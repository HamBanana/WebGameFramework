// games/Acca/systems/TheManNarrator.js — Planning §E.2
// "The Man" narrator: watches the event bus and pops a portrait + speech
// bubble in the notifications area when something dramatic happens. Sprite
// at Sprites/Portraits/TheMan/spritesheet.png, registered as
// `GF.portraits.theMan` (8 columns × 7 rows of 96×96 frames). Animation rows:
// idle, laughing, crying, angry, sad, talking, shouting.
//
// Per the design constraint in 21_Bugs.md: "He is the ultimate enemy, but
// will not show anger or sadness, until he is threatened or defeated." The
// narrator gates `angry` on cooperative threat ≥ a threshold and reserves
// `sad` / `crying` for the loss/threat end-states.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  const ROWS = ['idle', 'laughing', 'crying', 'angry', 'sad', 'talking', 'shouting'];
  const FRAMES_PER_ROW = 8;
  const FRAME_W = 96;
  const FRAME_H = 96;

  class TheManNarrator {
    constructor(game) {
      this.game = game;
      this.cfg  = (game.cfg && game.cfg.theMan) || {};
      this.enabled = this.cfg.enabled !== false; // default on
      if (!this.enabled) return;

      this._buildDOM();
      this._wire();
      this._lastTimeMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      this._raf = (window.requestAnimationFrame || window.setTimeout).bind(window);
      this._tick = this._tick.bind(this);
      this._raf(this._tick);
    }

    _buildDOM() {
      const wrap = document.createElement('div');
      wrap.id = 'the-man';
      wrap.style.cssText = [
        'position:fixed', 'right:16px', 'top:160px',
        'width:96px', 'height:96px',
        'display:none', 'z-index:1000', 'pointer-events:none',
      ].join(';');

      const canvas = document.createElement('canvas');
      canvas.width  = FRAME_W;
      canvas.height = FRAME_H;
      canvas.style.cssText = 'image-rendering:pixelated;border-radius:6px;background:rgba(0,0,0,0.4);';
      wrap.appendChild(canvas);

      const bubble = document.createElement('div');
      bubble.id = 'the-man-bubble';
      bubble.style.cssText = [
        'position:absolute', 'top:8px', 'right:104px', 'max-width:220px',
        'background:rgba(15,8,8,0.92)', 'color:#f4e8d8',
        'padding:8px 12px', 'border-radius:10px',
        'border:1px solid #6a3a3a',
        'font:13px monospace', 'opacity:0',
        'transition:opacity 0.3s ease',
        'pointer-events:none',
      ].join(';');
      wrap.appendChild(bubble);

      document.body.appendChild(wrap);
      this.dom = { wrap, canvas, ctx: canvas.getContext('2d'), bubble };
      this.row     = 0;
      this.frame   = 0;
      this._frameTimer = 0;
      this._holdTimer  = 0;
    }

    _wire() {
      const game = this.game;
      const E = game.engine && game.engine.events;
      if (!E) return;
      E.on('player:bankrupted', () => this._react('bankrupt'));
      E.on('roll:done', (data) => {
        if (data && data.value === 1) this._react('roll1');
      });
      E.on('trade:completed',   () => this._react('trade'));
      E.on('business:sabotaged',() => this._react('sabotage'));
      E.on('game:won',          () => this._react('win'));
      E.on('cooperative:lost',  () => this._react('lost'));
    }

    /** Pick the emotion + line for a trigger key and show the portrait.
     *  Gating: `angry` requires `game.cooperativeThreat` to exceed
     *  `threatThreshold × cooperativeThreatCap` (defaults: 0.8). `sad` is
     *  reserved for the cooperative loss state and only fires on the
     *  `lost` trigger. Other emotions are unrestricted. */
    _react(trigger) {
      const triggers = this.cfg.triggers || DEFAULT_TRIGGERS;
      const trig = triggers[trigger];
      if (!trig) return;
      const emotion = trig.emotion || 'idle';
      const line    = trig.line || '';

      if (emotion === 'angry') {
        const threshold = (this.cfg.threatThreshold != null) ? this.cfg.threatThreshold : 0.8;
        const cap       = this.game.cooperativeThreatCap || 100;
        const cur       = this.game.cooperativeThreat   || 0;
        if (cur < threshold * cap) return;
      }
      if (emotion === 'sad' && trigger !== 'lost') return;

      this._show(emotion, line);
    }

    _show(emotion, line) {
      const r = ROWS.indexOf(emotion);
      if (r < 0) return;
      this.row   = r;
      this.frame = 0;
      this._frameTimer = 0;
      this._holdTimer  = (this.cfg.duration != null) ? this.cfg.duration : 3.0;
      this.dom.wrap.style.display = 'block';
      if (line) {
        this.dom.bubble.textContent = line;
        this.dom.bubble.style.opacity = '1';
      } else {
        this.dom.bubble.style.opacity = '0';
      }
      this._draw();
    }

    _tick(t) {
      const now = (typeof t === 'number') ? t : performance.now();
      const dt  = Math.min(0.1, Math.max(0, (now - this._lastTimeMs) / 1000));
      this._lastTimeMs = now;

      if (this._holdTimer > 0) {
        this._holdTimer -= dt;
        this._frameTimer -= dt;
        if (this._frameTimer <= 0) {
          this.frame = (this.frame + 1) % FRAMES_PER_ROW;
          this._frameTimer = 0.14;
          this._draw();
        }
        if (this._holdTimer <= 0) {
          this.dom.wrap.style.display   = 'none';
          this.dom.bubble.style.opacity = '0';
        }
      }

      this._raf(this._tick);
    }

    _draw() {
      const sheet = (window.GF && window.GF.portraits && window.GF.portraits.theMan);
      if (!sheet || !sheet.complete || !sheet.naturalWidth) return;
      const ctx = this.dom.ctx;
      ctx.clearRect(0, 0, FRAME_W, FRAME_H);
      ctx.drawImage(
        sheet,
        this.frame * FRAME_W, this.row * FRAME_H, FRAME_W, FRAME_H,
        0, 0, FRAME_W, FRAME_H
      );
    }
  }

  const DEFAULT_TRIGGERS = {
    bankrupt:  { emotion: 'laughing', line: 'One down.' },
    roll1:     { emotion: 'laughing', line: 'Pathetic.' },
    trade:     { emotion: 'talking',  line: 'A handshake means nothing.' },
    sabotage:  { emotion: 'shouting', line: 'Burn it down!' },
    win:       { emotion: 'crying',   line: 'Impossible…' },
    lost:      { emotion: 'sad',      line: '' },
  };

  GF.Acca.TheManNarrator = TheManNarrator;
  GF.Acca._theManDefaultTriggers = DEFAULT_TRIGGERS;

})(window.GF = window.GF || {});
