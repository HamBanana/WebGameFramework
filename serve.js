// GameFramework/serve.js
// Minimal local HTTP server for development.
// Serves the entire GameFramework folder over HTTP so browsers
// don't hit file:// CORS restrictions (which block audio and fetch).
//
// Usage:
//   node serve.js                  → serves on http://localhost:3000 (loopback only)
//   node serve.js 8080             → serves on http://localhost:8080 (loopback only)
//   node serve.js 8080 0.0.0.0     → serves on all interfaces (reachable on LAN)
//
// Then open a game at e.g.:
//   http://localhost:3000/games/FightingGame/index.html

const http = require('http');
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// Deep-merge `source` into `target` in place (arrays are replaced, not merged).
function deepMergeObj(target, source) {
  for (const k of Object.keys(source)) {
    const v = source[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) {
        target[k] = {};
      }
      deepMergeObj(target[k], v);
    } else {
      target[k] = v;
    }
  }
}

// Execute a config.js IIFE in a sandbox and return the resolved GF.GAME_CONFIG
// object (all JS local-variable references are evaluated, e.g. BOARD_LAYOUT).
function extractConfigFromFile(content) {
  try {
    const sandbox = vm.createContext({
      window: { addEventListener: function () {}, GF: {} },
    });
    vm.runInContext(content, sandbox);
    const cfg = sandbox.window.GF && sandbox.window.GF.GAME_CONFIG;
    // Return a plain deep-clone so vm internals don't leak
    return cfg ? JSON.parse(JSON.stringify(cfg)) : null;
  } catch (_) {
    return null;
  }
}

