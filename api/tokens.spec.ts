import { test, expect, type APIRequestContext } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { log } from '../logger';

/**
 * API tests for GET /v3/portfolio/tokens/{address}, the endpoint that returns the tokens a wallet holds.
 * The base URL and the "Authorization: Bearer {uuid4}" header come from playwright.config.ts, so every
 * request below already carries them. The tests do not depend on each other and run in parallel.
 */

/** Wallet address from the assignment. It is public, so anyone can send tokens to it. */
const WALLET_ADDRESS = 'HuiTegTpNAU7EJXvn95HKEWBdFMtWZYko4yoFVQyCKUS';
const TOKENS_PATH = `/v3/portfolio/tokens/${WALLET_ADDRESS}`;
/** Native SOL as described in scenario 2. Its mint is the System Program address. */
const SOL_TOKEN = { name: 'Solana', symbol: 'SOL', mint: '11111111111111111111111111111111' };

/**
 * Sends a GET request as its own step, so the reports list every request, and attaches the response
 * body (pretty-printed when it is JSON) to that step. The request is also logged with its status.
 */
async function get(request: APIRequestContext, path: string, params?: Record<string, string>) {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path;
    return test.step(`GET ${url}`, async () => {
        const response = await request.get(path, { params });
        log(`GET ${url} -> ${response.status()}`);
        const body = await response.text();
        let attachment = { body, contentType: 'text/plain' };
        try {
            attachment = { body: JSON.stringify(JSON.parse(body), null, 2), contentType: 'application/json' };
        } catch {
            // Not JSON, attached as plain text
        }
        await test.info().attach(`response ${response.status()}`, attachment);
        return response;
    });
}

/**
 * Fetches the wallet's tokens and checks that the request itself worked (status 200, JSON body).
 * The network query parameter is only sent when given, so scenario 2 really sends no network at all.
 */
async function getTokens(request: APIRequestContext, network?: string) {
    const response = await get(request, TOKENS_PATH, network ? { network } : undefined);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    // The body also has totals (value, solValue, ...) and errors, the tests only need the token list
    const { tokens } = await response.json();
    return tokens;
}

/** Removes the prices (in USD and in SOL), which can change between two requests, so responses can be compared. */
function withoutPrices(tokens: { price?: unknown; solPrice?: unknown }[]) {
    return tokens.map(({ price, solPrice, ...token }) => token);
}

