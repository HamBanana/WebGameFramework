// GameFramework/games/ModelDemo/ModelDemoGame.js
// GLB Model Showcase — lets you import .glb files from your filesystem,
// rotate/zoom with orbit controls, switch animations, change lighting, etc.
//
// Depends on: GameFramework.bundle.js (with ModelSystem), config.js
// Three.js + GLTFLoader + OrbitControls must be loaded first (see index.html).

(function () {
  'use strict';

  // ─── Showcase Scene ────────────────────────────────────────────────────────

  class ShowcaseScene {
    init(engine) {
      this._engine   = engine;
      this._models   = engine.getSystem('models');
      this._ui       = GF.UISystem;
      this._panel    = null;
      this._fileInput = null;
      this._dropOverlay = null;

      this._isDraggingOver = false;
      this._statusMsg = 'Import a .glb file to get started';
      this._statusTimer = 0;

      this._createPanel();
      this._createDropOverlay();
      this._updatePanel();
    }

    enter(engine)   {}
    exit(engine)    {}
    destroy(engine) {}

    // ─── HTML Panel ──────────────────────────────────────────────────────────

    _createPanel() {
      // Remove existing panel if present
      const existing = document.getElementById('gf-model-panel');
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = 'gf-model-panel';
      panel.style.cssText = [
        'position:absolute', 'top:0', 'left:0', 'width:240px', 'height:100%',
        'background:rgba(12,12,20,0.88)', 'border-right:1px solid rgba(100,100,180,0.3)',
        'backdrop-filter:blur(8px)', 'z-index:10', 'overflow-y:auto',
        'font-family:"Segoe UI",system-ui,sans-serif', 'color:#ccd', 'font-size:13px',
        'box-sizing:border-box', 'padding:16px 14px 24px',
        'user-select:none',
      ].join(';');

      panel.innerHTML = this._panelHTML();

      // Attach to canvas parent
      const parent = document.getElementById('gameCanvas').parentElement || document.body;
      parent.appendChild(panel);
      this._panel = panel;

      // Wire up the hidden file input
      this._fileInput = document.createElement('input');
      this._fileInput.type     = 'file';
      this._fileInput.accept   = '.glb,.gltf';
      this._fileInput.multiple = true;
      this._fileInput.style.display = 'none';
      this._fileInput.addEventListener('change', e => this._onFilesSelected(e.target.files));
      document.body.appendChild(this._fileInput);

      // Button events
      this._bindPanelEvents();
    }

    _panelHTML() {
      return `
        <div style="margin-bottom:16px;border-bottom:1px solid rgba(100,100,180,0.25);padding-bottom:12px;">
          <div style="font-size:15px;font-weight:700;color:#aabbff;letter-spacing:1px;margin-bottom:4px;">
            ◈ MODEL DEMO
          </div>
          <div style="font-size:10px;color:#667;letter-spacing:0.5px;">GameFramework showcase</div>
        </div>

        <!-- Mode toggle -->
        <div class="gf-section-label" style="${SECTION_LABEL}">MODE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:14px;">
          <button data-mode="orbit" style="${BTN_SMALL} background:rgba(60,80,140,0.6);">⟳ Orbit</button>
          <button data-mode="walk"  style="${BTN_SMALL}">🚶 Walk</button>
        </div>

        <!-- Import -->
        <button id="gf-import-btn" style="${BTN_PRIMARY}">
          ＋ Import GLB…
        </button>
        <div style="font-size:10px;color:#556;margin:6px 0 10px;text-align:center;">
          or drag &amp; drop onto the viewport
        </div>

        <!-- Presets -->
        <div class="gf-section-label" style="${SECTION_LABEL}">PRESET MODELS</div>
        <div id="gf-preset-row" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px;">
          <!-- buttons injected from registered presets -->
        </div>

        <!-- Model List -->
        <div class="gf-section-label" style="${SECTION_LABEL}">LOADED MODELS</div>
        <div id="gf-model-list" style="margin-bottom:14px;min-height:28px;">
          <div style="color:#445;font-size:11px;padding:4px 0;">None loaded yet</div>
        </div>

        <!-- Animations -->
        <div class="gf-section-label" style="${SECTION_LABEL}">ANIMATIONS</div>
        <div id="gf-anim-list" style="margin-bottom:14px;min-height:28px;">
          <div style="color:#445;font-size:11px;padding:4px 0;">—</div>
        </div>

        <!-- Lighting -->
        <div class="gf-section-label" style="${SECTION_LABEL}">LIGHTING</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:14px;">
          <button data-light="studio"   style="${BTN_SMALL} background:rgba(60,80,140,0.6);">Studio</button>
          <button data-light="outdoor"  style="${BTN_SMALL}">Outdoor</button>
          <button data-light="dramatic" style="${BTN_SMALL}">Dramatic</button>
          <button data-light="flat"     style="${BTN_SMALL}">Flat</button>
        </div>

        <!-- Toggles -->
        <div class="gf-section-label" style="${SECTION_LABEL}">VIEW</div>
        <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:14px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="gf-toggle-grid" checked style="accent-color:#6688ff;">
            Grid
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="gf-toggle-wire" style="accent-color:#6688ff;">
            Wireframe
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="gf-toggle-axes" style="accent-color:#6688ff;">
            Axes helper
          </label>
        </div>

        <!-- Background -->
        <div class="gf-section-label" style="${SECTION_LABEL}">BACKGROUND</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
          ${BG_PRESETS.map(p =>
            `<button data-bg="${p.hex}" title="${p.label}" style="${BTN_COLOR}background:${p.css};"></button>`
          ).join('')}
        </div>

        <!-- Camera -->
        <button id="gf-reset-cam" style="${BTN_SECONDARY}">⟳ Reset Camera</button>
      `;
    }

    _bindPanelEvents() {
      const p = this._panel;

      // Import button
      p.querySelector('#gf-import-btn').addEventListener('click', () => {
        this._fileInput.value = '';
        this._fileInput.click();
      });

      // Mode toggle
      p.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.mode;
          this._models.setMode(mode);
          p.querySelectorAll('[data-mode]').forEach(b => {
            b.style.background = 'rgba(30,30,60,0.6)';
          });
          btn.style.background = 'rgba(60,80,140,0.6)';
          this._updatePanel();
        });
      });

      // Preset model loaders
      const presetRow = p.querySelector('#gf-preset-row');
      const presetNames = (window.GF && GF.ModelSystem && GF.ModelSystem.listPresets)
        ? GF.ModelSystem.listPresets() : [];
      if (presetNames.length === 0) {
        presetRow.innerHTML =
          '<div style="color:#445;font-size:11px;">No presets registered</div>';
      } else {
        presetRow.innerHTML = presetNames.map(n =>
          `<button data-preset="${_esc(n)}" style="${BTN_SMALL} flex:1 1 auto;">${_esc(n)}</button>`
        ).join('');
        presetRow.querySelectorAll('[data-preset]').forEach(btn => {
          btn.addEventListener('click', () => {
            const name = btn.dataset.preset;
            // Avoid double-loading
            if (this._models.getModelNames().indexOf(name) !== -1) {
              this._setStatus(`"${name}" already loaded`);
              this._models.showModel(name);
              this._updatePanel();
              return;
            }
            this._setStatus(`Loading preset "${name}"…`);
            this._models.loadPreset(name)
              .then(data => {
                this._setStatus(`Loaded "${data.name}"  (${data.meshCount} meshes, ${data.matCount} materials)`);
                this._models.showModel(data.name);
                this._updatePanel();
              })
              .catch(err => {
                this._setStatus(`Failed to load "${name}": ${err.message || err}`);
              });
          });
        });
      }

      // Lighting buttons
      p.querySelectorAll('[data-light]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._models.setLighting(btn.dataset.light);
          p.querySelectorAll('[data-light]').forEach(b => {
            b.style.background = 'rgba(30,30,60,0.6)';
          });
          btn.style.background = 'rgba(60,80,140,0.6)';
        });
      });

      // Toggle: grid
      p.querySelector('#gf-toggle-grid').addEventListener('change', e => {
        this._models.showGrid(e.target.checked);
      });

      // Toggle: wireframe
      p.querySelector('#gf-toggle-wire').addEventListener('change', e => {
        this._models.setWireframe(e.target.checked);
      });

      // Toggle: axes
      p.querySelector('#gf-toggle-axes').addEventListener('change', e => {
        this._models.showAxes(e.target.checked);
      });

      // Background presets
      p.querySelectorAll('[data-bg]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._models.setBackground(parseInt(btn.dataset.bg, 16));
        });
      });

      // Reset camera
      p.querySelector('#gf-reset-cam').addEventListener('click', () => {
        this._models.resetCamera();
      });
    }

    // ─── Drag & Drop Overlay ─────────────────────────────────────────────────

    _createDropOverlay() {
      const parent = document.getElementById('gameCanvas').parentElement || document.body;

      const overlay = document.createElement('div');
      overlay.id = 'gf-drop-overlay';
      overlay.style.cssText = [
        'position:absolute', 'inset:0', 'z-index:20',
        'display:none', 'align-items:center', 'justify-content:center',
        'background:rgba(20,20,60,0.75)',
        'border:3px dashed rgba(100,130,255,0.8)',
        'font-family:"Segoe UI",system-ui,sans-serif',
        'color:#aabbff', 'font-size:22px', 'font-weight:600',
        'pointer-events:none',
        'letter-spacing:1px',
      ].join(';');
      overlay.textContent = '⬇  Drop GLB files here';
      parent.appendChild(overlay);
      this._dropOverlay = overlay;

      // Drag events on the parent container
      parent.addEventListener('dragover', e => {
        e.preventDefault();
        this._isDraggingOver = true;
        overlay.style.display = 'flex';
      });
      parent.addEventListener('dragleave', e => {
        if (!parent.contains(e.relatedTarget)) {
          this._isDraggingOver = false;
          overlay.style.display = 'none';
        }
      });
      parent.addEventListener('drop', e => {
        e.preventDefault();
        overlay.style.display = 'none';
        this._isDraggingOver  = false;
        this._onFilesSelected(e.dataTransfer.files);
      });
    }

    // ─── File Loading ─────────────────────────────────────────────────────────

    _onFilesSelected(fileList) {
      const files = Array.from(fileList).filter(f => /\.(glb|gltf)$/i.test(f.name));
      if (!files.length) {
        this._setStatus('No .glb or .gltf files found');
        return;
      }
      files.forEach(file => {
        this._setStatus(`Loading "${file.name}"…`);
        this._models.loadFromFile(file)
          .then(data => {
            this._setStatus(`Loaded "${data.name}"  (${data.meshCount} meshes, ${data.matCount} materials)`);
            this._models.showModel(data.name);
            this._updatePanel();
          })
          .catch(err => {
            this._setStatus(`Failed to load "${file.name}": ${err.message || err}`);
          });
      });
    }

    // ─── Panel Update ─────────────────────────────────────────────────────────

    _updatePanel() {
      if (!this._panel) return;
      this._rebuildModelList();
      this._rebuildAnimList();
    }

    _rebuildModelList() {
      const list    = this._panel.querySelector('#gf-model-list');
      const names   = this._models.getModelNames();
      const active  = this._models.getActiveModel();
      const activeN = active ? active.name : null;

      if (!names.length) {
        list.innerHTML = '<div style="color:#445;font-size:11px;padding:4px 0;">None loaded yet</div>';
        return;
      }

      list.innerHTML = names.map(n => {
        const isActive = n === activeN;
        return `<div data-model="${_esc(n)}" style="${MODEL_ITEM}${isActive ? MODEL_ITEM_ACTIVE : ''}">
          ${isActive ? '▶' : '◦'} ${_esc(n)}
          <span data-del-model="${_esc(n)}" style="float:right;opacity:0.4;cursor:pointer;padding:0 4px;" title="Remove">✕</span>
        </div>`;
      }).join('');

      list.querySelectorAll('[data-model]').forEach(el => {
        el.addEventListener('click', e => {
          if (e.target.dataset.delModel) return;
          this._models.showModel(el.dataset.model);
          this._updatePanel();
        });
      });

      list.querySelectorAll('[data-del-model]').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          this._models.removeModel(el.dataset.delModel);
          this._updatePanel();
        });
      });
    }

    _rebuildAnimList() {
      const list   = this._panel.querySelector('#gf-anim-list');
      const active = this._models.getActiveModel();

      if (!active || !active.animationNames.length) {
        list.innerHTML = '<div style="color:#445;font-size:11px;padding:4px 0;">No animations</div>';
        return;
      }

      const playing = this._models.getActiveAnimationName();

      list.innerHTML = active.animationNames.map(n => {
        const isPlaying = n === playing;
        return `<div data-anim="${_esc(n)}" style="${ANIM_ITEM}${isPlaying ? ANIM_ITEM_ACTIVE : ''}">
          ${isPlaying ? '▶' : '◦'} ${_esc(n)}
        </div>`;
      }).join('');

      list.querySelectorAll('[data-anim]').forEach(el => {
        el.addEventListener('click', () => {
          this._models.playAnimation(el.dataset.anim);
          this._rebuildAnimList();
        });
      });
    }

    // ─── Status Messages ──────────────────────────────────────────────────────

    _setStatus(msg) {
      this._statusMsg   = msg;
      this._statusTimer = 4; // seconds before fading to default hint
    }

    // ─── Update / Render ─────────────────────────────────────────────────────

    update(dt /*, engine */) {
      if (this._statusTimer > 0) this._statusTimer -= dt;

      // Keep animation list in sync with currently playing clip
      if (this._panel) {
        const active = this._models.getActiveModel();
        if (active) this._rebuildAnimList();
      }
    }

    render(ctx, engine) {
      const W = engine.canvas.width;
      const H = engine.canvas.height;

      this._drawInfoBar(ctx, engine, W, H);
      this._drawHint(ctx, engine, W, H);
    }

    _drawInfoBar(ctx, engine, W, H) {
      const active = this._models.getActiveModel();
      const mode   = this._models.getMode ? this._models.getMode() : 'orbit';
      const count  = this._models.getModelNames().length;
      const BAR_H  = 34;
      const X0     = 240; // clear of the side panel
      const BAR_W  = W - X0;

      // Semi-transparent bar at the bottom
      ctx.save();
      ctx.fillStyle = 'rgba(8,8,18,0.72)';
      ctx.fillRect(X0, H - BAR_H, BAR_W, BAR_H);

      ctx.font      = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = (active || count) ? '#aabbff' : '#445566';

      let label;
      if (mode === 'walk') {
        label = count
          ? `WALK MODE  ·  ${count} model${count !== 1 ? 's' : ''} on display  ·  click viewport, then WASD + mouse`
          : 'WALK MODE  ·  no models yet  ·  import or load a preset to populate the gallery';
      } else if (active) {
        label = `${active.name}  ·  ${active.meshCount} mesh${active.meshCount !== 1 ? 'es' : ''}  ·  ${active.matCount} material${active.matCount !== 1 ? 's' : ''}  ·  ${active.animationNames.length} animation${active.animationNames.length !== 1 ? 's' : ''}`;
      } else {
        label = 'No model loaded';
      }
      ctx.fillText(label, X0 + 14, H - 11);

      // FPS on the right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#334455';
      ctx.fillText(`${engine.fps} fps`, W - 12, H - 11);

      ctx.restore();
    }

    _drawHint(ctx, engine, W, H) {
      // Hide hint once a model exists OR once we've entered walk mode
      // (walk mode shows its own click-to-look overlay).
      if (this._models.getActiveModel()) return;
      if (this._models.getMode && this._models.getMode() === 'walk') return;

      const X0 = 240;
      const cx = X0 + (W - X0) / 2;
      const cy = H / 2;

      ctx.save();
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.font       = '32px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle  = 'rgba(80,90,160,0.5)';
      ctx.fillText('◈', cx, cy - 28);

      ctx.font      = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(100,120,200,0.6)';
      ctx.fillText('Import a .glb file to begin', cx, cy + 10);

      ctx.font      = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(80,90,140,0.5)';
      ctx.fillText('Click "Import GLB…", drag & drop files, or load a preset', cx, cy + 36);
      ctx.fillText('Switch to "Walk" to step into the gallery', cx, cy + 56);
      ctx.restore();
    }

    destroy() {
      if (this._panel)    this._panel.remove();
      if (this._fileInput)  this._fileInput.remove();
      if (this._dropOverlay) this._dropOverlay.remove();
    }
  }

  // ─── Style Constants ────────────────────────────────────────────────────────

  const BTN_BASE   = 'display:block;width:100%;padding:7px 10px;border-radius:6px;border:none;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s;';
  const BTN_PRIMARY   = BTN_BASE + 'background:rgba(60,80,200,0.75);color:#ddeeff;font-weight:600;margin-bottom:4px;';
  const BTN_SECONDARY = BTN_BASE + 'background:rgba(30,30,70,0.6);color:#9099bb;margin-bottom:4px;border:1px solid rgba(80,80,160,0.3);';
  const BTN_SMALL     = 'padding:5px 6px;border-radius:5px;border:none;cursor:pointer;font-size:11px;font-family:inherit;background:rgba(30,30,60,0.6);color:#8899cc;';
  const BTN_COLOR     = 'width:22px;height:22px;border-radius:4px;border:1px solid rgba(100,100,180,0.3);cursor:pointer;';
  const SECTION_LABEL = 'font-size:9px;letter-spacing:1.5px;color:#445;font-weight:600;margin-bottom:6px;';
  const MODEL_ITEM    = 'padding:5px 8px;border-radius:5px;cursor:pointer;margin-bottom:3px;font-size:12px;color:#8899cc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid transparent;';
  const MODEL_ITEM_ACTIVE = 'background:rgba(50,70,160,0.4);color:#aabbff;border-color:rgba(80,100,200,0.3);';
  const ANIM_ITEM     = 'padding:4px 8px;border-radius:5px;cursor:pointer;margin-bottom:2px;font-size:11px;color:#7788aa;';
  const ANIM_ITEM_ACTIVE = 'background:rgba(40,60,130,0.4);color:#99aadd;';

  const BG_PRESETS = [
    { hex: '16161e', css: '#16161e', label: 'Dark (default)' },
    { hex: '0d0d0d', css: '#0d0d0d', label: 'Black' },
    { hex: '1a1a2e', css: '#1a1a2e', label: 'Dark navy' },
    { hex: '1e1012', css: '#1e1012', label: 'Dark warm' },
    { hex: '2a2a2a', css: '#2a2a2a', label: 'Grey' },
    { hex: 'e0e0e8', css: '#e0e0e8', label: 'Light grey' },
    { hex: 'ffffff', css: '#ffffff', label: 'White' },
    { hex: '0a1628', css: '#0a1628', label: 'Deep blue' },
  ];

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', () => {
    GF.applyLauncherConfig(GAME_CONFIG.game.name);

    const game = GF.createGame(GAME_CONFIG.engine, GAME_CONFIG.physics, {
      gameName:  GAME_CONFIG.game.name,
      models:    true,
      audio:     false,
      particles: false,
      tilemap:   false,
      dialogue:  false,
      debug:     false,
    });

    game.scenes.push(new ShowcaseScene(), game.engine);
    game.engine.start();
  });

})();
