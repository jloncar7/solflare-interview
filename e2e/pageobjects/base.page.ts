import type { ChainablePromiseElement } from 'webdriverio';
import { logger } from '../utils/e2eLogger';

type Element = ChainablePromiseElement;

/**
 * Parent class for all page objects. Holds the shared helpers so that every
 * user action waits for its element and is written to the log.
 */
export default class BasePage {
    /** Opens a path relative to the baseUrl from wdio.conf.ts. */
    async open(urlPath: string): Promise<void> {
        logger.info(`Opening ${urlPath}`);
        await browser.url(urlPath);
    }

    /** Waits until the element is clickable and clicks it. */
    protected async click(element: Element, description: string): Promise<void> {
        logger.info(`Clicking ${description}`);
        await element.waitForClickable();
        await element.click();
    }

    /** Waits until the input is displayed and types the value into it. */
    protected async type(element: Element, value: string, description: string, isSecret = false): Promise<void> {
        logger.info(`Typing ${isSecret ? '*****' : `"${value}"`} into ${description}`);
        await element.waitForDisplayed();
        await element.setValue(value);
    }

    /** Clicks the element only if it shows up within the timeout. Used for screens that are not always shown. */
    protected async clickIfDisplayed(element: Element, description: string, timeout = 5000): Promise<boolean> {
        const isDisplayed = await element.waitForDisplayed({ timeout }).catch(() => false);
        if (!isDisplayed) {
            logger.info(`${description} is not displayed, skipping`);
            return false;
        }
        await this.click(element, description);
        return true;
    }
}
