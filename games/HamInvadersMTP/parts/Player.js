// parts/Player.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 40;
      this.h = 24;
    }
    draw(ctx) {
      ctx.fillStyle = '#ff8844';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + this.w / 2 - 4, this.y - 8, 8, 8);
    }
  }

  G.components.Player = Player;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
