// parts/Main.js — scene, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Main extends GF.Scene {
    init(engine) {
      this.engine = engine; this.score = 0;
      engine.input.bind('up','ArrowUp','KeyW').bind('down','ArrowDown','KeyS')
                  .bind('left','ArrowLeft','KeyA').bind('right','ArrowRight','KeyD');
      this.world = new GF.EntityWorld();
      engine.addSystem(this.world);
      const W = engine.config.width, H = engine.config.height;
      this.player = this.world.spawn('player', W/2, H/2);
      for (let i = 0; i < 8; i++) this.world.spawn('orb', 40 + (i % 4) * 140, 60 + Math.floor(i / 4) * 170);
      this.world.onOverlap('player','orb', (p, o) => { o.destroy(); this.score += 1; });
    }
    update(dt, engine) { this.world.update(dt); }
    render(ctx, engine) {
      this.world.draw(ctx);
      GF.UISystem.drawText(ctx, 'Orbs: ' + this.score, 12, 12, { color:'#fff', font:'18px monospace' });
      if (this.world.count('orb') === 0)
        GF.UISystem.drawText(ctx, 'All collected!', engine.config.width/2, engine.config.height/2,
          { color:'#4fe0c0', align:'center', font:'26px monospace' });
    }
  }

  G.scenes.Main = Main;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
