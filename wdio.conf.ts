import type { Options } from '@wdio/types';
import { takeScreenshot } from './e2e/utils/screenshot';
import { logger } from './e2e/utils/e2eLogger';

/**
 * Browser selection and headless mode can be passed either as CLI arguments or as environment variables:
 *   npm run test:e2e -- --browser=firefox --headless
 *   BROWSER=firefox HEADLESS=true npm run test:e2e
 */
const SUPPORTED_BROWSERS = ['chrome', 'firefox'] as const;
type SupportedBrowser = (typeof SUPPORTED_BROWSERS)[number];

function getCliArgument(name: string): string | undefined {
    const prefix = `--${name}=`;
    return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function resolveBrowser(): SupportedBrowser {
    const requested = (getCliArgument('browser') ?? process.env.BROWSER ?? 'chrome').toLowerCase();
    if (!SUPPORTED_BROWSERS.includes(requested as SupportedBrowser)) {
        throw new Error(`Unsupported browser "${requested}". Use one of: ${SUPPORTED_BROWSERS.join(', ')}`);
    }
    return requested as SupportedBrowser;
}

const browserName = resolveBrowser();
const isHeadless = process.argv.includes('--headless') || process.env.HEADLESS === 'true';
const windowSize = { width: 1920, height: 1080 };

/** Builds the capability for the selected browser. Browsers and drivers are downloaded by WebdriverIO itself. */
function buildCapability(): WebdriverIO.Capabilities {
    if (browserName === 'firefox') {
        return {
            browserName: 'firefox',
            'moz:firefoxOptions': {
                args: [...(isHeadless ? ['-headless'] : []), `--width=${windowSize.width}`, `--height=${windowSize.height}`],
            },
        };
    }

    return {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                ...(isHeadless ? ['--headless=new'] : []),
                `--window-size=${windowSize.width},${windowSize.height}`,
                '--no-sandbox',
                '--disable-dev-shm-usage',
            ],
        },
    };
}

export const config: Options.Testrunner & { capabilities: WebdriverIO.Capabilities[] } = {
    runner: 'local',
    tsConfigPath: './tsconfig.json',

    specs: ['./e2e/specs/**/*.e2e.ts'],
    maxInstances: 1,
    capabilities: [buildCapability()],

    logLevel: 'warn',
    baseUrl: 'https://solflare.com',
    waitforTimeout: 15000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 2,

    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 120000,
    },

    onPrepare() {
        logger.info(`Starting E2E run in ${browserName} (${isHeadless ? 'headless' : 'headed'} mode)`);
    },

    beforeTest(test) {
        logger.info(`Test started: ${test.parent} > ${test.title}`);
    },

    /** Takes a screenshot after every failed test so the failure can be inspected later. */
    async afterTest(test, _context, { passed, error }) {
        if (passed) {
            logger.info(`Test passed: ${test.title}`);
            return;
        }
        logger.error(`Test failed: ${test.title} - ${error?.message ?? 'unknown error'}`);
        await takeScreenshot(`${test.parent}_${test.title}`);
    },
};
