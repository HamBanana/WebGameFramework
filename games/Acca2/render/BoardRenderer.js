// games/Acca2/render/BoardRenderer.js
// Draws the board: panel frame, district tints, roads, cell sprites, owner
// rings, toll-gate accrued indicators, the next-cell tooltip overlay.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class BoardRenderer {
    constructor(game) {
      this.game = game;
    }

    drawWorld(ctx, W, H) {
      const game = this.game;
      const cam = game._camera;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(cam.scale, cam.scale);
      ctx.translate(-cam.cx, -cam.cy);
      this._drawBoard(ctx);
      this._drawTokens(ctx);
      ctx.restore();
      // Screen-space spotlight overlay.
      this._drawSpotlight(ctx, W, H);
    }

    _drawBoard(ctx) {
      const game = this.game;
      const size = game._cellSize;

      // Board frame.
      const b = game._boardBounds;
      if (b) {
        game.ui.drawPanel(ctx, b.minX - 8, b.minY - 8,
          (b.maxX - b.minX) + 16, (b.maxY - b.minY) + 16, {
            bgColor: 'rgba(0,0,0,0.55)',
            borderColor: '#2a4060',
            borderWidth: 2,
            radius: 6,
          });
      }

      // District tinting — semi-transparent colour wash behind each district.
      if (game.districtSys) {
        game.districtSys.list().forEach(d => {
          if (!d.cells || d.cells.length === 0) return;
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          d.cells.forEach(c => {
            const px = game._toPixel(c);
            if (px.x < minX) minX = px.x;
            if (px.x > maxX) maxX = px.x;
            if (px.y < minY) minY = px.y;
            if (px.y > maxY) maxY = px.y;
          });
          ctx.save();
          ctx.fillStyle = d.color;
          ctx.globalAlpha = 0.10;
          ctx.fillRect(minX - size / 2 - 4, minY - size / 2 - 4,
                       (maxX - minX) + size + 8, (maxY - minY) + size + 8);
          ctx.restore();
        });
      }

      // Roads underneath the cell sprites so each cell square sits on top.
      this._drawRoads(ctx);

      game.cells.forEach(cell => {
        const { x, y } = game._toPixel(cell);
        cell.animator.draw(ctx, x, y);

        // Owner ring on owned structures.
        if (cell.structure && cell.structure.ownerIndex >= 0) {
          const owner = game.players[cell.structure.ownerIndex];
          ctx.strokeStyle = owner.color;
          ctx.lineWidth   = 3;
          ctx.strokeRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, size - 8);
        }

        // Toll-gate accrued indicator.
        if (cell.structure && cell.structure.type === 'toll_gate' && cell.structure.tollAccrued > 0) {
          game.ui.drawText(ctx, `$${cell.structure.tollAccrued}`, x, y + size / 2 - 4, {
            font: 'bold 10px monospace', color: '#ffe7c0', align: 'center', shadow: true,
          });
        }
      });

      // Next-cell tooltip preview during MOVE.
      if (game.gameState === A.GAME_STATE.PLAYING && game.movement && game.movement.active) {
        const adj = game.movement.adjacent || {};
        ['up', 'down', 'left', 'right'].forEach(dir => {
          const target = adj[dir];
          if (!target) return;
          const px = game._toPixel(target);
          const label = this._describeCell(target);
          if (!label) return;
          game.ui.drawText(ctx, label, px.x, px.y - size / 2 - 6, {
            font: 'bold 10px monospace',
            color: '#ffffff',
            align: 'center',
            stroke: '#000',
            strokeWidth: 3,
          });
        });
      }
    }

    /** Short human-readable description of a cell for the next-cell tooltip
     *  overlay during MOVE stage. */
    _describeCell(cell) {
      if (!cell) return '';
      const game = this.game;
      const labelMap = {
        bank: 'Bank +$200',
        chance: 'Chance',
        market: 'Market',
        power_plant: 'Power Plant',
        well: 'Well',
        mine: 'Mine',
        empty: '',
      };
      if (cell.type === 'buildable') {
        if (cell.structure) {
          const s = cell.structure;
          const owner = (game.players && game.players[s.ownerIndex]) || null;
          const labelEntry = (game.cfg.structures.catalog || []).find(c => c.type === s.type);
          const label = labelEntry ? labelEntry.label : s.type;
          if (owner) {
            return `${label} (${owner.name})`;
          }
          return label;
        }
        return 'Empty plot';
      }
      return labelMap[cell.type] || '';
    }

    /** Road segments between connected cells. Roads render before cells so
     *  the cell sprites sit on top, and visibly bridge non-adjacent cells. */
    _drawRoads(ctx) {
      const game = this.game;
      if (!game._connections || game._connections.length === 0) return;
      const size = game._cellSize;

      const drawnPairs = new Set();
      const pairKey = (a, b) => (a.id < b.id) ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;

      ctx.save();

      const segments = [];
      game._connections.forEach(conn => {
        const a = game._toPixel(conn.from);
        const b = game._toPixel(conn.to);
        const isBoth = conn.direction === 'both';
        if (isBoth) {
          const k = pairKey(conn.from, conn.to);
          if (drawnPairs.has(k)) return;
          drawnPairs.add(k);
        }
        segments.push({ a, b, oneWay: !isBoth });
      });

      // Outer asphalt-edge.
      ctx.strokeStyle = '#1a1f28';
      ctx.lineWidth   = Math.max(6, size * 0.18);
      ctx.lineCap     = 'round';
      ctx.beginPath();
      segments.forEach(s => { ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); });
      ctx.stroke();

      // Inner road surface.
      ctx.strokeStyle = '#5b6573';
      ctx.lineWidth   = Math.max(3, size * 0.10);
      ctx.lineCap     = 'round';
      ctx.beginPath();
      segments.forEach(s => { ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); });
      ctx.stroke();

      // Center dashed lane markings on long-enough segments.
      ctx.strokeStyle = 'rgba(240, 220, 130, 0.55)';
      ctx.lineWidth   = Math.max(1, size * 0.025);
      ctx.setLineDash([Math.max(4, size * 0.10), Math.max(4, size * 0.10)]);
      ctx.beginPath();
      segments.forEach(s => {
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < size * 1.2) return;
        ctx.moveTo(s.a.x, s.a.y);
        ctx.lineTo(s.b.x, s.b.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // One-way arrow markers for forward-only roads.
      ctx.fillStyle = 'rgba(255, 200, 90, 0.95)';
      segments.forEach(s => {
        if (!s.oneWay) return;
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;
        const ux = dx / len, uy = dy / len;
        const mx = (s.a.x + s.b.x) / 2;
        const my = (s.a.y + s.b.y) / 2;
        const h  = Math.max(7, size * 0.18);
        const w  = h * 0.7;
        const tipX = mx + ux * h * 0.5;
        const tipY = my + uy * h * 0.5;
        const baseX = mx - ux * h * 0.5;
        const baseY = my - uy * h * 0.5;
        const px = -uy, py = ux;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX + px * w * 0.5, baseY + py * w * 0.5);
        ctx.lineTo(baseX - px * w * 0.5, baseY - py * w * 0.5);
        ctx.closePath();
        ctx.fill();
      });

      ctx.restore();
    }

    _drawTokens(ctx) {
      const game = this.game;
      game.players.forEach(p => {
        if (!p.currentCell) return;
        const { x, y } = game._toPixel(p.currentCell);
        p.animator.draw(ctx, x + p.moveOffset.x, y + p.moveOffset.y + 8);
      });
    }

    /** Dim the screen and punch a glowing hole over the spotlit cell. */
    _drawSpotlight(ctx, W, H) {
      const game = this.game;
      const cell = game.camera.spotlightCell;
      if (!cell) return;
      const cam = game._camera;
      const px = game._toPixel(cell);
      const sx = (px.x - cam.cx) * cam.scale + W / 2;
      const sy = (px.y - cam.cy) * cam.scale + H / 2;
      const inner = game._cellSize * cam.scale * 0.65;
      const outer = game._cellSize * cam.scale * 2.4;

      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, inner, sx, sy, outer);
      grad.addColorStop(0,    'rgba(0,0,0,0)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1,    'rgba(0,0,0,0.78)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Pulsing halo around the spotlit cell.
      const pulse = 0.7 + 0.3 * Math.abs(Math.sin(performance.now() / 350));
      ctx.strokeStyle = `rgba(255,233,120,${0.55 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, inner * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.25 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, inner * 1.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  A.BoardRenderer = BoardRenderer;

})(window.GF = window.GF || {});
