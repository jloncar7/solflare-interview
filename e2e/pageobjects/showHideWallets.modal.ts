import type { ChainablePromiseElement } from 'webdriverio';
import BasePage from './base.page';
import { WALLET_ROW_TEST_ID_PREFIX } from './walletManagement.page';

/** Every wallet in the list has a toggle with data-testid="tgl-li-wallets-<publicKey>". */
const WALLET_TOGGLE_TEST_ID_PREFIX = `tgl-${WALLET_ROW_TEST_ID_PREFIX}`;

/**
 * "Show or hide wallets" dialog. It lists the wallets derived from the recovery phrase,
 * each with a toggle that controls whether the wallet is shown in the wallet list.
 */
class ShowHideWalletsModal extends BasePage {
    get walletToggles() {
        return $$(`[data-testid^="${WALLET_TOGGLE_TEST_ID_PREFIX}"]`);
    }

    get saveButton() {
        return $('button=Save');
    }

    /** Waits until the dialog has rendered the wallet list. */
    async waitForOpen(): Promise<void> {
        await this.walletToggles[0].waitForDisplayed();
    }

    /** Returns the toggle of the n-th wallet in the list (1-based, like in the test steps). */
    getToggle(position: number): ChainablePromiseElement {
        return this.walletToggles[position - 1];
    }

    /** Public key of the n-th wallet, read from its toggle's data-testid. */
    async getWalletKey(position: number): Promise<string> {
        const testId = await this.getToggle(position).getAttribute('data-testid');
        return (testId ?? '').slice(WALLET_TOGGLE_TEST_ID_PREFIX.length);
    }

    /** A toggle can be a native checkbox or an element with role="switch", so both ways are checked. */
    async isToggleOn(position: number): Promise<boolean> {
        const toggle = this.getToggle(position);
        const ariaChecked = await toggle.getAttribute('aria-checked');
        return ariaChecked !== null ? ariaChecked === 'true' : toggle.isSelected();
    }

    async isToggleDisabled(position: number): Promise<boolean> {
        const toggle = this.getToggle(position);
        const ariaDisabled = await toggle.getAttribute('aria-disabled');
        return ariaDisabled === 'true' || !(await toggle.isEnabled());
    }

    /** Selects the n-th wallet by switching its toggle on. */
    async selectWallet(position: number): Promise<void> {
        await this.click(this.getToggle(position), `toggle of wallet #${position}`);
    }

    async save(): Promise<void> {
        await this.click(this.saveButton, '"Save" button');
        await this.saveButton.waitForDisplayed({ reverse: true });
    }
}

export default new ShowHideWalletsModal();
