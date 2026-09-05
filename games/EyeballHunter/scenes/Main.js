// parts/Main.js — the platformer level scene. One instance per level.
// Reads its level from window.EH_LEVELS[EH.levelIndex] and persists run stats
// on window.EH. Handles camera scroll, eyeball-stealing, powerups, spikes,
// pits, the level goal, and the boss fight.
(function (G, GF) {
  'use strict';

  const VW = 960, VH = 540;

  class Main extends GF.Scene {
    constructor(levelIndex) {
      super();
      this.levelIndex = levelIndex != null ? levelIndex : (window.EH ? window.EH.levelIndex : 0);
      this.setupDone = false;
    }

    // ── Setup (runs once per level instance) ─────────────────────────
    enter(engine) {
      this.engine = engine;
      if (this.setupDone) return;

      const EH = window.EH;
      const LEVELS = window.EH_LEVELS;
      this.level = LEVELS[this.levelIndex];
      this.isBossLevel = !!this.level.boss;

      // Input bindings
      engine.input.bind('left', 'ArrowLeft', 'KeyA')
                  .bind('right', 'ArrowRight', 'KeyD')
                  .bind('up', 'ArrowUp', 'KeyW', 'Space');

      // Camera
      this.camera = new GF.Camera({
        width: VW, height: VH,
        worldWidth: this.level.width,
        worldHeight: VH,
        lerp: 0.12,
      });

      // World + shared data
      this.world = new GF.EntityWorld();
      this.world.data.solids = this.level.ground.concat(this.level.platforms);
      this.world.data.levelWidth = this.level.width;
      this.world.data.levelHeight = 620;
      this.world.data.t = 0;
      engine.addSystem(this.world);

      // Player
      this.player = this.world.spawn('player', this.level.playerStart.x, this.level.playerStart.y);
      this.camera.follow(this.player, 0, 0);
      this.camera.snapTo(this.player.centerX, this.player.centerY);

      // Enemies (spiders and flies)
      for (const p of this.level.enemies) {
        const type = p.type || 'spider';
        const en = this.world.spawn(type, p.x, p.y, {});
        if (en) {
          en.range = p.range || 120;
          en.homeX = p.x;
          en.baseY = p.y;
          en.startY = p.y;
        }
      }

      // Powerups
      for (const p of this.level.powerups) {
        const pu = this.world.spawn('powerup', p.x - 12, p.y - 12, {});
        if (pu) pu.powerType = p.type;
      }

      // Spikes
      for (const s of this.level.spikes) {
        this.world.spawn('spike', s.x, s.y, { w: s.w, h: s.h });
      }

      // Goal (non-boss levels)
      if (this.level.goal) {
        this.world.spawn('goal', this.level.goal.x, this.level.goal.y);
      }

      // Boss
      if (this.level.boss) {
        const b = this.world.spawn('boss', this.level.boss.x, this.level.boss.y, {});
        if (b) {
          b.maxEyeballs = this.level.boss.maxEyeballs;
          b.eyeballs = this.level.boss.maxEyeballs;
          b.homeY = this.level.boss.y;
          this.boss = b;
        }
      }

      // ── Collision rules ────────────────────────────────────────────
      // Player vs enemy: jump on one to take its eye. Touch it any other way
      // and it costs a life — blinded or not.
      this.world.onOverlap('player', 'enemy', (p, e) => {
        if (e.has('boss')) {
          this.onBossTouch(p, e);
          return;
        }
        
        // Check if player is stomping (falling from above)
        const playerBottom = p.y + p.h;
        const enemyTop = e.y;
        const isFalling = p.vy > 50;
        const isAbove = playerBottom <= enemyTop + 12;
        
        if (isFalling && isAbove && p.invuln <= 0) {
          // Stomp the enemy!
          this.stompEnemy(p, e);
        } else {
          // Side/bottom contact -> lose a life (shield and i-frames inside)
          this.damagePlayer(p, e.centerX);
        }
      });

      // Player collects powerup
      this.world.onOverlap('player', 'powerup', (p, e) => {
        EH.grant(e.powerType);
        e.destroy();
        this.spawnFloatingText(this.powerupLabel(e.powerType), e.x, e.y - 10, '#7cfc9e');
        this.burst(e.centerX, e.centerY, ['#7cfc9e', '#fff', this.powerupColor(e.powerType)], 14);
      });

      // Player hits spikes
      this.world.onOverlap('player', 'spike', (p, e) => {
        this.damagePlayer(p, e.centerX);
      });

      // Player hit by boss bomb
      this.world.onOverlap('player', 'bomb', (p, e) => {
        e.destroy();
        this.damagePlayer(p, e.centerX);
      });

      // Player reaches goal
      this.world.onOverlap('player', 'goal', (p, e) => {
        if (this.state === 'playing' && !this.isBossLevel) this.completeLevel();
      });

      // Thrown eyeball hits enemy — knocks their eye loose. Yours is spent and
      // theirs is collected, so hitting a sighted enemy is net neutral; hitting
      // a blind one just stuns it and costs you the eye.
      this.world.onOverlap('eyeball', 'enemy', (ball, e) => {
        if (e.has('boss')) return; // Boss has separate mechanic
        if (e.stunned > 0) return;
        
        // Destroy the eyeball
        ball.destroy();
        
        // Stun the enemy
        e.stunned = 1.5;
        e.hurtFlash = 1;
        
        this.burst(e.centerX, e.centerY, ['#fff', '#00e5ff', '#ffe066'], 12);
        if (this.stealEyeball(this.player, e)) return;
        
        this.spawnFloatingText('HIT!', e.centerX, e.y - 10, '#ffe066');
        
        const game = window.GAME && window.GAME.game;
        if (game && game.audio) game.audio.play('hit');
      });

      // Boss launches bombs at the player periodically
      this.bombTimer = 2.2;
      this.world.onTick((dt) => {
        this.world.data.t += dt;
        if (this.boss && this.state === 'playing' && !this.boss.defeated) {
          this.bombTimer -= dt;
          if (this.bombTimer <= 0) {
            this.bombTimer = 2.2 + Math.random() * 0.6;
            this.fireBossBomb();
          }
        }
      });

      // FX
      this.floatingTexts = [];
      this.particles = [];
      this.state = 'playing';
      this.stateTimer = 0;
      this.setupDone = true;
    }

    // ── Gameplay helpers ─────────────────────────────────────────────
    // Blind an enemy: they survive, they just can't see — and they have
    // nothing left to give. Single source of truth for both flags.
    blindEnemy(e) {
      const had = e.hasEyeball !== false;
      e.hasEyeball = false;
      e.blinded = true;
      e.blindFlash = 0.3;
      return had;
    }

    stealEyeball(p, e) {
      if (!this.blindEnemy(e)) return false;
      window.EH.eyeballs++;
      window.EH.levelEyeballs++;
      this.spawnFloatingText('+1 👁️', e.centerX, e.y - 14, '#ffcc00');
      this.burst(e.centerX, e.centerY, ['#fff', '#00e5ff', '#cc0000'], 12);
      const game = window.GAME && window.GAME.game;
      if (game && game.audio) game.audio.play('pickup');
      return true;
    }

    stompEnemy(p, e) {
      // The bounce is unconditional — a blinded enemy is still solid ground.
      p.bounceV = -400;
      p.invuln = 0.3;
      
      // Stun the enemy
      e.stunned = 2;
      e.hurtFlash = 1;
      
      // Only the first stomp (the one that takes the eye) pays out.
      if (!this.stealEyeball(p, e)) {
        this.spawnFloatingText('BLIND!', e.centerX, e.y - 20, '#9aa0b5');
        const game = window.GAME && window.GAME.game;
        if (game && game.audio) game.audio.play('hit');
        return;
      }
      
      // Chance to drop powerup
      this.maybeDropPowerup(e.centerX, e.centerY);
    }

    maybeDropPowerup(x, y) {
      // 25% chance to drop a powerup
      if (Math.random() > 0.25) return;
      
      const types = ['life', 'speed', 'shield', 'magnet'];
      const type = types[Math.floor(Math.random() * types.length)];
      const pu = this.world.spawn('powerup', x - 8, y - 8, { powerType: type });
      if (pu) {
        pu.vy = -150; // Pop up a bit
        this.spawnFloatingText('POWERUP!', x, y - 10, '#7cfc9e');
      }
    }

    onBossTouch(p, boss) {
      if (boss.defeated || boss.eyeballs <= 0) return;
      if (p.invuln > 0) return;
      boss.eyeballs--;
      boss.hitFlash = 0.3;
      window.EH.eyeballs++;
      this.spawnFloatingText('💥 -1 EYE', boss.centerX, boss.y - 10, '#ff5d5d');
      this.burst(boss.centerX, boss.centerY, ['#fff', '#00e5ff', '#ff5d5d'], 18);
      p.invuln = 0.8;
      if (boss.eyeballs <= 0) {
        boss.defeated = true;
        this.state = 'victory';
        this.stateTimer = 2.2;
        this.burst(boss.centerX, boss.centerY, ['#fff', '#00e5ff', '#ff5d8f', '#ffe066'], 60);
      }
    }

    damagePlayer(p, fromX) {
      if (this.state !== 'playing') return;
      if (p.invuln > 0) return;
      if (window.EH.consumeShield()) {
        this.spawnFloatingText('SHIELD!', p.centerX, p.y - 14, '#5fe0ff');
        p.invuln = 0.6;
        return;
      }
      window.EH.lives--;
      p.invuln = 1.4;
      // Knockback away from the hit
      const dir = p.centerX < fromX ? -1 : 1;
      p.knockbackX = dir * 250;
      p.knockbackY = -300;
      this.burst(p.centerX, p.centerY, ['#ff5d5d', '#fff'], 14);
      const game = window.GAME && window.GAME.game;
      if (game && game.audio) game.audio.play('hit');
      if (window.EH.lives <= 0) {
        this.state = 'gameover';
        this.stateTimer = 2.0;
      }
    }

    // Pit death: player fell below the level
    handlePit() {
      if (this.state !== 'playing') return;
      if (this.player.fellIntoPit) {
        console.log('[EH] PIT death! playerY=' + this.player.y + ' levelHeight=' + this.world.data.levelHeight);
        window.EH.lives--;
        this.burst(this.player.centerX, 600, ['#ff5d5d'], 12);
        if (window.EH.lives <= 0) {
          this.state = 'gameover';
          this.stateTimer = 2.0;
          return;
        }
        // Respawn at level start
        this.player.x = this.level.playerStart.x;
        this.player.y = this.level.playerStart.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.invuln = 1.5;
        this.camera.snapTo(this.player.centerX, this.player.centerY);
      }
    }

    fireBossBomb() {
      const b = this.boss;
      const p = this.player;
      if (!b || !p || b.defeated) return;
      const bomb = this.world.spawn('bomb', b.centerX - 8, b.centerY - 8, {});
      if (!bomb) return;
      const dx = p.centerX - b.centerX;
      const dy = p.centerY - b.centerY;
      const d = Math.hypot(dx, dy) || 1;
      const spd = 220;
      bomb.vx = (dx / d) * spd;
      bomb.vy = (dy / d) * spd;
    }

    completeLevel() {
      if (this.state !== 'playing') return;
      this.state = 'levelComplete';
      this.stateTimer = 1.6;
      this.spawnFloatingText('STAGE CLEAR!', VW / 2 - 100, VH / 2, '#7cfc9e');
      const game = window.GAME && window.GAME.game;
      if (game && game.audio) game.audio.play('levelUp');
    }

    throwEyeball(p) {
      const EH = window.EH;
      if (EH.eyeballs <= 0) return;
      
      EH.eyeballs--;
      const dir = p.flipX ? -1 : 1;
      const ball = this.world.spawn('eyeball', p.centerX - 8, p.centerY - 8, { dir });
      
      const game = window.GAME && window.GAME.game;
      if (game && game.audio) game.audio.play('shoot');
      this.spawnFloatingText('👁️', p.centerX + dir * 20, p.centerY - 10, '#ffcc00');
    }

    // ── FX ───────────────────────────────────────────────────────────
    spawnFloatingText(text, x, y, color) {
      this.floatingTexts.push({ text, x, y, vy: -50, alpha: 1, life: 1.1, color: color || '#ffcc00' });
    }

    burst(x, y, colors, count) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 120;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          size: 2 + Math.random() * 3,
          color: colors[i % colors.length],
          alpha: 1, decay: 0.9 + Math.random(),
        });
      }
    }

    powerupLabel(t) {
      return { life: '+1 LIFE', speed: 'SPEED UP!', shield: 'SHIELD!', magnet: 'MAGNET!' }[t] || 'POWERUP';
    }
    powerupColor(t) {
      return { life: '#ff5d8f', speed: '#ffe066', shield: '#5fe0ff', magnet: '#c084fc' }[t] || '#fff';
    }

    // ── Update ───────────────────────────────────────────────────────
    update(dt, engine) {
      const EH = window.EH;
      EH.tick(dt);
      
      // Handle throwing eyeballs
      if (this.player && this.player.wantThrow && EH.eyeballs > 0 && this.state === 'playing') {
        this.player.wantThrow = false;
        this.throwEyeball(this.player);
      }
      
      this.world.update(dt);
      this.camera.update(dt);

      this.handlePit();

      // Particles
      for (const p of this.particles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.alpha -= p.decay * dt;
      }
      this.particles = this.particles.filter(p => p.alpha > 0);

      for (const ft of this.floatingTexts) {
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.alpha = Math.max(0, ft.life / 1.1);
      }
      this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

      // State machine for end-of-level / game over / victory
      if (this.state === 'playing') return;
      this.stateTimer -= dt;
      if (this.stateTimer > 0) return;

      const game = window.GAME && window.GAME.game;
      if (!game) return;
      if (this.state === 'levelComplete') {
        EH.levelIndex++;
        EH.levelEyeballs = 0;
        game.scenes.replaceWithTransition(new Main(EH.levelIndex), { type: 'fade', duration: 0.7 });
        this.state = 'done';
      } else if (this.state === 'victory') {
        game.scenes.replaceWithTransition(new G.scenes.Victory(), { type: 'fade', duration: 0.9 });
        this.state = 'done';
      } else if (this.state === 'gameover') {
        game.scenes.replaceWithTransition(new G.scenes.GameOver(), { type: 'fade', duration: 0.9 });
        this.state = 'done';
      }
    }

    // ── Render ───────────────────────────────────────────────────────
    render(ctx, engine) {
      // Parallax background (screen space)
      this.drawBackground(ctx);

      ctx.save();
      this.camera.begin(ctx);

      // Solids (ground + platforms)
      this.drawSolids(ctx);

      // World entities (enemies, player, powerups, goal, boss, bombs)
      this.world.draw(ctx, this.camera);

      // Particles
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating text
      for (const ft of this.floatingTexts) {
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';

      this.camera.end(ctx);
      ctx.restore();

      // HUD
      this.drawHUD(ctx);

      // Overlays
      if (this.state === 'levelComplete') this.drawBanner(ctx, 'STAGE CLEAR!', '#7cfc9e');
      if (this.state === 'victory') this.drawBanner(ctx, 'BOSS DEFEATED!', '#ffe066');
      if (this.state === 'gameover') this.drawBanner(ctx, 'GAME OVER', '#ff5d5d');
    }

    drawBackground(ctx) {
      const camX = this.camera ? this.camera.x : 0;
      ctx.fillStyle = this.level.parallax || '#16162e';
      ctx.fillRect(0, 0, VW, VH);

      // Far parallax layer (hills)
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.tint(this.level.parallax, 18);
      const off = -(camX * 0.3) % 400;
      for (let i = -1; i < 4; i++) {
        const bx = off + i * 400;
        ctx.beginPath();
        ctx.moveTo(bx, 420);
        ctx.quadraticCurveTo(bx + 150, 300, bx + 300, 420);
        ctx.fill();
      }
      ctx.restore();

      // Near parallax (fog wisps)
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#fff';
      const off2 = -(camX * 0.5) % 300;
      for (let i = -1; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(off2 + i * 300, 120, 120, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    tint(hex, amt) {
      const c = hex.replace('#', '');
      const r = Math.min(255, parseInt(c.substr(0, 2), 16) + amt);
      const g = Math.min(255, parseInt(c.substr(2, 2), 16) + amt);
      const b = Math.min(255, parseInt(c.substr(4, 2), 16) + amt);
      return `rgb(${r},${g},${b})`;
    }

    drawSolids(ctx) {
      for (const s of this.level.ground) {
        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#2a2a5a';
        ctx.fillRect(s.x, s.y, s.w, 4);
      }
      for (const s of this.level.platforms) {
        ctx.fillStyle = '#241a44';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#3a2a66';
        ctx.fillRect(s.x, s.y, s.w, 4);
      }
    }

    drawHUD(ctx) {
      const EH = window.EH;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, VW, 48);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`👁️ ${EH.eyeballs}`, 16, 32);

      // Lives
      let lives = '';
      for (let i = 0; i < EH.lives; i++) lives += '❤️ ';
      ctx.fillText(lives, 130, 32);

      // Level name
      ctx.font = '14px monospace';
      ctx.fillStyle = '#9aa';
      ctx.textAlign = 'center';
      ctx.fillText(this.level.name, VW / 2, 30);

      // Active powerups
      let px = VW - 16;
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px monospace';
      if (EH.shield) { ctx.fillStyle = '#5fe0ff'; ctx.fillText('◈ SHIELD', px, 24); px -= 110; }
      if (EH.isSpeeding()) { ctx.fillStyle = '#ffe066'; ctx.fillText(`» ${EH.speedTimer.toFixed(0)}`, px, 24); }

      // Boss health (eyeballs remaining)
      if (this.isBossLevel && this.boss) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ff5d5d';
        ctx.font = 'bold 16px monospace';
        let eyes = '';
        for (let i = 0; i < this.boss.eyeballs; i++) eyes += '👁 ';
        ctx.fillText('BOSS ' + eyes, 16, 70);
      }

      // Hint
      ctx.font = '11px monospace';
      ctx.fillStyle = '#667';
      ctx.textAlign = 'left';
      ctx.fillText('← → / A D: Move   ↑ / W / Space: Jump   X / F: Throw Eyeball   Stomp enemies for eyes — touch one and lose a life!', 16, VH - 12);
    }

    drawBanner(ctx, text, color) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = color;
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, VW / 2, VH / 2);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }
  }

  G.scenes.Main = Main;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
