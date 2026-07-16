// GameFramework/games/SwarmHome/ui/HUD.js
// 2D canvas overlay: sim clock, robot status cards, MQTT-style event log,
// active-camera label, PiP frame and key hints.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};
  const UI = () => GF.UISystem;

  class HUD {
    constructor(game) {
      this.game = game;
    }

    draw(ctx) {
      const g = this.game;
      const W = g.cfg.engine.width, H = g.cfg.engine.height;
      const U = UI();

      // ── Clock + speed (top-left) ──
      U.drawPanel(ctx, 12, 10, 168, 44, { bgColor: 'rgba(10,12,22,0.72)', borderColor: 'rgba(100,140,200,0.4)', radius: 8 });
      U.drawText(ctx, g.routine.clockString(), 24, 16, { font: 'bold 24px monospace', color: '#e8f0ff', shadow: true });
      U.drawText(ctx, `×${g.routine.speed}${g.routine.paused ? '  ⏸' : ''}`, 130, 22, {
        font: 'bold 14px monospace', color: g.routine.paused ? '#ffaa44' : '#7a9acc',
      });

      // ── Robot cards (left column) ──
      let y = 66;
      g.robots.forEach(r => {
        const sel = g.selectedId === r.id;
        U.drawPanel(ctx, 12, y, 168, 52, {
          bgColor: 'rgba(10,12,22,0.66)',
          borderColor: sel ? r.spec.color : 'rgba(80,100,140,0.35)',
          borderWidth: sel ? 2 : 1, radius: 8,
        });
        U.drawText(ctx, `${g.camHotkey(r.id)} ${r.name}`, 22, y + 7, {
          font: 'bold 13px monospace', color: r.spec.color, shadow: true,
        });
        U.drawText(ctx, r.state, 22, y + 24, { font: '11px monospace', color: '#aab8d0' });
        U.drawHealthBar(ctx, 116, y + 9, 54, 7, r.battery, r.spec.battery.capacity, {
          fillColor: r.battery < 20 ? '#ff4444' : '#4ade80',
        });
        U.drawText(ctx, `${Math.round(r.battery)}%`, 116, y + 20, { font: '10px monospace', color: '#88a0c0' });
        y += 58;
      });

      // ── Active camera label (top-center) ──
      const camLabel = g.cameras.active.label;
      U.drawPanel(ctx, W / 2 - 110, 10, 220, 30, { bgColor: 'rgba(10,12,22,0.66)', borderColor: 'rgba(100,140,200,0.4)', radius: 8 });
      U.drawText(ctx, `📷 ${camLabel}`, W / 2, 16, { font: 'bold 13px monospace', color: '#cfe0ff', align: 'center' });

      // ── PiP frame ──
      const pipEntry = g.cameras.pipCamEntry();
      if (pipEntry) {
        const r = g.cameras.pipRect();
        ctx.strokeStyle = 'rgba(140,180,255,0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
        U.drawText(ctx, pipEntry.label, r.x + 8, r.y + 6, {
          font: 'bold 11px monospace', color: '#cfe0ff', shadow: true,
        });
      }

      // ── MQTT log (bottom-left) ──
      const log = g.mqttLog;
      if (log.length) {
        const lh = 15, pad = 8;
        const bh = log.length * lh + pad * 2;
        U.drawPanel(ctx, 12, H - bh - 12, 330, bh, { bgColor: 'rgba(8,10,18,0.62)', borderColor: 'rgba(80,100,140,0.3)', radius: 8 });
        log.forEach((line, i) => {
          U.drawText(ctx, line, 22, H - bh - 12 + pad + i * lh, { font: '10px monospace', color: '#8fd0a8' });
        });
      }

      // ── Key hints (bottom-center; hidden when touch controls are shown) ──
      if (!g.touch || !g.touch.enabled) {
        U.drawText(ctx, '0 orbit · 1-4 robot cams · 5/6/7 device cams · C cycle · P pip · Space pause · ± speed · G design panel',
          W / 2, H - 18, { font: '10px monospace', color: 'rgba(160,180,210,0.55)', align: 'center' });
      }

      if (g.routine.paused) {
        U.drawText(ctx, 'PAUSED', W / 2, 52, {
          font: 'bold 26px monospace', color: '#ffcc66', align: 'center', glow: '#ff8800', glowBlur: 14, shadow: true,
        });
      }
    }
  }

  SH.HUD = HUD;

})(window.GF = window.GF || {});
