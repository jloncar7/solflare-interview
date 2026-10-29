import Page from './page';

/**
 * Onboarding at /onboard: welcome screen and the "create a password" form.
 * Every element is found by its data-testid (or another attribute the site sets for it), not by text,
 * position or CSS classes, so the selectors keep working when texts, layout or styles change.
 */
class OnboardPage extends Page {
    get getStartedButton() {
        return $('[data-testid="btn-get-started"]');
    }

    /** On the screen after "Get started", above "Continue with Google" */
    get createNewWalletButton() {
        return $('[data-testid="btn-manual-create"]');
    }

    get passwordInput() {
        return $('[data-testid="input-new-password"]');
    }

    get repeatPasswordInput() {
        return $('[data-testid="input-repeat-password"]');
    }

    /**
     * The real checkbox input is visually hidden, so the box around it (label data-id="checkbox") is clicked.
     * It is looked up inside the terms row (data-key), and not the whole row is clicked, because the row
     * also holds the Terms of Service link and a click in its middle would open that link.
     */
    get termsCheckbox() {
        return $('label[data-key="onboard-term-and-conditions-check"] label[data-id="checkbox"]');
    }

    /** The real (hidden) checkbox input, used to check that the click above really ticked it. */
    get termsCheckboxInput() {
        return $('input[name="termsAccepted"]');
    }

    get continueButton() {
        return $('[data-testid="btn-continue"]');
    }

    async open(): Promise<void> {
        await super.open('/onboard');
        // Solflare answers blocked clients (e.g. headless Chrome's User-Agent) with only {"errors":["Too many requests."]}
        if ((await $('body').getText()).includes('Too many requests')) {
            throw new Error('Solflare blocked this browser ("Too many requests"), see Findings in the README');
        }
    }

    async clickGetStarted(): Promise<void> {
        await this.getStartedButton.click();
    }

    async clickCreateNewWallet(): Promise<void> {
        await this.createNewWalletButton.click();
    }

    // mask: true keeps the typed password out of the WebdriverIO logs and reports
    async enterPassword(password: string): Promise<void> {
        await this.passwordInput.setValue(password, { mask: true });
    }

    async enterRepeatPassword(password: string): Promise<void> {
        await this.repeatPasswordInput.setValue(password, { mask: true });
    }

    async acceptTerms(): Promise<void> {
        await this.termsCheckbox.click();
    }

    async clickContinue(): Promise<void> {
        await this.continueButton.click();
    }
}

export default new OnboardPage();
