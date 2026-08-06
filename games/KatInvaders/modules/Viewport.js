// modules/Viewport.js — zoom on level complete, screen shake.
(function (GF) {
  'use strict';
  GF.sceneModule('Viewport', {
    scene: 'Main',
    order: -1,
    phases: ['play', 'boss'],

    enter(scene) {
      this.zoom = 1;
      this.zoomTarget = 1;
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeTime = 0;
      this.shakeIntensity = 0;
      this._zoomTimer = 0;
    },

    shake(intensity, duration) {
      this.shakeIntensity = intensity || 4;
      this.shakeTime = duration || 0.3;
    },

    zoomIn(factor, duration) {
      this.zoomTarget = factor || 1.4;
      this.zoom = this.zoomTarget;
      this._zoomTimer = duration || 0.6;
    },

    update(dt, scene, engine) {
      // Smooth zoom return
      if (this.zoomTarget !== 1) {
        this._zoomTimer -= dt;
        if (this._zoomTimer <= 0) {
          this.zoomTarget = 1;
        }
      }
      this.zoom += (this.zoomTarget - this.zoom) * dt * 8;

      // Screen shake
      if (this.shakeTime > 0) {
        this.shakeTime -= dt;
        this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
      }

      // Apply transform to canvas
      var canvas = engine.canvas;
      var scale = this.zoom;
      canvas.style.transform = 'scale(' + scale + ') translate(' + this.shakeX + 'px,' + this.shakeY + 'px)';
      canvas.style.transformOrigin = 'center center';
      console.log('[Viewport] zoom=' + scale.toFixed(2) + ' shake=(' + this.shakeX.toFixed(1) + ',' + this.shakeY.toFixed(1) + ')');
    },

    // Called when a wave is cleared
    onWaveClear(scene) {
      var cfg = GF.GAME_CONFIG || {};
      var vpCfg = cfg.viewport || {};
      this.zoomIn(vpCfg.zoomOnLevelComplete || 1.4, vpCfg.zoomDuration || 0.6);
    },
  });
})(window.GF);
