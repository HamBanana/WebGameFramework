// Harness: boot EyeballHunter headlessly in node with a stub canvas and drive the
// real collision rules, so stomp / blind / side-contact behaviour can be verified
// without a browser. Run: node tools/eyeball-harness.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const G = path.join(ROOT, 'games', 'EyeballHunter');

// ── Minimal DOM / canvas stubs ───────────────────────────────────────────────
let rafQueue = [];
let clock = 0;
function makeCtx() {
  const noop = () => {};
  const ctx = {
    save: noop, restore: noop, translate: noop, scale: noop, rotate: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop,
    fill: noop, stroke: noop, fillRect: noop, strokeRect: noop, clearRect: noop,
    fillText: noop, strokeText: noop, measureText: () => ({ width: 10 }),
    drawImage: noop, setTransform: noop, clip: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, ellipse: noop, rect: noop, setLineDash: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null, getImageData: () => ({ data: [0, 0, 0, 0] }),
    putImageData: noop, canvas: null,
  };
  return ctx;
}
function makeEl(tag) {
  const el = {
    tag, width: 0, height: 0, style: {}, dataset: {}, classList: { add() {}, remove() {} },
    children: [], parentElement: null,
    getContext: () => { const c = makeCtx(); c.canvas = el; return c; },
    appendChild(c) { this.children.push(c); c.parentElement = this; return c; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
    addEventListener() {}, removeEventListener() {}, focus() {},
  };
  return el;
}
const bodyEl = makeEl('body');
const window = {
  devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
  listeners: {},
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
  removeEventListener() {},
  dispatch(t, arg) { (this.listeners[t] || []).forEach(fn => fn(arg || {})); },
  document: {
    head: makeEl('head'), body: bodyEl, documentElement: makeEl('html'),
    createElement: makeEl, querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null, currentScript: null,
    addEventListener() {}, removeEventListener() {},
  },
  performance: { now: () => clock },
  requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame() {},
  AudioContext: undefined, webkitAudioContext: undefined,
};
window.window = window;
function pump(frames, dtMs) {
  for (let i = 0; i < frames; i++) {
    const q = rafQueue; rafQueue = [];
    clock += (dtMs || 16.7);
    q.forEach(fn => fn(clock));
  }
}

const sandbox = {
  window, console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Boolean,
  isNaN, parseInt, parseFloat, Error, TypeError, RegExp, Function, Promise, Symbol, Infinity, NaN,
  document: window.document, navigator: { userAgent: 'node', maxTouchPoints: 0 },
  performance: window.performance,
  requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: window.cancelAnimationFrame,
  setTimeout, clearTimeout, setInterval, clearInterval,
  devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
  HTMLCanvasElement: function () {}, Image: function () { this.width = 0; this.height = 0; },
  CustomEvent: function (t, o) { this.type = t; Object.assign(this, (o || {}).detail || {}); },
  addEventListener: window.addEventListener.bind(window),
  removeEventListener: window.removeEventListener.bind(window),
  dispatchEvent: () => true, // boot.js path is driven manually below; keep it inert
};
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(src, sandbox, { filename: rel });
}

load('framework/GameFramework.bundle.js');
load(path.join('games', 'EyeballHunter', 'config.js'));
load(path.join('games', 'EyeballHunter', 'state.js'));
load(path.join('games', 'EyeballHunter', 'levels.js'));
// Only real .js files — the stale .bak/.prev siblings in the tree are not scripts.
const jsOnly = fs.readdirSync;
function loadDir(dir) {
  jsOnly(path.join(G, dir)).filter(f => f.endsWith('.js')).sort().forEach(f => load(path.join('games', 'EyeballHunter', dir, f)));
}
loadDir('behaviors');
loadDir('prefabs');
loadDir('scenes');

const GF = window.GF;
const EH = window.EH;