test.describe('GET /v3/portfolio/tokens/{address}', () => {
    /**
     * Scenario 1: with network=devnet the API returns the wallet's devnet tokens.
     * Devnet is Solana's network for developers, its tokens are free test tokens without a market price.
     */
    test('Scenario 1: devnet returns multiple tokens with valid fields', async ({ request }) => {
        const tokens = await getTokens(request, 'devnet');

        // "multiple tokens, not just SOL"
        expect(tokens.length).toBeGreaterThan(1);
        for (const token of tokens) {
            // Every token has a mint address (the token's id) and a balance that is a real number, never negative.
            // toMatchObject only checks the listed fields and ignores the many others in the response.
            expect(token).toMatchObject({ mint: expect.any(String), totalUiAmount: expect.any(Number) });
            expect(token.totalUiAmount).toBeGreaterThanOrEqual(0);

            // "validate the type of fields such as price, coingeckoId, and verify if they exist":
            // coingeckoId is on every token (null for test tokens CoinGecko does not know),
            // price only on tokens that have one, so its type is checked only when it is there
            expect(token).toHaveProperty('coingeckoId');
            expect(token.coingeckoId === null || typeof token.coingeckoId === 'string').toBe(true);
            if (token.price !== undefined) {
                expect(token.price).toMatchObject({ price: expect.any(Number), currency: expect.any(String) });
            }
        }
    });

    /**
     * Scenario 2: without the network parameter the API should return only the SOL token.
     * This test currently fails on purpose: the API returns the mainnet tokens of the address (six of them),
     * because the address has received other tokens since the assignment was written. See Findings in the README.
     */
    test('Scenario 2: without network only the SOL token is returned', async ({ request }) => {
        // Explains the expected failure in the Allure report and puts it under "Known issue" (allurerc.mjs)
        await allure.tag('known-issue');
        await allure.description(
            'Fails on purpose. Without `network` the API returns the mainnet tokens of the address: SOL and five more ' +
            '(bSOL, USDC and USDT with a balance of 0, tiny amounts of BERN and TSLAx). The address has most likely ' +
            'received them after the assignment was written. The SOL token itself is checked and correct.',
        );
        await allure.link('https://github.com/jloncar7/solflare-interview#findings', 'Findings in the README');

        const tokens = await getTokens(request);
        const symbols = tokens.map((token: { symbol: string }) => token.symbol);
        log(`tokens without network: ${symbols.join(', ')}`);

        // Soft assertion: the test is marked as failed if other tokens are returned, but it does not stop here,
        // so the SOL checks below still run and the report shows both results. The failure lists every symbol.
        expect.soft(symbols, 'only the SOL token is returned').toEqual([SOL_TOKEN.symbol]);

        // The SOL token is found by its mint, so this part works whether SOL is alone in the list or not
        const solToken = tokens.find((token: { mint: string }) => token.mint === SOL_TOKEN.mint);
        expect(solToken, 'the SOL token is in the response').toMatchObject({
            ...SOL_TOKEN,
            totalUiAmount: expect.any(Number),
            // "the price object contains key values": the price and its currency
            price: { price: expect.any(Number), currency: expect.any(String) },
        });
        expect(solToken.totalUiAmount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Scenario 3: try to break the API with unexpected data. Each case breaks one part of the request
     * (the address, the network parameter, the path), and the API must reject it with 400 or 404 and an
     * error message, not with a 500 or an empty body. The loop turns every case into its own test, so the
     * report shows exactly which one failed, and a new case is one more line in the list.
     */
    const invalidRequests = [
        // Not a base58 Solana public key -> 400 "Invalid public key provided"
        { name: 'invalid wallet address', path: '/v3/portfolio/tokens/not-a-valid-address' },
        // Only mainnet, devnet and testnet are allowed -> 400 "\"network\" must be one of [...]"
        { name: 'unsupported network', path: `${TOKENS_PATH}?network=unknownnet` },
        // A path the API does not have -> 404 "common.error.not_found"
        { name: 'endpoint that does not exist', path: `/v3/portfolio/unknown/${WALLET_ADDRESS}` },
    ];
    for (const { name, path } of invalidRequests) {
        test(`Scenario 3: ${name} returns 400 or 404 with an error message`, async ({ request }) => {
            const response = await get(request, path);
            // 400 = the path exists but the data is wrong, 404 = the path does not exist.
            // The status is checked before the body is read, so a 500 with an HTML page fails with
            // the wrong status in the report, not with an unclear JSON parse error.
            expect([400, 404], `status of GET ${path}`).toContain(response.status());
            expect(response.headers()['content-type']).toContain('application/json');

            const error = await response.json();
            // "The error message is displayed": it is printed to the log and is in the attached response
            log(`error message: ${error.message}`);
            // Every error has a message and repeats the status code, e.g. { "message": "Invalid public key provided", "code": 400 }
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).not.toBe('');
            expect(error.code).toBe(response.status());
        });
    }

    /**
     * Scenario 4: switching mainnet -> devnet -> mainnet must not change what mainnet returns,
     * for example because of caching or state kept between requests. All three requests are in one test,
     * because the second and third are compared with the first.
     */
    test('Scenario 4: switching mainnet -> devnet -> mainnet restores the mainnet response', async ({ request }) => {
        const firstMainnet = await getTokens(request, 'mainnet');
        const devnet = await getTokens(request, 'devnet');
        const secondMainnet = await getTokens(request, 'mainnet');

        // "additional tokens appear compared to mainnet": devnet has tokens (mints) that mainnet does not have.
        // Comparing the number of tokens would not work, because this address has more tokens on mainnet.
        const mainnetMints = firstMainnet.map((token: { mint: string }) => token.mint);
        const devnetOnlyTokens = devnet.filter((token: { mint: string }) => !mainnetMints.includes(token.mint));
        log(`devnet tokens that mainnet does not have: ${devnetOnlyTokens.length}`);
        expect(devnetOnlyTokens.length).toBeGreaterThan(0);

        // "first and third requests should return identical responses, except maybe the price":
        // every token detail and balance is the same once the prices are left out
        expect(withoutPrices(secondMainnet)).toEqual(withoutPrices(firstMainnet));
        // and the third response is really mainnet again, not the devnet one
        expect(withoutPrices(secondMainnet)).not.toEqual(withoutPrices(devnet));
    });
});
