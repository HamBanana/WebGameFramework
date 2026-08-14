// GameFramework/framework/systems/DebugTools.js
// A toggleable developer overlay — press F6 (or cfg.toggleKey) to show/hide.
//
// Renders a scrollable menu panel with two sections:
//   • Universal commands  — work on any framework-backed game (pause, kill all, reset)
//   • Game-specific commands — registered per scene via GF.DebugTools.registerCommands()
//
// The panel can be opened with F6, the 'debugTools' input action, or the ⚙ button
// on the touch control overlay (auto-added when debug is enabled).
//
// Game registration example:
//   GF.DebugTools.registerCommands('Main', [
//     { label: 'Next Level',     fn: (ctx) => { ctx.scene.state.level++; ... } },
//     { label: 'God Mode',       fn: (ctx) => { var p = ctx.scene.world.first('player'); p.data.invincible = true; } },
//     { label: 'Max Lives',      fn: (ctx) => { ctx.scene.world.first('player').data.lives = 99; } },
//     { label: 'Spawn UFO',      fn: (ctx) => { ctx.scene.world.spawn('ufo', 0, 50); } },
//   ]);
//
// Each command callback receives a context object:
//   { scene, engine, world, state }
//
// Added automatically by createGame() when debug is enabled.
// Disable per-game by setting GAME_CONFIG.debugTools: false.

