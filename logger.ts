/**
 * Action logger shared by the E2E and API tests.
 * Every line starts with the time, and actions are indented under the test step they belong to, e.g.:
 *   [14:03:26] STEP 14: save
 *   [14:03:26]    click "Save"
 *   [14:03:28] GET /v3/portfolio/tokens/Hui...?network=devnet -> 200
 */
export function log(message: string): void {
    const time = new Date().toTimeString().slice(0, 8);
    console.log(`[${time}] ${message}`);
}

/** Logs the start of a test step, so the log reads like the test case. */
export function step(title: string): void {
    log(`STEP ${title}`);
}

/** Logs one action or check inside the current step. */
export function action(message: string): void {
    log(`   ${message}`);
}

/** Shortens a 44 character wallet key for the log, e.g. "E7Ap...PEKL". */
export function shortKey(key: string): string {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
