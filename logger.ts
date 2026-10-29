import winston from 'winston';

/**
 * Action logger shared by the E2E and API tests, built on winston (https://github.com/winstonjs/winston).
 * Every line starts with the time, and actions are indented under the test step they belong to, e.g.:
 *   [14:03:25] STEP 13: select the 3rd and 4th wallet
 *   [14:03:25]    switch on wallet 3 (E7Ap...PEKL)
 *   [14:03:28] GET /v3/portfolio/tokens/Hui...?network=devnet -> 200
 * Each line goes to the terminal and to logs/test.log, so a run can be read again after it finished.
 */
const LOG_FILE = 'logs/test.log';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, message }) => `[${timestamp}] ${message}`),
    ),
    transports: [
        new winston.transports.Console(),
        // winston creates the logs/ directory itself. The file is appended to, every run starts with "START"
        new winston.transports.File({ filename: LOG_FILE }),
    ],
});

export function log(message: string): void {
    logger.info(message);
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
