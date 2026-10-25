# solflare-interview

QA Automation assignment for Solflare, written in TypeScript:

1. **E2E test** of the Solflare onboarding and wallet management flow with **WebdriverIO** (Mocha, Page Object pattern).
2. **API tests** for `GET /v3/portfolio/tokens/{address}` with **Playwright Test** as the API test runner.

## Prerequisites

- Node.js 20 or newer (developed with Node.js 22)
- Google Chrome and/or Mozilla Firefox are **not** required: WebdriverIO downloads the browser and its driver on the first run

## Setup

```bash
git clone https://github.com/jloncar7/solflare-interview.git
cd solflare-interview
npm ci
```

## Running the tests

| Command | What it does |
| --- | --- |
| `npm test` | Runs the API tests and then the E2E test |
| `npm run test:e2e` | E2E test in Chrome, headed |
| `npm run test:e2e:headless` | E2E test in Chrome, headless |
| `npm run test:e2e:chrome` | E2E test in Chrome |
| `npm run test:e2e:firefox` | E2E test in Firefox |
| `npm run test:api` | All API tests |
| `npm run report:api` | Opens the HTML report of the last API run |
| `npm run typecheck` | TypeScript type check |

### E2E options

The browser and the headless mode can be passed as command line arguments or as environment variables:

```bash
npm run test:e2e -- --browser=firefox --headless
BROWSER=firefox HEADLESS=true npm run test:e2e
```

| Argument | Environment variable | Values | Default |
| --- | --- | --- | --- |
| `--browser=<name>` | `BROWSER` | `chrome`, `firefox` | `chrome` |
| `--headless` | `HEADLESS=true` | | headed |
| | `TEST_PASSWORD` | password for the new wallet | a throwaway password |
| | `LOG_LEVEL` | `error`, `warn`, `info`, `debug` | `info` |

### API options

```bash
# Run a single scenario (every test is independent)
npx playwright test api/specs/solToken.spec.ts
npx playwright test -g "unsupported network"
```

| Environment variable | Default |
| --- | --- |
| `API_BASE_URL` | `https://wallet-api.solflare.com` |
| `WALLET_ADDRESS` | `HuiTegTpNAU7EJXvn95HKEWBdFMtWZYko4yoFVQyCKUS` |

## Project structure

```
├── e2e/
│   ├── pageobjects/
│   │   ├── base.page.ts               # shared helpers: waits + logging for every action
│   │   ├── onboard.page.ts            # Get started, password form, terms, Continue
│   │   ├── header.component.ts        # Wallet management avatar
│   │   ├── walletManagement.page.ts   # Main wallet, RECOVERY PHRASE menu, listed wallets
│   │   └── showHideWallets.modal.ts   # wallet toggles and Save
│   ├── specs/
│   │   └── recoveryPhraseWallets.e2e.ts
│   └── utils/
│       ├── e2eLogger.ts
│       └── screenshot.ts              # generic screenshot module
├── api/
│   ├── specs/
│   │   ├── devnetTokens.spec.ts       # Scenario 1
│   │   ├── solToken.spec.ts           # Scenario 2
│   │   ├── breakTheApi.spec.ts        # Scenario 3
│   │   └── networkSwitch.spec.ts      # Scenario 4
│   └── support/
│       ├── fixtures.ts                # per-test request context with a fresh uuid4
│       ├── tokensApiClient.ts         # endpoint wrapper
│       ├── tokenSchemas.ts            # zod schemas of the response
│       └── apiLogger.ts
├── utils/logger.ts                    # winston logger shared by both suites
├── wdio.conf.ts
├── playwright.config.ts
└── .github/workflows/tests.yml        # manual GitHub Actions run (Chrome + Firefox matrix)
```

## E2E test

`e2e/specs/recoveryPhraseWallets.e2e.ts` follows the steps of the assignment:

1. Opens `https://solflare.com/onboard` and clicks **Get started**. The current site then asks which kind of wallet to set up, so **Create new wallet** is clicked when that screen is shown.
2. Enters the password twice, accepts the Terms of Service and clicks **Continue**.
3. Opens **Wallet management** from the header avatar and checks that **Main wallet** is displayed.
4. Opens the menu next to the **RECOVERY PHRASE** label and clicks **Show or hide wallets**.
5. Checks that the first toggle (the main wallet) is disabled and on.
6. Selects the 3rd and 4th wallet and clicks **Save**.
7. **Expected result:** the recovery phrase list contains exactly three wallets: the original one and the two that were added. The wallets are compared by their public keys, which are read from the `data-testid` of the toggles and list items.

Each WebdriverIO session starts with a fresh browser profile, so every run creates a new wallet and needs no cleanup.

## API tests

Every test gets its own Playwright request context with a newly generated uuid4 in the `Authorization: Bearer {uuid4}` header, the same way the app does for every install. No state is shared between tests, so each one can be run on its own and all of them run in parallel.

| Scenario | What is checked |
| --- | --- |
| 1. Devnet token validation | `network=devnet` returns more than one token besides SOL; every token has a unique base58 mint, a valid `totalUiAmount`, and `price` / `coingeckoId` fields of the right type |
| 2. SOL token validation | Without `network` only SOL is returned with `name: "Solana"`, `symbol: "SOL"`, mint `11111111111111111111111111111111`, a valid `totalUiAmount` and a price |
| 3. Break the API | An invalid address, an unsupported network, a missing address and an unknown endpoint each return 400 or 404 with an error message (the message is logged and added to the HTML report) |
| 4. Mainnet → devnet → mainnet | Devnet returns additional tokens, and the second mainnet response matches the first one in every token detail and balance (prices are ignored because they can move between requests) |

The response is validated with [zod](https://zod.dev) schemas in `api/support/tokenSchemas.ts`. A schema error lists every field that does not match.

## Reports, logs and screenshots

| Output | Location |
| --- | --- |
| Action logs (console + file) | `logs/e2e.log`, `logs/api.log` |
| Screenshot of every failed E2E test | `screenshots/<browser>/<test>_<timestamp>.png` |
| API HTML report | `reports/api/index.html` |

## GitHub Actions

`.github/workflows/tests.yml` runs the API tests and the E2E test in headless Chrome and Firefox on GitHub's runners. It is started manually from the **Actions** tab (**Run workflow**), where the browser can be chosen. Logs, screenshots and the API report are uploaded as artifacts.
