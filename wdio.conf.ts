import { mkdirSync } from 'node:fs';
import { action, log } from './logger';

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
        'goog:chromeOptions': {
            // --log-level=3 and excludeSwitches keep Chrome's own messages out of the test log
            args: [...(isHeadless ? ['--headless=new'] : []), '--log-level=3'],
            excludeSwitches: ['enable-logging'],
        },
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

/** Optional pause in ms after every action, to watch the test step by step, e.g. SLOW_MO=1000 */
const slowMo = Number(process.env.SLOW_MO ?? 0);

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./e2e/specs/**/*.e2e.ts'],
    maxInstances: 1,
    // WebdriverIO downloads the browser and its driver itself, so nothing has to be installed locally
    capabilities: [capabilities[browserName]],

    baseUrl: 'https://solflare.com',
    waitforTimeout: 15000,
    // Only real errors from WebdriverIO itself, the test log comes from logger.ts
    logLevel: 'error',

    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: { timeout: 120000 },

    onPrepare() {
        mkdirSync(SCREENSHOT_DIR, { recursive: true });
    },

    async before() {
        // Same window size in every browser and mode, so the layout is always the desktop one
        await browser.setWindowSize(1920, 1080);

        // Every page that is opened is logged, the other actions are logged by the page objects
        browser.overwriteCommand('url', async (originalUrl, path) => {
            action(`open ${path}`);
            const result = await originalUrl(path);
            await browser.pause(slowMo);
            return result;
        });

        // With SLOW_MO set, every click and typing is followed by a pause so the run can be watched
        if (slowMo > 0) {
            browser.overwriteCommand('click', async (originalClick, options) => {
                await originalClick(options);
                await browser.pause(slowMo);
            }, true);
            browser.overwriteCommand('setValue', async (originalSetValue, value) => {
                await originalSetValue(value);
                await browser.pause(slowMo);
            }, true);
        }
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
