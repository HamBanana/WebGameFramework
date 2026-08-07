// modules/Viewport.js — zoom on level complete, screen shake, slow-motion.
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
      this.timeScale = 1;
      this._cinematicTimer = 0;
      this._cinematicActive = false;
      console.log('[Viewport] enter: module initialized');
    },

    // Trigger slow-motion + zoom for the last-kill cinematic
    triggerCinematic() {
      this._cinematicActive = true;
      this.timeScale = 0.15;
      this.zoomTarget = 1.6;
      this._cinematicTimer = 0.4;
      console.log('[Viewport] *** Cinematic TRIGGERED *** timeScale=0.15, zoom=1.6, timer=0.4');
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
      // Cinematic slow-motion recovery
      if (this._cinematicActive) {
        this._cinematicTimer -= dt;
        console.log('[Viewport] cinematic active: timer=' + this._cinematicTimer.toFixed(3));
        if (this._cinematicTimer <= 0) {
          this._cinematicActive = false;
          this.timeScale = 1;
          this.zoomTarget = 1;
          console.log('[Viewport] cinematic ended, returning to normal');
        }
      }

      // Expose scaled dt for modules and behaviors
      scene.scaledDt = dt * this.timeScale;
      scene.world.scene = scene; // so behaviors can find it via world.scene

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
      console.log('[Viewport] zoom=' + scale.toFixed(2) + ' timeScale=' + this.timeScale.toFixed(2) + ' cinematic=' + this._cinematicActive + ' shake=(' + this.shakeX.toFixed(1) + ',' + this.shakeY.toFixed(1) + ')');
    },

    // Called when a wave is cleared
    onWaveClear(scene) {
      var cfg = GF.GAME_CONFIG || {};
      var vpCfg = cfg.viewport || {};
      this.zoomIn(vpCfg.zoomOnLevelComplete || 1.4, vpCfg.zoomDuration || 0.6);
    },
  });
})(window.GF);
