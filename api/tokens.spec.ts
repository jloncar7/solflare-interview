import { test, expect, type APIRequestContext } from '@playwright/test';

const WALLET_ADDRESS = 'HuiTegTpNAU7EJXvn95HKEWBdFMtWZYko4yoFVQyCKUS';
const TOKENS_PATH = `/v3/portfolio/tokens/${WALLET_ADDRESS}`;
const SOL_TOKEN = { name: 'Solana', symbol: 'SOL', mint: '11111111111111111111111111111111' };

/** Fetches the wallet's tokens, the network query parameter is only sent when given. */
async function getTokens(request: APIRequestContext, network?: string) {
    const response = await request.get(TOKENS_PATH, { params: network ? { network } : undefined });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const { tokens } = await response.json();
    return tokens;
}

/** Removes the price, which can change between two requests, so responses can be compared. */
function withoutPrices(tokens: { price: unknown }[]) {
    return tokens.map(({ price, ...token }) => token);
}

test.describe('GET /v3/portfolio/tokens/{address}', () => {
    test('Scenario 1: devnet returns multiple tokens with valid fields', async ({ request }) => {
        const tokens = await getTokens(request, 'devnet');

        expect(tokens.length).toBeGreaterThan(1);
        for (const token of tokens) {
            expect(token).toMatchObject({ mint: expect.any(String), totalUiAmount: expect.any(Number) });
            expect(token.totalUiAmount).toBeGreaterThanOrEqual(0);
            // price and coingeckoId exist on every token, but devnet tokens can have null values
            expect(token).toHaveProperty('price');
            expect(token).toHaveProperty('coingeckoId');
            expect(token.price === null || typeof token.price === 'object').toBe(true);
            expect(token.coingeckoId === null || typeof token.coingeckoId === 'string').toBe(true);
        }
    });

    test('Scenario 2: without network only the SOL token is returned', async ({ request }) => {
        const tokens = await getTokens(request);

        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toMatchObject({
            ...SOL_TOKEN,
            totalUiAmount: expect.any(Number),
            price: { price: expect.any(Number) },
        });
        expect(tokens[0].totalUiAmount).toBeGreaterThanOrEqual(0);
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
            const errorMessage = await response.text();
            console.log(`${name}: ${response.status()} ${errorMessage}`);

            expect([400, 404]).toContain(response.status());
            expect(errorMessage).not.toBe('');
        });
    }

    test('Scenario 4: switching mainnet -> devnet -> mainnet restores the mainnet response', async ({ request }) => {
        const firstMainnet = await getTokens(request, 'mainnet');
        const devnet = await getTokens(request, 'devnet');
        const secondMainnet = await getTokens(request, 'mainnet');

        // devnet has additional tokens compared to mainnet
        expect(devnet.length).toBeGreaterThan(firstMainnet.length);
        // both mainnet responses are identical, except maybe the price
        expect(withoutPrices(secondMainnet)).toEqual(withoutPrices(firstMainnet));
        expect(withoutPrices(secondMainnet)).not.toEqual(withoutPrices(devnet));
    });
});
