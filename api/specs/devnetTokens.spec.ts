import { test, expect } from '../support/fixtures';
import { parseTokensResponse, SOL_TOKEN } from '../support/tokenSchemas';

test.describe('Scenario 1: Devnet token validation', () => {
    test('returns multiple devnet tokens with valid fields', async ({ tokensApi }) => {
        const response = await tokensApi.getTokens({ network: 'devnet' });

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        // Schema check: every token has a mint, a valid totalUiAmount and the price/coingeckoId fields of the right type
        const { tokens } = parseTokensResponse(await response.json());

        await test.step('response contains multiple tokens, not just SOL', async () => {
            expect(tokens.length).toBeGreaterThan(1);
            expect(tokens.some((token) => token.mint !== SOL_TOKEN.mint)).toBe(true);
        });

        await test.step('every token has a unique mint address', async () => {
            const mints = tokens.map((token) => token.mint);
            expect(new Set(mints).size).toBe(mints.length);
        });

        await test.step('totalUiAmount of every token is a valid amount', async () => {
            for (const token of tokens) {
                expect(Number.isFinite(token.totalUiAmount), `${token.symbol} totalUiAmount`).toBe(true);
                expect(token.totalUiAmount, `${token.symbol} totalUiAmount`).toBeGreaterThanOrEqual(0);
            }
        });
    });
});
