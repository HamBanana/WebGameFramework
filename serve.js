// GameFramework/serve.js
// Minimal local HTTP server for development.
// Serves the entire GameFramework folder over HTTP so browsers
// don't hit file:// CORS restrictions (which block audio and fetch).
//
// Usage:
//   node serve.js          → serves on http://localhost:3000
//   node serve.js 8080     → serves on http://localhost:8080
//
// Then open a game at e.g.:
//   http://localhost:3000/games/FightingGame/index.html

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2] || '3000', 10);
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nGameFramework dev server running at:\n`);
  console.log(`  http://localhost:${PORT}/\n`);
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
