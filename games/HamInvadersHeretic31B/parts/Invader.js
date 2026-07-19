// parts/Invader.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Invader {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.w = 32;
      this.h = 24;
      this.alive = true;
      this.type = type || 0;
    }
    draw(ctx) {
      if (!this.alive) return;
      const colors = ['#9b59b6', '#e67e22', '#2ecc71'];
      ctx.fillStyle = colors[this.type] || '#9b59b6';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 6, this.y + 6, 8, 8);
      ctx.fillRect(this.x + 18, this.y + 6, 8, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(this.x + 9, this.y + 9, 4, 4);
      ctx.fillRect(this.x + 21, this.y + 9, 4, 4);
      ctx.fillStyle = colors[this.type] || '#9b59b6';
      ctx.fillRect(this.x + 2, this.y + this.h, 6, 6);
      ctx.fillRect(this.x + this.w - 8, this.y + this.h, 6, 6);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(this.x + 10, this.y + 18, 12, 3);
    }
  }

  G.components.Invader = Invader;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);