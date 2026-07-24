(function (G, GF) {
  'use strict';

  // Powerup types and their effects
  const POWERUP_TYPES = {
    doubleShot: {
      name: 'doubleShot',
      color: '#ff6b6b',
      icon: '⚡',
      effect: function (player) {
        player.addPowerup('doubleShot', 10);
      },
      spriteKey: 'powerup_doubleShot'
    },
    extraLife: {
      name: 'extraLife',
      color: '#2ecc71',
      icon: '❤️',
      effect: function (player) {
        player.lives = Math.min(player.lives + 1, 5);
      },
      spriteKey: 'powerup_extraLife'
    },
    megaLaser: {
      name: 'megaLaser',
      color: '#ffeb3b',
      icon: '🔫',
      effect: function (player) {
        player.addPowerup('megaLaser', 10);
      },
      spriteKey: 'powerup_megaLaser'
    },
    rapidFire: {
      name: 'rapidFire',
      color: '#3498db',
      icon: '⚡',
      effect: function (player) {
        player.addPowerup('rapidFire', 10);
      },
      spriteKey: 'powerup_rapidFire'
    },
    shield: {
      name: 'shield',
      color: '#9b59b6',
      icon: '🛡️',
      effect: function (player) {
        player.addPowerup('shield', 10);
      },
      spriteKey: 'powerup_shield'
    },
    smartBomb: {
      name: 'smartBomb',
      color: '#e74c3c',
      icon: '💣',
      effect: function (player) {
        player.addPowerup('smartBomb', 10);
      },
      spriteKey: 'powerup_smartBomb'
    },
    invincible: {
      name: 'invincible',
      color: '#ff69b4',
      icon: '✨',
      effect: function (player) {
        player.addPowerup('invincible', 8);
      },
      spriteKey: 'powerup_invincible'
    },
    tripleShot: {
      name: 'tripleShot',
      color: '#00bfff',
      icon: '🔫',
      effect: function (player) {
        player.addPowerup('tripleShot', 10);
      },
      spriteKey: 'powerup_tripleShot'
    }
  };

  class Powerup {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.w = 24;
      this.h = 24;
      this.type = type;
      this.alive = true;
      this.speed = 80;
      this.bobOffset = Math.random() * Math.PI * 2;
      this.bobTimer = 0;
      this.spawnTime = 0;
    }

    update(dt) {
      this.bobTimer += dt;
      this.y += this.speed * dt;
      if (this.y > 600) this.alive = false;
    }

    draw(ctx) {
      if (!this.alive) return;
      const bob = Math.sin(this.bobTimer * 5) * 3;
      const p = POWERUP_TYPES[this.type];

      // Glow effect
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 15;

      // Body
      ctx.fillStyle = p.color;
      ctx.fillRect(this.x + 2, this.y + 2 + bob, this.w - 4, this.h - 4);

      // Inner highlight
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(this.x + 4, this.y + 4 + bob, this.w - 8, this.h - 8);
      ctx.globalAlpha = 1;

      // Icon
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon, this.x + this.w / 2, this.y + this.h / 2 + bob);

      ctx.restore();
    }
  }

  G.components.Powerup = Powerup;
  G.powerupTypes = POWERUP_TYPES;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);