// games/Acca2/managers/CameraManager.js
// Camera state + the lerp loop that smooths between targets. Owns the
// "spotlight on a cell" effect used by the portfolio menu, and the
// zoom-out hold that fires between turns.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class CameraManager {
    constructor(game) {
      this.game = game;
      this._spotlightCell = null;
    }

    zoomInOnPlayer(player) {
      const game = this.game;
      const W = game.cfg.engine.width, H = game.cfg.engine.height;
      const cells = game.cfg.camera.zoomedInCellsAcross;
      const minDim = Math.min(W, H);
      const scale = minDim / (cells * game._cellSize);
      const px = game._toPixel(player.currentCell);
      game._camera.targetScale = scale;
      game._camera.targetCx    = px.x;
      game._camera.targetCy    = px.y;
    }

    zoomOutToBoard() {
      const cam = this.game._camera;
      cam.targetScale = cam.zoomedOutScale;
      cam.targetCx    = cam.boardCenter.x;
      cam.targetCy    = cam.boardCenter.y;
    }

    snap() {
      const cam = this.game._camera;
      cam.scale = cam.targetScale;
      cam.cx    = cam.targetCx;
      cam.cy    = cam.targetCy;
    }

    update(dt) {
      const game = this.game;
      const cam  = game._camera;
      // Spotlight wins over follow-the-player so the portfolio menu can focus
      // the camera on the highlighted property.
      if (this._spotlightCell) {
        const px = game._toPixel(this._spotlightCell);
        cam.targetCx = px.x;
        cam.targetCy = px.y;
        const W = game.cfg.engine.width, H = game.cfg.engine.height;
        const cells = Math.max(4, game.cfg.camera.zoomedInCellsAcross - 4);
        const minDim = Math.min(W, H);
        cam.targetScale = minDim / (cells * game._cellSize);
      } else if (game.gameState === A.GAME_STATE.PLAYING &&
                 game.turn.stage !== A.TURN_STAGE.BETWEEN &&
                 game.turn.player) {
        const px = game._toPixel(game.turn.player.currentCell);
        cam.targetCx = px.x;
        cam.targetCy = px.y;
      }
      const alpha = Math.min(1, game.cfg.camera.lerp * (dt * 60));
      cam.scale += (cam.targetScale - cam.scale) * alpha;
      cam.cx    += (cam.targetCx    - cam.cx)    * alpha;
      cam.cy    += (cam.targetCy    - cam.cy)    * alpha;
    }

    /** Spotlight a cell — focus the camera on it and dim the rest of the board. */
    spotlightOnCell(cell) {
      this._spotlightCell = cell;
      if (cell) {
        const game = this.game;
        const px = game._toPixel(cell);
        game._camera.targetCx = px.x;
        game._camera.targetCy = px.y;
      }
    }

    clearSpotlight() {
      this._spotlightCell = null;
      // Snap-target the active player again so the camera lerps back.
      const game = this.game;
      if (game.turn && game.turn.player) {
        this.zoomInOnPlayer(game.turn.player);
      }
    }

    get spotlightCell() { return this._spotlightCell; }
  }

  A.CameraManager = CameraManager;

})(window.GF = window.GF || {});
