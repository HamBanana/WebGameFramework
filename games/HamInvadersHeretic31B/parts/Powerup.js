(function (G, GF) {
  'use strict';
  class Powerup {
    constructor(x, y, type) {
      this.x = x; this.y = y;
      this.w = 20; this.h = 20;
      this.speed = 100; this.alive = true;
      this.type = type;
    }
    update(dt) { this.y += this.speed * dt; if (this.y > 510) this.alive = false; }
    draw(ctx) {
      if (!this.alive) return;
      var symbols = { speed: '⚡', laser: '🔴', sidecannons: '💥' };
      var colors = { speed: '#ffeb3b', laser: '#ff6b6b', sidecannons: '#2ecc71' };
      var c = colors[this.type] || '#fff';
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = c;
      ctx.font = '14px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(symbols[this.type] || '?', this.x + this.w / 2, this.y + this.h / 2);
    }
  }
  G.components.Powerup = Powerup;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);