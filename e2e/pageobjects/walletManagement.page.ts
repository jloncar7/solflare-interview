import Page from './page';
import { shortKey } from '../../logger';
import { action } from '../helpers/report';

/**
 * Wallet management panel (opened from the header avatar) and its "Show or hide wallets" dialog.
 * Every element is found by its data-testid, not by text, position or CSS classes.
 * Every wallet has its public key in data-testid: the toggles in the dialog use "tgl-li-wallets-<key>"
 * and the wallets listed under the recovery phrase use "li-wallets-<key>". The rows of the dialog also use
 * "li-wallets-<key>", so the listed wallets are only looked up inside the recovery phrase section.
 */

/**
 * The recovery phrase section of the panel. Its data-testid holds the name of the recovery phrase,
 * which is "Recovery phrase" for every new wallet (it would change if the phrase were renamed).
 */
const RECOVERY_PHRASE_SECTION = '[data-testid="section-Recovery phrase"]';

/**
 * Time the dialog needs to take over a toggle change. The toggle shows "on" at once, but "Save" clicked
 * right after it sometimes drops that wallet, and nothing on the page shows when the dialog is ready
 * (see Findings in the README), so a short fixed wait is the only option here.
 * On a slow machine it can be raised without a code change, e.g. TOGGLE_SETTLE_MS=1000.
 */
const TOGGLE_SETTLE_MS = Number(process.env.TOGGLE_SETTLE_MS ?? 500);

class WalletManagementPage extends Page {
    /**
     * The avatar (initials) in the pill in the top right corner of the header. The avatar is clicked, not the
     * middle of the pill, because the middle holds the address with its copy button, which copies the address.
     */
    get walletManagementButton() {
        return $('[data-testid="section-wallet-picker"] [data-testid="wallet-picker-avatar"]');
    }

    /**
     * The first wallet listed under the recovery phrase, which is the main wallet. The test also checks
     * its text, so a wallet with another name in the first place fails the check.
     */
    get mainWallet() {
        return $(`${RECOVERY_PHRASE_SECTION} [data-testid^="li-wallets-"]`);
    }

    /**
     * The kebab menu (⋮, aria-label "More options") next to RECOVERY PHRASE. The assignment calls it
     * "arrow icon", but the arrow in the section header only collapses the list.
     */
    get recoveryPhraseMenuButton() {
        return $(`${RECOVERY_PHRASE_SECTION} [data-testid="icon-btn-wallet-section-options"]`);
    }

    get showOrHideWalletsButton() {
        return $('[data-testid="li-recovery-phrase-show-or-hide"]');
    }

    get walletToggles() {
        return $$('[data-testid^="tgl-li-wallets-"]');
    }

    get saveButton() {
        return $('[data-testid="btn-save"]');
    }

    get listedWallets() {
        return $$(`${RECOVERY_PHRASE_SECTION} [data-testid^="li-wallets-"]`);
    }

    async openWalletManagement(): Promise<void> {
        await this.walletManagementButton.click();
    }

    async openRecoveryPhraseMenu(): Promise<void> {
        await this.recoveryPhraseMenuButton.click();
    }

    /** Opens the dialog and waits until its wallet list is shown. */
    async clickShowOrHideWallets(): Promise<void> {
        await this.showOrHideWalletsButton.click();
        await this.walletToggles[0].waitForDisplayed();
    }

    /**
     * Switches on the wallet at the given index (0 = first) in the "Show or hide wallets" dialog.
     * Waits until the toggle is really on, because a second click or "Save" sent while the dialog
     * is still updating can get lost, and then a wallet is missing from the list.
     */
    async selectWallet(index: number): Promise<void> {
        action(`switch on wallet ${index + 1} (${shortKey(await this.getToggleWalletKey(index))})`);
        await this.walletToggles[index].click();
        await browser.waitUntil(() => this.isToggleOn(index), {
            timeoutMsg: `the toggle of wallet ${index + 1} did not switch on`,
        });
    }

    /** Saves the selection and waits until the dialog has closed and the panel shows its wallets again. */
    async save(): Promise<void> {
        await browser.pause(TOGGLE_SETTLE_MS);
        await this.saveButton.click();
        await this.walletToggles[0].waitForDisplayed({ reverse: true });
    }

    /** The toggles are switches (role="switch"), they show their state in aria-checked. */
    async isToggleOn(index: number): Promise<boolean> {
        return (await this.walletToggles[index].getAttribute('aria-checked')) === 'true';
    }

    async getToggleWalletKey(index: number): Promise<string> {
        return this.getWalletKey(await this.walletToggles[index].getAttribute('data-testid'));
    }

    async getListedWalletKeys(): Promise<string[]> {
        const testIds = await this.listedWallets.map((wallet) => wallet.getAttribute('data-testid'));
        return testIds.map((testId) => this.getWalletKey(testId));
    }

    /** The public key is the last part of the data-testid (base58 keys never contain "-"). */
    private getWalletKey(testId: string | null): string {
        return testId?.split('-').pop() ?? '';
    }
}

export default new WalletManagementPage();
