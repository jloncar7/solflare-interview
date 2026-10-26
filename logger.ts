/**
 * Action logger shared by the E2E and API tests.
 * Every line starts with the time, so a failed run shows which step it stopped on, e.g.:
 *   [14:03:27] click button=Save
 *   [14:03:28] GET /v3/portfolio/tokens/Hui...?network=devnet -> 200
 */
export function log(message: string): void {
    const time = new Date().toTimeString().slice(0, 8);
    console.log(`[${time}] ${message}`);
}
