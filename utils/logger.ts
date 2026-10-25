import { createLogger, format, transports } from 'winston';

/**
 * Shared winston logger used by both the E2E and the API suites.
 * Everything is printed to the console and also written to logs/<suite>.log.
 * The level can be changed with the LOG_LEVEL environment variable (default: info).
 */
export function createSuiteLogger(suite: 'e2e' | 'api') {
    return createLogger({
        level: process.env.LOG_LEVEL ?? 'info',
        format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            format.printf(({ timestamp, level, message }) => `${timestamp} [${suite}] ${level.toUpperCase()}: ${message}`),
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: `logs/${suite}.log` }),
        ],
    });
}
