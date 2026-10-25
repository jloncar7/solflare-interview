import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { logger } from './e2eLogger';

const SCREENSHOT_ROOT = 'screenshots';

/** Turns a test title into a safe file name, e.g. "Wallet > adds wallets" -> "Wallet_adds_wallets". */
function toFileName(name: string): string {
    return name.replace(/[^a-z0-9-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 120);
}

/**
 * Generic screenshot helper. Saves a screenshot of the current browser window to
 * screenshots/<browserName>/<name>_<timestamp>.png and returns the file path.
 * Used by the afterTest hook on failures, but it can also be called from any test.
 */
export async function takeScreenshot(name: string): Promise<string | undefined> {
    const browserName = String((browser.capabilities as WebdriverIO.Capabilities).browserName ?? 'browser');
    const directory = path.join(SCREENSHOT_ROOT, browserName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(directory, `${toFileName(name)}_${timestamp}.png`);

    try {
        await mkdir(directory, { recursive: true });
        await browser.saveScreenshot(filePath);
        logger.info(`Screenshot saved: ${filePath}`);
        return filePath;
    } catch (error) {
        // A failed screenshot must never hide the original test failure
        logger.warn(`Could not take screenshot "${filePath}": ${(error as Error).message}`);
        return undefined;
    }
}
