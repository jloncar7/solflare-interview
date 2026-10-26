import Page from './page';

/**
 * Onboarding at /onboard: welcome screen and the "create a password" form.
 */
class OnboardPage extends Page {
    get getStartedButton() {
        return $('button*=Get started');
    }

    /** On the screen after "Get started", next to "Continue with Google" (this screen is not in the assignment steps). */
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
        // When an IP sends too many requests, Solflare answers with only {"errors":["Too many requests."]}
        if ((await $('body').getText()).includes('Too many requests')) {
            throw new Error('Solflare is rate limiting this IP (Too many requests), wait a few minutes and try again');
        }
    }

    async clickGetStarted(): Promise<void> {
        await this.getStartedButton.click();
    }

    async clickCreateNewWallet(): Promise<void> {
        await this.createNewWalletButton.click();
    }

    async enterPassword(password: string): Promise<void> {
        await this.passwordInput.setValue(password);
    }

    async enterRepeatPassword(password: string): Promise<void> {
        await this.repeatPasswordInput.setValue(password);
    }

    async acceptTerms(): Promise<void> {
        await this.termsCheckbox.click();
    }

    async clickContinue(): Promise<void> {
        await this.continueButton.click();
    }
}

export default new OnboardPage();
