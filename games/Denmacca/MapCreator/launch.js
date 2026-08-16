// GameFramework/games/Acca/MapCreator/launch.js
// Standalone dev server for the Acca Map Creator tool.
// Serves this folder at / so the tool runs without file:// restrictions.
//
// Usage:
//   node launch.js          → server on port 3001
//   node launch.js 8080     → server on port 8080

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT     = parseInt(process.argv[2] || '3001', 10);
const DIR      = __dirname;
const MAPS_DIR = path.join(DIR, '..', 'maps');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function jsonReply(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type':  'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function handleSaveMap(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); }
    catch { jsonReply(res, 400, { error: 'Invalid JSON body' }); return; }

    const { filename, data } = payload;
    if (!filename || !/^[A-Za-z0-9_\-]+$/.test(filename)) {
      jsonReply(res, 400, { error: 'Invalid filename' }); return;
    }

    const filePath = path.join(MAPS_DIR, `${filename}.json`);
    if (!filePath.startsWith(MAPS_DIR + path.sep) && filePath !== MAPS_DIR) {
      jsonReply(res, 403, { error: 'Forbidden' }); return;
    }

    const content = JSON.stringify(data, null, 2);
    fs.writeFile(filePath, content, 'utf8', err => {
      if (err) { jsonReply(res, 500, { error: err.message }); return; }
      jsonReply(res, 200, { ok: true, path: `maps/${filename}.json` });
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save-map') {
    handleSaveMap(req, res); return;
  }

  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath.endsWith('/')) urlPath = '/index.html';

  const filePath = path.join(DIR, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }
    const mime = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type':  mime,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`\nAcca Map Creator running at:\n`);
  console.log(`  ${url}\n`);
  console.log(`Press Ctrl+C to stop.\n`);

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
