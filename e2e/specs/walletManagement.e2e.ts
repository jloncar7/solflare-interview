import onboardPage from '../pageobjects/onboard.page';
import walletManagementPage from '../pageobjects/walletManagement.page';
import { shortKey } from '../../logger';
import { action, step } from '../helpers/report';

/** Every run creates a brand-new wallet in a fresh browser profile, so this password protects nothing real. */
const PASSWORD = process.env.TEST_PASSWORD ?? 'JLoncarSolflare#2026';

/**
 * E2E test from the assignment: create a new wallet, show two more wallets of its recovery phrase
 * and check that the wallet list then holds exactly the original wallet and the two new ones.
 *
 * The test only describes the steps. How each element is found and clicked lives in the page objects
 * (e2e/pageobjects), so a change on the site is fixed there and this file stays the same.
 * Every step starts with step(...), which writes it to the log, so a failed run shows where it stopped.
 */
describe('Wallet management', () => {
    it('should list the original wallet and the two newly added wallets under the recovery phrase', async () => {
        // Steps 1-6: create a new wallet with a password
        step('1: go to /onboard');
        // open() also fails at once with a clear message when Solflare answers "Too many requests"
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

        // Steps 7-8: the wallet is created and the app opens; wallet management lists its wallets
        step('7: click "Wallet management" (the avatar in the header)');
        await walletManagementPage.openWalletManagement();

        step('8: verify that the main wallet is displayed');
        // WebdriverIO's expect waits and retries until the element is displayed, so no fixed pause is needed
        await expect(walletManagementPage.mainWallet).toBeDisplayed();
        await expect(walletManagementPage.mainWallet).toHaveText('Main Wallet', { containing: true });
        action('OK');

        // Steps 9-10: one recovery phrase can create many wallets; this dialog chooses which ones are shown
        // The assignment says "arrow icon", but "Show or hide wallets" is only in the kebab menu (the arrow collapses the list)
        step('9: click the kebab menu (⋮) next to RECOVERY PHRASE');
        await walletManagementPage.openRecoveryPhraseMenu();

        step('10: click "Show or hide wallets"');
        await walletManagementPage.clickShowOrHideWallets();

        // Steps 11-12: the first wallet is the main wallet, it is always shown, so its toggle is on and locked
        step('11: verify that the first toggle is disabled');
        await expect(walletManagementPage.walletToggles[0]).toBeDisabled();
        action('OK');

        step('12: verify that the first toggle is on');
        // isToggleOn returns a value that is already known, so this is a plain expect without waiting
        expect(await walletManagementPage.isToggleOn(0)).toBe(true);
        action('OK');

        step('13: select the 3rd and 4th wallet');
        // Remember the keys of all wallets that should be listed at the end. A wallet's public key is
        // unique, unlike its name, so it proves the list holds exactly these wallets.
        // Indexes start at 0: the 1st wallet is 0, the 3rd is 2 and the 4th is 3.
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
        // Waits until the list has updated to exactly 3 wallets, then compares their keys with the expected ones
        await expect(walletManagementPage.listedWallets).toBeElementsArrayOfSize(3);
        const listedWalletKeys = await walletManagementPage.getListedWalletKeys();
        action(`expected wallets: ${expectedWalletKeys.map(shortKey).join(', ')}`);
        action(`listed wallets:   ${listedWalletKeys.map(shortKey).join(', ')}`);
        // Both lists are sorted, so only which wallets are listed matters, not their order
        expect(listedWalletKeys.sort()).toEqual(expectedWalletKeys.sort());
        action('OK');
    });
});
