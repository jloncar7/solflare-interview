import { test, expect, type APIRequestContext } from '@playwright/test';
import { log } from '../logger';

const WALLET_ADDRESS = 'HuiTegTpNAU7EJXvn95HKEWBdFMtWZYko4yoFVQyCKUS';
const TOKENS_PATH = `/v3/portfolio/tokens/${WALLET_ADDRESS}`;
const SOL_TOKEN = { name: 'Solana', symbol: 'SOL', mint: '11111111111111111111111111111111' };

/** Fetches the wallet's tokens, the network query parameter is only sent when given. */
async function getTokens(request: APIRequestContext, network?: string) {
    const response = await request.get(TOKENS_PATH, { params: network ? { network } : undefined });
    log(`GET ${TOKENS_PATH}${network ? `?network=${network}` : ''} -> ${response.status()}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const { tokens } = await response.json();
    return tokens;
}

/** Removes the prices (in USD and in SOL), which can change between two requests, so responses can be compared. */
function withoutPrices(tokens: { price?: unknown; solPrice?: unknown }[]) {
    return tokens.map(({ price, solPrice, ...token }) => token);
}

test.describe('GET /v3/portfolio/tokens/{address}', () => {
    test('Scenario 1: devnet returns multiple tokens with valid fields', async ({ request }) => {
        const tokens = await getTokens(request, 'devnet');

        expect(tokens.length).toBeGreaterThan(1);
        for (const token of tokens) {
            expect(token).toMatchObject({ mint: expect.any(String), totalUiAmount: expect.any(Number) });
            expect(token.totalUiAmount).toBeGreaterThanOrEqual(0);
            // coingeckoId is on every token (null for unknown devnet tokens), price only on tokens that have one
            expect(token).toHaveProperty('coingeckoId');
            expect(token.coingeckoId === null || typeof token.coingeckoId === 'string').toBe(true);
            if (token.price !== undefined) {
                expect(token.price).toMatchObject({ price: expect.any(Number), currency: expect.any(String) });
            }
        }
    });

    test('Scenario 2: without network only the SOL token is returned', async ({ request }) => {
        const tokens = await getTokens(request);
        const symbols = tokens.map((token: { symbol: string }) => token.symbol);
        log(`tokens without network: ${symbols.join(', ')}`);

        // Soft assertion: the test fails if other tokens are returned, but the SOL checks below still run
        expect.soft(symbols, 'only the SOL token is returned').toEqual([SOL_TOKEN.symbol]);

        const solToken = tokens.find((token: { mint: string }) => token.mint === SOL_TOKEN.mint);
        expect(solToken, 'the SOL token is in the response').toMatchObject({
            ...SOL_TOKEN,
            totalUiAmount: expect.any(Number),
            price: { price: expect.any(Number), currency: expect.any(String) },
        });
        expect(solToken.totalUiAmount).toBeGreaterThanOrEqual(0);
    });

    // Scenario 3: every case sends one kind of unexpected data
    const invalidRequests = [
        { name: 'invalid wallet address', path: '/v3/portfolio/tokens/not-a-valid-address' },
        { name: 'unsupported network', path: `${TOKENS_PATH}?network=unknownnet` },
        { name: 'endpoint that does not exist', path: `/v3/portfolio/unknown/${WALLET_ADDRESS}` },
    ];
    for (const { name, path } of invalidRequests) {
        test(`Scenario 3: ${name} returns 400 or 404 with an error message`, async ({ request }) => {
            const response = await request.get(path);
            const error = await response.json();
            log(`GET ${path} -> ${response.status()} ${error.message}`);

            expect([400, 404]).toContain(response.status());
            // Every error has a message and repeats the status code, e.g. { "message": "Invalid public key provided", "code": 400 }
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).not.toBe('');
            expect(error.code).toBe(response.status());
        });
    }

    test('Scenario 4: switching mainnet -> devnet -> mainnet restores the mainnet response', async ({ request }) => {
        const firstMainnet = await getTokens(request, 'mainnet');
        const devnet = await getTokens(request, 'devnet');
        const secondMainnet = await getTokens(request, 'mainnet');

        // devnet has tokens that mainnet does not have
        const mainnetMints = firstMainnet.map((token: { mint: string }) => token.mint);
        const devnetOnlyTokens = devnet.filter((token: { mint: string }) => !mainnetMints.includes(token.mint));
        log(`devnet tokens that mainnet does not have: ${devnetOnlyTokens.length}`);
        expect(devnetOnlyTokens.length).toBeGreaterThan(0);
        // both mainnet responses are identical, except maybe the prices
        expect(withoutPrices(secondMainnet)).toEqual(withoutPrices(firstMainnet));
        expect(withoutPrices(secondMainnet)).not.toEqual(withoutPrices(devnet));
    });
});
