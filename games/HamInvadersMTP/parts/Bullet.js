// parts/Bullet.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Bullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 4;
      this.h = 12;
      this.alive = true;
    }
    draw(ctx) {
      if (!this.alive) return;
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  G.components.Bullet = Bullet;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
