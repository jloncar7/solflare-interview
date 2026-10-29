import { rmSync } from 'node:fs';

/**
 * Runs once before the API tests. Every run starts with an empty Allure results folder for the API tests,
 * so the report only shows the last run. The E2E results in allure-results/e2e are left alone.
 */
export default function globalSetup(): void {
    rmSync('./allure-results/api', { recursive: true, force: true });
}
