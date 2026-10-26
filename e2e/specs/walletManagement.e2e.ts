import onboardPage from '../pageobjects/onboard.page';
import walletManagementPage from '../pageobjects/walletManagement.page';
import { action, shortKey, step } from '../../logger';

/** Every run creates a brand-new wallet in a fresh browser profile, so this password protects nothing real. */
const PASSWORD = process.env.TEST_PASSWORD ?? 'QaAutomation#2026';

describe('Wallet management', () => {
    it('should list the original wallet and the two newly added wallets under the recovery phrase', async () => {
        step('1-6: create a new wallet');
        await onboardPage.open();
        await onboardPage.clickGetStarted();
        // The site shows a screen between "Get started" and the password form that the assignment does not list
        await onboardPage.clickCreateNewWallet();
        await onboardPage.createPassword(PASSWORD);

        step('7-8: open wallet management, the main wallet is displayed');
        await walletManagementPage.openWalletManagement();
        await expect(walletManagementPage.mainWallet).toBeDisplayed();
        action('OK: "Main Wallet" is displayed');

        step('9-10: open the "Show or hide wallets" dialog of the recovery phrase');
        await walletManagementPage.openShowOrHideWallets();

        step('11-12: the first toggle (main wallet) is disabled and on');
        await expect(walletManagementPage.walletToggles[0]).toBeDisabled();
        expect(await walletManagementPage.isToggleOn(0)).toBe(true);
        action('OK: the first toggle is disabled and on');

        step('13: select the 3rd and 4th wallet');
        // Remember the keys of all wallets that should be listed at the end
        const expectedWalletKeys = [
            await walletManagementPage.getToggleWalletKey(0),
            await walletManagementPage.getToggleWalletKey(2),
            await walletManagementPage.getToggleWalletKey(3),
        ];
        await walletManagementPage.selectWallet(2);
        await walletManagementPage.selectWallet(3);

        step('14: save');
        await walletManagementPage.save();

        step('Expected result: the list contains the original wallet and the two newly added wallets');
        await expect(walletManagementPage.listedWallets).toBeElementsArrayOfSize(3);
        const listedWalletKeys = await walletManagementPage.getListedWalletKeys();
        action(`expected wallets: ${expectedWalletKeys.map(shortKey).join(', ')}`);
        action(`listed wallets:   ${listedWalletKeys.map(shortKey).join(', ')}`);
        expect(listedWalletKeys.sort()).toEqual(expectedWalletKeys.sort());
        action('OK: the list contains exactly the expected wallets');
    });
});
