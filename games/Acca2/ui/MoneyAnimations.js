// games/Acca2/ui/MoneyAnimations.js
// Watches per-player cash deltas across renders. On a non-zero delta:
//   • flash the topbar money cell (current player only)
//   • flash the player-list row
//   • spawn a floating "+$X" / "-$X" indicator that drifts up
//   • spawn a coin sparkle burst on a gain (current player only)
// Pure DOM — never touches the canvas.

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

      // Topbar money cell (current player only).
      if (isCurrent && game.dom.tbMoney) {
        const el = game.dom.tbMoney;
        el.classList.remove('money-gain', 'money-loss');
        // Force reflow so the animation restarts cleanly on rapid back-to-back deltas.
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth;
        el.classList.add(delta > 0 ? 'money-gain' : 'money-loss');

        const r = el.getBoundingClientRect();
        this._spawnFloating(txt, cls, r.left + r.width / 2, r.top - 2, true);

        if (delta > 0) {
          this._spawnCoinBurst(r.left + r.width / 2, r.top + r.height / 2);
        }
      }

      // Player-list row flash + secondary delta.
      if (game.dom.playerList) {
        const row = game.dom.playerList.children[index];
        if (row) {
          row.classList.remove('flash-gain', 'flash-loss');
          // eslint-disable-next-line no-unused-expressions
          void row.offsetWidth;
          row.classList.add(delta > 0 ? 'flash-gain' : 'flash-loss');

          if (!isCurrent) {
            const rr = row.getBoundingClientRect();
            this._spawnFloating(txt, cls, rr.right - 28, rr.top + rr.height / 2, false);
          }
        }
      }
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

  A.MoneyAnimations = MoneyAnimations;

})(window.GF = window.GF || {});