(function (GF) {
  'use strict';

  // ── Global command registry (per scene name) ──────────────────────────────

  /** @type {Object<string, Array<{label:string, fn:Function}>>} */
  GF._debugCommands = GF._debugCommands || {};

  /**
   * Register game-specific debug commands for a scene.
   * @param {string}   sceneName  - scene name (e.g. 'Main', 'Boss')
   * @param {Object[]} commands   - array of { label, fn } objects
   * @returns {GF}
   */
  GF.DebugTools = GF.DebugTools || {};

  GF.DebugTools.registerCommands = function (sceneName, commands) {
    if (!GF._debugCommands[sceneName]) GF._debugCommands[sceneName] = [];
    commands.forEach(function (cmd) {
      GF._debugCommands[sceneName].push(cmd);
    });
    return GF;
  };

  /**
   * Get commands for a specific scene name.
   * @param {string} sceneName
   * @returns {Array}
   */
  GF.DebugTools.getCommands = function (sceneName) {
    return GF._debugCommands[sceneName] || [];
  };

  // ── Universal commands (work on any game using EntityWorld) ────────────────

  /**
   * Add a universal command that works on any framework-backed game.
   * @param {string}   label - display text
   * @param {Function} fn    - callback(ctx) where ctx = { scene, engine, world, state }
   * @returns {GF}
   */
  GF.DebugTools.addUniversal = function (label, fn) {
    if (!GF._debugUniversal) GF._debugUniversal = [];
    GF._debugUniversal.push({ label: label, fn: fn });
    return GF;
  };

  /**
   * Remove all universal commands (added by this call).
   * @returns {GF}
   */
  GF.DebugTools.clearUniversal = function () {
    GF._debugUniversal = [];
    return GF;
  };

  // Pre-register universal commands for games using EntityWorld (GF.GameScene pattern)
  (function () {
    // These are lazily resolved each frame so they always point at live objects
    GF.DebugTools.addUniversal('Pause Game', function (ctx) {
      if (ctx.engine) {
        if (ctx.engine._running) ctx.engine.stop();
        else ctx.engine.start();
      }
    });

    GF.DebugTools.addUniversal('Kill All Aliens', function (ctx) {
      if (ctx.world) {
        ctx.world.byTag('alien').forEach(function (e) { e.destroy(); });
      }
    });

    GF.DebugTools.addUniversal('Kill All Projectiles', function (ctx) {
      if (ctx.world) {
        ctx.world.byTag('shot').forEach(function (e) { e.destroy(); });
        ctx.world.byTag('alienShot').forEach(function (e) { e.destroy(); });
        ctx.world.byTag('bossShot').forEach(function (e) { e.destroy(); });
      }
    });

    GF.DebugTools.addUniversal('Kill All Bosses', function (ctx) {
      if (ctx.world) {
        ctx.world.byTag('boss').forEach(function (e) { e.destroy(); });
        ctx.world.byTag('bossMinion').forEach(function (e) { e.destroy(); });
      }
    });

    GF.DebugTools.addUniversal('Reset Scene', function (ctx) {
      if (ctx.scene && ctx.scene.engine) {
        var mgr = ctx.scene._manager();
        if (mgr) {
          mgr.replace(ctx.scene.sceneName, ctx.scene.engine);
        }
      }
    });

    GF.DebugTools.addUniversal('God Mode', function (ctx) {
      if (ctx.world) {
        var p = ctx.world.first('player');
        if (p) p.data.invincible = true;
      }
    });

    GF.DebugTools.addUniversal('Clear God Mode', function (ctx) {
      if (ctx.world) {
        var p = ctx.world.first('player');
        if (p) p.data.invincible = false;
      }
    });

    GF.DebugTools.addUniversal('Max Lives', function (ctx) {
      if (ctx.world) {
        var p = ctx.world.first('player');
        if (p) p.data.lives = 99;
      }
    });

    GF.DebugTools.addUniversal('Add Score 10K', function (ctx) {
      if (ctx.state) ctx.state.score += 10000;
    });

    GF.DebugTools.addUniversal('Set Score 0', function (ctx) {
      if (ctx.state) ctx.state.score = 0;
    });
  })();

  // ── Watch API ─────────────────────────────────────────────────────────────

  /** @type {Array<{label:string, fn:Function}>} */
  GF._debugWatches = GF._debugWatches || [];

  GF.DebugTools.watch = function (label, fn) {
    GF._debugWatches.push({ label: label, fn: fn });
    return GF;
  };

  GF.DebugTools.clearWatches = function () {
    GF._debugWatches = [];
    return GF;
  };

  GF.DebugTools.removeWatch = function (label) {
    GF._debugWatches = GF._debugWatches.filter(function (w) { return w.label !== label; });
    return GF;
  };

  // ── DebugOverlay (F1) compatibility ──────────────────────────────────────

  GF.DebugTools.showDebugOverlay = function () {
    // Show the existing DebugOverlay panel
    if (GF._debugOverlayInstance) GF._debugOverlayInstance.enabled = true;
  };

  GF.DebugTools.hideDebugOverlay = function () {
    if (GF._debugOverlayInstance) GF._debugOverlayInstance.enabled = false;
  };

  // ── Touch control integration ────────────────────────────────────────────

  /**
   * Add the 🔧 (debug) and ⚙ (tools) buttons to the touch control auto layout.
   * Called automatically by DebugOverlay.init().
   * @param {TouchControls} touch
   */
  GF.DebugTools.addTouchButtons = function (touch) {
    if (!touch) return;
    // 🔧 toggles DebugOverlay (F1), ⚙ toggles DebugTools panel (F6)
    touch.addButton({ id: 'debug',       action: 'debug',       label: '🔧', anchor: 'tr', x: 0, y: 0, mode: 'tap' });
    touch.addButton({ id: 'debugTools',  action: 'debugTools',  label: '⚙',  anchor: 'tr', x: 0, y: 1, mode: 'tap' });
    return touch;
  };

  // ── DebugPanel (F6) — scrollable command menu ───────────────────────────
  // This is the scrollable overlay panel. Separate from the existing
  // GF.DebugOverlay class (F1 physics overlay) defined in DebugOverlay.js.

  /**
   * @param {Object}  cfg
   * @param {string}  cfg.toggleKey - Keyboard code to toggle (default 'F6')
   */
  function DebugPanel(cfg) {
    cfg = cfg || {};
    this.name       = 'DebugPanel';
    this.toggleKey  = cfg.toggleKey || 'F6';
    this.enabled    = false;
    this._watches   = [];
    this._engine    = null;
    this._touch     = null;
  }

  DebugPanel.prototype.init = function (engine) {
    this._engine = engine;
    var self = this;

    // Register keyboard toggles
    window.addEventListener('keydown', function (e) {
      if (e.code === DebugPanel._toggleKey || e.code === 'F1') {
        e.preventDefault();
        self.enabled = !self.enabled;
        console.log('[DebugOverlay] ' + (self.enabled ? 'ON' : 'OFF'));
      }
      if (e.code === DebugPanel._toolsToggleKey || e.code === 'F6') {
        e.preventDefault();
        if (GF._debugToolsPanel) GF._debugToolsPanel.toggle();
      }
      if (e.code === 'F7') {
        e.preventDefault();
        GF.DebugTools._stepFrame = true;
      }
      if (e.code === 'F2') {
        e.preventDefault();
        GF.DebugTools.showDebugOverlay();
      }
      if (e.code === 'F3') {
        e.preventDefault();
        GF.DebugTools.hideDebugOverlay();
      }
    });

    // Register input actions for touch buttons (🔧 = F1 overlay, ⚙ = F6 tools)
    // NOTE: DebugPanel._toggleKey is a static property set after the constructor.
    engine.input.bind('debug', DebugPanel._toggleKey, '⊕');
    engine.input.bind('debugTools', DebugPanel._toolsToggleKey, '⊖');

    // Store references for show/hide and touch polling
    GF._debugOverlayInstance = self;
    GF._debugToolsPanel = engine.debugTools;

    // Add 🔧 (F1 overlay) and ⚙ (F6 tools) buttons to touch controls
    var touch = engine.getSystem && engine.getSystem('TouchControls');
    if (touch) {
      GF.DebugTools.addTouchButtons(touch);
    }

    // Add FPS watch automatically
    self.watch('FPS', function () { return self._engine ? Math.round(self._engine.fps || 0) : '?'; });
    self.watch('Scene', function () {
      var s = self._engine ? (self._engine.scenes ? self._engine.scenes.current : null) : null;
      return s ? (s.sceneName || '?') : 'none';
    });
  };

  DebugPanel.prototype.update = function () {
    var e = this._engine;
    if (!e) return;
    // Poll touch button actions each frame
    if (e.input.wasPressed('debug')) {
      this.enabled = !this.enabled;
      console.log('[DebugOverlay] ' + (this.enabled ? 'ON' : 'OFF'));
    }
    if (e.input.wasPressed('debugTools')) {
      if (GF._debugToolsPanel) GF._debugToolsPanel.toggle();
    }
  };

  DebugPanel.prototype.render = function (ctx, engine) {
    if (!this.enabled) return;
    var e = engine || this._engine;

    // Physics wireframes (if PhysicsSystem exists)
    var physics = null;
    if (e && e._systems) {
      for (var i = 0; i < e._systems.length; i++) {
        if (e._systems[i].name === 'PhysicsSystem') { physics = e._systems[i]; break; }
      }
    }

    if (physics && physics._bodies && physics._bodies.length) {
      ctx.save();
      physics._bodies.forEach(function (b) {
        ctx.strokeStyle = 'rgba(0,255,80,0.85)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        ctx.fillStyle = 'rgba(0,255,80,0.85)';
        ctx.fillRect(b.centerX - 2, b.centerY - 2, 4, 4);
        var scale = 0.05;
        var vx = b.vx * scale, vy = b.vy * scale;
        if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
          ctx.strokeStyle = 'rgba(255,220,0,0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.centerX, b.centerY);
          ctx.lineTo(b.centerX + vx, b.centerY + vy);
          ctx.stroke();
          var angle = Math.atan2(vy, vx);
          var al = 6;
          ctx.beginPath();
          ctx.moveTo(b.centerX + vx, b.centerY + vy);
          ctx.lineTo(b.centerX + vx - al * Math.cos(angle - 0.4), b.centerY + vy - al * Math.sin(angle - 0.4));
          ctx.moveTo(b.centerX + vx, b.centerY + vy);
          ctx.lineTo(b.centerX + vx - al * Math.cos(angle + 0.4), b.centerY + vy - al * Math.sin(angle + 0.4));
          ctx.stroke();
        }
        if (b.grounded) {
          ctx.fillStyle = 'rgba(0,180,255,0.7)';
          ctx.fillRect(b.x, b.bottom - 2, b.width, 2);
        }
      });
      ctx.restore();
    }

    // HUD panel
    var lines = [];
    lines.push('GF debug  [' + this.toggleKey + ']');
    lines.push('FPS: ' + (e ? Math.round(e.fps || 0) : '?'));
    lines.push('Bodies: ' + (physics && physics._bodies ? physics._bodies.length : 0));
    lines.push('Entities: ' + (e ? _countAllEntities(e) : '?'));

    this._watches.forEach(function (w) {
      var val;
      try { val = w.fn(); } catch (_) { val = '!err'; }
      lines.push(w.label + ': ' + val);
    });

    var PAD = 8, LINE_H = 16, PAN_W = 220, PAN_H = lines.length * LINE_H + PAD * 2;
    var PAN_X = 8, PAN_Y = 8;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(PAN_X, PAN_Y, PAN_W, PAN_H);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(PAN_X, PAN_Y, PAN_W, 2);
    ctx.textBaseline = 'top';
    lines.forEach(function (line, i) {
      ctx.font = i === 0 ? 'bold 11px monospace' : '12px monospace';
      ctx.fillStyle = i === 0 ? '#00ff88' : '#ccffee';
      ctx.fillText(line, PAN_X + PAD, PAN_Y + PAD + i * LINE_H);
    });
    ctx.restore();
  };

  DebugPanel.prototype.watch = function (label, fn) {
    this._watches.push({ label: label, fn: fn });
    return this;
  };

  DebugPanel.prototype.clearWatches = function () {
    this._watches = [];
    return this;
  };

  DebugPanel.prototype.removeWatch = function (label) {
    this._watches = this._watches.filter(function (w) { return w.label !== label; });
    return this;
  };

  // ── DebugTools panel (F6) — scrollable command menu ─────────────────────

  GF.DebugTools._stepFrame = false;
  GF.DebugTools._toggleKey = 'F6';
  GF.DebugOverlay._toolsToggleKey = 'F6';
  GF.DebugOverlay._toggleKey = 'F1';

  /** Create the scrollable DebugTools panel overlay. */
  GF.DebugTools.createPanel = function (cfg) {
    cfg = cfg || {};
    var panel = {
      name:          'DebugTools',
      overlay:       true,
      visible:       false,
      toggleKey:     cfg.toggleKey || 'F6',
      _engine:       null,
      _scrollPos:    0,
      _scrollMax:    0,
      _selected:     0,
      _touchButtons: null,
      _prevPhase:    null,
      _panelW:       340,
      _panelH:       420,
      _headerH:      32,
      _sectionGap:   6,
      _lineH:        28,
      _visibleLines: 12,

      toggle: function () {
        this.visible = !this.visible;
        this._scrollPos = 0;
        this._selected = 0;
        if (this.visible) console.log('[DebugTools] ON');
        else console.log('[DebugTools] OFF');
      },

      init: function (engine) {
        this._engine = engine;

        // Keyboard toggle
        var self = this;
        window.addEventListener('keydown', function (e) {
          if (e.code === self.toggleKey) {
            e.preventDefault();
            self.toggle();
          }
          if (!self.visible) return;
          if (e.code === 'ArrowUp') { e.preventDefault(); self._selected = Math.max(0, self._selected - 1); }
          if (e.code === 'ArrowDown') {
            e.preventDefault();
            var max = self._totalLines - 1;
            self._selected = Math.min(max, self._selected + 1);
          }
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            self._executeSelected();
          }
          if (e.code === 'Escape' || e.code === 'KeyP') {
            e.preventDefault();
            self.toggle();
          }
          if (e.code === 'Home') { e.preventDefault(); self._scrollPos = 0; }
          if (e.code === 'End') { e.preventDefault(); self._scrollPos = self._scrollMax; }
        });

        // Mouse/touch support for the panel
        this._setupPointerEvents();
      },

      _setupPointerEvents: function () {
        var self = this;
        var canvas = this._engine && this._engine.canvas;
        if (!canvas) return;

        // Create an invisible overlay div for pointer events on the panel
        var div = document.createElement('div');
        div.id = 'gf-debugtools-overlay';
        div.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;';
        document.body.appendChild(div);
        this._panelDiv = div;

        var panelX, panelY;
        var updatePanelPos = function () {
          if (!canvas || !canvas.getBoundingClientRect) return;
          var rect = canvas.getBoundingClientRect();
          panelX = rect.right - this._panelW;
          panelY = rect.top;
          // Clamp
          if (panelY < 0) panelY = 10;
          if (panelX < 10) panelX = 10;
          div.style.left = panelX + 'px';
          div.style.top = panelY + 'px';
          div.style.width = this._panelW + 'px';
          div.style.height = this._panelH + 'px';
        };
        updatePanelPos.call(this);

        // Resize handler
        window.addEventListener('resize', updatePanelPos.bind(this));

        var hitTest = function (px, py) {
          updatePanelPos.call(self);
          var x = px - panelX;
          var y = py - panelY;
          if (x < 0 || y < 0 || x > self._panelW || y > self._panelH) return null;
          // Header area (first 32px)
          if (y < self._headerH) return { kind: 'header' };
          // Command area
          var contentY = y - self._headerH;
          var scrollY = self._scrollPos;
          var lineIdx = Math.floor((contentY + scrollY) / self._lineH);
          if (lineIdx >= 0 && lineIdx < self._totalLines) return { kind: 'line', index: lineIdx };
          // Scrollbar area (right edge, last 12px)
          if (x > self._panelW - 12) return { kind: 'scrollbar' };
          return null;
        };

        var onDown = function (e) {
          if (!self.visible) return;
          var target = hitTest(e.clientX, e.clientY);
          if (!target) { self.toggle(); return; }
          if (target.kind === 'line') {
            self._selected = target.index;
            self._executeSelected();
          }
          if (target.kind === 'scrollbar') {
            self._dragging = true;
          }
          if (target.kind === 'header') {
            self.toggle();
          }
        };

        var onMove = function (e) {
          if (!self._dragging) return;
          var dy = e.clientY - panelY;
          var contentH = self._visibleLines * self._lineH;
          var scrollH = contentH - self._panelH + self._headerH;
          if (scrollH <= 0) return;
          var ratio = Math.max(0, Math.min(1, (dy - self._headerH) / self._panelH));
          self._scrollPos = Math.round(ratio * self._scrollMax);
        };

        var onUp = function () { self._dragging = false; };

        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        this._pointerCleanup = function () {
          window.removeEventListener('pointerdown', onDown);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
      },

      update: function (dt, engine) {
        // Step frame on F7 press (single frame advance)
        if (GF.DebugTools._stepFrame) {
          GF.DebugTools._stepFrame = false;
          // Engine will step next frame via a flag
          if (engine && engine._stepNext) engine._stepNext = true;
        }
      },

      render: function (ctx, engine) {
        if (!this.visible) return;
        this._renderPanel(ctx);
      },

      _renderPanel: function (ctx) {
        var W = this._panelW, H = this._panelH;
        var panelX, panelY;

        // Position panel on the right side of the canvas
        var canvas = this._engine && this._engine.canvas;
        if (canvas && canvas.getBoundingClientRect) {
          var rect = canvas.getBoundingClientRect();
          panelX = Math.max(10, rect.right - W);
          panelY = Math.max(10, rect.top);
          if (panelX + W > window.innerWidth) panelX = 10;
        } else {
          panelX = Math.max(10, (window.innerWidth || 800) - W);
          panelY = 10;
        }

        ctx.save();
        ctx.translate(panelX, panelY);

        // Panel background
        ctx.fillStyle = 'rgba(10,10,20,0.92)';
        ctx.strokeStyle = 'rgba(0,229,255,0.3)';
        ctx.lineWidth = 1;

        // Rounded rect
        var r = 6;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(W - r, 0);
        ctx.quadraticCurveTo(W, 0, W, r);
        ctx.lineTo(W, H - r);
        ctx.quadraticCurveTo(W, H, W - r, H);
        ctx.lineTo(r, H);
        ctx.quadraticCurveTo(0, H, 0, H - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ── Header ────────────────────────────────────────────────────────
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('⚙ DEBUG TOOLS  [' + this.toggleKey + ']', 10, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '10px monospace';
        ctx.fillText('↑↓ select  enter execute  esc close', 10, 20);

        // ── Separator ─────────────────────────────────────────────────────
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(0, this._headerH);
        ctx.lineTo(W, this._headerH);
        ctx.stroke();

        // ── Build visible lines ───────────────────────────────────────────
        this._buildLines();
        var lines = this._visibleLinesArr || [];
        this._totalLines = lines.length;

        // Clamp scroll
        var maxScroll = Math.max(0, lines.length - this._visibleLines);
        if (this._scrollPos > maxScroll) this._scrollPos = maxScroll;
        this._scrollMax = maxScroll;
        if (this._selected < 0) this._selected = 0;
        if (this._selected >= lines.length) this._selected = lines.length - 1;

        // Clamp selection to visible area
        if (this._selected < this._scrollPos) this._scrollPos = this._selected;
        if (this._selected >= this._scrollPos + this._visibleLines) this._scrollPos = this._selected - this._visibleLines + 1;

        // ── Section header rendering ──────────────────────────────────────
        var sectionColors = {
          'universal': '#00e5ff',
          'game': '#ffcc00',
          'watch': '#44ff88',
        };

        // Draw lines
        var startLine = this._scrollPos;
        var endLine = Math.min(startLine + this._visibleLines, lines.length);

        for (var i = startLine; i < endLine; i++) {
          var line = lines[i];
          var ly = this._headerH + (i - startLine) * this._lineH;
          var isSelected = (i === this._selected);

          if (line.type === 'separator') {
            // Section divider
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(0, ly, W, this._lineH);
            ctx.fillStyle = sectionColors[line.section] || '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(('◆ ' + line.label).toUpperCase(), 10, ly + 4);
            continue;
          }

          if (line.type === 'watch') {
            // Watch line
            ctx.fillStyle = 'rgba(68,255,136,0.7)';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(line.label + ': ' + line.value, 10, ly + 4);
            continue;
          }

          if (line.type === 'command') {
            // Command line
            if (isSelected) {
              ctx.fillStyle = 'rgba(0,229,255,0.15)';
              ctx.fillRect(0, ly, W, this._lineH);
              ctx.fillStyle = '#00e5ff';
              ctx.font = 'bold 13px monospace';
            } else {
              ctx.fillStyle = 'rgba(255,255,255,0.75)';
              ctx.font = '12px monospace';
            }
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('▸ ' + line.label, 10, ly + 4);
            continue;
          }
        }

        // ── Scrollbar ─────────────────────────────────────────────────────
        if (lines.length > this._visibleLines) {
          var sbW = 8, sbX = W - sbW;
          var contentH = this._visibleLines * this._lineH;
          var scrollThumbH = Math.max(20, (contentH / lines.length) * contentH);
          var scrollTrackH = contentH;
          var scrollY = this._headerH + (this._scrollPos / maxScroll) * (scrollTrackH - scrollThumbH);

          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(sbX, this._headerH, sbW, scrollTrackH);
          ctx.fillStyle = 'rgba(0,229,255,0.5)';
          ctx.fillRect(sbX + 1, scrollY, sbW - 2, scrollThumbH);
        }

        // ── Execution flash ───────────────────────────────────────────────
        if (this._flashTimer > 0) {
          var flashAlpha = this._flashTimer;
          ctx.fillStyle = 'rgba(0,229,255,' + (flashAlpha * 0.3) + ')';
          ctx.fillRect(0, 0, W, H);
          this._flashTimer -= dt;
        }

        ctx.restore();
      },

      _buildLines: function () {
        this._visibleLinesArr = [];
        var scene = this._currentScene();
        var engine = this._engine;
        var world = scene ? scene.world : null;
        var state = scene ? scene.state : null;
        var sceneName = scene ? scene.sceneName : 'none';

        // ── Section: WATCHES ──────────────────────────────────────────────
        this._visibleLinesArr.push({ type: 'separator', label: 'Watches', section: 'watch' });

        // Auto-watches from the scene
        if (state) {
          this._visibleLinesArr.push({
            type: 'watch',
            label: 'Score',
            value: state.score != null ? state.score : '—',
          });
          this._visibleLinesArr.push({
            type: 'watch',
            label: 'Level',
            value: state.level != null ? state.level : '—',
          });
          this._visibleLinesArr.push({
            type: 'watch',
            label: 'Phase',
            value: scene ? scene.phase : '—',
          });
          this._visibleLinesArr.push({
            type: 'watch',
            label: 'Phase (scene)',
            value: scene ? scene.phase : '—',
          });

          // Count entities by tag
          if (world) {
            var tags = ['alien', 'player', 'boss', 'ufo', 'powerup', 'shot', 'alienShot', 'bossMinion', 'bunker'];
            for (var t = 0; t < tags.length; t++) {
              var cnt = world.count(tags[t]);
              if (cnt > 0) {
                this._visibleLinesArr.push({
                  type: 'watch',
                  label: tags[t] + 's',
                  value: cnt,
                });
              }
            }
          }
        }

        // Custom watches from GF._debugWatches
        if (GF._debugWatches) {
          for (var w = 0; w < GF._debugWatches.length; w++) {
            var wc = GF._debugWatches[w];
            var val;
            try { val = wc.fn(); } catch (_) { val = '!err'; }
            this._visibleLinesArr.push({ type: 'watch', label: wc.label, value: val });
          }
        }

        // ── Section: UNIVERSAL COMMANDS ───────────────────────────────────
        this._visibleLinesArr.push({ type: 'separator', label: 'Universal', section: 'universal' });

        var universalCmds = GF._debugUniversal || [];
        for (var u = 0; u < universalCmds.length; u++) {
          this._visibleLinesArr.push({
            type: 'command',
            label: universalCmds[u].label,
            fn: universalCmds[u].fn,
            ctx: { scene: scene, engine: engine, world: world, state: state },
          });
        }

        // ── Section: GAME COMMANDS ────────────────────────────────────────
        var gameCmds = GF.DebugTools.getCommands(sceneName);
        if (gameCmds && gameCmds.length > 0) {
          this._visibleLinesArr.push({ type: 'separator', label: 'Game: ' + sceneName, section: 'game' });
          for (var g = 0; g < gameCmds.length; g++) {
            this._visibleLinesArr.push({
              type: 'command',
              label: gameCmds[g].label,
              fn: gameCmds[g].fn,
              ctx: { scene: scene, engine: engine, world: world, state: state },
            });
          }
        }

        // If no game commands for this scene, still show the section with a note
        if (!gameCmds || gameCmds.length === 0) {
          this._visibleLinesArr.push({ type: 'separator', label: 'Game: ' + sceneName, section: 'game' });
          this._visibleLinesArr.push({ type: 'command', label: '(none registered)', fn: null, ctx: null });
        }

        // ── Section: DEBUG HELP ───────────────────────────────────────────
        this._visibleLinesArr.push({ type: 'separator', label: 'Debug', section: 'universal' });
        this._visibleLinesArr.push({ type: 'command', label: 'Toggle Debug Overlay (F1)', fn: function () { GF.DebugTools.showDebugOverlay(); } });
        this._visibleLinesArr.push({ type: 'command', label: 'Toggle Pause (F5)', fn: function () {
          var e = engine; if (!e && scene) e = scene.engine;
          if (e && e._running) e.stop(); else if (e) e.start();
        }});
      },

      _currentScene: function () {
        if (!this._engine) return null;
        // Try scenes system
        var scenes = this._engine.scenes || this._engine.getSystem && this._engine.getSystem('SceneManager');
        if (scenes && scenes.current) return scenes.current;
        // Try GF.game
        if (GF.game && GF.game.scenes && GF.game.scenes.current) return GF.game.scenes.current;
        return null;
      },

      _executeSelected: function () {
        if (this._selected < 0 || this._totalLines <= 0) return;
        var lines = this._visibleLinesArr;
        if (!lines || this._selected >= lines.length) return;
        var line = lines[this._selected];
        if (!line || line.type !== 'command' || !line.fn) return;

        try {
          line.fn(line.ctx);
        } catch (err) {
          console.error('[DebugTools] Command "' + line.label + '" failed:', err);
        }

        // Flash effect
        this._flashTimer = 0.3;

        // Scroll to show the executed line
        this._selected = this._selected;
      },

      destroy: function () {
        if (this._pointerCleanup) this._pointerCleanup();
      },
    };

    // Touch button for toggling (⚙)
    panel.addButton = function (touch) {
      if (!touch) return;
      var self = this;
      touch.addButton({
        id: 'debugTools',
        action: 'debugTools',
        label: '⚙',
        anchor: 'tr',
        x: 0,
        y: 1,
        mode: 'tap',
        onTap: function () { self.toggle(); },
      });
      return touch;
    };

    return panel;
  };

  // ── Register with GF namespace ───────────────────────────────────────────

  GF.DebugTools.Panel = DebugPanel;

  // Expose for external use
  window.GF = GF;
  window.GF.DebugTools = GF.DebugTools;

})(window.GF = window.GF || {});

function _countAllEntities(engine) {
  if (!engine) return '?';
  // Check for EntityWorld systems
  if (engine.scenes && engine.scenes.current && engine.scenes.current.world) {
    var w = engine.scenes.current.world;
    var total = 0;
    for (var i = 0; i < w._objs.length; i++) {
      if (w._objs[i].alive) total++;
    }
    return total;
  }
  return '?';
}
