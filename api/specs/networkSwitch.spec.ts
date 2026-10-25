import { test, expect } from '../support/fixtures';
import { parseTokensResponse, withoutPrices } from '../support/tokenSchemas';

test.describe('Scenario 4: Returning to mainnet after switching to devnet', () => {
    test('mainnet response is restored after switching to devnet and back', async ({ tokensApi }) => {
        const firstMainnet = await test.step('first request (mainnet)', async () => {
            const response = await tokensApi.getTokens({ network: 'mainnet' });
            expect(response.status()).toBe(200);
            return parseTokensResponse(await response.json());
        });

        const devnet = await test.step('second request (devnet) has additional tokens', async () => {
            const response = await tokensApi.getTokens({ network: 'devnet' });
            expect(response.status()).toBe(200);
            const body = parseTokensResponse(await response.json());

            const mainnetMints = new Set(firstMainnet.tokens.map((token) => token.mint));
            const additionalTokens = body.tokens.filter((token) => !mainnetMints.has(token.mint));
            expect(additionalTokens.length).toBeGreaterThan(0);
            return body;
        });

        await test.step('third request (back to mainnet) matches the first one', async () => {
            const response = await tokensApi.getTokens({ network: 'mainnet' });
            expect(response.status()).toBe(200);
            const thirdMainnet = parseTokensResponse(await response.json());

            // Prices can move between requests, every other token detail and balance must be identical
            expect(withoutPrices(thirdMainnet.tokens)).toEqual(withoutPrices(firstMainnet.tokens));
            expect(withoutPrices(thirdMainnet.tokens)).not.toEqual(withoutPrices(devnet.tokens));
        });
    });
});
