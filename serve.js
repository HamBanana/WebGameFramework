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
