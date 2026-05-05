// games/Acca2/ui/MoneyAnimations.js
// Watches per-player cash deltas across renders. On a non-zero delta:
//   • flash the topbar money cell (current player only) — CSS only
//   • flash the player-list row — CSS only
//   • spawn a floating "+$X" / "-$X" indicator above the player's token
//   • spawn a coin sparkle burst on the token on a gain
// The floating effects use _tokenScreenPos() to project the token's world
// position through the camera transform into page coordinates, so they
// track zoom and pan correctly. Pure DOM — never touches the canvas.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class MoneyAnimations {
    constructor(game) {
      this.game = game;
      this._lastMoney = null;
    }

    /** Reset the cash baseline so the initial cash deal doesn't get rendered
     *  as a +$X delta. Called from AccaGame._beginGame. */
    reset() { this._lastMoney = null; }

    tick() {
      const game = this.game;
      if (!this._lastMoney) {
        this._lastMoney = game.players.map(p => p.money);
        return;
      }
      // Defensive: rosters can change between games; resize the array.
      if (this._lastMoney.length !== game.players.length) {
        this._lastMoney = game.players.map(p => p.money);
        return;
      }
      game.players.forEach((p, i) => {
        const prev = this._lastMoney[i];
        if (prev === undefined) {
          this._lastMoney[i] = p.money;
          return;
        }
        const delta = p.money - prev;
        if (delta !== 0) {
          this._fire(p, i, delta);
        }
        this._lastMoney[i] = p.money;
      });
    }

    _fire(player, index, delta) {
      const game = this.game;
      const isCurrent = (index === game.currentPlayerIndex);
      const cls  = delta > 0 ? 'gain' : 'loss';
      const sign = delta > 0 ? '+' : '−';
      const txt  = `${sign}$${Math.abs(delta)}`;

      // Topbar money cell flash (current player only) — CSS only, no position anchor.
      if (isCurrent && game.dom.tbMoney) {
        const el = game.dom.tbMoney;
        el.classList.remove('money-gain', 'money-loss');
        // Force reflow so the animation restarts cleanly on rapid back-to-back deltas.
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth;
        el.classList.add(delta > 0 ? 'money-gain' : 'money-loss');
      }

      // Player-list row flash — CSS only, no position anchor.
      if (game.dom.playerList) {
        const row = game.dom.playerList.children[index];
        if (row) {
          row.classList.remove('flash-gain', 'flash-loss');
          // eslint-disable-next-line no-unused-expressions
          void row.offsetWidth;
          row.classList.add(delta > 0 ? 'flash-gain' : 'flash-loss');
        }
      }

      // Floating delta + coin burst anchored to the player token on the canvas.
      const pos = this._tokenScreenPos(player);
      if (pos) {
        this._spawnFloating(txt, cls, pos.x, pos.y, isCurrent);
        if (delta > 0) this._spawnCoinBurst(pos.x, pos.y);
      }
    }

    /** Convert a player's token world position to viewport coordinates,
     *  matching the camera transform used by BoardRenderer.drawWorld.
     *
     *  The canvas is rendered at an internal resolution (cfg.engine.width ×
     *  cfg.engine.height) but displayed at a different CSS size when the engine
     *  scales it to fit the container. We must account for that ratio so the
     *  fixed-position DOM overlays land on the token pixel-perfectly. */
    _tokenScreenPos(player) {
      const game = this.game;
      if (!player.currentCell || !game._toPixel) return null;
      const cam = game._camera;
      const W   = game.cfg.engine.width;
      const H   = game.cfg.engine.height;
      const wp  = game._toPixel(player.currentCell);
      // +8 y-offset matches the shift in BoardRenderer._drawTokens.
      const wx  = wp.x + (player.moveOffset ? player.moveOffset.x : 0);
      const wy  = wp.y + (player.moveOffset ? player.moveOffset.y : 0) + 8;
      // World → canvas-local pixel (same transform as BoardRenderer.drawWorld).
      const cx  = (wx - cam.cx) * cam.scale + W / 2;
      const cy  = (wy - cam.cy) * cam.scale + H / 2;
      // Canvas-local → viewport coordinates.
      // getBoundingClientRect() gives the *CSS* size, which may differ from the
      // internal pixel dimensions when Engine._setupScaling() has applied a
      // display scale factor. Normalise cx/cy into 0-1 fractions first, then
      // map into CSS pixels.
      const canvasEl = game.engine && game.engine.canvas;
      if (!canvasEl) return { x: cx, y: cy };
      const rect = canvasEl.getBoundingClientRect();
      return {
        x: rect.left + cx * (rect.width  / W),
        y: rect.top  + cy * (rect.height / H),
      };
    }

    /** Absolute-positioned "+$X" / "-$X" element that floats up and fades.
     *  Auto-removed after ~1.7s. */
    _spawnFloating(text, cls, x, y, big) {
      const el = document.createElement('div');
      el.className = 'money-delta ' + cls + (big ? ' big' : '');
      el.textContent = text;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      document.body.appendChild(el);
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1700);
    }

    _spawnCoinBurst(x, y) {
      const burst = document.createElement('div');
      burst.className = 'coin-burst';
      burst.style.left = x + 'px';
      burst.style.top  = y + 'px';
      const SPARKS = 8;
      for (let i = 0; i < SPARKS; i++) {
        const s = document.createElement('div');
        s.className = 'spark';
        const angle = (Math.PI * 2 * i) / SPARKS + (Math.random() - 0.5) * 0.4;
        const dist  = 26 + Math.random() * 22;
        s.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        s.style.setProperty('--dy', (Math.sin(angle) * dist - 6).toFixed(1) + 'px');
        s.style.animationDelay = (Math.random() * 0.05).toFixed(3) + 's';
        burst.appendChild(s);
      }
      document.body.appendChild(burst);
      setTimeout(() => { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 950);
    }
  }

  /** How long (ms) the floating "+$X" element lives. AccaGame reads this to
   *  know how long to hold the camera zoomed in after an end-of-turn delta. */
  MoneyAnimations.FLOAT_LIFETIME_MS = 1700;

  A.MoneyAnimations = MoneyAnimations;

})(window.GF = window.GF || {});
