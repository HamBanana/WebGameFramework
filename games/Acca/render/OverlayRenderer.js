// games/Acca2/render/OverlayRenderer.js
// Background gradient + screen-space overlays: the canvas-rendered start
// menu, the in-game menu modal, the die preview, and the game-over screen.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class OverlayRenderer {
    constructor(game) {
      this.game = game;
    }

    drawBackground(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a2330');
      g.addColorStop(1, '#0a0d12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(80,120,160,0.06)';
      ctx.lineWidth = 1;
      for (let i = -H; i < W; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    }

    drawDie(ctx, W, H) {
      const game = this.game;
      const stage = game.turn.stage;
      const visibleStages = [A.TURN_STAGE.ROLL, A.TURN_STAGE.MOVE];
      if (!visibleStages.includes(stage)) return;
      const dieX = W - 60;
      const dieY = H - 60;
      game.ui.drawPanel(ctx, dieX - 36, dieY - 36, 72, 72, {
        bgColor: 'rgba(0,0,0,0.55)',
        borderColor: '#2a4060', borderWidth: 1, radius: 6,
      });
      game.die.draw(ctx, dieX, dieY);
    }

    drawMenuOverlay(ctx, W, H) {
      const game = this.game;
      if (!game.menu.visible) return;
      if (game.menu.layout === 'horizontal') {
        this._drawHorizontalBar(ctx, W, H);
      } else {
        this._drawVerticalPanel(ctx, W, H);
      }
    }

    _drawHorizontalBar(ctx, W, H) {
      const game  = this.game;
      const UI    = game.ui;
      const opts  = game.menu.options;
      const barH  = 58;
      const barY  = H - barH;

      // Optional context header above the bar — title (top line) and subtitle
      // (smaller line below). Drawn on a slim translucent strip so the menu
      // stays unambiguous when reused for deeper sub-menus (Manage, Other, …).
      // Only render the header when a subtitle is present, so the start-of-
      // turn menu (title-only, with the player + cash already in the HUD)
      // keeps its existing tabs-only look.
      const title    = game.menu.title    || '';
      const subtitle = game.menu.subtitle || '';
      const hasHeader = !!subtitle;
      const headerH  = hasHeader ? 36 : 0;
      if (hasHeader) {
        const hY = barY - headerH;
        UI.drawPanel(ctx, 0, hY, W, headerH, {
          bgColor: 'rgba(8,12,22,0.78)',
          borderColor: '#2a4060', borderWidth: 0, radius: 0,
        });
        if (title) {
          UI.drawText(ctx, title, W / 2, hY + 6,
            { font: 'bold 13px monospace', color: '#ffffff', align: 'center', shadow: true });
        }
        UI.drawText(ctx, subtitle, W / 2, hY + 22,
          { font: '11px monospace', color: '#9fc8ff', align: 'center' });
      }

      // Full-width background bar
      UI.drawPanel(ctx, 0, barY, W, barH, {
        bgColor: 'rgba(8,12,22,0.96)',
        borderColor: '#7796c4', borderWidth: 2, radius: 0,
      });

      // Tabs — centred in the bar.  Adaptive sizing so longer menus (Other has
      // 7 items, Sell assets has many) always fit between the sidebars on the
      // standard 768-wide canvas: shrink padding first, then drop the font
      // size, then floor the padding. Selected items render in bold which is
      // slightly wider, so we measure with the bold font to be safe.
      const ideal  = 28;
      const minPad = 4;
      const maxFont = 13;
      const minFont = 10;
      let fontSize = maxFont;
      let tabPad   = ideal;
      const measure = (px) => {
        ctx.font = 'bold ' + px + 'px monospace';
        const ws = opts.map(o => ctx.measureText(o.label).width);
        return { ws, sum: ws.reduce((a, b) => a + b, 0) };
      };
      let { ws: labelWs, sum: labelSum } = measure(fontSize);
      const fitsWith = (pad, sum) => sum + opts.length * pad * 2 + 16 <= W;
      if (!fitsWith(tabPad, labelSum)) {
        tabPad = Math.max(minPad, Math.floor((W - 16 - labelSum) / (opts.length * 2)));
      }
      // If padding alone can't make it fit, step the font down a px at a time.
      while (!fitsWith(tabPad, labelSum) && fontSize > minFont) {
        fontSize -= 1;
        ({ ws: labelWs, sum: labelSum } = measure(fontSize));
        tabPad = Math.max(minPad, Math.floor((W - 16 - labelSum) / (opts.length * 2)));
      }
      const measured = labelWs.map(w => w + tabPad * 2);
      const totalW  = measured.reduce((a, b) => a + b, 0);
      let   tabX    = Math.round((W - totalW) / 2);

      opts.forEach((opt, i) => {
        const tw       = measured[i];
        const selected = i === game.menu.index;
        const disabled = !!opt._disabled;

        if (selected) {
          // Highlight background
          ctx.fillStyle = disabled ? 'rgba(80,80,80,0.35)' : 'rgba(100,150,220,0.28)';
          ctx.fillRect(tabX + 2, barY + 5, tw - 4, barH - 10);
          // Top accent line
          ctx.fillStyle = disabled ? '#9aa0a8' : '#7796c4';
          ctx.fillRect(tabX + 2, barY + 5, tw - 4, 3);
        }

        const color = disabled
          ? (selected ? '#9aa0a8' : '#55606a')
          : (selected ? '#ffffff'  : '#bcd0e8');
        UI.drawText(ctx, opt.label, tabX + tw / 2, barY + barH / 2,
          { font: (selected ? 'bold ' : '') + fontSize + 'px monospace',
            color, align: 'center', baseline: 'middle' });

        tabX += tw;
      });

    }

    _drawVerticalPanel(ctx, W, H) {
      const game = this.game;
      const UI   = game.ui;
      const visible = (typeof game.menu.visibleSlice === 'function')
        ? game.menu.visibleSlice()
        : { slice: game.menu.options, offset: 0 };
      const opts   = visible.slice;
      const offset = visible.offset;
      const totalLen = game.menu.options.length;
      const isWindowed = totalLen > opts.length;
      const optH = 24;
      const w    = 320;
      const h    = 56 + (game.menu.subtitle ? 16 : 0) + opts.length * optH + 24;
      const x    = (W / 2) - w / 2;
      const y    = (H / 2) - h / 2;

      UI.drawPanel(ctx, x, y, w, h, {
        bgColor: 'rgba(10,15,25,0.94)',
        borderColor: '#7796c4', borderWidth: 2, radius: 8,
      });

      UI.drawText(ctx, game.menu.title, x + w / 2, y + 12,
        { font: 'bold 16px monospace', color: '#ffffff', align: 'center', shadow: true });

      let curY = y + 36;
      if (game.menu.subtitle) {
        UI.drawText(ctx, game.menu.subtitle, x + w / 2, curY,
          { font: '11px monospace', color: '#9fc8ff', align: 'center' });
        curY += 16;
      }

      const localIndex = game.menu.index - offset;
      opts.forEach((opt, i) => {
        const oy = curY + 8 + i * optH;
        const disabled = !!opt._disabled;
        if (i === localIndex) {
          ctx.fillStyle = disabled ? 'rgba(120,120,120,0.18)' : 'rgba(120,160,220,0.25)';
          ctx.fillRect(x + 8, oy - 4, w - 16, optH - 4);
        }
        const prefix = i === localIndex ? '> ' : '  ';
        const color = disabled
          ? (i === localIndex ? '#9aa0a8' : '#666c75')
          : (i === localIndex ? '#ffffff' : '#bcd0e8');
        UI.drawText(ctx, prefix + opt.label, x + 24, oy,
          { font: '13px monospace', color });
      });

      // Scroll indicators when the list is windowed.
      if (isWindowed) {
        if (offset > 0) {
          UI.drawText(ctx, '▲ ' + offset + ' more', x + w - 14, curY + 8,
            { font: '10px monospace', color: '#7793b8', align: 'right' });
        }
        const below = totalLen - (offset + opts.length);
        if (below > 0) {
          UI.drawText(ctx, '▼ ' + below + ' more', x + w - 14, curY + 8 + opts.length * optH - 4,
            { font: '10px monospace', color: '#7793b8', align: 'right' });
        }
      }

      UI.drawText(ctx,
        isWindowed ? '↑↓ scroll   Enter confirm' : '↑↓ select   Enter confirm',
        x + w / 2, y + h - 18,
        { font: '11px monospace', color: '#7793b8', align: 'center' });
    }

    drawStartMenu(ctx, W, H) {
      const game = this.game;
      const UI = game.ui;
      UI.drawText(ctx, 'A C C A   v 2', W / 2, H * 0.18,
        { font: 'bold 56px monospace', color: '#ffffff',
          align: 'center', shadow: true,
          glow: '#5a8ed1', glowBlur: 22,
          stroke: '#2a4060', strokeWidth: 3 });
      UI.drawText(ctx, 'a board game of property & power', W / 2, H * 0.18 + 50,
        { font: '13px monospace', color: '#9fc8ff', align: 'center' });

      const cy = H * 0.5;
      UI.drawPanel(ctx, W / 2 - 200, cy - 50, 400, 100, {
        bgColor: 'rgba(0,0,0,0.55)',
        borderColor: '#2a4060', borderWidth: 2, radius: 6,
      });
      UI.drawText(ctx, 'PLAYERS', W / 2, cy - 36,
        { font: 'bold 12px monospace', color: '#9fc8ff', align: 'center' });
      UI.drawText(ctx, `<  ${game.menuPlayerCount}  >`, W / 2, cy - 8,
        { font: 'bold 32px monospace', color: '#ffffff', align: 'center', shadow: true });
      UI.drawText(ctx, '← → adjust', W / 2, cy + 30,
        { font: '11px monospace', color: '#7793b8', align: 'center' });

      const tokenY = H * 0.72;
      const spacing = 56;
      const startX = W / 2 - ((game.menuPlayerCount - 1) * spacing) / 2;
      for (let i = 0; i < game.menuPlayerCount; i++) {
        const def = game.cfg.players[i];
        ctx.save();
        ctx.translate(startX + i * spacing, tokenY);
        ctx.scale(1.1, 1.1);
        game.sprites.drawFrame(ctx, def.sprite, 'idle',
          Math.floor(performance.now() / 250) % 4, 0, 0, false);
        ctx.restore();
      }

      const blink = Math.floor(performance.now() / 500) % 2;
      if (blink) {
        UI.drawText(ctx, 'PRESS ENTER TO START', W / 2, H - 50,
          { font: 'bold 16px monospace', color: '#ffffff',
            align: 'center', glow: '#aac8ff', glowBlur: 8 });
      }
      UI.drawText(ctx, 'Arrow keys to move on the board · Enter to confirm',
        W / 2, H - 22,
        { font: '10px monospace', color: '#5e7898', align: 'center' });
    }

    drawGameOver(ctx, W, H) {
      const game = this.game;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fillRect(0, 0, W, H);
      const winner = game.winner;
      if (!winner) return;
      const UI = game.ui;

      // Banner
      UI.drawText(ctx, `${winner.name.toUpperCase()} WINS!`, W / 2, 30,
        { font: 'bold 32px monospace', color: winner.color,
          align: 'center', glow: winner.color, glowBlur: 20,
          stroke: '#000000', strokeWidth: 3, shadow: true });
      UI.drawText(ctx,
        `Cash $${winner.money} · Net Worth $${game.netWorth(winner)} · Turns ${(game.turnCounter || 0)}`,
        W / 2, 64,
        { font: '12px monospace', color: '#cdd6e0', align: 'center' });

      // Per-player results table — sorted by NW desc.
      const rows = game.players.map(p => {
        let cash = p.money;
        let structVal = 0, vaultStored = 0;
        p.ownedStructures.forEach(s => {
          structVal += (s.currentValue || 0);
          if (s.type === 'vault') vaultStored += (s.storedMoney || 0);
        });
        const M = game.marketSys;
        const fallback = (game.cfg.market && game.cfg.market.basePrices) || {};
        let resVal = 0;
        Object.entries(p.resources).forEach(([r, q]) => {
          const price = M ? M.priceOf(r) : (fallback[r] || 0);
          resVal += price * q;
        });
        return {
          p,
          cash,
          structVal,
          vaultStored,
          resVal: Math.round(resVal),
          nw: game.netWorth(p),
          structCount: p.ownedStructures.length,
          mayorCount: p.districtsMayoredOf.size,
          isWinner: p === winner,
        };
      }).sort((a, b) => b.nw - a.nw);

      const headerY = 90;
      const rowH    = 78;
      const tableX  = 40;
      const tableW  = W - 80;
      // Header pill
      UI.drawText(ctx, 'FINAL STANDINGS',
        W / 2, headerY,
        { font: 'bold 11px monospace', color: '#9fc8ff', align: 'center' });

      // Find the largest single number across rows for the bar normalization.
      const maxNW = Math.max(1, ...rows.map(r => r.nw));

      rows.forEach((r, i) => {
        const y = headerY + 18 + i * rowH;
        const card = {
          x: tableX, y, w: tableW, h: rowH - 6,
          bgColor: r.isWinner ? 'rgba(70,120,80,0.20)' : 'rgba(20,30,45,0.55)',
          borderColor: r.isWinner ? r.p.color : '#2a4060',
          borderWidth: r.isWinner ? 2 : 1, radius: 6,
        };
        UI.drawPanel(ctx, card.x, card.y, card.w, card.h, card);

        // Rank + name + bankrupt badge
        UI.drawText(ctx, `${i + 1}. ${r.p.name}`, card.x + 12, card.y + 8,
          { font: 'bold 14px monospace', color: r.p.color, shadow: true });
        if (r.p.isBankrupt) {
          UI.drawText(ctx, '(bankrupt)', card.x + 12 + 110, card.y + 10,
            { font: '10px monospace', color: '#ff8b8b' });
        }
        // NW + structure/mayor counts (right side)
        UI.drawText(ctx, `Net Worth $${r.nw}`,
          card.x + card.w - 12, card.y + 8,
          { font: 'bold 13px monospace', color: '#ffffff', align: 'right', shadow: true });
        UI.drawText(ctx, `${r.structCount} structures · ${r.mayorCount} mayoral`,
          card.x + card.w - 12, card.y + 26,
          { font: '10px monospace', color: '#9fc8ff', align: 'right' });

        // NW breakdown bar — cash | structures | vault | resources.
        const barX = card.x + 12;
        const barY = card.y + card.h - 22;
        const barW = card.w - 24;
        const barH = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(barX, barY, barW, barH);
        const nwAbs = Math.max(1, r.nw);
        let cx = barX;
        const segs = [
          { v: Math.max(0, r.cash),       color: '#7be07f' }, // cash
          { v: Math.max(0, r.structVal),  color: '#9fc8ff' }, // structures
          { v: Math.max(0, r.vaultStored),color: '#ffe57a' }, // vault
          { v: Math.max(0, r.resVal),     color: '#ff9f6b' }, // resources
        ];
        segs.forEach(s => {
          const w = Math.round(barW * (s.v / nwAbs));
          if (w <= 0) return;
          ctx.fillStyle = s.color;
          ctx.fillRect(cx, barY, w, barH);
          cx += w;
        });
        // Inline legend (small label at left under the bar)
        UI.drawText(ctx,
          `cash $${r.cash} · structs $${r.structVal} · vault $${r.vaultStored} · res $${r.resVal}`,
          barX, barY + barH + 4,
          { font: '9px monospace', color: '#bcd0e8' });
      });

      // Action footer
      const blink = Math.floor(performance.now() / 600) % 2;
      const footY = H - 20;
      UI.drawPanel(ctx, 0, footY - 28, W, 36, {
        bgColor: 'rgba(8,12,22,0.92)',
        borderColor: '#2a4060', borderWidth: 0, radius: 0,
      });
      UI.drawText(ctx,
        blink ? 'Enter — Replay  ·  Esc — Main menu' : 'Enter — Replay  ·  Esc — Main menu',
        W / 2, footY - 20,
        { font: 'bold 12px monospace', color: '#ffffff', align: 'center', shadow: true });
    }
  }

  A.OverlayRenderer = OverlayRenderer;

})(window.GF = window.GF || {});
