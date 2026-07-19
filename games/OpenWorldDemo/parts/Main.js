// parts/Main.js — the starting scene (registered as G.scenes.Main).
// A scene extends GF.Scene and implements init/update/render.
// REPLACE THIS with your real game: write_component(name='Main', kind='scene', content=...).
(function (G, GF) {
  'use strict';
  G.scenes.Main = class Main extends GF.Scene {
    init(engine) {
      this.t = 0;
    }
    update(dt, engine) {
      this.t += dt;
    }
    render(ctx, engine) {
      const { width, height } = GF.GAME_CONFIG.engine;
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Open World Demo', width / 2, height / 2 - 10);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#88aadd';
      ctx.fillText('component scaffold — add parts, edit this scene', width / 2, height / 2 + 20);
    }
  };
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
