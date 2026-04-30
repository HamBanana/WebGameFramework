// GameFramework/launch.js
// Starts the dev server and opens the launcher in your default browser.
//
// Usage:
//   node launch.js          → server on port 3000
//   node launch.js 8080     → server on port 8080

const { spawn, exec } = require('child_process');
const path = require('path');

const PORT   = parseInt(process.argv[2] || '3000', 10);
const LAUNCH = `http://localhost:${PORT}/launcher.html`;

// ── Start the server as a child process ───────────────────────────────────────

const server = spawn(
  process.execPath,                      // same node binary
  [path.join(__dirname, 'serve.js'), PORT],
  { stdio: 'inherit', cwd: __dirname }
);

server.on('error', err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

server.on('exit', code => {
  if (code !== null && code !== 0) process.exit(code);
});

// Propagate Ctrl+C to the child so it cleans up properly
process.on('SIGINT',  () => { server.kill('SIGINT');  process.exit(0); });
process.on('SIGTERM', () => { server.kill('SIGTERM'); process.exit(0); });

// ── Open the browser after a short delay ─────────────────────────────────────

const DELAY_MS = 600; // give the server a moment to bind

setTimeout(() => {
  const platform = process.platform;
  let cmd;
  if (platform === 'win32')  cmd = `start "" "${LAUNCH}"`;
  else if (platform === 'darwin') cmd = `open "${LAUNCH}"`;
  else cmd = `xdg-open "${LAUNCH}"`;

  exec(cmd, err => {
    if (err) {
      console.log(`\nCould not open browser automatically.`);
      console.log(`Open this URL manually: ${LAUNCH}\n`);
    }
  });
}, DELAY_MS);
