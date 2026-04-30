// GameFramework/games/FightingGame/launch.js
// Standalone dev server for Shadow Strike.
// Serves this game folder at / and the framework folder at /framework/,
// so the game runs independently of the GameFramework launcher.
//
// Usage:
//   node launch.js          → server on port 3000
//   node launch.js 8080     → server on port 8080

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT     = parseInt(process.argv[2] || '3000', 10);
const GAME_DIR = __dirname;

// Resolve the framework directory from the frameworkPath declared in config.js.
// This means moving the game folder anywhere only requires updating that one value.
const configSrc     = fs.readFileSync(path.join(GAME_DIR, 'config.js'), 'utf8');
const fpMatch       = configSrc.match(/frameworkPath\s*:\s*['"]([^'"]+)['"]/);
const FRAMEWORK_DIR = path.resolve(GAME_DIR, fpMatch ? fpMatch[1] : '../../framework');

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
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // /framework/* → framework directory
  // /*           → game directory
  let filePath;
  if (urlPath.startsWith('/framework/')) {
    filePath = path.join(FRAMEWORK_DIR, urlPath.slice('/framework/'.length));
    if (!filePath.startsWith(FRAMEWORK_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  } else {
    if (urlPath === '/' || urlPath.endsWith('/')) urlPath = urlPath.replace(/\/?$/, '/index.html');
    filePath = path.join(GAME_DIR, urlPath);
    if (!filePath.startsWith(GAME_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }
    const mime = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type':          mime,
      'Content-Length':        stat.size,
      'Accept-Ranges':         'bytes',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`\nShadow Strike running at:\n`);
  console.log(`  ${url}\n`);
  console.log(`Framework: ${FRAMEWORK_DIR}`);
  console.log(`\nPress Ctrl+C to stop.\n`);

  const cmd = process.platform === 'win32' ? `start "" "${url}"`
            : process.platform === 'darwin' ? `open "${url}"`
            : `xdg-open "${url}"`;
  setTimeout(() => exec(cmd, err => { if (err) console.log(`Open manually: ${url}`); }), 400);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Try:\n  node launch.js ${PORT + 1}\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
