import Page from './page';

/**
 * Wallet management panel (opened from the header avatar) and its "Show or hide wallets" dialog.
 * Every wallet has its public key in data-testid: the toggles in the dialog use "tgl-li-wallets-<key>"
 * and the wallets listed under the recovery phrase use "li-wallets-<key>".
 */
class WalletManagementPage extends Page {
    /**
     * Wallet management is opened from the pill in the top right corner of the header
     * (initials, wallet name and address). Before the panel opens, its "Main Wallet" text is the first one on the page.
     */
    get walletManagementButton() {
        return $('(//*[normalize-space(text())="Main Wallet"])[1]');
    }

    get mainWallet() {
        return $('//*[contains(text(), "Main Wallet") or contains(text(), "Main wallet")]');
    }

    /** The menu button is the last button in the RECOVERY PHRASE section header (the other one collapses the list). */
    get recoveryPhraseMenuButton() {
        return $('(//*[contains(text(), "RECOVERY PHRASE") or contains(text(), "Recovery phrase")]/ancestor::*[.//button][1]//button)[last()]');
    }

    get showOrHideWalletsButton() {
        return $('//*[text()="Show or hide wallets"]');
    }

    get walletToggles() {
        return $$('[data-testid^="tgl-li-wallets-"]');
    }

    get saveButton() {
        return $('button=Save');
    }

    get listedWallets() {
        return $$('[data-testid^="li-wallets-"]');
    }

    async openShowOrHideWallets(): Promise<void> {
        await this.recoveryPhraseMenuButton.click();
        await this.showOrHideWalletsButton.click();
        await this.walletToggles[0].waitForDisplayed();
    }

    /** A toggle is either a native checkbox or an element with aria-checked. */
    async isToggleOn(index: number): Promise<boolean> {
        const toggle = this.walletToggles[index];
        return (await toggle.getAttribute('aria-checked')) === 'true' || toggle.isSelected();
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
