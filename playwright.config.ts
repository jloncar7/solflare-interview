import { randomUUID } from 'node:crypto';
import { defineConfig } from '@playwright/test';

/**
 * Playwright is used only for API tests, so no browser is started.
 */
export default defineConfig({
    testDir: './api',
    fullyParallel: true,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'https://wallet-api.solflare.com',
        // The app generates a uuid4 per install and sends it with every request
        extraHTTPHeaders: { Authorization: `Bearer ${randomUUID()}` },
    },
});
