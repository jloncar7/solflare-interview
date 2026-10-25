import type { APIResponse } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { TOKENS_ENDPOINT, WALLET_ADDRESS, type TokensApiClient } from '../support/tokensApiClient';
import { logger } from '../support/apiLogger';

/** Reads the error message from a JSON error body ({ message } / { error }) or falls back to the plain text body. */
async function getErrorMessage(response: APIResponse): Promise<string> {
    const text = await response.text();
    try {
        const body = JSON.parse(text);
        const message = body?.message ?? body?.error ?? body?.errors;
        return typeof message === 'string' ? message : JSON.stringify(message ?? body);
    } catch {
        return text;
    }
}

/** Each case sends one kind of unexpected data. */
const invalidRequests = [
    {
        name: 'invalid wallet address',
        send: (api) => api.getTokens({ address: 'not-a-valid-solana-address' }),
    },
    {
        name: 'unsupported network',
        send: (api) => api.getTokens({ network: 'unknownnet' }),
    },
    {
        name: 'missing wallet address',
        send: (api) => api.get(`${TOKENS_ENDPOINT}/`),
    },
    {
        name: 'endpoint that does not exist',
        send: (api) => api.get(`/v3/portfolio/does-not-exist/${WALLET_ADDRESS}`),
    },
] satisfies { name: string; send: (api: TokensApiClient) => Promise<APIResponse> }[];

test.describe('Scenario 3: Break the API', () => {
    for (const { name, send } of invalidRequests) {
        test(`returns 400 or 404 with an error message for ${name}`, async ({ tokensApi }, testInfo) => {
            const response = await send(tokensApi);

            expect([400, 404]).toContain(response.status());

            // Display the error message in the log and in the HTML report
            const message = await getErrorMessage(response);
            logger.info(`Error message for ${name}: ${message}`);
            testInfo.annotations.push({ type: 'error message', description: message });
            expect(message.trim()).not.toBe('');
        });
    }
});