// ── Boot ─────────────────────────────────────────────────────────────────────
const game = GF.createGame(GF.GAME_CONFIG.engine, GF.GAME_CONFIG.physics, {
  gameName: GF.GAME_CONFIG.game.name, audio: false, tweens: true, particles: true, scenes: true,
});
window.GAME.game = game;
const Main = window.GAME.scenes.Main;
game.scenes.push(new Main(0), game.engine);
game.engine.start();

pump(3);

const world = game.engine.getSystem('EntityWorld') || (game.scenes.current && game.scenes.current.world);
if (!world) { console.error('no world'); process.exit(1); }

// Find the registered overlap rules by name.
const rules = world._rules || [];
const playerEnemy = rules.find(r => (r.a === 'player' && r.b === 'enemy') || (r.b === 'player' && r.a === 'enemy'));
const ballEnemy = rules.find(r => (r.a === 'eyeball' && r.b === 'enemy') || (r.b === 'eyeball' && r.a === 'enemy'));
if (!playerEnemy || !ballEnemy) { console.error('rules missing', rules.map(r => r.a + '/' + r.b)); process.exit(1); }

const scene = game.scenes.current;
const call = (rule, a, b) => (rule.a === 'player' || rule.a === 'eyeball' ? rule.cb(a, b) : rule.cb(b, a));

const player = scene.player;
function spawn(type, x, y) { return world.spawn(type, x, y, {}); }

function fire(p, e) {
  call(playerEnemy, p, e);
}
function fireBall(ball, e) {
  call(ballEnemy, ball, e);
}
function stomp(e) {
  player.y = e.y - player.h - 4; player.vy = 200; player.invuln = 0; player.bounceV = 0;
  fire(player, e);
}
function sideTouch(e) {
  player.y = e.y; player.x = e.x - 4; player.vy = 0; player.invuln = 0; player.bounceV = 0;
  fire(player, e);
}
const snap = (label, e) => ({
  label, eyeballs: EH.eyeballs, lives: EH.lives, shield: EH.shield,
  hasEyeball: e.hasEyeball, blinded: e.blinded, blindFlash: e.blindFlash,
  bounceV: player.bounceV, invuln: player.invuln, state: EH.state,
  powerups: (world._objs || []).filter(o => o.has('powerup')).length,
});

const results = [];
const reset = () => { EH.reset && EH.reset(); EH.state = 'playing'; };

// 1. Spider: first stomp steals the eye.
reset();
let spider = spawn('spider', 200, 300);
stomp(spider);
results.push(snap('spider stomp #1 (had an eye)', spider));

// 2. Same spider, second stomp: bouncy but no eye.
stomp(spider);
results.push(snap('spider stomp #2 (blind)', spider));

// 3. Same spider, third stomp for good measure.
stomp(spider);
results.push(snap('spider stomp #3 (blind)', spider));

// 4. Side contact with a sighted spider costs a life.
reset();
let s2 = spawn('spider', 200, 300);
sideTouch(s2);
results.push(snap('spider side contact (had an eye)', s2));

// 5. Side contact with an already-blind spider still costs a life.
reset();
let s3 = spawn('spider', 200, 300);
stomp(s3); const afterStomp = snap('spider stomp (sets up blind)', s3);
sideTouch(s3);
results.push(afterStomp); results.push(snap('spider side contact (blind)', s3));

// 6. Fly: first stomp, then second, then side.
reset();
let fly = spawn('fly', 200, 200);
stomp(fly); results.push(snap('fly stomp #1 (had an eye)', fly));
stomp(fly); results.push(snap('fly stomp #2 (blind)', fly));
sideTouch(fly); results.push(snap('fly side contact (blind)', fly));

// 7. Thrown eyeball: the throw costs one, the hit awards one.
reset();
let s4 = spawn('spider', 200, 300);
EH.eyeballs = 1;
EH.eyeballs--;                        // throwEyeball() spends it
fireBall({ has: () => true, destroy() {}, x: 200, y: 300 }, s4);
results.push(snap('throw at sighted (cost 1, award 1 = net 0)', s4));
EH.eyeballs--;                        // throwEyeball() spends it
s4.stunned = 0;
fireBall({ has: () => true, destroy() {}, x: 200, y: 300 }, s4);
results.push(snap('throw at blind (cost 1, award 0 = net -1)', s4));

