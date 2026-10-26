import onboardPage from '../pageobjects/onboard.page';
import walletManagementPage from '../pageobjects/walletManagement.page';

/** Every run creates a brand-new wallet in a fresh browser profile, so this password protects nothing real. */
const PASSWORD = process.env.TEST_PASSWORD ?? 'QaAutomation#2026';

describe('Wallet management', () => {
    it('should list the original wallet and the two newly added wallets under the recovery phrase', async () => {
        // Steps 1-6: create a new wallet
        await onboardPage.open();
        await onboardPage.clickGetStarted();
        await onboardPage.createPassword(PASSWORD);

        // Steps 7-8: open wallet management, the main wallet is displayed
        await walletManagementPage.walletManagementButton.click();
        await expect(walletManagementPage.mainWallet).toBeDisplayed();

        // Steps 9-10: open the "Show or hide wallets" dialog of the recovery phrase
        await walletManagementPage.openShowOrHideWallets();

        // Steps 11-12: the first toggle (main wallet) is disabled and on
        await expect(walletManagementPage.walletToggles[0]).toBeDisabled();
        expect(await walletManagementPage.isToggleOn(0)).toBe(true);

        // Step 13: select the 3rd and 4th wallet, remembering the keys of all expected wallets
        const expectedWalletKeys = [
            await walletManagementPage.getToggleWalletKey(0),
            await walletManagementPage.getToggleWalletKey(2),
            await walletManagementPage.getToggleWalletKey(3),
        ];
        await walletManagementPage.walletToggles[2].click();
        await walletManagementPage.walletToggles[3].click();

        // Step 14
        await walletManagementPage.saveButton.click();

        // Expected result: the list contains the original wallet and the two newly added wallets
        await expect(walletManagementPage.listedWallets).toBeElementsArrayOfSize(3);
        expect((await walletManagementPage.getListedWalletKeys()).sort()).toEqual(expectedWalletKeys.sort());
    });
});
