// GameFramework/framework/systems/TouchControls.js
// On-canvas touch controls: virtual buttons and joysticks that inject input
// through InputManager's synthetic-action API, so game code keeps reading
// engine.input.isDown / wasPressed exactly as it does for the keyboard.
//
// Usage:
//   const touch = new GF.TouchControls();          // auto-enables on touch devices
//   engine.addSystem(touch);
//   touch.addButton({ id:'pause', action:'pause', label:'⏯', anchor:'bc', x:0,  y:42 });
//   touch.addButton({ id:'fire',  action:'fire',  label:'A',  anchor:'br', x:60, y:60, mode:'hold' });
//   touch.addJoystick({ id:'move', anchor:'bl', x:90, y:90,
//                       actions:{ up:'up', down:'down', left:'left', right:'right' } });
//   // Analog stick value (-1..1 per axis): touch.value('move')
//
// Buttons: mode 'tap' (default) fires wasPressed once; mode 'hold' keeps the
// action isDown while touched.
//
// Rendering: by default the system draws itself during the engine's system
// render pass, which runs BEFORE the game's onRender callback — a game that
// paints a HUD in onRender should pass { autoRender:false } and call
// touch.draw(ctx) at the end of its own onRender so the controls stay on top.
//
// Event handling is attached to the canvas' parent in the CAPTURE phase, so
// touches on a control never reach OrbitControls / game listeners on the
// canvas, while touches elsewhere pass through untouched.
//
// Detection: enabled automatically when the device reports touch support;
// override with { force:true } (always on) or { force:false } via .enabled.

(function (GF) {
  'use strict';

  class TouchControls {
    constructor(opts) {
      opts = opts || {};
      this.name = 'touch';
      this.enabled = opts.force !== undefined ? !!opts.force : TouchControls.isTouchDevice();
      this.autoRender = opts.autoRender !== undefined ? !!opts.autoRender : true;
      this.opacity = opts.opacity !== undefined ? opts.opacity : 0.55;

      this._buttons = [];
      this._sticks = [];
      this._pointers = new Map();   // pointerId → { kind:'button'|'stick', ref }
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

    // ── Lifecycle ─────────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      const canvas = engine.canvas;
      canvas.style.touchAction = 'none';   // stop browser pan/zoom on the game

      // Capture phase on the parent → we run before canvas listeners
      // (OrbitControls, picking) and can swallow control touches.
      const parent = canvas.parentElement || document.body;
      const on = (type, fn) => {
        parent.addEventListener(type, fn, true);
        this._listeners.push([parent, type, fn]);
      };
      on('pointerdown', e => this._onDown(e));
      on('pointermove', e => this._onMove(e));
      on('pointerup', e => this._onUp(e));
      on('pointercancel', e => this._onUp(e));
    }

    destroy() {
      this._listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn, true));
      this._listeners = [];
      this._releaseAll();
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
      this._sticks.push(Object.assign({
        anchor: 'bl', radius: 64, deadzone: 0.3, actions: null,
        vx: 0, vy: 0, active: false, visible: true, color: '#9bb8e8',
      }, def));
      return this;
    }

    getButton(id) { return this._buttons.find(b => b.id === id) || null; }
    getJoystick(id) { return this._sticks.find(s => s.id === id) || null; }

    /** Analog joystick value: { x:-1..1, y:-1..1 } (y negative = up). */
    value(id) {
      const s = this.getJoystick(id);
      return s ? { x: s.vx, y: s.vy } : { x: 0, y: 0 };
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

    update() {}

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
