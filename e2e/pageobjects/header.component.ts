import BasePage from './base.page';

/**
 * Header of the wallet app that is shown after onboarding.
 */
class HeaderComponent extends BasePage {
    /** Avatar in the right corner of the header, matched by its accessible name. */
    get walletManagementButton() {
        return $('aria/Wallet management');
    }

    async openWalletManagement(): Promise<void> {
        await this.click(this.walletManagementButton, '"Wallet management" (avatar) button');
    }
}

export default new HeaderComponent();
