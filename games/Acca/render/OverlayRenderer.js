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

      // Full-width background bar
      UI.drawPanel(ctx, 0, barY, W, barH, {
        bgColor: 'rgba(8,12,22,0.96)',
        borderColor: '#7796c4', borderWidth: 2, radius: 0,
      });

      // Tabs — centred in the bar
      const tabPad   = 28;
      const measured = opts.map(o => {
        ctx.font = '13px monospace';
        return ctx.measureText(o.label).width + tabPad * 2;
      });
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
          { font: selected ? 'bold 13px monospace' : '13px monospace',
            color, align: 'center', baseline: 'middle' });

        tabX += tw;
      });

    }

    _drawVerticalPanel(ctx, W, H) {
      const game = this.game;
      const UI   = game.ui;
      const opts = game.menu.options;
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

      opts.forEach((opt, i) => {
        const oy = curY + 8 + i * optH;
        const disabled = !!opt._disabled;
        if (i === game.menu.index) {
          ctx.fillStyle = disabled ? 'rgba(120,120,120,0.18)' : 'rgba(120,160,220,0.25)';
          ctx.fillRect(x + 8, oy - 4, w - 16, optH - 4);
        }
        const prefix = i === game.menu.index ? '> ' : '  ';
        const color = disabled
          ? (i === game.menu.index ? '#9aa0a8' : '#666c75')
          : (i === game.menu.index ? '#ffffff' : '#bcd0e8');
        UI.drawText(ctx, prefix + opt.label, x + 24, oy,
          { font: '13px monospace', color });
      });

      UI.drawText(ctx, '↑↓ select   Enter confirm', x + w / 2, y + h - 18,
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
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      const winner = game.winner;
      if (!winner) return;
      game.ui.drawText(ctx, `${winner.name.toUpperCase()} WINS!`, W / 2, H / 2 - 40,
        { font: 'bold 40px monospace', color: winner.color,
          align: 'center', glow: winner.color, glowBlur: 20,
          stroke: '#000000', strokeWidth: 3, shadow: true });
      game.ui.drawText(ctx, `Cash: $${winner.money}    Net Worth: $${game.netWorth(winner)}`,
        W / 2, H / 2 + 16,
        { font: '14px monospace', color: '#cdd6e0', align: 'center' });
      const blink = Math.floor(performance.now() / 600) % 2;
      if (blink) {
        game.ui.drawText(ctx, 'Press Enter to return to menu', W / 2, H - 50,
          { font: 'bold 14px monospace', color: '#ffffff', align: 'center', shadow: true });
      }
    }
  }

  A.OverlayRenderer = OverlayRenderer;

})(window.GF = window.GF || {});
