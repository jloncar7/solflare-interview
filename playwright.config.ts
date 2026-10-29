import { randomUUID } from 'node:crypto';
import { defineConfig } from '@playwright/test';

/**
 * Playwright is used only for API tests, so no browser is started.
 */
export default defineConfig({
    testDir: './api',
    fullyParallel: true,
    globalSetup: './api/globalSetup.ts',
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        // Same Allure report as the E2E test: "npm run report" builds one report from allure-results/e2e and /api
        ['allure-playwright', { resultsDir: 'allure-results/api' }],
    ],
    use: {
        baseURL: 'https://wallet-api.solflare.com',
        // The app generates a uuid4 per install and sends it with every request
        extraHTTPHeaders: { Authorization: `Bearer ${randomUUID()}` },
    },
});
