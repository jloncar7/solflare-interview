import { defineConfig } from 'allure';

/**
 * Allure 3 report config, used by "npm run report" and at the end of "npm test".
 * The E2E test (WebdriverIO) and the API tests (Playwright) write their raw results to separate folders,
 * and one report is built from both.
 */
export default defineConfig({
    name: 'Solflare QA Automation',
    output: './allure-report',
    resultsDir: ['./allure-results/e2e', './allure-results/api'],
    // Shown as Metadata on the report's first page. The browser and mode of an E2E run are parameters of the test.
    variables: {
        'API base URL': 'https://wallet-api.solflare.com',
        'API wallet address': 'HuiTegTpNAU7EJXvn95HKEWBdFMtWZYko4yoFVQyCKUS',
    },
    categories: [
        {
            // Scenario 2 is tagged "known-issue" in api/tokens.spec.ts, see Findings in the README
            name: 'Known issue: the address holds more tokens than the assignment expects',
            matchers: { statuses: ['failed'], labels: { tag: 'known-issue' } },
        },
    ],
    plugins: {
        awesome: {
            options: {
                // The tree shows "E2E (WebdriverIO)" and "API (Playwright)" (epic) with their features below.
                // The labels are set in wdio.conf.ts and playwright.config.ts.
                groupBy: ['epic', 'feature'],
                // The whole report is one index.html that opens with a double click, no server needed. Building
                // it as many files sometimes failed on Windows with EBUSY, when a scanner locked one of them.
                singleFile: true,
            },
        },
    },
});
