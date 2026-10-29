import { rmSync } from 'node:fs';
import { addArgument, addEpic, addFeature } from '@wdio/allure-reporter';
import { log } from './logger';
import { action, endStep } from './e2e/helpers/report';
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

/**
 * Raw results of the Allure reporter. The API tests write theirs to allure-results/api,
 * and "npm run report" turns both into one HTML report.
 */
const ALLURE_RESULTS_DIR = './allure-results/e2e';

/** Optional pause in ms after every action, to watch the test step by step, e.g. SLOW_MO=1000 */
const slowMo = Number(process.env.SLOW_MO ?? 0);

/** Expected value of a check for the log, e.g. 3, ["aria-checked","true"] or StringContaining "Main Wallet". */
function describeExpected(value: unknown): string {
    const matcher = value as { asymmetricMatch?: unknown; sample?: unknown } | null;
    if (typeof matcher?.asymmetricMatch === 'function') {
        return `${String(matcher)} ${JSON.stringify(matcher.sample)}`;
    }
    return JSON.stringify(value);
}

/** Short name of an element for the log: its selector, plus its position when it was picked from a list. */
function describeElement(element: WebdriverIO.Element): string {
    const position = element.index === undefined ? '' : `[${element.index}]`;
    return `${String(element.selector)}${position}`;
}

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
    reporters: [
        'spec',
        // The steps in the report are the test case steps from e2e/helpers/report.ts. WebDriver commands are left out,
        // they would bury the steps and would also show the typed password. Screenshots are still attached.
        ['allure', { outputDir: ALLURE_RESULTS_DIR, disableWebdriverStepsReporting: true }],
    ],
    mochaOpts: { timeout: 120000 },

    // Every run starts with an empty results folder, so the report only shows the last run
    onPrepare() {
        rmSync(ALLURE_RESULTS_DIR, { recursive: true, force: true });
    },

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

        // Every click and every typed value is logged as an action of the current step, so no page object has to
        // log them itself. A masked value (the password) is logged as "********". With SLOW_MO set, every click
        // and typing is followed by a pause so the run can be watched.
        browser.overwriteCommand('click', async function (originalClick, options) {
            action(`click ${describeElement(this)}`);
            await originalClick(options);
            await browser.pause(slowMo);
        }, true);
        browser.overwriteCommand('setValue', async function (originalSetValue, value, options) {
            action(`type ${options?.mask ? '********' : JSON.stringify(value)} into ${describeElement(this)}`);
            await originalSetValue(value, options);
            await browser.pause(slowMo);
        }, true);
    },

    // Every WebdriverIO assertion (toBeDisplayed, toBeDisabled, toHaveText, ...) is logged with its result as an
    // action of the current step. Plain value checks (toBe, toEqual) do not call this hook, the test logs those.
    afterAssertion({ matcherName, expectedValue, result }) {
        // At runtime the result says "pass", the type calls it "result"
        const passed = (result as unknown as { pass: boolean }).pass;
        const expected = expectedValue === undefined ? '' : ` ${describeExpected(expectedValue)}`;
        action(`check ${matcherName}${expected}: ${passed ? 'passed' : 'FAILED'} | ${result.message().split('\n')[0]}`);
    },

    beforeTest(test) {
        log(`START ${test.title}`);
        // Puts the test under "E2E (WebdriverIO)" > its describe block in the Allure tree, next to the API tests
        // (groupBy in allurerc.mjs). Epic and feature are used, because the reporter fills the suite labels itself.
        addEpic('E2E (WebdriverIO)');
        addFeature(test.parent);
        // The reporter adds the browser (with its version) as a parameter of the test, the mode is added here.
        // Both are on the test, not in the report's metadata, because a report built from several runs
        // (Chrome and Firefox in GitHub Actions) keeps the metadata of only one of them.
        addArgument('headless', String(isHeadless));
    },

    // Ends the last step with the result of the test. A failed test also gets a screenshot,
    // saved to screenshots/<browser>_<date>_<time>_<test title>.png and attached to the test in the Allure report.
    async afterTest(test, _context, { passed }) {
        endStep(passed);
        log(`${passed ? 'PASSED' : 'FAILED'} ${test.title}`);
        if (!passed) {
            await saveScreenshot(test.title);
        }
    },
};
