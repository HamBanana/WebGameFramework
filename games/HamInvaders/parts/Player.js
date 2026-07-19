(function (G, GF) {
  'use strict';
  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 40;
      this.h = 24;
      this.speed = 300;
      this.alive = true;
      // Powerup state
      this.powerupType = null;
      this.powerupTimer = 0;
      this.powerupDuration = 10;
      this.shootRate = 0.3;
      this.fireCooldown = 0;
      // Side cannon offsets
      this.leftCannonOffset = -22;
      this.rightCannonOffset = 22;
    }
    update(dt, engine) {
      if (engine.input.isDown('left'))  this.x -= this.speed * dt;
      if (engine.input.isDown('right')) this.x += this.speed * dt;
      var margin = 4;
      if (this.x < margin) this.x = margin;
      if (this.x + this.w > engine.config.width - margin) this.x = engine.config.width - this.w - margin;
      this.fireCooldown = Math.max(0, this.fireCooldown - dt);
      if (this.powerupType) {
        this.powerupTimer -= dt;
        if (this.powerupTimer <= 0) {
          this.powerupType = null;
          this.fireCooldown = 0;
        }
      }
    }
    activate(type) {
      this.powerupType = type;
      this.powerupTimer = this.powerupDuration;
      if (type === 'speed') {
        this.shootRate = 0.12;
      } else if (type === 'laser') {
        this.shootRate = 0.3;
      } else if (type === 'sidecannons') {
        this.shootRate = 0.25;
      } else {
        this.shootRate = 0.3;
      }
    }
    getBulletType() {
      return this.powerupType === 'laser' ? 'laser' : 'normal';
    }
    needsSideCannons() {
      return this.powerupType === 'sidecannons';
    }
    draw(ctx) {
      if (!this.alive) return;
      var cx = this.x + this.w / 2;
      var cy = this.y;
      // Ham/pig ship body
      ctx.fillStyle = '#ff8c69';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // Nozzle
      ctx.fillStyle = '#ff6347';
      ctx.fillRect(this.x + this.w / 2 - 4, this.y + this.h, 8, 6);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 8, this.y + 4, 8, 8);
      ctx.fillRect(this.x + 24, this.y + 4, 8, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(this.x + 11, this.y + 7, 4, 4);
      ctx.fillRect(this.x + 27, this.y + 7, 4, 4);
      // Snout
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(this.x + 14, this.y + 14, 12, 6);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(this.x + 16, this.y + 15, 3, 3);
      ctx.fillRect(this.x + 21, this.y + 15, 3, 3);
      // Side cannons visual
      if (this.powerupType === 'sidecannons') {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x + this.leftCannonOffset, this.y - 6, 8, 8);
        ctx.fillRect(this.x + this.w + this.leftCannonOffset - 8, this.y - 6, 8, 8);
      }
      // Powerup indicator bar
      if (this.powerupType) {
        var barW = 40;
        var barH = 4;
        var barX = this.x;
        var barY = this.y + this.h + 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        var pct = this.powerupTimer / this.powerupDuration;
        var barColors = { speed: '#ffeb3b', laser: '#ff6b6b', sidecannons: '#2ecc71' };
        ctx.fillStyle = barColors[this.powerupType] || '#fff';
        ctx.fillRect(barX, barY, barW * pct, barH);
      }
    }
  }
  G.components.Player = Player;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);