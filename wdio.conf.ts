import { mkdirSync } from 'node:fs';
import { log } from './logger';

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

    async before() {
        // Same window size in every browser and mode, so the layout is always the desktop one
        await browser.setWindowSize(1920, 1080);

        // Action logger: every page opened, click and typing is logged with its selector,
        // without any change in the page objects. Typed values are not logged, they can be passwords.
        browser.overwriteCommand('url', async (originalUrl, path) => {
            log(`open ${path}`);
            return originalUrl(path);
        });
        browser.overwriteCommand('click', async function (this: WebdriverIO.Element, originalClick, options) {
            log(`click ${this.selector}`);
            return originalClick(options);
        }, true);
        browser.overwriteCommand('setValue', async function (this: WebdriverIO.Element, originalSetValue, value) {
            log(`type into ${this.selector}`);
            return originalSetValue(value);
        }, true);
    },

    beforeTest(test) {
        log(`START ${test.title}`);
    },

    // Screenshot of every failed test: screenshots/<browser>_<test title>.png
    async afterTest(test, _context, { passed }) {
        log(`${passed ? 'PASSED' : 'FAILED'} ${test.title}`);
        if (!passed) {
            const fileName = `${browserName}_${test.title.replace(/\W+/g, '_')}.png`;
            await browser.saveScreenshot(`${SCREENSHOT_DIR}/${fileName}`);
        }
    },
};
