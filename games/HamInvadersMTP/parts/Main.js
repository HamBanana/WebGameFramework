// parts/Main.js — scene, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Main extends GF.Scene {
    init(engine) {
      this.engine = engine;
      this.phase = 'menu';
      this.score = 0;
      this.lives = 3;
      this.player = new G.components.Player(engine.config.width / 2 - 20, engine.config.height - 50);
      this.bullets = [];
      this.invaders = [];
      this.invaderDir = 1;
      this.invaderSpeed = 60;
      this.invaderStep = 10;
      this.fireCooldown = 0;
      engine.input.bind('left', 'KeyA', 'ArrowLeft');
      engine.input.bind('right', 'KeyD', 'ArrowRight');
      engine.input.bind('fire', 'Space');
      engine.input.bind('confirm', 'Space', 'Enter');
    }
    startGame() {
      this.score = 0;
      this.lives = 3;
      this.player.x = this.engine.config.width / 2 - 20;
      this.bullets = [];
      this.invaders = [];
      this.invaderDir = 1;
      this.invaderSpeed = 60;
      const cols = 8, rows = 4;
      const w = 30, h = 20, gap = 8;
      const startX = (this.engine.config.width - cols * (w + gap)) / 2;
      const startY = 60;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this.invaders.push(new G.components.Invader(startX + c * (w + gap), startY + r * (h + gap), r));
        }
      }
      this.phase = 'play';
    }
    update(dt, engine) {
      if (this.phase === 'menu') {
        if (engine.input.wasPressed('confirm')) this.startGame();
      } else if (this.phase === 'play') {
        const speed = 220;
        if (engine.input.isDown('left')) this.player.x -= speed * dt;
        if (engine.input.isDown('right')) this.player.x += speed * dt;
        this.player.x = Math.max(0, Math.min(this.engine.config.width - this.player.w, this.player.x));
        this.fireCooldown -= dt;
        if (engine.input.wasPressed('fire') && this.fireCooldown <= 0) {
          this.bullets.push(new G.components.Bullet(this.player.x + this.player.w / 2 - 2, this.player.y - 12));
          this.fireCooldown = 0.25;
        }
        let edge = false;
        for (const inv of this.invaders) {
          if (!inv.alive) continue;
          inv.x += this.invaderSpeed * this.invaderDir * dt;
          if (inv.x < 0 || inv.x + inv.w > this.engine.config.width) edge = true;
        }
        if (edge) {
          this.invaderDir *= -1;
          for (const inv of this.invaders) inv.y += this.invaderStep;
        }
        for (const b of this.bullets) b.y -= 400 * dt;
        this.bullets = this.bullets.filter(b => b.alive && b.y > -20);
        for (const b of this.bullets) {
          for (const inv of this.invaders) {
            if (!inv.alive) continue;
            if (b.x < inv.x + inv.w && b.x + b.w > inv.x && b.y < inv.y + inv.h && b.y + b.h > inv.y) {
              inv.alive = false;
              b.alive = false;
              this.score += 10;
            }
          }
        }
        this.invaders = this.invaders.filter(i => i.alive);
        if (this.invaders.length === 0) this.phase = 'win';
        for (const inv of this.invaders) {
          if (inv.y + inv.h >= this.player.y) { this.lives = 0; this.phase = 'over'; }
        }
        if (this.lives <= 0) this.phase = 'over';
      } else if (this.phase === 'over' || this.phase === 'win') {
        if (engine.input.wasPressed('confirm')) this.phase = 'menu';
      }
    }
    render(ctx, engine) {
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, engine.config.width, engine.config.height);
      if (this.phase === 'menu') {
        GF.UISystem.drawText(ctx, 'HAM INVADERS', engine.config.width / 2, engine.config.height / 2 - 40, { align: 'center', font: '40px monospace', color: '#ff8844' });
        GF.UISystem.drawText(ctx, 'built by qwen3.6-27b-mtp-coder', engine.config.width / 2, engine.config.height / 2 - 8, { align: 'center', font: '16px monospace', color: '#ff8844' });
        GF.UISystem.drawText(ctx, 'Arrows / A,D to move. Space to fire.', engine.config.width / 2, engine.config.height / 2 + 10, { align: 'center', color: '#ccc' });
        GF.UISystem.drawText(ctx, 'Press Space to start', engine.config.width / 2, engine.config.height / 2 + 50, { align: 'center', color: '#fff' });
      } else if (this.phase === 'play') {
        this.player.draw(ctx);
        for (const inv of this.invaders) inv.draw(ctx);
        for (const b of this.bullets) b.draw(ctx);
        GF.UISystem.drawText(ctx, 'Score ' + this.score, 12, 12, { font: '20px monospace', color: '#fff' });
        GF.UISystem.drawText(ctx, 'Lives ' + this.lives, 12, 36, { font: '20px monospace', color: '#fff' });
      } else if (this.phase === 'over') {
        GF.UISystem.drawText(ctx, 'GAME OVER', engine.config.width / 2, engine.config.height / 2 - 20, { align: 'center', font: '36px monospace', color: '#f44' });
        GF.UISystem.drawText(ctx, 'Score ' + this.score, engine.config.width / 2, engine.config.height / 2 + 20, { align: 'center', color: '#fff' });
        GF.UISystem.drawText(ctx, 'Space to retry', engine.config.width / 2, engine.config.height / 2 + 50, { align: 'center', color: '#ccc' });
      } else if (this.phase === 'win') {
        GF.UISystem.drawText(ctx, 'YOU WIN!', engine.config.width / 2, engine.config.height / 2 - 20, { align: 'center', font: '36px monospace', color: '#8f8' });
        GF.UISystem.drawText(ctx, 'Score ' + this.score, engine.config.width / 2, engine.config.height / 2 + 20, { align: 'center', color: '#fff' });
        GF.UISystem.drawText(ctx, 'Space to retry', engine.config.width / 2, engine.config.height / 2 + 50, { align: 'center', color: '#ccc' });
      }
    }
  }

  G.scenes.Main = Main;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
