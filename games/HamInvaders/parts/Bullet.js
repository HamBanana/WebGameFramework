// parts/Bullet.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Bullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 4;
      this.h = 12;
      this.speed = 400;
      this.alive = true;
    }
    update(dt) {
      this.y -= this.speed * dt;
      if (this.y + this.h < 0) this.alive = false;
    }
    draw(ctx) {
      if (!this.alive) return;
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 1, this.y, 2, this.h);
    }
  }

  G.components.Bullet = Bullet;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
