import { randomUUID } from 'node:crypto';
import { test as base } from '@playwright/test';
import { TokensApiClient } from './tokensApiClient';
import { logger } from './apiLogger';

type ApiFixtures = {
    /** Fresh uuid4 for this test, the same way the app generates one per install. */
    installId: string;
    tokensApi: TokensApiClient;
};

/**
 * Every test gets its own request context with its own uuid4 in the Authorization header,
 * so no state is shared between tests and each one can be run on its own.
 */
export const test = base.extend<ApiFixtures>({
    installId: async ({}, use) => {
        await use(randomUUID());
    },

    tokensApi: async ({ playwright, baseURL, installId }, use, testInfo) => {
        logger.info(`Test started: ${testInfo.title}`);
        const request = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { Authorization: `Bearer ${installId}` },
        });
        await use(new TokensApiClient(request));
        await request.dispose();
        logger.info(`Test finished: ${testInfo.title} (${testInfo.status})`);
    },
});

export { expect } from '@playwright/test';
