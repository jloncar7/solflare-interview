import BasePage from './base.page';

/**
 * Onboarding flow at /onboard: the welcome screen and the "create a password" form.
 */
class OnboardPage extends BasePage {
    get getStartedButton() {
        return $('button*=Get started');
    }

    /** Wallet type selection that the current site shows after "Get started" (not listed in the assignment steps). */
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
     * The real terms checkbox is a visually hidden input, so we click the outermost label that wraps it.
     */
    get termsCheckboxLabel() {
        return $('//input[@name="termsAccepted"]/ancestor::label[last()]');
    }

    get termsCheckbox() {
        return $('input[name="termsAccepted"]');
    }

    get continueButton() {
        return $('button=Continue');
    }

    async open(): Promise<void> {
        await super.open('/onboard');
    }

    async clickGetStarted(): Promise<void> {
        await this.click(this.getStartedButton, '"Get started" button');
        await this.clickIfDisplayed(this.createNewWalletButton, '"Create new wallet" button');
    }

    async enterPassword(password: string): Promise<void> {
        await this.type(this.passwordInput, password, 'password input', true);
    }

    async enterRepeatPassword(password: string): Promise<void> {
        await this.type(this.repeatPasswordInput, password, 'repeat password input', true);
    }

    async acceptTerms(): Promise<void> {
        await this.click(this.termsCheckboxLabel, '"I agree to the Terms of Service and Privacy Policy" checkbox');
    }

    async clickContinue(): Promise<void> {
        await this.click(this.continueButton, '"Continue" button');
    }
}

export default new OnboardPage();
