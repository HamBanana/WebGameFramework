// parts/Invader.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Invader {
    constructor(x, y, kind) {
      this.x = x;
      this.y = y;
      this.w = 30;
      this.h = 20;
      this.kind = kind;
      this.alive = true;
    }
    draw(ctx) {
      if (!this.alive) return;
      ctx.fillStyle = this.kind === 0 ? '#88ff88' : this.kind === 1 ? '#88ccff' : '#ffcc44';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + 6, this.y + 5, 6, 6);
      ctx.fillRect(this.x + this.w - 12, this.y + 5, 6, 6);
    }
  }

  G.components.Invader = Invader;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
