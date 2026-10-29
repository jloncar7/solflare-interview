import { mkdirSync } from 'node:fs';
import { action } from '../../logger';

const SCREENSHOT_DIR = './screenshots';

/**
 * Generic screenshot module: saves a screenshot of the current browser window as
 * screenshots/<browser>_<name>.png and returns the file path.
 * It works for any test and any browser, wdio.conf.ts calls it after every failed test.
 */
export async function saveScreenshot(name: string): Promise<string> {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const browserName = browser.capabilities.browserName ?? 'browser';
    // Only letters, digits and "_" are kept, so any test title gives a valid file name
    const filePath = `${SCREENSHOT_DIR}/${browserName}_${name.replace(/\W+/g, '_')}.png`;
    await browser.saveScreenshot(filePath);
    action(`screenshot saved to ${filePath}`);
    return filePath;
}
