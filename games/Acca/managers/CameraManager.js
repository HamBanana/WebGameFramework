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
      this._mapViewActive = false;
      this._savedScale    = null;  // scale before district-focus took over
    }

    zoomInOnPlayer(player) {
      this._mapViewActive = false;
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

    toggleMapView() {
      this._mapViewActive = !this._mapViewActive;
      if (this._mapViewActive) this.zoomOutToBoard();
    }

    /** Gradually zoom in. Each press steps the target scale up; the existing
     *  lerp loop in update() smooths the visual transition. Cancels map view
     *  so manual zoom always takes precedence over the overview override. */
    zoomIn() {
      const cam = this.game._camera;
      this._mapViewActive = false;
      cam.targetScale = Math.min(4.0, cam.targetScale * 1.18);
    }

    /** Gradually zoom out. Floor is 50% of the all-board zoom so the player
     *  can pan past the overview if they want extra context. */
    zoomOut() {
      const cam = this.game._camera;
      this._mapViewActive = false;
      const floor = (cam.zoomedOutScale || 0.1) * 0.5;
      cam.targetScale = Math.max(floor, cam.targetScale / 1.18);
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
      // Hovering a district row in the sidebar pins focus to that district —
      // zoom the camera to fit it. Highest priority so it overrides map view
      // and player-follow. We save the prior targetScale on entry and restore
      // it on exit so the camera doesn't stay zoomed at the district's fit.
      const focusDistrict = this._getFocusedDistrict();
      if (focusDistrict) {
        if (this._savedScale === null) this._savedScale = cam.targetScale;
        this._applyDistrictFocus(focusDistrict);
      } else if (this._savedScale !== null) {
        cam.targetScale = this._savedScale;
        this._savedScale = null;
      }
      if (focusDistrict) {
        // already handled above
      // Map view — hold the zoomed-out board view.
      } else if (this._mapViewActive) {
        cam.targetScale = cam.zoomedOutScale;
        cam.targetCx    = cam.boardCenter.x;
        cam.targetCy    = cam.boardCenter.y;
      // Spotlight wins over follow-the-player so the portfolio menu can focus
      // the camera on the highlighted property.
      } else if (this._spotlightCell) {
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

    /** Resolve the district-row hover focus into a District object, or null. */
    _getFocusedDistrict() {
      const game = this.game;
      const id = game._focusDistrictId;
      if (!id || !game.districtSys) return null;
      const d = game.districtSys.get(id);
      return (d && d.cells && d.cells.length) ? d : null;
    }

    /** Set camera target to fit a district's bounding box with padding. */
    _applyDistrictFocus(district) {
      const game = this.game;
      const cam  = game._camera;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      district.cells.forEach(c => {
        const px = game._toPixel(c);
        if (px.x < minX) minX = px.x;
        if (px.x > maxX) maxX = px.x;
        if (px.y < minY) minY = px.y;
        if (px.y > maxY) maxY = px.y;
      });
      const size  = game._cellSize;
      const bboxW = (maxX - minX) + size;
      const bboxH = (maxY - minY) + size;
      const W = game.cfg.engine.width;
      const H = game.cfg.engine.height;
      const margin = 1.4;  // padding around the bbox
      const scale  = Math.min(W / (bboxW * margin), H / (bboxH * margin));
      cam.targetCx    = (minX + maxX) / 2;
      cam.targetCy    = (minY + maxY) / 2;
      cam.targetScale = scale;
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
