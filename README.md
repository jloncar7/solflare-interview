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
| `npm run test:e2e:headless` | E2E test in Chrome, headless (with a normal Chrome User-Agent, see [Findings](#findings)) |
| `npm run test:e2e:firefox` | E2E test in Firefox |
| `npm run test:e2e -- --browser=firefox --headless` | Any combination of browser (`chrome`, `firefox`) and mode |
| `npm run test:api` | All API tests |
| `npx playwright test -g "Scenario 2"` | A single API test (every test is independent) |
| `npx playwright show-report` | HTML report of the last API run |

A screenshot of every failed E2E test is saved to `screenshots/<browser>_<test title>.png` by the generic screenshot module `e2e/helpers/screenshot.ts`.

To watch the E2E test step by step, set `SLOW_MO` to a pause in milliseconds after every action (PowerShell: `$env:SLOW_MO=1000; npm run test:e2e`, bash: `SLOW_MO=1000 npm run test:e2e`).

Every step and action is logged with its time by `logger.ts`, which uses the [winston](https://github.com/winstonjs/winston) logging framework. The log goes to the terminal and to `logs/test.log`. In the E2E test every step of the assignment is logged on its own line, with the result of each check, and the typed password is never logged. The API tests log every request with its status:

```
[14:03:25] STEP 13: select the 3rd and 4th wallet
[14:03:25]    switch on wallet 3 (E7Ap...PEKL)
[14:03:25]    switch on wallet 4 (J3L4...dHfQ)
[14:03:26] STEP 14: click "Save"
[14:03:27] STEP Expected result: the list contains the original wallet and the two newly added wallets
[14:03:27]    expected wallets: 5iLH...DH31, E7Ap...PEKL, J3L4...dHfQ
[14:03:27]    listed wallets:   5iLH...DH31, E7Ap...PEKL, J3L4...dHfQ
[14:03:27]    OK
[14:03:28] GET /v3/portfolio/tokens/Hui...?network=devnet -> 200
```

## Project structure

```
├── e2e/
│   ├── helpers/
│   │   └── screenshot.ts              # generic screenshot module, used after every failed test
│   ├── pageobjects/
│   │   ├── page.ts                    # base page object
│   │   ├── onboard.page.ts            # Get started, password form, terms, Continue
│   │   └── walletManagement.page.ts   # wallet management panel and "Show or hide wallets" dialog
│   └── specs/
│       └── walletManagement.e2e.ts    # the E2E test
├── api/
│   └── tokens.spec.ts                 # API scenarios 1-4
├── .github/workflows/tests.yml        # GitHub Actions: API tests + E2E in Chrome and Firefox
├── logger.ts                          # winston action logger used by both parts (terminal + logs/test.log)
├── wdio.conf.ts
└── playwright.config.ts
```

## GitHub Actions

`.github/workflows/tests.yml` runs the API tests and the E2E test in headless Chrome and Firefox. It is started manually from the **Actions** tab with **Run workflow**. The API HTML report and the screenshots of failed E2E tests are uploaded as artifacts.

## E2E test

The test follows the steps of the assignment. Notes on how it works:

- After **Get started** the site shows a screen that is not in the assignment steps, with **Create new wallet** and **Continue with Google**. The test clicks **Create new wallet** as its own step.
- Every element is found by its `data-testid` (or another attribute the site sets for it, such as `data-key` on the terms checkbox), not by text, position or CSS classes. The site's CSS classes are generated (e.g. `wctcrs1`) and change between deploys.
- Every wallet has its public key in its `data-testid`. The keys of the 1st, 3rd and 4th wallet are read in the **Show or hide wallets** dialog, and after **Save** the test checks that exactly these three wallets are listed under the recovery phrase.
- Every run starts with a fresh browser profile, so a new wallet is created each time and no cleanup is needed.

## API tests

Every request has an `Authorization: Bearer {uuid4}` header, the same way the app does for every install.

| Scenario | What is checked |
| --- | --- |
| 1. Devnet token validation | `network=devnet` returns more than one token besides SOL. Every token has a mint, a valid `totalUiAmount` and a `coingeckoId` (a string or `null`). `price` is checked when a token has one (devnet test tokens have none) |
| 2. SOL token validation | Without `network` only SOL is returned. SOL has the correct name, symbol, mint, `totalUiAmount` and a price |
| 3. Break the API | An invalid address, an unsupported network and an unknown endpoint return 400 or 404 (checked first, so a 500 fails with a clear status) with a JSON error that has a `message` and the same `code`. The message is printed to the console |
| 4. Mainnet → devnet → mainnet | Devnet returns tokens that mainnet does not have, and both mainnet responses are identical apart from the prices (`price` and `solPrice`) |

## Findings

**Headless Chrome is blocked on `/onboard`.** With its default User-Agent, headless Chrome gets only `{"errors":["Too many requests."]}` from `https://solflare.com/onboard`, even after waiting more than an hour, and the test stops in step 1. Headed Chrome, headed Firefox and headless Firefox pass on the same machine at the same time. The block depends only on the User-Agent: from the same IP, at the same moment, Cloudflare answers `403 Forbidden` with this body to a User-Agent that contains `HeadlessChrome`, and `200` with the page to a normal Chrome User-Agent (and to `curl`). So it is not real rate limiting, the site blocks headless Chrome on purpose and the message is misleading.

To still run the test in headless Chrome, `wdio.conf.ts` makes headless Chrome send the User-Agent of a normal Chrome on the same OS (`--user-agent`). Nothing else changes, and headed Chrome and Firefox keep their own User-Agent. This works around a block that Solflare set up on purpose, so the proper fix is on Solflare's side, e.g. a test environment or an allowlisted IP or User-Agent for automated tests. The error check in step 1 (`Too many requests`) stays, so the test still fails with a clear message if the block changes.

**"Save" right after a toggle can drop that wallet.** In the **Show or hide wallets** dialog the toggle of the 4th wallet shows "on" (`aria-checked="true"`) at once, but when **Save** is clicked a moment later, only the 1st and 3rd wallet are sometimes saved. This happened in about 1 of 3 runs. Nothing on the page shows when the dialog has taken over the change (the toggle and the Save button look the same right after the click and a second later), so the test waits 500 ms before **Save** (`TOGGLE_SETTLE_MS` in `walletManagement.page.ts`, which can be raised on a slow machine with the environment variable of the same name, e.g. `TOGGLE_SETTLE_MS=1000`). With that wait it passed 8 runs out of 8. A user who clicks fast could hit the same problem.

**Scenario 2 fails: without `network` the API returns 6 tokens, not only SOL.** The test is kept as the assignment describes it, so it reports the difference.

- The response without `network` is the mainnet response (the same tokens as `network=mainnet`).
- Besides SOL, the address holds token accounts for bSOL, USDC and USDT with a balance of 0, and tiny amounts of BERN (0.00005) and TSLAx (0.00000001).
- The SOL token itself is correct (name, symbol, mint, `totalUiAmount`, price). That part of the test is a soft assertion, so it is still checked and reported.
- Most likely the address held only SOL when the assignment was written and has received other tokens since. The expectation then depends on the address's current balance, not on the API.

**Devnet SOL is valued at the mainnet SOL price.** With `network=devnet` the SOL token has the mainnet USD price, so `value.total` shows about 200 USD for test tokens with no real value. This may be intended, but it is worth a question.