// 8. Shield absorbs a side hit before lives are spent.
reset();
EH.grant('shield');
let s5 = spawn('spider', 200, 300);
sideTouch(s5);
results.push(snap('side contact with shield', s5));

// 9. Jumping up into an enemy (bottom contact) also costs a life.
reset();
let s6 = spawn('spider', 200, 300);
player.y = s6.y + s6.h - 4; player.x = s6.x; player.vy = -200; player.invuln = 0; player.bounceV = 0;
fire(player, s6);
results.push(snap('spider bottom hit (jumping up)', s6));

// 10. Powerup gate made deterministic: sighted stomp drops, blind stomp must not.
reset();
const countPU = () => (world._objs || []).filter(o => o.has('powerup')).length;
const withRandom = (v, fn) => { const orig = Math.random; Math.random = () => v; try { fn(); } finally { Math.random = orig; } };
let s7 = spawn('spider', 200, 300);
withRandom(0, () => stomp(s7)); const puAfterFirst = countPU();
withRandom(0, () => stomp(s7)); const puAfterSecond = countPU();

// 11. Behaviours still run (half-speed blinded wander, flash decay, no crash).
const spy = world._objs.find(o => o.has('enemy') && !o.has('boss'));
let speedWithEye = null, speedBlind = null;
function measureSpeed(e) {
  const x0 = e.x; for (let i = 0; i < 60; i++) world.update(1 / 60);
  return Math.abs(e.x - x0);
}
if (spy) {
  spy.hasEyeball = true; spy.stunned = 0; speedWithEye = measureSpeed(spy);
  spy.hasEyeball = false; spy.blinded = true; speedBlind = measureSpeed(spy);
}

console.table(results);
console.log({ speedWithEye, speedBlind, puAfterFirst, puAfterSecond });
console.log('fly behaviours present:', (world._objs.find(o => o.has('fly')) || {}).name || 'no fly in level 0');

// ── Assertions ────────────────────────────────────────────────────────────────
const byLabel = l => results.find(r => r.label === l) || {};
const checks = [
  ['first stomp awards exactly 1 eye', byLabel('spider stomp #1 (had an eye)').eyeballs === 1],
  ['first stomp blinds the spider', byLabel('spider stomp #1 (had an eye)').blinded === true],
  ['repeat stomp awards 0 more eyes', byLabel('spider stomp #3 (blind)').eyeballs === 1],
  ['blind enemy stays bouncy', byLabel('spider stomp #3 (blind)').bounceV === -400],
  ['blind enemy costs no life', byLabel('spider stomp #3 (blind)').lives === 3],
  ['blind stomp drops no powerup', puAfterSecond === puAfterFirst],
  ['sighted stomp can drop a powerup', puAfterFirst > 0],
  ['side contact costs a life', byLabel('spider side contact (had an eye)').lives === 2],
  ['side contact does not steal the eye', byLabel('spider side contact (had an eye)').hasEyeball === true],
  ['side contact with a BLIND enemy costs a life', byLabel('spider side contact (blind)').lives === 2],
  ['bottom contact costs a life', byLabel('spider bottom hit (jumping up)').lives === 2],
  ['fly stomp awards 1 eye', byLabel('fly stomp #1 (had an eye)').eyeballs === 1],
  ['repeat fly stomp awards 0 more', byLabel('fly stomp #2 (blind)').eyeballs === 1],
  ['thrown eye nets 0 on a sighted enemy', byLabel('throw at sighted (cost 1, award 1 = net 0)').eyeballs === 1],
  ['thrown eye nets -1 on a blind enemy', byLabel('throw at blind (cost 1, award 0 = net -1)').eyeballs === 0],
  ['shield absorbs a side hit', byLabel('side contact with shield').lives === 3],
  ['blinded enemies move at half speed', speedWithEye !== null && Math.abs(speedBlind - speedWithEye / 2) < 1],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);

