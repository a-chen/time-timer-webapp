# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Time Timer is a visual countdown/countup timer web application. It displays a circular timer with a shrinking/growing colored arc to visually represent time remaining/elapsed. The app is built as a single-page application and deployed to GitHub Pages.

## Build System & Commands

**Build tool:** Gulp 5 with Browserify bundling

**Key commands:**
- `npm run build` - Full production build (clean → copy resources → build CSS → bundle JS → build HTML)
- `npm run serve` - Start development server with live reload on `http://localhost:3000` (builds and watches `app/**`)
- `npm test` - Currently not implemented (exits with warning)

**Build process:**
- Source: `app/` directory
- Output: `dist/` directory
- JS bundling: Browserify with transforms (packageify, brfs)
- Entry point: `app/index.js` → `dist/bundle.js`
- Resources copied: `app/graphics/*`, `app/sounds/*`

## Architecture

**Single-file application:** The entire timer logic lives in `app/index.js` (~196 lines). There are no separate modules or components.

**Core dependencies:**
- jQuery + jQuery UI (for DOM manipulation and animations)
- ProgressBar.js (circular progress visualization)

**Key concepts:**
- **Timer modes:** Countdown (default) or countup, toggled by clicking the direction icon
- **Timer state:** Stored in `ProgressBar.Circle` instance; degree-based positioning (0-360°)
- **Persistent settings:** LocalStorage stores timer type and alarm sound preference with `time-timer/` key prefix
- **URL params:** `?init=0` sets initial timer in seconds (default: 0 minutes, max: 60 minutes)
- **Visual updates:** `step` callback in ProgressBar config drives both arc rendering and time display
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
1. Node 16 Alpine - build stage (runs `npm run build`)
2. Nginx 1.21 Alpine - production stage (serves `dist/` on port 80)
3. Use `docker compose` instead of `docker-compose`

**Commands:**
```sh
docker build -t qoomon/time-timer-webapp https://github.com/qoomon/time-timer-webapp.git
docker run --rm -p 8080:80 qoomon/time-timer-webapp
```

## Deployment

CI/CD via GitHub Actions (`.github/workflows/build_deploy.yml`):
- Runs on all branches for build validation
- Deploys `dist/` to `gh-pages` branch only on `master` branch pushes
- Uses Node 22.x for builds
- Demo available at: https://qoomon.github.io/time-timer-webapp?init=600

## Code Style Notes

- ES5 style with `var` declarations
- jQuery-heavy DOM manipulation
- Global function exposure via `global.functionName` for onclick handlers in HTML
- Mix of semicolons (inconsistent)
- Direct Audio API usage for alarm sounds

## Git Commit Messages

When creating git commits:
- Do NOT add emojis to commit messages
- Do NOT add "Generated with Claude Code" footer
- Do NOT add "Co-Authored-By: Claude" attribution
- Use conventional commit format: `type: description`
- Keep commit messages concise and focused on what changed and why

## Development Workflow

**UI Change Verification:**
- **REQUIRED:** After making any UI changes, you MUST use Playwright to verify the changes are working properly
- Start the dev server with `npm run serve` (runs on `http://localhost:3000`)
- Use Playwright MCP tools to:
  1. Navigate to `http://localhost:3000`
  2. Take screenshots to verify visual changes
  3. Interact with UI elements to test functionality
  4. Test both light mode and dark mode if applicable
- This ensures changes render correctly and function as expected before completion

** Testing **
- Before a commit is made, a check should be made if there are corresponding tests present to be commited with the code
- If not, create the corresponding tests
