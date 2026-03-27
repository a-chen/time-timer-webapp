# time-timer [![starline](https://starlines.qoo.monster/assets/qoomon/time-timer-webapp)](https://github.com/qoomon/starlines)

### [demo](https://timer.andrewchen.website)

Time Timer is a single-page visual timer web app. It shows time as a circular disk that fills or empties as the timer runs, supports countdown and countup modes, and also shows the current clock time on the timer face.

![Time Timer screenshot](docs/Screenshot.png)

- Inspired by the physical [Time Timer](https://www.timetimer.com/)
- Built on code from [qoomon](https://github.com/qoomon/time-timer-webapp)

## What The App Does

- Shows a visual circular timer with a moving arc
- Supports both countdown and countup modes
- Lets you drag on the timer face to set the time
- Persists preferences such as theme and timer behavior in local storage
- Supports `?init=<seconds>` URL initialization, for example `?init=900` for 15 minutes

## Local Development

### Requirements

- Node.js 22.x
- npm

### Quick Start

```shell
npm ci
npm run serve
```

Then open [http://localhost:3000](http://localhost:3000).

### Other Useful Commands

```shell
# production build into dist/
npm run build

# run Playwright tests
npm test

# show the last Playwright HTML report
npx playwright show-report
```

## Testing During Development

Playwright is the primary automated UI test suite in this repository.

### First-Time Playwright Setup

If you have not installed Playwright browsers on your machine yet, run:

```shell
npx playwright install
```

### Development Validation Flow

1. Run `npm run serve`
2. Open [http://localhost:3000](http://localhost:3000) and manually verify your change
3. Run `npm test` to execute the automated browser tests
4. If a test fails, inspect the HTML report with `npx playwright show-report`

For agent-driven or scripted interactive browser work in this repository, use `playwright-cli` rather than MCP or other browser-tool integrations.

- `playwright-cli open http://127.0.0.1:3000`
- `playwright-cli snapshot`
- `playwright-cli click <ref>`
- `playwright-cli drag <startRef> <endRef>`
- `playwright-cli screenshot`

For the automated test suite, continue to use the Playwright test runner:

- `npx playwright test`
- `npx playwright test tests/<spec>.js`
- `npx playwright show-report`

### Current Status

Playwright configuration and tests are present in this repo, but the current `npm test` flow should not be treated as a reliable self-validation gate yet. In the current repo state, Playwright's configured `webServer` startup can fail with an `AggregateError` while launching `npm run serve`.

If that happens:

- Run `npm run serve` directly to inspect the dev-server failure
- Re-run `npm test` after fixing the server startup issue
- Use `npx playwright show-report` to inspect the most recent automated run

## Git Hooks

After cloning the repository, you can install the local git hooks:

```shell
./hooks/setup.sh
```

This installs:

- **pre-commit**: Auto-increments the patch version in `package.json`
- **pre-push**: Runs `npm test` before pushing

Because the current Playwright web-server startup is flaky, treat the pre-push hook as best-effort protection rather than a guaranteed green gate until the underlying startup issue is fixed.

## Docker

Docker is available as an optional way to run the production build locally.

```shell
# build and start the service
docker compose up --build

# open the app in your browser
xdg-open "http://localhost:8080"

# stop the service
docker compose down
```

## Version Management

1. Edit `package.json` and update the `version` field:
   ```json
   {
     "version": "x.x.x"
   }
   ```
2. The version file `app/version.js` is auto-generated and should not be edited manually.
3. The git pre-commit hook automatically increments the patch version on each commit.
