// parts/Main.js — scene, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Main extends GF.Scene {
    init(engine) {
      this.engine = engine;
      this.score = { value: 0, best: 0 };
    
      engine.input.bind('left','ArrowLeft','KeyA').bind('right','ArrowRight','KeyD');
    
      this.world = new GF.EntityWorld();
      engine.addSystem(this.world);
    
      engine.input.bind('restart', 'Space', 'Enter');
      // Spawn the tongue
      this.player = this.world.spawn('tonguePlayer', engine.config.width/2, engine.config.height - 30);
    
      // World data
      this.world.data.score = this.score;
      this.world.data.popups = [];
      this.world.data.spawnTimer = 0;
      this.world.data.difficulty = 1;
      this.world.data.lastTime = Date.now();
    
      // Game over state
      this.gameOver = false;
      this.gameOverTime = 0;
    }
  
    update(dt, engine) {
      if (this.gameOver) {
        this.gameOverTime += dt;
        if (engine.input.wasPressed('restart')) {
          engine.scenes.pop();
          engine.scenes.push(new Main(engine));
        }
        return;
      }
    
      // Difficulty increases over time
      const now = Date.now();
      const elapsed = (now - this.world.data.lastTime) / 1000;
      this.world.data.difficulty = 1 + Math.floor(elapsed / 10) * 0.2;
    
      // Spawn balls
      this.world.data.spawnTimer += dt;
      const spawnRate = Math.max(0.15, 0.5 - this.world.data.difficulty * 0.03);
    
      if (this.world.data.spawnTimer > spawnRate) {
        this.world.data.spawnTimer = 0;
        // More spicy balls as difficulty increases
        const isSpicy = Math.random() < Math.min(0.4, this.world.data.difficulty * 0.08);
        this.world.spawn(isSpicy ? 'spicyBall' : 'sweetBall');
      }
    
      this.world.update(dt);
    
      // Update popups
      this.world.data.popups = this.world.data.popups.filter(p => {
        p.life -= dt;
        p.y -= 40 * dt;
        return p.life > 0;
      });
    
      // Update burning tongue
      if (this.player && this.player.burning) {
        this.player.burnTime -= dt;
        if (this.player.burnTime <= 0) {
          this.player.burning = false;
        }
      }
    
      // Screen shake decay
      if (this.world.data.screenShake) {
        this.world.data.screenShake -= dt * 15;
        if (this.world.data.screenShake < 0) this.world.data.screenShake = 0;
      }
    }
  
    render(ctx, engine) {
      // Apply screen shake
      ctx.save();
      if (this.world.data.screenShake > 0) {
        const shake = this.world.data.screenShake;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake
        );
      }
    
      this.world.draw(ctx);
    
      // Draw popups
      this.world.data.popups.forEach(p => {
        const alpha = Math.min(1, p.life / 0.4);
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.font = 'bold 18px Arial';
        ctx.fillText(p.text, p.x, p.y);
      });
    
      // HUD
      ctx.restore(); // no shake on HUD
    
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Score: ' + this.score.value, 15, 30);
      ctx.font = '14px Arial';
      ctx.fillText('Best: ' + this.score.best, 15, 50);
    
      // Difficulty indicator
      ctx.fillStyle = '#ffcc00';
      ctx.font = '12px Arial';
      ctx.fillText('Level: ' + this.world.data.difficulty.toFixed(1), engine.width - 80, 30);
    
      // Game over screen
      if (this.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, engine.width, engine.height);
      
        ctx.fillStyle = '#ff4466';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TONGUE BURN!', engine.width/2, engine.height/2 - 40);
      
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText('Score: ' + this.score.value, engine.width/2, engine.height/2 + 10);
      
        if (this.score.value >= this.score.best && this.score.value > 0) {
          ctx.fillStyle = '#ffcc00';
          ctx.font = '18px Arial';
          ctx.fillText('NEW BEST!', engine.width/2, engine.height/2 + 45);
        }
      
        ctx.fillStyle = '#cccccc';
        ctx.font = '16px Arial';
        ctx.fillText('Press SPACE or ENTER to play again', engine.width/2, engine.height/2 + 85);
        ctx.textAlign = 'left';
      }
    }
  }

  G.scenes.Main = Main;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
