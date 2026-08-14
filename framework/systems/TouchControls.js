// GameFramework/framework/systems/TouchControls.js
// On-canvas touch controls: virtual buttons and joysticks that inject input
// through InputManager's synthetic-action API, so game code keeps reading
// engine.input.isDown / wasPressed exactly as it does for the keyboard.
//
// AUTOMATIC MODE (the default for every game): GF.createGame() attaches one of
// these with { auto:true }. It watches the actions the game binds — 'left',
// 'fire', 'confirm', … — and lays out a joystick plus the matching buttons on
// its own, so a game gets working touch controls without writing any touch
// code. See _buildAuto() for the action → control mapping.
//
// Opt out or override from GAME_CONFIG:
//   touch: false                                  // no touch controls at all
//   touch: { force: true }                        // also show them on desktop
//   touch: { opacity: 0.4, scale: 1.2 }           // restyle the auto layout
//   touch: { joystick: {...}, buttons: [ ... ] }  // replace the auto layout
// ?touch=1 / ?touch=0 in the URL forces controls on/off for testing.
//
// MANUAL MODE:
//   const touch = new GF.TouchControls();          // auto-enables on touch devices
//   engine.addSystem(touch);                       // evicts the automatic one
//   touch.addButton({ id:'pause', action:'pause', label:'⏯', anchor:'bc', x:0,  y:42 });
//   touch.addButton({ id:'fire',  action:'fire',  label:'A',  anchor:'br', x:60, y:60, mode:'hold' });
//   touch.addJoystick({ id:'move', anchor:'bl', x:90, y:90,
//                       actions:{ up:'up', down:'down', left:'left', right:'right' } });
//   // Analog stick value (-1..1 per axis): touch.value('move')
//
// Buttons: mode 'tap' (default) fires wasPressed once; mode 'hold' keeps the
// action isDown while touched (wasPressed still fires on the press frame).
//
// Rendering: the system is an engine overlay, so its render pass runs AFTER
// the game's onRender callback and the controls always sit on top. Games that
// want to place the draw themselves pass { autoRender:false } and call
// touch.draw(ctx) wherever they like.
//
// Event handling: pointerdown is taken on the canvas' parent in the CAPTURE
// phase, so a touch on a control never reaches OrbitControls / game listeners
// on the canvas, while touches elsewhere pass through untouched. Move and
// release are tracked on window, so dragging off the canvas keeps working and
// a pointer released outside it can never leave an action stuck down.
//
// Detection: enabled automatically when the device reports touch support;
// override with { force:true } (always on) or { force:false } via .enabled.

