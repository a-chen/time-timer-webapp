# AGENTS.md

## Project Overview

Time Timer is a visual countdown/countup timer web application. This fork adds a visible current clock on the timer face alongside the circular timer, plus theme and alarm controls. The app is built as a single-page application and deployed to GitHub Pages.

## Build System & Commands

**Build tool:** Gulp 5 with Browserify bundling

**Key commands:**
- `npm run build` - Full production build (clean → copy resources → build CSS → bundle JS → build HTML)
- `npm run serve` - Start the BrowserSync development server (usually `http://localhost:3000`, or the next free port) and watch `app/**`
- `npm test` - Run the Playwright browser test suite

**Build process:**
- Source: `app/` directory
- Output: `dist/` directory
- JS bundling: Browserify with transforms (packageify, brfs)
- Entry point: `app/index.js` → `dist/bundle.js`
- Resources copied: `app/graphics/*`, `app/sounds/*`, `app/fonts/*`

## Architecture

**App structure:** The runtime logic lives in `app/index.js`, styles live in `app/index.css`, and the HTML shell is `app/index.html`. There are no separate app-side JavaScript modules or components.

**Core dependencies:**
- jQuery + jQuery UI (for DOM manipulation and animations)
- ProgressBar.js (circular progress visualization)

**Key concepts:**
- **Timer modes:** Countdown (default) or countup, toggled by clicking the direction icon
- **Timer state:** Stored in `ProgressBar.Circle` instance; degree-based positioning (0-360°)
- **Persistent settings:** LocalStorage stores timer type, theme, alarm mute state, and alarm duration with the `time-timer/` key prefix
- **URL params:** `?init=<seconds>` seeds the initial timer value from `0` to `3600` seconds
- **Visual updates:** `step` callback in ProgressBar config drives both arc rendering and the timer display, while a separate interval updates the clock on the timer face
- **User interaction:** Mouse/touch drag on timer disk to set time; stops timer during drag, restarts on release

**State management:**
- Global `timer` object (ProgressBar instance) holds current progress (0.0-1.0)
- `timerType` variable toggles between "countdown"/"countup"
- `timerLastDegree` tracks previous angle to prevent wrap-around jumps during drag
- `STORAGE` utility provides localStorage abstraction with domain-prefixed keys

**Animation system:**
- jQuery UI effects handle the 3D flip animation when switching timer modes (rotateY transform)
- ProgressBar.js animates the circular progress arc with configurable duration
- Timer bar end/knob positions calculated via trigonometry based on current rotation

## Docker Support

Multi-stage build:
1. Node 22 Alpine - build stage as currently defined in `Dockerfile` (runs `npm ci` and `npm run build`)
2. Nginx 1.27 Alpine - production stage serving `dist/` on port 80
3. `docker-compose.yml` maps container port `80` to host port `9002` by default, with `EXTERNAL_PORT` available for overrides

**Commands:**
```sh
docker compose up --build
# open http://localhost:9002

EXTERNAL_PORT=8080 docker compose up --build
# open http://localhost:8080

docker compose down
```

Optional troubleshooting: run `npm ci` first if you also need to reproduce local install or test issues on the host. The containerized flow installs its own dependencies during `docker compose up --build`.

## Deployment

CI/CD via GitHub Actions (`.github/workflows/build_deploy.yml`):
- Runs `npm ci`, `npm run build`, and `npm test` on pushes and pull requests
- Deploys `dist/` to `gh-pages` branch only on `master` branch pushes
- Uses Node 22.x for builds
- Demo available at: https://timer.andrewchen.website?init=600

## Code Style Notes

- ES5 style with `var` declarations
- jQuery-heavy DOM manipulation
- Global function exposure via `global.functionName` for onclick handlers in HTML
- Mix of semicolons (inconsistent)
- Direct Audio API usage for alarm sounds

## Git Commit Messages

When creating git commits:
- Do NOT add emojis to commit messages
- Do NOT add "Generated with Codex" footer
- Do NOT add "Co-Authored-By: Codex" attribution
- Use conventional commit format: `type: description`
- Keep commit messages concise and focused on what changed and why

## Development Workflow

**UI Change Verification:**
- **REQUIRED:** After making any UI changes, you MUST use playwright-cli to verify the changes are working properly
- In this repository, use `playwright-cli` for interactive browser verification work instead of Playwright MCP tools or other browser automation wrappers.
- Start the dev server with `npm run serve` when a command needs a running app, then use the local URL printed by BrowserSync
- Preferred `playwright-cli` commands:
  1. `playwright-cli open http://127.0.0.1:3000` to launch the app when BrowserSync is on its default port
  2. `playwright-cli snapshot` to capture refs before interacting
  3. `playwright-cli click <ref>` / `playwright-cli fill <ref> <text>` / `playwright-cli drag <startRef> <endRef>` for interaction
  4. `playwright-cli screenshot` for visual captures
- Do not claim Playwright verification is complete unless a playwright-cli command was actually run
- Run `npm test` or `npx playwright test` for automated coverage

** Testing **
- Before a commit is made, a check should be made if there are corresponding tests present to be commited with the code
- If not, create the corresponding tests