const PORT = parseInt(process.argv[2] || '3000', 10);
const HOST = process.argv[3] || '127.0.0.1';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.ogg':  'audio/ogg',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  // Decode and strip query string
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // ── API: list games ──────────────────────────────────────────────────────────
  if (urlPath === '/api/games') {
    const gamesDir = path.join(ROOT, 'games');
    const games = [];

    if (fs.existsSync(gamesDir)) {
      const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const indexFile   = path.join(gamesDir, entry.name, 'index.html');
        const gameJsonFile = path.join(gamesDir, entry.name, 'game.json');
        if (!fs.existsSync(indexFile)) continue;   // skip folders without a game

        let meta = { id: entry.name, title: entry.name, config: [] };
        if (fs.existsSync(gameJsonFile)) {
          try { Object.assign(meta, JSON.parse(fs.readFileSync(gameJsonFile, 'utf8'))); }
          catch { /* malformed game.json — use defaults */ }
        }
        // Always derive path from folder name so it stays correct regardless of game.json
        meta.path = `games/${entry.name}/index.html`;
        games.push(meta);
      }
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(games));
    return;
  }

  // ── API: save game config ─────────────────────────────────────────────────────
  if (req.method === 'POST' && urlPath === '/api/config/save') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { gameId, config: overrides } = JSON.parse(body);
        const configFile = path.join(ROOT, 'games', gameId, 'config.js');

        // Validate path to prevent directory traversal
        if (!configFile.startsWith(ROOT)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }

        if (!fs.existsSync(path.dirname(configFile))) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Game not found' }));
          return;
        }

        const currentContent = fs.readFileSync(configFile, 'utf8');

        // Verify the file has a GF.GAME_CONFIG block we can replace
        if (!/GF\.GAME_CONFIG\s*=\s*\{/.test(currentContent)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid config.js format' }));
          return;
        }

        // ── Step 1: extract the full current config ────────────────────────
        // Run the IIFE in a vm sandbox so that any JS locals (e.g. BOARD_LAYOUT
        // in Acca) are resolved before we serialise.  Falls back to a regex +
        // JSON.parse if vm execution fails for any reason.
        let currentConfig = extractConfigFromFile(currentContent);

        if (!currentConfig) {
          // Fallback: extract the raw JSON block and parse it
          const m = currentContent.match(/GF\.GAME_CONFIG\s*=\s*({[\s\S]*?});/);
          if (m) {
            try { currentConfig = JSON.parse(m[1]); } catch (_) {}
          }
        }

        if (!currentConfig) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Could not parse current config' }));
          return;
        }

        // ── Step 2: merge the launcher overrides into the full config ──────
        // Only the keys touched by the launcher are changed; everything else
        // (physics, board layout, achievements, etc.) is preserved.
        deepMergeObj(currentConfig, overrides);

        // ── Step 3: write the merged config back ───────────────────────────
        const configStr = JSON.stringify(currentConfig, null, 2);
        const newContent = currentContent.replace(
          /GF\.GAME_CONFIG\s*=\s*\{[\s\S]*?\};/,
          `GF.GAME_CONFIG = ${configStr};`
        );

        fs.writeFileSync(configFile, newContent, 'utf8');

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ success: true, message: 'Config saved' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── API: restart server ───────────────────────────────────────────────────────
  if (req.method === 'POST' && urlPath === '/api/server/restart') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ success: true, message: 'Server restarting...' }));

    // Give the response time to send, then gracefully restart
    setTimeout(() => {
      process.exit(0);
    }, 500);
    return;
  }

  // ── World editor API ─────────────────────────────────────────────────────────
  // The world editor (worldbuilder.html) reads/writes a game's world.json and the
  // generated parts/world_data.js. Creating a brand-new world game is proxied to
  // the owui-games-tool service (reuses its create_game + create_world scaffold).
  const NS_STR = "window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }";

  function worldDataPart(world) {
    return (
      "// parts/world_data.js — generated by the world editor (worldbuilder.html).\n" +
      "// The world data object (areas, layers, entities, portals) as inline JS so\n" +
      "// the scene reads G.state.world with no fetch. Do not hand-edit.\n" +
      "(function (G) {\n  'use strict';\n  G.state.world = " +
      JSON.stringify(world) + ";\n})(" + NS_STR + ");\n"
    );
  }

  const GAME_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

  function jsonRes(res, code, obj) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8',
                          'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(obj));
  }

  // Proxy a JSON request to the owui-games-tool service (same docker network).
  function proxyGamesTool(method, apiPath, body) {
    return new Promise((resolve, reject) => {
      const base = process.env.GAMES_TOOL_URL || 'http://owui-games-tool:8000';
      const token = process.env.GAMES_TOOL_TOKEN || '';
      let u;
      try { u = new URL(base + apiPath); } catch (e) { return reject(e); }
      const data = body != null ? Buffer.from(JSON.stringify(body)) : null;
      const opts = {
        method, hostname: u.hostname, port: u.port || 80, path: u.pathname + u.search,
        headers: { 'Authorization': 'Bearer ' + token },
      };
      if (data) { opts.headers['Content-Type'] = 'application/json';
                  opts.headers['Content-Length'] = data.length; }
      const preq = http.request(opts, (pres) => {
        let buf = '';
        pres.on('data', c => { buf += c; });
        pres.on('end', () => {
          let parsed = null; try { parsed = JSON.parse(buf); } catch (_) {}
          resolve({ status: pres.statusCode, body: parsed, raw: buf });
        });
      });
      preq.on('error', reject);
      if (data) preq.write(data);
      preq.end();
    });
  }

  // GET /api/world/list → games that already have a world.json, plus every game
  // (so the editor can offer to add a world to one, and list targets for New).
  if (urlPath === '/api/world/list') {
    const gamesDir = path.join(ROOT, 'games');
    const worlds = [], all = [];
    if (fs.existsSync(gamesDir)) {
      for (const e of fs.readdirSync(gamesDir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        if (!fs.existsSync(path.join(gamesDir, e.name, 'index.html'))) continue;
        all.push(e.name);
        if (fs.existsSync(path.join(gamesDir, e.name, 'world.json'))) worlds.push(e.name);
      }
    }
    jsonRes(res, 200, { worlds, games: all });
    return;
  }

  // GET /api/world/read?game=X → the game's world.json
  if (urlPath === '/api/world/read') {
    const game = (req.url.split('?')[1] || '').split('&')
      .map(s => s.split('=')).reduce((a, [k, v]) => (k === 'game' ? decodeURIComponent(v || '') : a), '');
    if (!GAME_ID_RE.test(game)) { jsonRes(res, 400, { error: 'bad game id' }); return; }
    const wf = path.join(ROOT, 'games', game, 'world.json');
    if (!wf.startsWith(ROOT) || !fs.existsSync(wf)) { jsonRes(res, 404, { error: 'no world.json for ' + game }); return; }
    try { jsonRes(res, 200, { game, world: JSON.parse(fs.readFileSync(wf, 'utf8')) }); }
    catch (e) { jsonRes(res, 500, { error: 'world.json is corrupt: ' + e.message }); }
    return;
  }

  // POST /api/world/save  { game, world } → write world.json + parts/world_data.js
  if (req.method === 'POST' && urlPath === '/api/world/save') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { game, world } = JSON.parse(body);
        if (!GAME_ID_RE.test(game || '')) { jsonRes(res, 400, { error: 'bad game id' }); return; }
        const gdir = path.join(ROOT, 'games', game);
        if (!gdir.startsWith(ROOT) || !fs.existsSync(gdir)) { jsonRes(res, 404, { error: 'game not found' }); return; }
        if (!world || typeof world !== 'object' || !world.areas) {
          jsonRes(res, 400, { error: 'world must be an object with an areas map' }); return;
        }
        const partsDir = path.join(gdir, 'parts');
        if (!fs.existsSync(partsDir)) { jsonRes(res, 400, { error: 'not a component game (no parts/) — create the world game first' }); return; }
        // light validation
        const warnings = [];
        for (const [an, a] of Object.entries(world.areas)) {
          for (const [ln, grid] of Object.entries(a.layers || {})) {
            if (grid && (grid.length !== a.rows || grid.some(r => r.length !== a.cols)))
              warnings.push(`area ${an} layer ${ln} is not ${a.cols}x${a.rows}`);
          }
          for (const p of a.portals || []) if (!world.areas[p.toArea]) warnings.push(`area ${an} portal to unknown ${p.toArea}`);
        }
        fs.writeFileSync(path.join(gdir, 'world.json'), JSON.stringify(world, null, 2), 'utf8');
        fs.writeFileSync(path.join(partsDir, 'world_data.js'), worldDataPart(world), 'utf8');
        const idx = path.join(gdir, 'index.html');
        if (fs.existsSync(idx) && !/parts\/world_data\.js/.test(fs.readFileSync(idx, 'utf8')))
          warnings.push('index.html does not load parts/world_data.js — the world game may not be scaffolded');
        jsonRes(res, 200, { success: true, game, warnings,
                            play_url: `games/${game}/index.html` });
      } catch (err) { jsonRes(res, 500, { error: err.message }); }
    });
    return;
  }

  // POST /api/world/new  { … } → proxy create_game + create_world to owui-games-tool
  if (req.method === 'POST' && urlPath === '/api/world/new') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const b = JSON.parse(body);
        if (!GAME_ID_RE.test(b.game_id || '')) { jsonRes(res, 400, { error: 'bad game_id' }); return; }
        const cg = await proxyGamesTool('POST', '/create_game', {
          game_id: b.game_id, title: b.title || b.game_id,
          desc: b.desc || 'Open-world game built with the world editor.',
          tags: b.tags || ['world'], width: b.width || 640, height: b.height || 384,
          background_color: b.background_color || '#10131f',
          layout: 'component', renderer: '2d',
        });
        if (cg.status >= 400) { jsonRes(res, cg.status, { error: 'create_game failed', detail: cg.body || cg.raw }); return; }
        const cw = await proxyGamesTool('POST', '/create_world', {
          game: b.game_id, tile_width: b.tile_width || 32, tile_height: b.tile_height || 32,
          area: b.area || 'overworld', cols: b.cols || 30, rows: b.rows || 20,
          ground_tile: b.ground_tile != null ? b.ground_tile : 0,
          border_wall: b.border_wall !== false, scaffold_scene: true,
        });
        if (cw.status >= 400) { jsonRes(res, cw.status, { error: 'create_world failed', detail: cw.body || cw.raw }); return; }
        jsonRes(res, 200, { success: true, game: b.game_id,
                            play_url: `games/${b.game_id}/index.html`,
                            create_world: cw.body });
      } catch (err) {
        jsonRes(res, 502, { error: 'could not reach owui-games-tool: ' + err.message });
      }
    });
    return;
  }

  // Root → launcher
  if (urlPath === '/') { urlPath = '/launcher.html'; }
  // Other directory requests → index.html
  else if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    // If the path is a directory, redirect to trailing slash
    if (!err && stat.isDirectory()) {
      res.writeHead(301, { Location: urlPath + '/' });
      res.end();
      return;
    }

    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type':   mime,
      'Content-Length': stat.size,
      // Allow audio/video range requests
      'Accept-Ranges':  'bytes',
      // Permissive CORS for local dev
      'Access-Control-Allow-Origin': '*',
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\nGameFramework dev server running at:\n`);
  console.log(`  http://localhost:${PORT}/  (bound to ${HOST})\n`);
  console.log(`Games:`);

  // List available games
  const gamesDir = path.join(ROOT, 'games');
  if (fs.existsSync(gamesDir)) {
    fs.readdirSync(gamesDir).forEach(name => {
      const indexFile = path.join(gamesDir, name, 'index.html');
      if (fs.existsSync(indexFile)) {
        console.log(`  http://localhost:${PORT}/games/${name}/index.html`);
      }
    });
  }

  console.log(`\nPress Ctrl+C to stop.\n`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Try:\n  node serve.js ${PORT + 1}\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
