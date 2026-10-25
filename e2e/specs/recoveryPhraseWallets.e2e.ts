import { expect } from '@wdio/globals';
import onboardPage from '../pageobjects/onboard.page';
import headerComponent from '../pageobjects/header.component';
import walletManagementPage from '../pageobjects/walletManagement.page';
import showHideWalletsModal from '../pageobjects/showHideWallets.modal';

/**
 * The wallet is created from scratch in a fresh browser profile, so the password only protects
 * this throwaway wallet. It can be overridden with the TEST_PASSWORD environment variable.
 */
const PASSWORD = process.env.TEST_PASSWORD ?? 'QaAutomation#2026';

describe('Wallet management', () => {
    it('should list the original wallet and the two newly added wallets under the recovery phrase', async () => {
        // Steps 1-6: create a new wallet
        await onboardPage.open();
        await onboardPage.clickGetStarted();
        await onboardPage.enterPassword(PASSWORD);
        await onboardPage.enterRepeatPassword(PASSWORD);
        await onboardPage.acceptTerms();
        await expect(onboardPage.termsCheckbox).toBeSelected();
        await onboardPage.clickContinue();

        // Steps 7-8: open wallet management and check the main wallet
        await headerComponent.openWalletManagement();
        await expect(walletManagementPage.mainWallet).toBeDisplayed();

        // Steps 9-10: open the wallet list of the recovery phrase
        await walletManagementPage.openRecoveryPhraseMenu();
        await walletManagementPage.openShowOrHideWallets();
        await showHideWalletsModal.waitForOpen();

        // Steps 11-12: the first wallet is the main wallet, it is always shown and cannot be hidden
        expect(await showHideWalletsModal.isToggleDisabled(1)).toBe(true);
        expect(await showHideWalletsModal.isToggleOn(1)).toBe(true);

        // Step 13: select the 3rd and 4th wallet and remember their keys for the final check
        const mainWalletKey = await showHideWalletsModal.getWalletKey(1);
        const addedWalletKeys = [await showHideWalletsModal.getWalletKey(3), await showHideWalletsModal.getWalletKey(4)];
        await showHideWalletsModal.selectWallet(3);
        await showHideWalletsModal.selectWallet(4);
        expect(await showHideWalletsModal.isToggleOn(3)).toBe(true);
        expect(await showHideWalletsModal.isToggleOn(4)).toBe(true);

        // Step 14
        await showHideWalletsModal.save();

        // Expected result: the list contains the original wallet and exactly the two added wallets
        await walletManagementPage.waitForWalletCount(3);
        const listedWalletKeys = await walletManagementPage.getRecoveryPhraseWalletKeys();
        expect(listedWalletKeys).toHaveLength(3);
        expect(listedWalletKeys).toEqual(expect.arrayContaining([mainWalletKey, ...addedWalletKeys]));
        await expect(walletManagementPage.mainWallet).toBeDisplayed();
    });
});
