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
      this._cinematicHold = false;
      console.log('[Viewport] enter: module initialized');
    },

    // Begin the final-invader cinematic (zoom in + slow-mo) and HOLD it, so the
    // player's killing shot travels and connects while zoomed/slowed. Called
    // when only one invader remains — i.e. before the last one is hit.
    startCinematic() {
      if (this._cinematicActive) return; // already running
      this._cinematicActive = true;
      this._cinematicHold = true;
      this.timeScale = 0.15;
      this.zoomTarget = 1.6;
      console.log('[Viewport] *** Cinematic START (held) *** timeScale=0.15, zoom=1.6');
    },

    // Release the held cinematic: keep the zoom/slow-mo for `beat` seconds so
    // the final invader's explosion plays out inside it, then return to normal.
    // Called when the last invader is destroyed.
    releaseCinematic(beat) {
      if (!this._cinematicActive) return;
      this._cinematicHold = false;
      this._cinematicTimer = beat || 0.6;
      console.log('[Viewport] *** Cinematic RELEASE *** explosion beat=' + this._cinematicTimer);
    },

    // Stand the cinematic down immediately (no explosion beat). Used when it was
    // armed for an incoming shot that ended up missing the final invader.
    cancelCinematic() {
      if (!this._cinematicActive) return;
      this._cinematicActive = false;
      this._cinematicHold = false;
      this.timeScale = 1;
      this.zoomTarget = 1;
      console.log('[Viewport] cinematic cancelled (shot missed)');
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

    // If we leave gameplay (e.g. the player dies mid-cinematic) Viewport stops
    // updating, so make sure time is restored here — otherwise the shared
    // particle system would be left stuck in slow-motion.
    onPhase(phase, prev, scene, engine) {
      if (phase !== 'play' && phase !== 'boss') {
        this._cinematicActive = false;
        this._cinematicHold = false;
        this.timeScale = 1;
        this.zoomTarget = 1;
        if (this._particles) this._particles.timeScale = 1;
      }
    },

    update(dt, scene, engine) {
      // Cinematic slow-motion recovery. While held (final invader still alive)
      // the timer doesn't run — we wait for releaseCinematic(). Once released,
      // the explosion beat counts down, then we return to normal.
      if (this._cinematicActive && !this._cinematicHold) {
        this._cinematicTimer -= dt;
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

      // Slow particle debris to match the scene (e.g. the last-kill explosion
      // playing inside the cinematic). Cached on first use.
      if (this._particles === undefined) {
        this._particles = (engine.getSystem && engine.getSystem('ParticleSystem')) ||
          (GF.game && GF.game.particles) || null;
      }
      if (this._particles) this._particles.timeScale = this.timeScale;

      // Smooth zoom return — but not while the cinematic is holding the zoom
      if (!this._cinematicActive && this.zoomTarget !== 1) {
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
