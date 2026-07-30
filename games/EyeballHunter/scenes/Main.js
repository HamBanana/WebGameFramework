// parts/Main.js — scene, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Main extends GF.Scene {
    init(engine) {
      this.engine = engine;
      this.eyeballs = 0;
      this.lives = 3;
      this.floatingTexts = [];
      this.particles = [];
    
      engine.input.bind('left','ArrowLeft','KeyA').bind('right','ArrowRight','KeyD')
                  .bind('up','ArrowUp','KeyW','Space');
    
      this.platforms = [
        {x:150, y:380, w:120, h:20},
        {x:350, y:300, w:100, h:20},
        {x:550, y:360, w:140, h:20},
        {x:700, y:260, w:120, h:20},
        {x:80,  y:240, w:100, h:20},
      ];
    
      this.world = new GF.EntityWorld();
      engine.addSystem(this.world);
    
      const player = this.world.spawn('player', 80, 400);
    
      [{x:200,y:440},{x:400,y:280},{x:600,y:440},{x:780,y:240},{x:120,y:220}].forEach(p =>
        this.world.spawn('spider', p.x, p.y)
      );
    
      // Declarative collision: when player touches enemy, steal eyeball
      this.world.onOverlap('player', 'enemy', (p, e) => {
        if (e.hasEyeball) {
          e.hasEyeball = false;
          e.destroy();
          this.eyeballs++;
          this.spawnFloatingText(`+1 👁️`, e.x, e.y - 30);
        }
      });
    
      this.world.onTick((dt) => {
        if (Math.random() < 0.004) this.world.spawn('spider', Math.random()<0.5?-20:980, Math.random()*300+100);
        if (Math.random() < 0.05) {
          this.particles.push({x:Math.random()*960, y:540, vx:(Math.random()-0.5)*15, vy:-Math.random()*30-15, size:Math.random()*3+1, alpha:0.6, decay:0.008});
        }
      });
    }
  
    spawnFloatingText(text, x, y) {
      this.floatingTexts.push({text, x, y, vy: -60, alpha: 1, life: 1.2});
    }
  
    update(dt, engine) {
      this.world.update(dt);
    
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= p.decay;
      }
      this.particles = this.particles.filter(p => p.alpha > 0);
    
      for (const ft of this.floatingTexts) {
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.alpha = ft.life / 1.2;
      }
      this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
    
      if (this.eyeballs >= 15) {
        this.spawnFloatingText('🎉 YOU WIN! 🎉', 380, 200);
      }
    }
  
    render(ctx, engine) {
      ctx.fillStyle = '#1a1a3a';
      ctx.fillRect(0, 480, 960, 60);
      ctx.fillStyle = '#2a2a5a';
      ctx.fillRect(0, 480, 960, 3);
    
      for (const p of this.platforms) {
        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#2a2a5a';
        ctx.fillRect(p.x, p.y, p.w, 3);
      }
    
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha * 0.5;
        ctx.fillStyle = '#6a6aff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    
      this.world.draw(ctx);
    
      for (const ft of this.floatingTexts) {
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;
    
      // HUD
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`👁️ Eyeballs: ${this.eyeballs}`, 20, 35);
      let lives = '';
      for (let i = 0; i < this.lives; i++) lives += '❤️ ';
      ctx.fillText(lives, 20, 62);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText('Arrows: Move/Jump | Touch enemies to steal their eyeballs!', 20, 525);
    
      if (this.eyeballs >= 15) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 40px monospace';
        ctx.fillText('🎉 VICTORY! ALL EYEBALLS COLLECTED! 🎉', 80, 260);
      }
    }
  }

  G.scenes.Main = Main;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
