import { mkdirSync } from 'node:fs';
import { addAttachment } from '@wdio/allure-reporter';
import { action } from './report';

const SCREENSHOT_DIR = './screenshots';

/** Local date and time for a file name, e.g. "2026-10-29_15-30-05", the same clock as the log lines. */
function fileTimestamp(date = new Date()): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

/**
 * Generic screenshot module: saves a screenshot of the current browser window as
 * screenshots/<browser>_<date>_<time>_<name>.png, attaches it to the current test in the Allure report
 * and returns the file path. The time in the name keeps the screenshots of earlier failures instead of
 * overwriting them. It works for any test and any browser, wdio.conf.ts calls it after every failed test.
 */
export async function saveScreenshot(name: string): Promise<string> {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const browserName = browser.capabilities.browserName ?? 'browser';
    // Only letters, digits and "_" are kept, so any test title gives a valid file name
    const filePath = `${SCREENSHOT_DIR}/${browserName}_${fileTimestamp()}_${name.replace(/\W+/g, '_')}.png`;
    const screenshot = await browser.saveScreenshot(filePath);
    await addAttachment('screenshot', screenshot, 'image/png');
    action(`screenshot saved to ${filePath}`);
    return filePath;
}
