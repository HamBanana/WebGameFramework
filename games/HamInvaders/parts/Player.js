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
      this.lives = 3;
      // Stackable powerup system: { type: string, stackCount: number, timer: number }
      this.powerups = {};
    }

    // Add a powerup (stackable) — returns true if it was a new activation
    addPowerup(type, duration) {
      if (!this.powerups[type]) {
        this.powerups[type] = { stackCount: 1, timer: duration };
        return true;
      }
      // Stack it
      this.powerups[type].stackCount++;
      // Extend timer (but cap at 2x base duration)
      this.powerups[type].timer = Math.min(this.powerups[type].timer + duration * 0.5, duration * 2);
      return false;
    }

    // Check if a powerup is currently active
    hasPowerup(type) {
      return this.powerups[type] && this.powerups[type].timer > 0;
    }

    // Get the stack count for a powerup
    getPowerupCount(type) {
      return this.powerups[type] ? this.powerups[type].stackCount : 0;
    }

    // Update powerup timers each frame
    updatePowerups(dt) {
      for (const type in this.powerups) {
        this.powerups[type].timer -= dt;
        if (this.powerups[type].timer <= 0) {
          delete this.powerups[type];
        }
      }
    }

    update(dt, engine) {
      if (engine.input.isDown('left'))  this.x -= this.speed * dt;
      if (engine.input.isDown('right')) this.x += this.speed * dt;
      var margin = 4;
      if (this.x < margin) this.x = margin;
      if (this.x + this.w > engine.config.width - margin) this.x = engine.config.width - this.w - margin;

      // Update powerup timers
      this.updatePowerups(dt);
    }

    draw(ctx) {
      if (!this.alive) return;
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

      // Shield effect
      if (this.hasPowerup('shield')) {
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Invincible shimmer
      if (this.hasPowerup('invincible')) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
        ctx.restore();
      }
    }
  }
  G.components.Player = Player;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
