// GameFramework/framework/systems/DialogueSystem.js
// Script sequencer for text panels, speaker portraits, and timed events.
//
// A dialogue script is an array of step objects:
//
//   { type: 'text',  speaker: 'Claude',  portrait: 'claude_idle',
//     text: 'Hello, adventurer!',  duration: 2 }   // auto-advances after 2 s
//
//   { type: 'text',  text: 'Narration — no speaker box.' }
//
//   { type: 'pause', duration: 1.5 }               // silent wait, then continues
//
//   { type: 'event', id: 'boss_intro' }             // fires 'dialogue:event' on EventBus
//                                                   // and immediately continues
//
// Text steps with no duration wait for the player to press the advance action
// (default: 'interact').  Pressing advance while the typewriter is mid-way
// through instantly completes it; a second press advances.
//
// Portrait images:
//   Supply a getPortrait callback in cfg, or register images via addPortrait().
//   The callback receives the portrait string from the script step and should
//   return an HTMLImageElement (or null).
//
// EventBus events emitted:
//   'dialogue:start'    — when start() is called
//   'dialogue:advance'  — on each text step  { index, step }
//   'dialogue:event'    — on event steps      { id, step }
//   'dialogue:end'      — when the script finishes or stop() is called

(function (GF) {
  'use strict';

  class DialogueSystem {
    /**
     * @param {Object}   cfg
     * @param {string}   cfg.advanceKey     - input action bound in InputManager (default 'interact')
     * @param {number}   cfg.typeSpeed      - chars/second typewriter effect; 0 = instant (default 40)
     * @param {Function} cfg.getPortrait    - (name: string) => HTMLImageElement | null
     * @param {Object}   cfg.box            - style overrides for the dialogue box
     */
    constructor(cfg = {}) {
      this.name       = 'DialogueSystem';
      this.advanceKey = cfg.advanceKey || 'interact';
      this.typeSpeed  = cfg.typeSpeed  !== undefined ? cfg.typeSpeed : 40;

      this._getPortraitCb = cfg.getPortrait || null;
      this._portraits     = {}; // name -> HTMLImageElement, registered via addPortrait()

      // ── Box style ─────────────────────────────────────────────────────────
      this.box = Object.assign({
        x:            40,
        y:            340,
        width:        720,
        height:       110,
        padding:      16,
        radius:       8,
        fillStyle:    'rgba(10,10,30,0.93)',
        strokeStyle:  '#4488ff',
        lineWidth:    2,
        font:         '16px sans-serif',
        textColor:    '#ffffff',
        speakerFont:  'bold 14px sans-serif',
        speakerColor: '#88bbff',
        lineHeight:   22,
        portraitSize: 78,
      }, cfg.box || {});

      // ── State ─────────────────────────────────────────────────────────────
      this._script    = [];
      this._index     = -1;
      this._current   = null;
      this._visible   = '';   // typewriter: currently shown portion of text
      this._typeTimer = 0;
      this._autoTimer = 0;
      this._events    = null; // GF.EventBus

      /** True while a script is running. */
      this.isActive = false;
    }

    // ── System interface ────────────────────────────────────────────────────

    init(engine) {
      this._events = engine ? engine.events : null;
    }

    // ── Portrait helpers ────────────────────────────────────────────────────

    /**
     * Register a portrait image by name.
     * Alternatively supply cfg.getPortrait for dynamic lookups.
     * @param {string}           name
     * @param {HTMLImageElement} img
     */
    addPortrait(name, img) {
      this._portraits[name] = img;
      return this;
    }

    _resolvePortrait(name) {
      if (!name) return null;
      if (this._portraits[name]) return this._portraits[name];
      if (this._getPortraitCb)   return this._getPortraitCb(name);
      return null;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /**
     * Start playing a dialogue script.
     * @param {Array} script - array of step objects (see module header)
     * @returns {this}
     */
    start(script) {
      this._script  = Array.isArray(script) ? script : [];
      this._index   = -1;
      this.isActive = this._script.length > 0;
      if (this.isActive) {
        this._emit('dialogue:start');
        this._step();
      }
      return this;
    }

    /**
     * Advance to the next step.
     * If the typewriter is still running, completes it instead.
     */
    next() {
      if (!this.isActive) return;
      const step = this._current;
      if (step && step.type === 'text') {
        const full = step.text || '';
        if (this._visible.length < full.length) {
          // Complete typewriter
          this._visible = full;
          return;
        }
      }
      this._step();
    }

    /**
     * Immediately end the dialogue without finishing the script.
     */
    stop() {
      this._current = null;
      this.isActive = false;
      this._emit('dialogue:end');
    }

    // ── Internal sequencer ──────────────────────────────────────────────────

    _step() {
      this._index++;
      if (this._index >= this._script.length) {
        this.stop();
        return;
      }

      const step = this._script[this._index];
      this._current   = step;
      this._typeTimer = 0;
      this._autoTimer = 0;
      this._visible   = '';

      const type = step.type || 'text';

      if (type === 'event') {
        this._emit('dialogue:event', { id: step.id, step });
        this._step(); // event steps don't pause
        return;
      }

      if (type === 'text') {
        this._emit('dialogue:advance', { index: this._index, step });
        if (!this.typeSpeed) this._visible = step.text || '';
      }
      // 'pause' steps just wait for _autoTimer
    }

    _emit(name, detail) {
      if (this._events) this._events.emit(name, detail);
    }

    // ── Update ──────────────────────────────────────────────────────────────

    update(dt, engine) {
      if (!this.isActive || !this._current) return;

      const step = this._current;
      const type = step.type || 'text';

      // Advance key
      const input = engine && engine.input;
      if (input && input.wasPressed(this.advanceKey)) {
        this.next();
        return;
      }

      if (type === 'text') {
        // Typewriter
        const full = step.text || '';
        if (this.typeSpeed && this._visible.length < full.length) {
          this._typeTimer += dt;
          const charsToShow = Math.floor(this._typeTimer * this.typeSpeed);
          this._visible = full.slice(0, Math.min(charsToShow, full.length));
        }

        // Auto-advance when text is complete and duration is set
        if (step.duration !== undefined && this._visible.length >= (step.text || '').length) {
          this._autoTimer += dt;
          if (this._autoTimer >= step.duration) this._step();
        }
      }

      if (type === 'pause') {
        this._autoTimer += dt;
        if (this._autoTimer >= (step.duration || 1)) this._step();
      }
    }

    // ── Render ──────────────────────────────────────────────────────────────

    render(ctx) {
      if (!this.isActive || !this._current) return;
      const step = this._current;
      if ((step.type || 'text') !== 'text') return;

      const b   = this.box;
      const pad = b.padding;

      ctx.save();

      // ── Box ───────────────────────────────────────────────────────────────
      ctx.fillStyle   = b.fillStyle;
      ctx.strokeStyle = b.strokeStyle;
      ctx.lineWidth   = b.lineWidth;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(b.x, b.y, b.width, b.height, b.radius);
      } else {
        // Fallback for older browsers
        ctx.rect(b.x, b.y, b.width, b.height);
      }
      ctx.fill();
      ctx.stroke();

      // ── Portrait ──────────────────────────────────────────────────────────
      let textX = b.x + pad;
      const portrait = this._resolvePortrait(step.portrait);
      if (portrait) {
        const ps = b.portraitSize;
        const py = b.y + (b.height - ps) / 2;
        ctx.drawImage(portrait, b.x + pad, py, ps, ps);
        textX += ps + pad;
      }

      let textY = b.y + pad;

      // ── Speaker name ──────────────────────────────────────────────────────
      if (step.speaker) {
        ctx.font        = b.speakerFont;
        ctx.fillStyle   = b.speakerColor;
        ctx.textBaseline = 'top';
        ctx.fillText(step.speaker, textX, textY);
        textY += b.lineHeight;
      }

      // ── Body text (word-wrapped) ───────────────────────────────────────────
      ctx.font        = b.font;
      ctx.fillStyle   = b.textColor;
      ctx.textBaseline = 'top';

      const maxTextWidth = b.width - (textX - b.x) - pad;
      this._wrapText(ctx, this._visible, textX, textY, maxTextWidth, b.lineHeight);

      // ── Advance indicator (blinking ▼) ────────────────────────────────────
      const full     = step.text || '';
      const textDone = !this.typeSpeed || this._visible.length >= full.length;
      const hasAuto  = step.duration !== undefined;

      if (textDone && !hasAuto) {
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
          ctx.font      = '13px sans-serif';
          ctx.fillStyle = b.speakerColor;
          ctx.fillText('▼', b.x + b.width - pad - 10, b.y + b.height - pad - 13);
        }
      }

      ctx.restore();
    }

    // ── Text utility ────────────────────────────────────────────────────────

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      if (!text) return;
      const words = text.split(' ');
      let line = '';
      let cy   = y;

      for (let i = 0; i < words.length; i++) {
        const test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line !== '') {
          ctx.fillText(line, x, cy);
          line = words[i];
          cy  += lineHeight;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, cy);
    }
  }

  GF.DialogueSystem = DialogueSystem;

})(window.GF = window.GF || {});
