// modules/Viewport.js — screen shake.
(function (GF) {
  'use strict';
  GF.sceneModule('Viewport', {
    scene: 'Main',
    order: -1,
    phases: ['play', 'boss'],

    enter(scene) {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeTime = 0;
      this.shakeIntensity = 0;
      scene.scaledDt = null;
      scene.timeScale = 1;
      scene.world.scene = scene;
    },

    shake(intensity, duration) {
      this.shakeIntensity = intensity || 4;
      this.shakeTime = duration || 0.3;
    },

    update(dt, scene, engine) {
      var scale = (scene.timeScale != null) ? scene.timeScale : 1;
      scene.scaledDt = dt * scale;

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
      canvas.style.transform = 'translate(' + this.shakeX + 'px,' + this.shakeY + 'px)';
      canvas.style.transformOrigin = 'center center';
    },

    // No-op: zoom removed
    startCinematic() {},
    releaseCinematic() {},
    cancelCinematic() {},
    onWaveClear() {},
  });
})(window.GF);
