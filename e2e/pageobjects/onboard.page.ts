import Page from './page';

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

    /** The real checkbox input is visually hidden, so its outermost label is clicked instead. */
    get termsCheckbox() {
        return $('//input[@name="termsAccepted"]/ancestor::label[last()]');
    }

    get continueButton() {
        return $('button=Continue');
    }

    async open(): Promise<void> {
        await super.open('/onboard');
    }

    async clickGetStarted(): Promise<void> {
        await this.getStartedButton.click();
        // Only click "Create new wallet" if that screen is shown
        const hasWalletTypeScreen = await this.createNewWalletButton.waitForDisplayed({ timeout: 5000 }).catch(() => false);
        if (hasWalletTypeScreen) {
            await this.createNewWalletButton.click();
        }
    }

    /** Fills in both password fields, accepts the terms and continues. */
    async createPassword(password: string): Promise<void> {
        await this.passwordInput.setValue(password);
        await this.repeatPasswordInput.setValue(password);
        await this.termsCheckbox.click();
        await this.continueButton.click();
    }
}

export default new OnboardPage();
