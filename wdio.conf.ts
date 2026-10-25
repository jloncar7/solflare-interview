import { mkdirSync } from 'node:fs';

/**
 * Browser and headless mode are chosen from the command line, e.g.:
 *   npm run test:e2e -- --browser=firefox --headless
 * Defaults: Chrome, headed.
 */
const browserName = process.argv.find((arg) => arg.startsWith('--browser='))?.split('=')[1] ?? 'chrome';
const isHeadless = process.argv.includes('--headless');

const capabilities: Record<string, WebdriverIO.Capabilities> = {
    chrome: {
        browserName: 'chrome',
        'goog:chromeOptions': { args: isHeadless ? ['--headless=new'] : [] },
    },
    firefox: {
        browserName: 'firefox',
        'moz:firefoxOptions': { args: isHeadless ? ['-headless'] : [] },
    },
};

if (!capabilities[browserName]) {
    throw new Error(`Unsupported browser "${browserName}", use one of: ${Object.keys(capabilities).join(', ')}`);
}

const SCREENSHOT_DIR = './screenshots';

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./e2e/specs/**/*.e2e.ts'],
    maxInstances: 1,
    // WebdriverIO downloads the browser and its driver itself, so nothing has to be installed locally
    capabilities: [capabilities[browserName]],

    baseUrl: 'https://solflare.com',
    waitforTimeout: 15000,
    logLevel: 'warn',

    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: { timeout: 120000 },

    onPrepare() {
        mkdirSync(SCREENSHOT_DIR, { recursive: true });
    },

    // Same window size in every browser and mode, so the layout is always the desktop one
    async before() {
        await browser.setWindowSize(1920, 1080);
    },

    // Screenshot of every failed test: screenshots/<browser>_<test title>.png
    async afterTest(test, _context, { passed }) {
        if (!passed) {
            const fileName = `${browserName}_${test.title.replace(/\W+/g, '_')}.png`;
            await browser.saveScreenshot(`${SCREENSHOT_DIR}/${fileName}`);
        }
    },
};
