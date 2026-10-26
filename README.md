# solflare-interview

QA Automation assignment for Solflare, written in TypeScript:

1. **E2E test** with **WebdriverIO** (Mocha, Page Object pattern): onboarding and wallet management at `https://solflare.com/onboard`.
2. **API tests** with **Playwright Test**: `GET /v3/portfolio/tokens/{address}` on `https://wallet-api.solflare.com`.

## Setup

Requires Node.js 20 or newer. Browsers and drivers don't need to be installed, WebdriverIO downloads them on the first run.

```bash
git clone https://github.com/jloncar7/solflare-interview.git
cd solflare-interview
npm ci
```

## Running the tests

| Command | What it does |
| --- | --- |
| `npm run test:e2e` | E2E test in Chrome, headed |
| `npm run test:e2e:headless` | E2E test in Chrome, headless |
| `npm run test:e2e:firefox` | E2E test in Firefox |
| `npm run test:e2e -- --browser=firefox --headless` | Any combination of browser (`chrome`, `firefox`) and mode |
| `npm run test:api` | All API tests |
| `npx playwright test -g "Scenario 2"` | A single API test (every test is independent) |
| `npx playwright show-report` | HTML report of the last API run |

A screenshot of every failed E2E test is saved to `screenshots/`.

To watch the E2E test step by step, set `SLOW_MO` to a pause in milliseconds after every action (PowerShell: `$env:SLOW_MO=1000; npm run test:e2e`, bash: `SLOW_MO=1000 npm run test:e2e`).

Every action is logged to the terminal with its time (`logger.ts`): the steps of the E2E test, pages opened, clicks and typing (with the element's text or name, never the typed value), the wallet keys that are compared, and every API request with its status:

```
[14:03:26] STEP 14: save
[14:03:27] click "Save"
[14:03:28] GET /v3/portfolio/tokens/Hui...?network=devnet -> 200
```

## Project structure

```
├── e2e/
│   ├── pageobjects/
│   │   ├── page.ts                    # base page object
│   │   ├── onboard.page.ts            # Get started, password form, terms, Continue
│   │   └── walletManagement.page.ts   # wallet management panel and "Show or hide wallets" dialog
│   └── specs/
│       └── walletManagement.e2e.ts    # the E2E test
├── api/
│   └── tokens.spec.ts                 # API scenarios 1-4
├── .github/workflows/tests.yml        # GitHub Actions: API tests + E2E in Chrome and Firefox
├── logger.ts                          # action logger used by both parts
├── wdio.conf.ts
└── playwright.config.ts
```

## GitHub Actions

`.github/workflows/tests.yml` runs the API tests and the E2E test in headless Chrome and Firefox. It is started manually from the **Actions** tab with **Run workflow**. The API HTML report and the screenshots of failed E2E tests are uploaded as artifacts.

## E2E test

The test follows the steps of the assignment. Notes on how it works:

- After **Get started** the site currently asks which kind of wallet to set up, so **Create new wallet** is clicked when that screen is shown.
- Every wallet has its public key in its `data-testid`. The keys of the 1st, 3rd and 4th wallet are read in the **Show or hide wallets** dialog, and after **Save** the test checks that exactly these three wallets are listed under the recovery phrase.
- Every run starts with a fresh browser profile, so a new wallet is created each time and no cleanup is needed.

## API tests

Every request has an `Authorization: Bearer {uuid4}` header, the same way the app does for every install.

| Scenario | What is checked |
| --- | --- |
| 1. Devnet token validation | `network=devnet` returns more than one token. Every token has a mint, a valid `totalUiAmount`, and `price` / `coingeckoId` fields of the right type (they can be `null` on devnet) |
| 2. SOL token validation | Without `network` only SOL is returned, with the correct name, symbol, mint, `totalUiAmount` and a price |
| 3. Break the API | An invalid address, an unsupported network and an unknown endpoint return 400 or 404 with an error message, which is printed to the console |
| 4. Mainnet → devnet → mainnet | Devnet returns more tokens than mainnet, and both mainnet responses are identical apart from the prices |
