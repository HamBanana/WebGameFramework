// games/Acca2/ui/HUDRenderer.js
// DOM-driven HUD: top bar (turn, name, money, net worth, resources),
// notifications panel (right), district panel (left), player list (right
// bottom). Re-renders only when a signature changes, so the panels don't
// rebuild every frame.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class HUDRenderer {
    constructor(game) {
      this.game = game;
      this._lastResPlayerSig = null;
      this._lastLogSig       = null;
      this._lastPlSig        = null;
      this._lastDistrictSig  = null;
      this.moneyAnim         = new A.MoneyAnimations(game);
    }

    resetSignatures() {
      this._lastResPlayerSig = null;
      this._lastLogSig       = null;
      this._lastPlSig        = null;
      this._lastDistrictSig  = null;
      this.moneyAnim.reset();
    }

    render() {
      const game = this.game;
      const cur  = game.currentPlayer;
      if (!cur) return;
      const dom = game.dom;

      this._renderTopBar(cur, dom);
      this._renderResources(cur, dom);
      this._renderNotifications(dom);
      this._renderPlayerList(dom);
      // Money animations after the player list rebuild so freshly-created
      // rows can pick up the .flash-* class.
      this.moneyAnim.tick();
      this._renderDistrictSidebar(dom);
    }

    _renderTopBar(cur, dom) {
      const game = this.game;
      const nw = game.netWorth(cur);
      // Turn counter — turnCounter is incremented at end-of-turn, so the
      // human-friendly "current turn" is +1.
      if (dom.tbTurn) {
        const turnStr = String((game.turnCounter || 0) + 1);
        if (dom.tbTurn.textContent !== turnStr) dom.tbTurn.textContent = turnStr;
      }
      // The "(bankrupt)" suffix used to truncate the topbar money/networth —
      // bankruptcy now renders as a separate pill-shaped badge next to the name.
      if (dom.tbName.textContent !== cur.name) dom.tbName.textContent = cur.name;
      dom.tbName.style.color = cur.color;
      if (dom.tbBankruptBadge) {
        dom.tbBankruptBadge.style.display = cur.isBankrupt ? 'inline-block' : 'none';
      }
      const moneyStr = '$' + cur.money;
      if (dom.tbMoney.textContent !== moneyStr) dom.tbMoney.textContent = moneyStr;
      const nwStr = '$' + nw;
      if (dom.tbNetWorth.textContent !== nwStr) dom.tbNetWorth.textContent = nwStr;
    }

    _renderResources(cur, dom) {
      const game = this.game;
      // Sig is keyed on currentPlayer.index so we can tell a turn-rotation
      // rebuild ("everything changed") apart from a real resource gain/loss
      // for the same player (where we want to .bump the changed pills).
      const resCfg = game.cfg.market.resources;
      const sigParts = resCfg.map(r => (cur.resources[r] || 0));
      const sig = sigParts.join(',');
      const playerSig = cur.index + '|' + sig;
      if (this._lastResPlayerSig === playerSig) return;
      const lastSig = this._lastResPlayerSig || '';
      const samePlayer = lastSig.startsWith(cur.index + '|');
      const prevParts = samePlayer
        ? lastSig.slice(String(cur.index).length + 1).split(',')
        : null;
      this._lastResPlayerSig = playerSig;
      dom.tbResources.innerHTML = '';
      resCfg.forEach((r, idx) => {
        const qty = cur.resources[r] || 0;
        const pill = document.createElement('span');
        pill.className = 'res-pill';
        if (prevParts && parseInt(prevParts[idx] || '0', 10) !== qty) {
          pill.classList.add('bump');
        }
        pill.innerHTML = `<span class="res-name">${r.slice(0, 3)}</span><span class="res-val">${qty}</span>`;
        dom.tbResources.appendChild(pill);
      });
    }

    _renderNotifications(dom) {
      const game = this.game;
      const last = game.eventLog[game.eventLog.length - 1];
      const lastSig = last && typeof last === 'object'
        ? `${last.turn}:${last.msg}:${last.count || 1}`
        : (last || '');
      const logSig = game.eventLog.length + '|' + lastSig;
      if (this._lastLogSig === logSig) return;
      this._lastLogSig = logSig;
      dom.notifications.innerHTML = '';
      // Show ~14 lines (was 12) — still tight enough not to dominate the
      // viewport but reduces the rate at which interesting events scroll off.
      const recent = game.eventLog.slice(-14);
      recent.forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'notif' + (idx === recent.length - 1 ? ' latest' : '');
        div.textContent = A.AccaGame ? A.AccaGame.logText(entry)
          : (typeof entry === 'object' ? entry.msg : entry);
        dom.notifications.appendChild(div);
      });
      dom.notifications.scrollTop = dom.notifications.scrollHeight;
    }

    _renderPlayerList(dom) {
      const game = this.game;
      const plSig = game.players.map(p =>
        `${p.index}:${p.money}:${game.netWorth(p)}:${p.isBankrupt ? 1 : 0}:${p.index === game.currentPlayerIndex ? 1 : 0}`
      ).join('|');
      if (this._lastPlSig === plSig) return;
      this._lastPlSig = plSig;
      dom.playerList.innerHTML = '';
      game.players.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'pl-row' +
          (i === game.currentPlayerIndex ? ' active' : '') +
          (p.isBankrupt ? ' bankrupt' : '');
        row.innerHTML =
          `<div class="pl-color" style="background:${p.color}"></div>` +
          `<div class="pl-info">` +
            `<div class="pl-name" style="color:${p.color}">${p.name}</div>` +
            `<div class="pl-stat">Net: $${game.netWorth(p)}</div>` +
            `<div class="pl-stat">Cash: $${p.money} · Structures: ${p.ownedStructures.length}</div>` +
          `</div>`;
        dom.playerList.appendChild(row);
      });
    }

    _renderDistrictSidebar(dom) {
      const game = this.game;
      const list = dom.districtList;
      if (!list) return;
      if (!game.districtSys) {
        list.innerHTML = '';
        return;
      }
      const districts = game.districtSys.list().sort((a, b) => a.id.localeCompare(b.id));
      const sig = districts.map(d =>
        `${d.id}:${d.population}:${Math.round(d.happiness)}:${d.mayorIndex}:${Math.round(d.taxRate * 100)}`
      ).join('|');
      if (this._lastDistrictSig === sig) return;
      this._lastDistrictSig = sig;

      list.innerHTML = '';
      districts.forEach(d => {
        const mayor = d.mayorIndex >= 0 ? game.players[d.mayorIndex] : null;
        const moodLabel = d.happiness >= 70 ? 'happy'
                        : d.happiness >= 40 ? 'ok'
                        : d.happiness >= 20 ? 'sad'
                        : 'angry';
        const owned = d.cells.filter(c => c.structure).length;
        const total = d.cells.filter(c => c.type === 'buildable').length;

        const row = document.createElement('div');
        row.className = 'dist-row';
        row.innerHTML =
          `<div class="dist-header">` +
            `<span class="dist-name" style="border-left-color:${d.color}">${d.id}</span>` +
            (d.specialty ? `<span class="dist-tag">${d.specialty}</span>` : '') +
          `</div>` +
          `<div class="dist-body">` +
            `<div class="dist-line">Pop <strong>${d.population}</strong>&ensp;Hap <span class="dist-mood dist-mood-${moodLabel}">${Math.round(d.happiness)}</span></div>` +
            `<div class="dist-line">Tax <strong>${Math.round(d.taxRate * 100)}%</strong>&ensp;Bldg ${owned}/${total}</div>` +
            `<div class="dist-line dist-mayor-line">${mayor
              ? `<span class="dist-mayor-dot" style="background:${mayor.color}"></span><span style="color:${mayor.color}">${mayor.name}</span>`
              : '<span class="dim">No mayor</span>'}</div>` +
          `</div>`;
        list.appendChild(row);
      });
    }
  }

  A.HUDRenderer = HUDRenderer;

})(window.GF = window.GF || {});
