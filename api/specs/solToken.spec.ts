import { test, expect } from '../support/fixtures';
import { parseTokensResponse, SOL_TOKEN } from '../support/tokenSchemas';

test.describe('Scenario 2: SOL token validation', () => {
    test('returns only the SOL token when the network parameter is not provided', async ({ tokensApi }) => {
        const response = await tokensApi.getTokens();

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const { tokens } = parseTokensResponse(await response.json());

        await test.step('response contains only Solana', async () => {
            expect(tokens).toHaveLength(1);
        });

        const [solToken] = tokens;

        await test.step('essential SOL token properties are correct', async () => {
            expect(solToken).toMatchObject(SOL_TOKEN);
            expect(Number.isFinite(solToken.totalUiAmount)).toBe(true);
            expect(solToken.totalUiAmount).toBeGreaterThanOrEqual(0);
        });

        await test.step('price object contains the key values', async () => {
            expect(solToken.price).not.toBeNull();
            expect(solToken.price!.price).toBeGreaterThan(0);
        });
    });
});
