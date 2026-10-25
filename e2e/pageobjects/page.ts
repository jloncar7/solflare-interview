/**
 * Base page object, every page extends it (pattern from https://webdriver.io/docs/pageobjects/).
 */
export default class Page {
    /** Opens a path relative to the baseUrl from wdio.conf.ts. */
    async open(path: string): Promise<void> {
        await browser.url(path);
    }
}
