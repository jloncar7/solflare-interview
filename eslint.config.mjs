import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import tseslint from 'typescript-eslint';

/**
 * "npm run lint". Besides the recommended JavaScript and TypeScript rules, it enforces the naming
 * conventions the assignment asks for, so they are checked instead of only promised:
 * - variables, functions and methods in camelCase, constants may be UPPER_CASE
 * - classes and types in PascalCase
 * - file and folder names in camelCase; middle extensions such as ".page" or ".spec" are not part of the name
 */
export default tseslint.config(
    { ignores: ['node_modules/', 'allure-report/', 'allure-results/', 'playwright-report/', 'test-results/'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.mjs'],
        plugins: { 'check-file': checkFile },
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'default', format: ['camelCase'] },
                { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
                // A leading "_" marks a parameter that has to be there but is not used, e.g. "_context"
                { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
                { selector: 'typeLike', format: ['PascalCase'] },
                // Imports keep the name the package gives them, e.g. "winston" or "Page"
                { selector: 'import', format: ['camelCase', 'PascalCase'] },
                // Keys are often given by others (HTTP headers, browser options, report labels), so any name is allowed
                { selector: ['objectLiteralProperty', 'typeProperty'], format: null },
            ],
            // "const { price, ...rest } = token" is the way to leave fields out of an object
            '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
            'check-file/filename-naming-convention': [
                'error',
                { '**/*.{ts,mjs}': 'CAMEL_CASE' },
                { ignoreMiddleExtensions: true },
            ],
            'check-file/folder-naming-convention': ['error', { '{api,e2e}/**/': 'CAMEL_CASE' }],
        },
    },
);
