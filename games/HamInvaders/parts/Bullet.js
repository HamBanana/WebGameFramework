(function (G, GF) {
  'use strict';
  class Bullet {
    constructor(x, y, type) {
      this.x = x; this.y = y;
      this.type = type || 'normal';
      this.alive = true;
      if (this.type === 'laser') {
        this.w = 6; this.h = 20;
        this.speed = 500;
      } else if (this.type === 'sidecannon') {
        this.w = 4; this.h = 10;
        this.speed = 450;
      } else {
        this.w = 4; this.h = 12;
        this.speed = 400;
      }
    }
    update(dt) {
      this.y -= this.speed * dt;
      if (this.y + this.h < 0) this.alive = false;
    }
    draw(ctx) {
      if (!this.alive) return;
      if (this.type === 'laser') {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(this.x - 1, this.y, this.w + 2, this.h);
        ctx.globalAlpha = 1.0;
      } else if (this.type === 'sidecannon') {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 1, this.y, 2, this.h);
      } else {
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 1, this.y, 2, this.h);
      }
    }
  }
  G.components.Bullet = Bullet;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);