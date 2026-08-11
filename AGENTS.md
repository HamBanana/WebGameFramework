# WebGameFramework — agent instructions

## Never install npm packages into this repo

This project has **no `package.json` and needs none**. It is plain static HTML/JS
served by `serve.js`.

Do not run `npm install`, `npm i -D`, or `npx playwright install` here. Doing so
creates `package.json`, `package-lock.json`, and `node_modules/`, and downloads
~700 MB of browser binaries to `%USERPROFILE%\AppData\Local\ms-playwright`. All of
it has to be deleted by hand afterwards.

## To look at a page, use the browser tools

Browser automation is provided by an MCP server, already running. Use the
`playwright_browser_*` tools:

- `playwright_browser_navigate` — open a URL
- `playwright_browser_snapshot` — read the page (accessibility tree; prefer this
  over screenshots, it is text and much cheaper)
- `playwright_browser_click`, `playwright_browser_type`, `playwright_browser_press_key`
- `playwright_browser_evaluate` — run JS in the page to inspect game state
- `playwright_browser_console_messages` — read console errors
- `playwright_browser_take_screenshot` — only when you actually need pixels

Do **not** write throwaway Node scripts that `require('playwright')`. The MCP
tools do the same job with nothing installed in the repo.

## Running the dev server

From the repo root, with no `cd` (the shell whitelist rejects `cd`):

    node serve.js

It defaults to port 3000. If that port is in use, either reuse the server that is
already running on it, or pick another port explicitly:

    node serve.js 3001

Do not use `python -m http.server` — `serve.js` handles the routing this project
expects.

## Layout

- `framework/` — shared engine code
- `games/<Name>/` — one directory per game
- `tools/`, `Sprites/`, `SFX/` — assets and helper tooling
- `serve.js` — dev server
