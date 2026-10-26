import Page from './page';
import { action } from '../../logger';

/**
 * Onboarding at /onboard: welcome screen and the "create a password" form.
 */
class OnboardPage extends Page {
    get getStartedButton() {
        return $('button*=Get started');
    }

    /** Extra screen the site shows after "Get started" (it is not in the assignment steps). */
    get createNewWalletButton() {
        return $('button*=Create new wallet');
    }

    get passwordInput() {
        return $$('input[type="password"]')[0];
    }

    get repeatPasswordInput() {
        return $$('input[type="password"]')[1];
    }

    /**
     * The real checkbox input is visually hidden, so the label right around it (the visible box) is clicked.
     * The outer label also holds the Terms of Service link, and a click in its middle would open that link.
     */
    get termsCheckbox() {
        return $('//input[@name="termsAccepted"]/ancestor::label[1]');
    }

    get continueButton() {
        return $('button=Continue');
    }

    async open(): Promise<void> {
        await super.open('/onboard');
    }

    async clickGetStarted(): Promise<void> {
        action('click "Get started"');
        await this.getStartedButton.click();
        // Only click "Create new wallet" if that screen is shown
        const hasWalletTypeScreen = await this.createNewWalletButton.waitForDisplayed({ timeout: 5000 }).catch(() => false);
        if (hasWalletTypeScreen) {
            action('click "Create new wallet"');
            await this.createNewWalletButton.click();
        }
    }

    /** Fills in both password fields, accepts the terms and continues. */
    async createPassword(password: string): Promise<void> {
        // The password itself is never logged
        action('type the password into both password fields');
        await this.passwordInput.setValue(password);
        await this.repeatPasswordInput.setValue(password);
        action('tick "I agree to the Terms of Service and Privacy Policy"');
        await this.termsCheckbox.click();
        action('click "Continue"');
        await this.continueButton.click();
    }
}

export default new OnboardPage();
