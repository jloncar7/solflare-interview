import { defineConfig } from '@playwright/test';

/**
 * Playwright is used only as an API test runner here, so no browser is launched.
 * Every test is independent (it gets its own request context and uuid4), so they can run in parallel.
 */
export default defineConfig({
    testDir: './api/specs',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    timeout: 30000,
    reporter: [['list'], ['html', { outputFolder: 'reports/api', open: 'never' }]],
    outputDir: 'test-results/api',
    use: {
        baseURL: process.env.API_BASE_URL ?? 'https://wallet-api.solflare.com',
    },
});