(function (GF) {
  'use strict';

  // Action → control mapping for the automatic layout. Order matters: it is
  // the order buttons are placed in each cluster.
  var AUTO_BUTTONS = [
    // primary (bottom-right cluster) — held, so isDown and wasPressed both work
    { action: 'fire',    label: '🔥', mode: 'hold', cluster: 'primary' },
    { action: 'shoot',   label: '🔥', mode: 'hold', cluster: 'primary' },
    { action: 'jump',    label: '⤴',  mode: 'hold', cluster: 'primary' },
    { action: 'attack',  label: '⚔',  mode: 'hold', cluster: 'primary' },
    { action: 'action',  label: '✋', mode: 'hold', cluster: 'primary' },
    { action: 'use',     label: '✋', mode: 'hold', cluster: 'primary' },
    { action: 'run',     label: '»',  mode: 'hold', cluster: 'primary' },
    { action: 'roll',    label: '🎲', mode: 'tap',  cluster: 'primary' },
    { action: 'launch',  label: '🚀', mode: 'tap',  cluster: 'primary' },
    // menu (bottom-centre) — one-frame taps
    { action: 'confirm', label: '▶',  mode: 'tap',  cluster: 'menu' },
    { action: 'start',   label: '▶',  mode: 'tap',  cluster: 'menu' },
    { action: 'restart', label: '↺',  mode: 'tap',  cluster: 'menu' },
    // system (top-right)
    { action: 'pause',   label: '⏸',  mode: 'tap',  cluster: 'system' },
    { action: 'cancel',  label: '✕',  mode: 'tap',  cluster: 'system' },
    { action: 'menu',    label: '☰',  mode: 'tap',  cluster: 'system' },
    // debug (top-right, above system)
    { action: 'debug',       label: '🔧',  mode: 'tap',  cluster: 'debug' },
    { action: 'debugTools',  label: '⚙',  mode: 'tap',  cluster: 'debug' },
  ];

  class TouchControls {
    constructor(opts) {
      opts = opts || {};
      this.name = 'touch';
      this.overlay = true;               // Engine renders overlays last
      this.enabled = TouchControls._resolveEnabled(opts);
      this.autoRender = opts.autoRender !== undefined ? !!opts.autoRender : true;
      this.opacity = opts.opacity !== undefined ? opts.opacity : 0.55;
      this.scale = opts.scale || 1;

      this._auto = !!opts.auto;          // framework-attached default layout
      this._autoOpts = opts;
      this._autoSig = null;              // binding signature the layout was built from

      this._buttons = [];
      this._sticks = [];
      this._pointers = new Map();   // pointerId → { kind:'button'|'stick', ref }
      this._touchIds = new Set();   // legacy touch identifiers we own
      this._engine = null;
      this._listeners = [];
    }

    static isTouchDevice() {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
      if ((navigator.maxTouchPoints | 0) > 0) return true;
      // 'ontouchstart' in window is unreliable (false positives in emulated
      // DOMs and some desktop browsers) — prefer the pointer media query.
      try {
        return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      } catch (_) {
        return false;
      }
    }

    /** ?touch=1 forces controls on (desktop testing), ?touch=0 forces them off. */
    static _urlOverride() {
      try {
        var v = new URLSearchParams(window.location.search).get('touch');
        if (v === null) return null;
        return !(v === '0' || v === 'false' || v === 'off');
      } catch (_) { return null; }
    }

    static _resolveEnabled(opts) {
      var url = TouchControls._urlOverride();
      if (url !== null) return url;
      if (opts.force !== undefined) return !!opts.force;
      return TouchControls.isTouchDevice();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      const canvas = engine.canvas;

      // A game that builds its own controls wins: drop the automatic layer
      // rather than stacking two sets of buttons on the same canvas.
      if (!this._auto && engine.removeSystem) {
        const prev = engine.getSystem && engine.getSystem('touch');
        if (prev && prev !== this && prev._auto) engine.removeSystem(prev);
      }

      if (this.enabled) {
        canvas.style.touchAction = 'none';   // stop browser pan/zoom on the game
        canvas.style.userSelect = 'none';
        canvas.style.webkitUserSelect = 'none';
        canvas.style.webkitTouchCallout = 'none';   // no iOS long-press menu
        // Pull-to-refresh / rubber-banding fires mid-drag on a phone and kills
        // the gesture the player is making.
        if (document.body) document.body.style.overscrollBehavior = 'none';
      }

      // Capture + explicitly non-passive: Chrome makes touch listeners passive
      // by default on body/window, and a passive listener's preventDefault()
      // is ignored — which is exactly the call that stops the page scrolling
      // under a player's thumb.
      const CAP = { capture: true, passive: false };
      const on = (el, type, fn, capture) => {
        el.addEventListener(type, fn, capture);
        this._listeners.push([el, type, fn, capture]);
      };

      // Capture phase on the parent → we run before canvas listeners
      // (OrbitControls, picking) and can swallow control touches.
      const parent = canvas.parentElement || document.body;
      on(parent, 'pointerdown', e => this._onDown(e), CAP);

      // Legacy touch events are a separate stream from pointer events: a game
      // (or a library) listening for touchstart on the canvas would still see
      // a tap that landed on a button. Swallow those too — but only the ones
      // that hit a control, so ordinary in-game touches still reach the game.
      on(parent, 'touchstart', e => this._swallowTouch(e), CAP);
      on(parent, 'touchmove', e => this._swallowTouch(e), CAP);
      on(parent, 'touchend', e => this._swallowTouch(e), CAP);
      on(parent, 'touchcancel', e => this._swallowTouch(e), CAP);

      // Move/up on window: a finger that slides off the canvas keeps steering,
      // and a release anywhere still lets go of the action. Listening on the
      // parent alone strands held actions when the pointer leaves it.
      on(window, 'pointermove', e => this._onMove(e), CAP);
      on(window, 'pointerup', e => this._onUp(e), CAP);
      on(window, 'pointercancel', e => this._onUp(e), CAP);

      // Backgrounded tab / lost focus: never leave a direction held.
      on(window, 'blur', () => this._releaseAll(), false);
      on(document, 'visibilitychange', () => {
        if (document.hidden) this._releaseAll();
      }, false);

      if (this._auto) this._syncAuto();
    }

    destroy() {
      this._releaseAll();
      this._listeners.forEach(([el, type, fn, capture]) => el.removeEventListener(type, fn, capture));
      this._listeners = [];
    }

    // ── Control registration ──────────────────────────────────────────────

    /**
     * @param {Object} def
     * @param {string} def.id        unique id
     * @param {string} def.action    InputManager action (or key code) to inject
     * @param {string} [def.label]   text/emoji drawn on the button
     * @param {string} [def.anchor]  'tl'|'tr'|'bl'|'br'|'tc'|'bc' (default 'br')
     * @param {number} def.x, def.y  centre offset from the anchor, inward
     * @param {number} [def.r=26]    radius (circle) / half-size (rect)
     * @param {string} [def.mode]    'tap' (default) | 'hold'
     * @param {string} [def.shape]   'circle' (default) | 'rect'
     * @param {string} [def.color]   accent colour
     * @param {function} [def.onTap] optional callback fired on press
     */
    addButton(def) {
      // A control added by hand takes the instance off automatic management,
      // so the next rebuild cannot wipe it.
      if (this._auto && !this._building) this._auto = false;
      this._buttons.push(Object.assign({
        r: 26, mode: 'tap', shape: 'circle', color: '#9bb8e8',
        anchor: 'br', label: '', pressed: false, visible: true,
      }, def));
      return this;
    }

    /**
     * @param {Object} def
     * @param {string} def.id
     * @param {string} [def.anchor='bl']
     * @param {number} def.x, def.y     centre offset from anchor, inward
     * @param {number} [def.radius=64]
     * @param {Object} [def.actions]    { up, down, left, right } actions to hold
     * @param {number} [def.deadzone=0.3]
     */
    addJoystick(def) {
      if (this._auto && !this._building) this._auto = false;
      this._sticks.push(Object.assign({
        anchor: 'bl', radius: 64, deadzone: 0.3, actions: null,
        vx: 0, vy: 0, active: false, visible: true, color: '#9bb8e8',
      }, def));
      return this;
    }

    /** Drop every registered control (the automatic layout rebuilds with it). */
    clear() {
      this._releaseAll();
      this._buttons = [];
      this._sticks = [];
      return this;
    }

    getButton(id) { return this._buttons.find(b => b.id === id) || null; }
    getJoystick(id) { return this._sticks.find(s => s.id === id) || null; }

    /** Analog joystick value: { x:-1..1, y:-1..1 } (y negative = up). */
    value(id) {
      const s = this.getJoystick(id);
      return s ? { x: s.vx, y: s.vy } : { x: 0, y: 0 };
    }

    // ── Automatic layout ──────────────────────────────────────────────────

    /** Rebuild the default layout whenever the game's key bindings change. */
    _syncAuto() {
      const input = this._engine && this._engine.input;
      if (!input) return;
      const sig = input._bindVersion + '|' +
        this._engine.canvas.width + 'x' + this._engine.canvas.height;
      if (sig === this._autoSig) return;
      this._autoSig = sig;
      this._buildAuto();
    }

    _buildAuto() {
      const input = this._engine.input;
      const opts = this._autoOpts || {};
      this._building = true;
      try { this._buildAutoControls(input, opts); }
      finally { this._building = false; }
    }

    _buildAutoControls(input, opts) {
      this.clear();

      // An explicit layout in GAME_CONFIG.touch replaces the derived one.
      if (opts.joystick || opts.buttons) {
        if (opts.joystick) this.addJoystick(Object.assign({ id: 'move' }, opts.joystick));
        (opts.buttons || []).forEach(b => this.addButton(b));
        return;
      }

      const W = this._engine.canvas.width, H = this._engine.canvas.height;
      // Controls scale with the canvas so they stay thumb-sized on any game.
      const k = this.scale * Math.max(0.7, Math.min(1.5, Math.min(W, H) / 600));
      const bound = a => input.isBound(a);

      // Movement stick: whichever axes the game actually binds.
      const dirs = {};
      ['up', 'down', 'left', 'right'].forEach(d => { if (bound(d)) dirs[d] = d; });
      if (Object.keys(dirs).length) {
        const radius = Math.round(58 * k);
        this.addJoystick({
          id: 'move', anchor: 'bl', x: radius + 22 * k, y: radius + 22 * k,
          radius: radius, actions: dirs,
          deadzone: (dirs.up || dirs.down) ? 0.3 : 0.22,
        });
      }

      // Buttons, deduplicated by the key code they inject: a game that binds
      // both 'confirm' and 'start' to Space gets one button, not two.
      const usedCodes = {};
      const clusters = { primary: [], menu: [], system: [], debug: [] };
      AUTO_BUTTONS.forEach(def => {
        if (!bound(def.action)) return;
        const code = input._codeFor(def.action);
        if (usedCodes[code]) return;
        usedCodes[code] = true;
        clusters[def.cluster].push(def);
      });

      const R = Math.round(30 * k);
      const pad = Math.round(22 * k);

      // Primary actions: an arc up from the bottom-right corner.
      const arc = [
        { x: R + pad, y: R + pad },
        { x: R + pad + 2.3 * R, y: R + pad + 0.4 * R },
        { x: R + pad + 0.4 * R, y: R + pad + 2.3 * R },
        { x: R + pad + 2.6 * R, y: R + pad + 2.6 * R },
      ];
      clusters.primary.slice(0, arc.length).forEach((def, i) => {
        this.addButton({
          id: 'auto_' + def.action, action: def.action, label: def.label,
          mode: def.mode, anchor: 'br', r: R,
          x: Math.round(arc[i].x), y: Math.round(arc[i].y),
        });
      });

      // Menu actions along the bottom centre.
      const mR = Math.round(24 * k);
      const menu = clusters.menu;
      menu.forEach((def, i) => {
        const spread = (i - (menu.length - 1) / 2) * (2.6 * mR);
        this.addButton({
          id: 'auto_' + def.action, action: def.action, label: def.label,
          mode: def.mode, anchor: 'bc', r: mR,
          x: Math.round(spread), y: Math.round(mR + 14 * k),
        });
      });

      // Debug actions (🔧 F1 overlay, ⚙ F6 tools) — above system buttons
      const dR = Math.round(21 * k);
      clusters.debug.forEach((def, i) => {
        this.addButton({
          id: 'auto_' + def.action, action: def.action, label: def.label,
          mode: def.mode, anchor: 'tr', r: dR,
          x: Math.round(dR + 14 * k), y: Math.round(dR + 14 * k + i * 2.5 * dR),
        });
      });

      // System actions down the top-right edge (below debug buttons).
      // Offset starts after debug buttons to avoid overlap.
      const sR = Math.round(21 * k);
      var sysStartOffset = clusters.debug.length * 2.5 * dR;
      clusters.system.forEach((def, i) => {
        this.addButton({
          id: 'auto_' + def.action, action: def.action, label: def.label,
          mode: def.mode, anchor: 'tr', r: sR,
          x: Math.round(sR + 14 * k), y: Math.round(sR + 14 * k + (sysStartOffset + i) * 2.5 * sR),
        });
      });
    }

    // ── Geometry ──────────────────────────────────────────────────────────

    _center(c) {
      const W = this._engine.canvas.width, H = this._engine.canvas.height;
      switch (c.anchor) {
        case 'tl': return { x: c.x, y: c.y };
        case 'tr': return { x: W - c.x, y: c.y };
        case 'bl': return { x: c.x, y: H - c.y };
        case 'tc': return { x: W / 2 + c.x, y: c.y };
        case 'bc': return { x: W / 2 + c.x, y: H - c.y };
        default: return { x: W - c.x, y: H - c.y };   // br
      }
    }

    _toCanvas(e) {
      const canvas = this._engine.canvas;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: (e.clientX - rect.left) * canvas.width / rect.width,
        y: (e.clientY - rect.top) * canvas.height / rect.height,
      };
    }

    _hit(x, y) {
      const PAD = 12;
      for (const b of this._buttons) {
        if (!b.visible) continue;
        const c = this._center(b);
        if (Math.hypot(x - c.x, y - c.y) <= b.r + PAD) return { kind: 'button', ref: b };
      }
      for (const s of this._sticks) {
        if (!s.visible) continue;
        const c = this._center(s);
        if (Math.hypot(x - c.x, y - c.y) <= s.radius + PAD * 2) return { kind: 'stick', ref: s };
      }
      return null;
    }

    // ── Pointer handling (tests may call these with {clientX..} stubs) ────

    _onDown(e) {
      if (!this.enabled || !this._engine) return;
      const p = this._toCanvas(e);
      if (!p) return;
      const hit = this._hit(p.x, p.y);
      if (!hit) return;

      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      this._pointers.set(e.pointerId !== undefined ? e.pointerId : 1, hit);

      if (hit.kind === 'button') {
        const b = hit.ref;
        b.pressed = true;
        if (b.mode === 'hold') this._engine.input.pressAction(b.action);
        else this._engine.input.tapAction(b.action);
        if (b.onTap) b.onTap();
      } else {
        hit.ref.active = true;
        this._updateStick(hit.ref, p.x, p.y);
      }
    }

    /**
     * Stop a legacy touch event that landed on a control from reaching the
     * game. Touches are tracked by identifier from touchstart onward, so a
     * finger that started on the joystick keeps being swallowed after it has
     * dragged clear of it.
     */
    _swallowTouch(e) {
      if (!this.enabled || !this._engine) return;
      const list = e.changedTouches || e.touches;
      if (!list || !list.length) return;
      let mine = false;
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const id = t.identifier !== undefined ? t.identifier : 0;
        if (e.type === 'touchstart') {
          const p = this._toCanvas(t);
          if (p && this._hit(p.x, p.y)) { this._touchIds.add(id); mine = true; }
        } else if (this._touchIds.has(id)) {
          mine = true;
          if (e.type !== 'touchmove') this._touchIds.delete(id);
        }
      }
      if (!mine) return;
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
    }

    _onMove(e) {
      if (!this.enabled || !this._engine) return;
      const id = e.pointerId !== undefined ? e.pointerId : 1;
      const grab = this._pointers.get(id);
      if (!grab) return;
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      const p = this._toCanvas(e);
      if (!p) return;
      if (grab.kind === 'stick') this._updateStick(grab.ref, p.x, p.y);
    }

    _onUp(e) {
      if (!this._engine) return;
      const id = e.pointerId !== undefined ? e.pointerId : 1;
      const grab = this._pointers.get(id);
      if (!grab) return;
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      this._pointers.delete(id);
      this._release(grab);
    }

    _release(grab) {
      if (grab.kind === 'button') {
        const b = grab.ref;
        b.pressed = false;
        if (b.mode === 'hold') this._engine.input.releaseAction(b.action);
      } else {
        const s = grab.ref;
        s.active = false;
        this._setStickVector(s, 0, 0);
      }
    }

    _releaseAll() {
      this._touchIds.clear();
      if (!this._engine) { this._pointers.clear(); return; }
      this._pointers.forEach(grab => this._release(grab));
      this._pointers.clear();
    }

    _updateStick(s, px, py) {
      const c = this._center(s);
      let dx = (px - c.x) / s.radius;
      let dy = (py - c.y) / s.radius;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this._setStickVector(s, dx, dy);
    }

    _setStickVector(s, vx, vy) {
      s.vx = vx; s.vy = vy;
      if (!s.actions) return;
      const inp = this._engine.input;
      const dz = s.deadzone;
      const want = {
        left: vx < -dz, right: vx > dz,
        up: vy < -dz, down: vy > dz,
      };
      ['left', 'right', 'up', 'down'].forEach(dir => {
        const action = s.actions[dir];
        if (!action) return;
        s._held = s._held || {};
        if (want[dir] && !s._held[dir]) { inp.pressAction(action); s._held[dir] = true; }
        else if (!want[dir] && s._held[dir]) { inp.releaseAction(action); s._held[dir] = false; }
      });
    }

    // ── Rendering ─────────────────────────────────────────────────────────

    update() {
      if (this._auto && this.enabled) this._syncAuto();
    }

    render(ctx) {
      if (this.autoRender) this.draw(ctx);
    }

    /** Draw the controls. Call from your onRender if autoRender is false. */
    draw(ctx) {
      if (!this.enabled || !this._engine) return;
      ctx.save();

      this._buttons.forEach(b => {
        if (!b.visible) return;
        const c = this._center(b);
        ctx.globalAlpha = b.pressed ? Math.min(1, this.opacity + 0.35) : this.opacity;
        ctx.beginPath();
        if (b.shape === 'rect') {
          const r = b.r;
          ctx.rect(c.x - r, c.y - r * 0.7, r * 2, r * 1.4);
        } else {
          ctx.arc(c.x, c.y, b.r, 0, Math.PI * 2);
        }
        ctx.fillStyle = b.pressed ? 'rgba(70,100,160,0.9)' : 'rgba(16,20,34,0.8)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = b.color;
        ctx.stroke();
        if (b.label) {
          ctx.fillStyle = '#e8f0ff';
          ctx.font = `${Math.round(b.r * 0.9)}px "Segoe UI", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.label, c.x, c.y + 1);
        }
      });

      this._sticks.forEach(s => {
        if (!s.visible) return;
        const c = this._center(s);
        ctx.globalAlpha = s.active ? Math.min(1, this.opacity + 0.25) : this.opacity;
        ctx.beginPath();
        ctx.arc(c.x, c.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16,20,34,0.55)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = s.color;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x + s.vx * s.radius * 0.6, c.y + s.vy * s.radius * 0.6, s.radius * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = s.active ? 'rgba(120,160,230,0.9)' : 'rgba(70,90,130,0.8)';
        ctx.fill();
      });

      ctx.restore();
    }
  }

  GF.TouchControls = TouchControls;

})(window.GF = window.GF || {});
