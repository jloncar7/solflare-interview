import { action, log } from './logger';
import { saveScreenshot } from './e2e/helpers/screenshot';

/**
 * Browser and headless mode are chosen from the command line, e.g.:
 *   npm run test:e2e -- --browser=firefox --headless
 * Defaults: Chrome, headed.
 */
const browserName = process.argv.find((arg) => arg.startsWith('--browser='))?.split('=')[1] ?? 'chrome';
const isHeadless = process.argv.includes('--headless');

/**
 * Headless Chrome puts "HeadlessChrome" into its User-Agent, and Solflare answers every such request with
 * 403 {"errors":["Too many requests."]} (see Findings in the README). In headless mode Chrome therefore sends
 * the User-Agent of a normal Chrome on the same OS. Only the User-Agent changes, the browser stays headless.
 */
const osUserAgentPart = process.platform === 'win32' ? 'Windows NT 10.0; Win64; x64'
    : process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7'
    : 'X11; Linux x86_64';
const chromeUserAgent = `Mozilla/5.0 (${osUserAgentPart}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36`;

const capabilities: Record<string, WebdriverIO.Capabilities> = {
    chrome: {
        browserName: 'chrome',
        'goog:chromeOptions': {
            // --log-level=3 and excludeSwitches keep Chrome's own messages out of the test log
            args: [...(isHeadless ? ['--headless=new', `--user-agent=${chromeUserAgent}`] : []), '--log-level=3'],
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

    async before() {
        // Same window size in every browser and mode, so the layout is always the desktop one
        await browser.setWindowSize(1920, 1080);

        // Every page that is opened is logged, the steps themselves are logged by the test
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

    // Screenshot of every failed test: screenshots/<browser>_<test title>.png (e2e/helpers/screenshot.ts)
    async afterTest(test, _context, { passed }) {
        log(`${passed ? 'PASSED' : 'FAILED'} ${test.title}`);
        if (!passed) {
            await saveScreenshot(test.title);
        }
    },
};
