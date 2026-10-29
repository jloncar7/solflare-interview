import { addStep, endStep as endAllureStep, startStep } from '@wdio/allure-reporter';
import { Status } from 'allure-js-commons';
import { action as logAction, step as logStep } from '../../logger';

/**
 * Test steps for the terminal log and the Allure report at the same time.
 * Every step(...) is a step in Allure and every action(...) a sub-step inside it,
 * so the report reads like the test case of the assignment instead of a list of WebDriver commands.
 */
let isStepOpen = false;

/** Ends the previous step as passed and starts the next one. */
export function step(title: string): void {
    endStep(true);
    logStep(title);
    startStep(title);
    isStepOpen = true;
}

/** Logs one action or check inside the current step. */
export function action(message: string): void {
    logAction(message);
    addStep(message);
}

/** Ends the open step. The last step is ended by afterTest in wdio.conf.ts with the result of the test. */
export function endStep(passed: boolean): void {
    if (isStepOpen) {
        endAllureStep(passed ? Status.PASSED : Status.FAILED);
        isStepOpen = false;
    }
}
