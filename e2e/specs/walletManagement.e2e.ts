import onboardPage from '../pageobjects/onboard.page';
import walletManagementPage from '../pageobjects/walletManagement.page';
import { action, shortKey, step } from '../../logger';

/** Every run creates a brand-new wallet in a fresh browser profile, so this password protects nothing real. */
const PASSWORD = process.env.TEST_PASSWORD ?? 'QaAutomation#2026';

describe('Wallet management', () => {
    it('should list the original wallet and the two newly added wallets under the recovery phrase', async () => {
        step('1: go to /onboard');
        await onboardPage.open();

        step('2: click "Get started"');
        await onboardPage.clickGetStarted();

        // The site shows a screen between "Get started" and the password form that the assignment does not list
        step('2a: click "Create new wallet"');
        await onboardPage.clickCreateNewWallet();

        // The password itself is never logged
        step('3: enter the password');
        await onboardPage.enterPassword(PASSWORD);

        step('4: enter the same password into the second field');
        await onboardPage.enterRepeatPassword(PASSWORD);

        step('5: tick "I agree to the Terms of Service and Privacy Policy"');
        await onboardPage.acceptTerms();

        step('6: click "Continue"');
        await onboardPage.clickContinue();

        step('7: click "Wallet management" (the "Main Wallet" pill in the header)');
        await walletManagementPage.openWalletManagement();

        step('8: verify that the main wallet is displayed');
        await expect(walletManagementPage.mainWallet).toBeDisplayed();
        action('OK');

        step('9: click the arrow icon next to RECOVERY PHRASE');
        await walletManagementPage.openRecoveryPhraseMenu();

        step('10: click "Show or hide wallets"');
        await walletManagementPage.clickShowOrHideWallets();

        step('11: verify that the first toggle is disabled');
        await expect(walletManagementPage.walletToggles[0]).toBeDisabled();
        action('OK');

        step('12: verify that the first toggle is on');
        expect(await walletManagementPage.isToggleOn(0)).toBe(true);
        action('OK');

        step('13: select the 3rd and 4th wallet');
        // Remember the keys of all wallets that should be listed at the end
        const expectedWalletKeys = [
            await walletManagementPage.getToggleWalletKey(0),
            await walletManagementPage.getToggleWalletKey(2),
            await walletManagementPage.getToggleWalletKey(3),
        ];
        await walletManagementPage.selectWallet(2);
        await walletManagementPage.selectWallet(3);

        step('14: click "Save"');
        await walletManagementPage.save();

        step('Expected result: the list contains the original wallet and the two newly added wallets');
        await expect(walletManagementPage.listedWallets).toBeElementsArrayOfSize(3);
        const listedWalletKeys = await walletManagementPage.getListedWalletKeys();
        action(`expected wallets: ${expectedWalletKeys.map(shortKey).join(', ')}`);
        action(`listed wallets:   ${listedWalletKeys.map(shortKey).join(', ')}`);
        expect(listedWalletKeys.sort()).toEqual(expectedWalletKeys.sort());
        action('OK');
    });
});
