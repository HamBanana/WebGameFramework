# WebGameFramework — agent instructions

## Never install npm packages into this repo

This project has **no `package.json` and needs none**. It is plain static HTML/JS
served by `serve.js`.

Do not run `npm install`, `npm i -D`, or `npx playwright install` here. Doing so
creates `package.json`, `package-lock.json`, and `node_modules/`, and downloads
~700 MB of browser binaries. All of it has to be deleted by hand afterwards.

## To look at a page, use the tools your environment actually has

Two environments work on this repo and they have **different** browser tooling.
Use the section that matches you; do not reach for the other one's tool names.

### On prime (little-coder / pi, in a terminal)

There is **no MCP server here** — pi ships no MCP client by design, so
`playwright_browser_*` tools do not exist. Use:

- **`gametest`** — the CLI wrapper. This is the fastest path and the only way to
  get pixels:

      gametest list [filter]        list game ids
      gametest check <Game>         lint + boot headless, exit 1 if broken
      gametest shot <Game> [-f N]   render a PNG, prints the on-disk path
      gametest play <Game>          print the play URL

  `gametest check` runs the game in real headless Chromium and reports engine
  start, render mode, frames, draw calls and every runtime error. `gametest shot`
  writes `preview.png` into the game's directory — open that file to see it.
  Full docs: `~/.local/bin/README-gametest.md`.

- **pi's built-in `Browser*` tools** — `BrowserNavigate`, `BrowserClick`,
  `BrowserType`, `BrowserScroll`, `BrowserExtract`, `BrowserBack`,
  `BrowserHistory`. Use these for interaction and reading page text. They take
  **no screenshots** — use `gametest shot` for that.

Prefer `gametest check` over hand-rolling a Playwright script: it already knows
how to boot a game, count draw calls and surface console errors.

### On Windows (Claude/Cursor with the Playwright MCP server)

Use the `playwright_browser_*` tools: `_navigate`, `_snapshot` (accessibility
tree — text, much cheaper than pixels, prefer it), `_click`, `_type`,
`_press_key`, `_evaluate`, `_console_messages`, `_take_screenshot`.

Do **not** write throwaway Node scripts that `require('playwright')`.

## Running the dev server

On prime the games are already served continuously by the `webgameframework`
container — do not start a second server. Reach them at:

- `http://webgameframework:8000` from inside a container on the `llm` network
- `http://127.0.0.1:8191` from the host
- `https://prime.taild264a6.ts.net:8191` from the tailnet

Elsewhere, from the repo root with no `cd` (the shell whitelist rejects `cd`):

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
