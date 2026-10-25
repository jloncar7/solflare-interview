import BasePage from './base.page';

/** Wallet rows have data-testid="li-wallets-<publicKey>". */
export const WALLET_ROW_TEST_ID_PREFIX = 'li-wallets-';

/** Matches the "RECOVERY PHRASE" label regardless of how its text is capitalized in the DOM. */
const RECOVERY_PHRASE_LABEL =
    '//*[contains(translate(normalize-space(text()), "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "RECOVERY PHRASE")]';

/**
 * Wallet management panel that opens from the header avatar.
 * It lists the wallets grouped under the RECOVERY PHRASE they were derived from.
 */
class WalletManagementPage extends BasePage {
    get mainWallet() {
        return $('//*[contains(normalize-space(text()), "Main wallet")]');
    }

    /**
     * Button next to the RECOVERY PHRASE label that opens its menu.
     * It is the last button in the label's section header (the other one only collapses the list).
     */
    get recoveryPhraseMenuButton() {
        return $(`(${RECOVERY_PHRASE_LABEL}/ancestor::*[.//button][1]//button)[last()]`);
    }

    get showOrHideWalletsButton() {
        return $('//*[normalize-space(text())="Show or hide wallets"]');
    }

    async openRecoveryPhraseMenu(): Promise<void> {
        await this.click(this.recoveryPhraseMenuButton, 'arrow icon next to the RECOVERY PHRASE label');
    }

    async openShowOrHideWallets(): Promise<void> {
        await this.click(this.showOrHideWalletsButton, '"Show or hide wallets" button');
    }

    /** Public keys of the wallets that are listed under the recovery phrase, read from the rows' data-testid. */
    async getRecoveryPhraseWalletKeys(): Promise<string[]> {
        const rows = await $$(`[data-testid^="${WALLET_ROW_TEST_ID_PREFIX}"]`).filter((row) => row.isDisplayed());
        const testIds = await Promise.all(rows.map((row) => row.getAttribute('data-testid')));
        return testIds.map((testId) => (testId ?? '').slice(WALLET_ROW_TEST_ID_PREFIX.length));
    }

    /** Waits until the list under the recovery phrase shows the given number of wallets (it updates after Save). */
    async waitForWalletCount(count: number): Promise<void> {
        await browser.waitUntil(async () => (await this.getRecoveryPhraseWalletKeys()).length === count, {
            timeoutMsg: `Expected ${count} wallets under the recovery phrase`,
        });
    }
}

export default new WalletManagementPage();
