// GameFramework/games/ShiningQuest/ShiningQuestGame.js
// Shining Force-style tactical RPG built on GameFramework.
//
// Showcases: Engine, EventBus, InputManager, SpriteSystem, GridSystem,
// TurnBasedBattleSystem, DialogueSystem, CursorMenu, SceneManager + transitions,
// TweenSystem, ParticleSystem, AudioSystem (procedural), UISystem, SaveSystem.
//
// Game-specific logic in this file is intentionally limited to:
//   - Scene definitions (Title, Town, Battle, GameOver, Victory)
//   - Per-game rendering (terrain palette, unit drawing wrapper)
//   - Simple enemy AI
// Mechanics — turn order, grid math, pathfinding, dialogue sequencing,
// menu navigation, etc — are framework concerns.

(function (GF) {
  'use strict';

  const CFG  = () => GF.GAME_CONFIG;
  const DATA = () => GF.QuestData;

  // ── Persistent state across scenes ─────────────────────────────────────────
  const State = {
    chapterIdx : 0,
    party      : null,   // deep-cloned party (current HP carries between chapters)
    visitedChapters: new Set(),
  };

  function clonePartyFromTemplate() {
    // Deep clone the party data so HP changes during battle don't bleed.
    State.party = DATA().party.map(p => Object.assign({}, p,
      { hp: p.maxHp, dead: false, mp: p.mp || 0 }));
  }

  // ── Audio (procedural blips, mirrors SpaceInvaders' style) ────────────────
  function makeTone(audioCtx, freq, duration, type, env) {
    const sr   = audioCtx.sampleRate;
    const len  = Math.floor(sr * duration);
    const buf  = audioCtx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let s = 0;
      if      (type === 'square') s = Math.sin(2*Math.PI*freq*t) > 0 ? 1 : -1;
      else if (type === 'noise')  s = Math.random() * 2 - 1;
      else if (type === 'sweep')  s = Math.sin(2*Math.PI*(freq + (env.sweep||0)*t)*t);
      else                        s = Math.sin(2*Math.PI*freq*t);
      const a = env.attack || 0.005, r = env.release || duration;
      let amp = (t < a) ? t/a : Math.max(0, 1 - (t - a) / (r - a));
      data[i] = s * amp * (env.volume || 0.25);
    }
    return buf;
  }

  function setupAudio(audio) {
    audio._ensureContext();
    const ctx = audio._ctx;
    if (!ctx) return;
    audio.register('cursor',    makeTone(ctx, 660, 0.06, 'square', { volume: 0.15 }));
    audio.register('confirm',   makeTone(ctx, 880, 0.10, 'square', { volume: 0.18 }));
    audio.register('cancel',    makeTone(ctx, 320, 0.10, 'square', { volume: 0.18 }));
    audio.register('hit',       makeTone(ctx, 220, 0.18, 'noise',  { volume: 0.30 }));
    audio.register('crit',      makeTone(ctx, 180, 0.30, 'sweep',  { volume: 0.35, sweep: -120 }));
    audio.register('heal',      makeTone(ctx, 720, 0.35, 'sweep',  { volume: 0.30, sweep: 380 }));
    audio.register('death',     makeTone(ctx, 140, 0.45, 'sweep',  { volume: 0.35, sweep: -90 }));
    audio.register('victory',   makeTone(ctx, 660, 0.50, 'square', { volume: 0.30 }));
    audio.register('defeat',    makeTone(ctx, 110, 0.60, 'sweep',  { volume: 0.35, sweep: -50 }));
    audio.register('spell',     makeTone(ctx, 540, 0.40, 'sweep',  { volume: 0.30, sweep: 220 }));
    audio.register('step',      makeTone(ctx, 380, 0.04, 'square', { volume: 0.10 }));
  }

  // ── Terrain palette (battle map tiles, drawn in code) ──────────────────────
  const TERRAIN_PALETTE = {
    0: { base: '#3a6a2a', accent: '#2a4a1a', name: 'Plain',    cost: 1 },
    1: { base: '#caa377', accent: '#a87a4a', name: 'Path',     cost: 1 },
    2: { base: '#1f4a22', accent: '#0e2810', name: 'Forest',   cost: 2 },
    3: { base: '#2244aa', accent: '#1a3388', name: 'Water',    cost: Infinity },
    4: { base: '#444444', accent: '#222222', name: 'Wall',     cost: Infinity },
    5: { base: '#776655', accent: '#554433', name: 'Mountain', cost: 3 },
  };

  function drawBattleTile(ctx, type, x, y, size) {
    const p = TERRAIN_PALETTE[type] || TERRAIN_PALETTE[0];
    ctx.fillStyle = p.base;
    ctx.fillRect(x, y, size, size);
    // Texture
    if (type === 0) {                       // grass blades
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 4,  y + 6,  2, 2);
      ctx.fillRect(x + 14, y + 18, 2, 2);
      ctx.fillRect(x + 22, y + 10, 2, 2);
      ctx.fillRect(x + 26, y + 24, 2, 2);
    } else if (type === 1) {                // path stones
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 2,  y + 2,  6, 4);
      ctx.fillRect(x + 12, y + 10, 8, 6);
      ctx.fillRect(x + 4,  y + 22, 5, 5);
      ctx.fillRect(x + 22, y + 22, 6, 4);
    } else if (type === 2) {                // forest tree
      ctx.fillStyle = '#0a1a08';
      ctx.fillRect(x + 14, y + 18, 4, 12);
      ctx.fillStyle = '#2e6a26';
      ctx.beginPath();
      ctx.arc(x + 16, y + 14, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3e8a36';
      ctx.beginPath();
      ctx.arc(x + 13, y + 11, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 3) {                // water shimmer
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 2,  y + 6,  10, 1);
      ctx.fillRect(x + 18, y + 14, 12, 1);
      ctx.fillRect(x + 6,  y + 22, 14, 1);
    } else if (type === 4) {                // stone wall
      ctx.fillStyle = p.accent;
      ctx.fillRect(x,      y,      32, 1);
      ctx.fillRect(x,      y + 11, 32, 1);
      ctx.fillRect(x,      y + 22, 32, 1);
      ctx.fillRect(x + 6,  y + 1,  1, 10);
      ctx.fillRect(x + 18, y + 1,  1, 10);
      ctx.fillRect(x + 12, y + 12, 1, 10);
      ctx.fillRect(x + 24, y + 12, 1, 10);
    } else if (type === 5) {                // mountain
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 28); ctx.lineTo(x + 14, y + 8);
      ctx.lineTo(x + 22, y + 16); ctx.lineTo(x + 28, y + 28);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#dddddd';
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 12); ctx.lineTo(x + 14, y + 8);
      ctx.lineTo(x + 16, y + 12); ctx.closePath(); ctx.fill();
    }
    // Subtle grid line
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }

  // ── Town tile palette (grass + path + buildings drawn directly) ───────────
  const TOWN_TILE = {
    GRASS: 0, PATH: 1, WATER: 2, WALL: 3, FLOWER: 4,
  };

  function drawTownTile(ctx, type, x, y, size) {
    if (type === TOWN_TILE.GRASS) {
      ctx.fillStyle = '#3a6a2a'; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#2a4a1a';
      ctx.fillRect(x + 5, y + 6, 2, 2);
      ctx.fillRect(x + 22, y + 18, 2, 2);
    } else if (type === TOWN_TILE.PATH) {
      ctx.fillStyle = '#caa377'; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#a87a4a';
      ctx.fillRect(x + 8, y + 8,  4, 4);
      ctx.fillRect(x + 20, y + 18, 5, 5);
    } else if (type === TOWN_TILE.WATER) {
      ctx.fillStyle = '#2244aa'; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#5577dd';
      ctx.fillRect(x + 4, y + 8, 6, 1);
      ctx.fillRect(x + 18, y + 22, 8, 1);
    } else if (type === TOWN_TILE.WALL) {
      ctx.fillStyle = '#666666'; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#444444';
      ctx.fillRect(x, y + 11, size, 1);
      ctx.fillRect(x + 8, y, 1, 11);
      ctx.fillRect(x + 22, y, 1, 11);
      ctx.fillRect(x + 4, y + 12, 1, 10);
      ctx.fillRect(x + 16, y + 12, 1, 10);
      ctx.fillRect(x + 28, y + 12, 1, 10);
      ctx.fillRect(x, y + 22, size, 1);
    } else if (type === TOWN_TILE.FLOWER) {
      ctx.fillStyle = '#3a6a2a'; ctx.fillRect(x, y, size, size);
      const colors = ['#ff5577','#ffdd55','#ffffff','#aa55ff'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        const fx = x + 4 + (i % 2) * 16, fy = y + 4 + (i >> 1) * 16;
        ctx.fillRect(fx + 4, fy + 2, 2, 2);
        ctx.fillRect(fx + 2, fy + 4, 2, 2);
        ctx.fillRect(fx + 6, fy + 4, 2, 2);
        ctx.fillRect(fx + 4, fy + 6, 2, 2);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(fx + 4, fy + 4, 2, 2);
      }
    }
  }

  // Build the castle town map programmatically. 26 cols × 15 rows.
  function buildTownMap() {
    const cols = CFG().town.cols, rows = CFG().town.rows;
    const G = TOWN_TILE.GRASS, P = TOWN_TILE.PATH, W = TOWN_TILE.WALL,
          A = TOWN_TILE.WATER, F = TOWN_TILE.FLOWER;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(G));

    // Castle keep (top centre): 8x5 wall block
    for (let r = 0; r < 5; r++) for (let c = 9; c < 17; c++) grid[r][c] = W;
    // Throne room hole (open arched gate)
    grid[4][12] = P; grid[4][13] = P;
    // Battlements crenellations: keep walls
    // Path leading from gate to bottom
    for (let r = 4; r < rows; r++) { grid[r][12] = P; grid[r][13] = P; }
    // Cross-path
    for (let c = 2; c < cols - 2; c++) grid[10][c] = P;

    // Side houses (walls)
    for (let r = 7; r < 10; r++) for (let c = 3; c < 6; c++) grid[r][c] = W;
    grid[9][4] = P; // door
    for (let r = 7; r < 10; r++) for (let c = 19; c < 22; c++) grid[r][c] = W;
    grid[9][20] = P;

    // Moat (water around castle base)
    for (let c = 8; c < 18; c++) grid[5][c] = A;
    grid[5][12] = P; grid[5][13] = P; // bridge

    // Flower beds
    grid[7][12] = F; grid[7][13] = F;
    grid[12][6] = F; grid[12][19] = F;
    grid[13][2] = F; grid[13][cols - 3] = F;

    // Outer wall border
    for (let c = 0; c < cols; c++) { grid[0][c] = W; grid[rows-1][c] = W; }
    for (let r = 0; r < rows; r++) { grid[r][0] = W; grid[r][cols-1] = W; }
    // Town gate at the bottom centre
    grid[rows-1][12] = P; grid[rows-1][13] = P;

    return grid;
  }

  // True if the given town tile is walkable (player can stand on it).
  function isTownWalkable(tile) {
    return tile !== TOWN_TILE.WALL && tile !== TOWN_TILE.WATER;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── TitleScene ─────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  class TitleScene extends GF.Scene {
    init(engine) {
      this._t = 0;
      this._pulse = { v: 1.0 };
      const tw = engine.getSystem('TweenSystem');
      tw.create(this._pulse, { v: 0.25 }, 0.9, { ease: 'inOutSine', loop: true, yoyo: true });

      const cfg = CFG().controls;
      engine.input.bind('confirm', ...cfg.confirm);

      try { setupAudio(engine.getSystem('AudioSystem')); } catch(e) {}

      // Initialize game state on (re)entering the title
      State.chapterIdx = 0;
      State.visitedChapters.clear();
      clonePartyFromTemplate();

      // Star backdrop seeds
      this._stars = Array.from({ length: 90 }, (_, i) => ({
        x: GF.Math.rand(0, engine.config.width),
        y: GF.Math.rand(0, engine.config.height),
        r: GF.Math.rand(0.4, 1.6),
        s: GF.Math.rand(0.5, 2.0),
        p: GF.Math.rand(0, Math.PI * 2),
      }));
    }

    update(dt, engine) {
      this._t += dt;
      if (engine.input.wasPressed('confirm')) {
        engine.getSystem('AudioSystem').play('confirm');
        engine.getSystem('SceneManager').replaceWithTransition(
          new TownScene(), { type: 'fade', duration: 0.7, color: '#000000' }
        );
      }
    }

    render(ctx, engine) {
      const W = engine.config.width, H = engine.config.height;
      const ui = GF.UISystem;

      // Twinkling stars
      for (const s of this._stars) {
        const b = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.p + this._t * s.s));
        ctx.fillStyle = `rgba(255,255,255,${b.toFixed(2)})`;
        ctx.fillRect(s.x | 0, s.y | 0, s.r | 0 || 1, s.r | 0 || 1);
      }

      // Aurora sweep
      const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
      grad.addColorStop(0, 'rgba(40,80,160,0)');
      grad.addColorStop(1, 'rgba(20,40,90,0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.4, W, H * 0.6);

      // Castle silhouette
      ctx.fillStyle = '#0a0a18';
      ctx.beginPath();
      ctx.moveTo(W * 0.15, H);
      ctx.lineTo(W * 0.15, H * 0.78);
      ctx.lineTo(W * 0.20, H * 0.78);
      ctx.lineTo(W * 0.20, H * 0.66); ctx.lineTo(W * 0.23, H * 0.66);
      ctx.lineTo(W * 0.23, H * 0.78); ctx.lineTo(W * 0.30, H * 0.78);
      ctx.lineTo(W * 0.30, H * 0.55); ctx.lineTo(W * 0.36, H * 0.50);
      ctx.lineTo(W * 0.42, H * 0.55); ctx.lineTo(W * 0.42, H * 0.78);
      ctx.lineTo(W * 0.55, H * 0.78); ctx.lineTo(W * 0.55, H * 0.66);
      ctx.lineTo(W * 0.58, H * 0.66); ctx.lineTo(W * 0.58, H * 0.78);
      ctx.lineTo(W * 0.62, H * 0.78); ctx.lineTo(W * 0.62, H);
      ctx.closePath();
      ctx.fill();
      // Castle lights
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(W * 0.20, H * 0.70, 4, 4);
      ctx.fillRect(W * 0.34, H * 0.60, 4, 4);
      ctx.fillRect(W * 0.50, H * 0.72, 4, 4);

      // Title text
      ui.drawText(ctx, 'SHINING QUEST', W / 2, H * 0.30, {
        font: CFG().ui.bigTitleFont, color: CFG().ui.titleColor,
        align: 'center', baseline: 'middle',
        glow: '#ffaa22', glowBlur: 24, stroke: '#332200', strokeWidth: 4,
      });
      ui.drawText(ctx, 'A tactical RPG built on the GameFramework', W / 2, H * 0.30 + 38, {
        font: '13px monospace', color: '#aab8d8',
        align: 'center', baseline: 'middle',
      });

      // "Press to start" pulse
      ctx.globalAlpha = this._pulse.v;
      ui.drawText(ctx, '— PRESS SPACE / ENTER —', W / 2, H - 70, {
        font: 'bold 18px monospace', color: '#ffffff',
        align: 'center', baseline: 'middle',
      });
      ctx.globalAlpha = 1;

      ui.drawText(ctx, 'WASD/Arrows · SPACE select · X cancel', W / 2, H - 32, {
        font: '11px monospace', color: '#7788aa',
        align: 'center', baseline: 'middle',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── TownScene (overworld hub) ──────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  class TownScene extends GF.Scene {
    init(engine) {
      const cfg = CFG();
      this._engine   = engine;
      this._dialogue = engine.getSystem('DialogueSystem');
      this._scenes   = engine.getSystem('SceneManager');
      this._sprites  = engine.getSystem('SpriteSystem');
      this._audio    = engine.getSystem('AudioSystem');

      // Bind controls
      engine.input.bind('up',      ...cfg.controls.up);
      engine.input.bind('down',    ...cfg.controls.down);
      engine.input.bind('left',    ...cfg.controls.left);
      engine.input.bind('right',   ...cfg.controls.right);
      engine.input.bind('confirm', ...cfg.controls.confirm);
      engine.input.bind('cancel',  ...cfg.controls.cancel);

      // Dialogue advance is bound to confirm
      this._dialogue.advanceKey = 'confirm';
      this._dialogue._getPortraitCb = name => GF.portraits[name] || null;

      // Build town
      this._mapGrid = buildTownMap();
      const cs = cfg.town.cellSize;

      // Player (Kestra leader) — uses claudia sprite
      this._player = {
        x: cfg.town.cols / 2 * cs,
        y: (cfg.town.rows - 2) * cs + cs / 2,
        anim: this._sprites.createAnimator('claudia', 'idle'),
        facing: 's',
      };

      // NPCs placed on the town map
      this._npcs = [
        { id: 'king',     col: 12, row: 5, portrait: 'king',
          script: () => this._talkToKing() },
        { id: 'villager', col: 4,  row: 11, portrait: 'villager',
          script: () => this._showRandomVillagerLine() },
        { id: 'villager', col: 21, row: 11, portrait: 'villager',
          script: () => this._showRandomVillagerLine() },
      ];

      this._showIntro = !State.visitedChapters.has('town_intro');

      // Quest progress sign post
      this._signLine = `Chapter ${State.chapterIdx + 1} awaits — speak to the King.`;
    }

    enter(engine) {
      if (this._showIntro) {
        this._showIntro = false;
        State.visitedChapters.add('town_intro');
        this._dialogue.start(DATA().townIntro);
      }
    }

    _talkToKing() {
      const ch = DATA().chapters[State.chapterIdx];
      if (!ch) {
        this._dialogue.start(DATA().finale);
        // After finale, transition to victory scene on dialogue end
        const off = this._engine.events.on('dialogue:end', () => {
          off();
          this._scenes.replaceWithTransition(new VictoryScene(),
            { type: 'iris', duration: 1.0, color: '#000000' });
        });
        return;
      }
      // Run intro and then start battle
      this._dialogue.start(ch.intro);
      const off = this._engine.events.on('dialogue:end', () => {
        off();
        this._scenes.replaceWithTransition(new BattleScene(ch),
          { type: 'wipe', duration: 0.9, color: '#000000' });
      });
    }

    _showRandomVillagerLine() {
      const lines = DATA().villagerLines;
      const pick  = lines[Math.floor(Math.random() * lines.length)];
      this._dialogue.start(pick);
    }

    update(dt, engine) {
      // Block player input during dialogue
      if (this._dialogue.isActive) return;

      const cfg = CFG().town;
      const cs  = cfg.cellSize;
      const speed = cfg.playerSpeed;

      let dx = 0, dy = 0;
      if (engine.input.isDown('left'))  { dx -= 1; this._player.facing = 'w'; }
      if (engine.input.isDown('right')) { dx += 1; this._player.facing = 'e'; }
      if (engine.input.isDown('up'))    { dy -= 1; this._player.facing = 'n'; }
      if (engine.input.isDown('down'))  { dy += 1; this._player.facing = 's'; }

      const moving = dx !== 0 || dy !== 0;
      if (moving) {
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        const nx = this._player.x + dx * speed * dt;
        const ny = this._player.y + dy * speed * dt;
        // Check collision via map tile at the new feet position
        const col = Math.floor(nx / cs), row = Math.floor(ny / cs);
        if (col >= 0 && row >= 0 && row < this._mapGrid.length &&
            col < this._mapGrid[0].length &&
            isTownWalkable(this._mapGrid[row][col])) {
          this._player.x = nx;
          this._player.y = ny;
        }
        // Animation
        const animMap = { n: 'walk_n', s: 'walk_s', e: 'walk_e', w: 'walk_w' };
        this._player.anim.play(animMap[this._player.facing] || 'walk_s');
      } else {
        this._player.anim.play('idle');
      }
      this._player.anim.update(dt);

      // Interaction
      if (engine.input.wasPressed('confirm')) {
        const npc = this._nearbyNpc();
        if (npc) {
          this._audio.play('confirm');
          npc.script();
        }
      }
    }

    _nearbyNpc() {
      const cs = CFG().town.cellSize;
      const px = this._player.x, py = this._player.y;
      for (const n of this._npcs) {
        const cx = n.col * cs + cs / 2, cy = n.row * cs + cs / 2;
        if (Math.hypot(px - cx, py - cy) < cs * 1.2) return n;
      }
      return null;
    }

    render(ctx, engine) {
      const cfg = CFG();
      const cs  = cfg.town.cellSize;
      const W   = engine.config.width;
      const H   = engine.config.height;

      // Draw map
      for (let r = 0; r < this._mapGrid.length; r++) {
        for (let c = 0; c < this._mapGrid[0].length; c++) {
          drawTownTile(ctx, this._mapGrid[r][c], c * cs, r * cs, cs);
        }
      }

      // Draw NPCs
      const t = Date.now() / 1000;
      for (const n of this._npcs) {
        const x = n.col * cs + cs / 2, y = n.row * cs + cs;
        // Body
        ctx.fillStyle = (n.id === 'king') ? '#7a1f3a' : '#5a7a3a';
        ctx.fillRect(x - 8, y - 22, 16, 18);
        // Head
        ctx.fillStyle = '#f0d2a8';
        ctx.beginPath();
        ctx.arc(x, y - 26, 7, 0, Math.PI * 2);
        ctx.fill();
        if (n.id === 'king') {
          ctx.fillStyle = '#ffcc44';
          ctx.beginPath();
          ctx.moveTo(x - 8, y - 30); ctx.lineTo(x - 5, y - 36);
          ctx.lineTo(x - 1, y - 32); ctx.lineTo(x, y - 38);
          ctx.lineTo(x + 1, y - 32); ctx.lineTo(x + 5, y - 36);
          ctx.lineTo(x + 8, y - 30);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = '#cca644';
          ctx.beginPath();
          ctx.ellipse(x, y - 32, 10, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Indicator dot when player is nearby
        const px = this._player.x, py = this._player.y;
        if (Math.hypot(px - x, py - y) < cs * 1.2) {
          const bob = Math.sin(t * 5) * 3;
          ctx.fillStyle = '#ffdd44';
          ctx.beginPath();
          ctx.moveTo(x - 4, y - 44 - bob);
          ctx.lineTo(x + 4, y - 44 - bob);
          ctx.lineTo(x,     y - 38 - bob);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw player
      this._player.anim.draw(ctx, this._player.x, this._player.y);

      // HUD
      const ui = GF.UISystem;
      ui.drawPanel(ctx, 8, H - 36, W - 16, 28, {
        bgColor: cfg.ui.panelBg, borderColor: cfg.ui.panelBorder, radius: 4,
      });
      ui.drawText(ctx, this._signLine, 16, H - 22, {
        font: cfg.ui.hudFont, color: cfg.ui.hudColor, baseline: 'middle',
      });
      ui.drawText(ctx, `Party HP: ${State.party.map(p => `${p.name.slice(0,3)} ${p.hp}/${p.maxHp}`).join('  ')}`,
        W - 16, H - 22, {
        font: cfg.ui.hudFont, color: cfg.ui.hudColor, align: 'right', baseline: 'middle',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── BattleScene (the tactical core) ────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  // States that drive BattleScene's update/render machine.
  const PHASE = {
    INTRO         : 'intro',
    UNIT_TURN     : 'unit_turn',          // about to take action — show menu
    PICK_MOVE     : 'pick_move',          // cursor on grid, choose move tile
    ANIM_MOVE     : 'anim_move',          // tweening unit through path
    PICK_ATTACK   : 'pick_attack',        // cursor on grid, choose attack target
    PICK_SPELL    : 'pick_spell',         // cursor on grid for spell target
    ANIM_ATTACK   : 'anim_attack',        // attack animation playing
    ENEMY_THINK   : 'enemy_think',        // pause before enemy moves
    OUTRO         : 'outro',              // running victory dialogue
    DEFEAT        : 'defeat',
  };

  class BattleScene extends GF.Scene {
    constructor(chapterDef) {
      super();
      this._chapter = chapterDef;
    }

    init(engine) {
      const cfg = CFG();
      this._engine   = engine;
      this._sprites  = engine.getSystem('SpriteSystem');
      this._dialogue = engine.getSystem('DialogueSystem');
      this._scenes   = engine.getSystem('SceneManager');
      this._tweens   = engine.getSystem('TweenSystem');
      this._particles= engine.getSystem('ParticleSystem');
      this._audio    = engine.getSystem('AudioSystem');
      this._battle   = engine.getSystem('TurnBasedBattleSystem');
      this._grids    = engine.getSystem('GridSystem');

      this._dialogue.advanceKey = 'confirm';
      this._dialogue._getPortraitCb = name => GF.portraits[name] || null;

      // Build the logical grid
      const ch = this._chapter;
      const grid = this._grids.create({
        cols: ch.cols, rows: ch.rows,
        cellSize: cfg.battle.cellSize,
        x: cfg.battle.gridOffset.x, y: cfg.battle.gridOffset.y,
      });
      this._grid = grid;

      // Apply terrain costs / blocked
      for (let r = 0; r < ch.rows; r++) {
        for (let c = 0; c < ch.cols; c++) {
          const t = ch.terrain[r][c];
          const palCost = TERRAIN_PALETTE[t] ? TERRAIN_PALETTE[t].cost : 1;
          if (cfg.battle.blockedTerrain.indexOf(t) >= 0) {
            grid.setBlocked(c, r, true);
          } else {
            grid.setCost(c, r, palCost);
          }
        }
      }

      // Build units (cloning from State.party + chapter enemies)
      this._units = [];
      State.party.forEach((p, i) => {
        if (p.dead) return; // dead party members don't deploy
        const spawn = ch.playerSpawns[i] || ch.playerSpawns[0];
        const u = Object.assign({}, p, {
          col: spawn.col, row: spawn.row,
          screenX: 0, screenY: 0,
          anim: this._sprites.createAnimator(p.sprite, 'idle'),
          actedThisTurn: false,
          ref: p,                        // back-reference to update party HP
        });
        const w = grid.toWorldCenter(u.col, u.row);
        u.screenX = w.x; u.screenY = w.y + cfg.battle.cellSize / 2 - 2;
        u.anim.play('walk_s'); // face camera
        u.anim.update(0); // tick once
        grid.placeOccupant(u, u.col, u.row);
        this._units.push(u);
      });
      ch.enemies.forEach(e => {
        const tpl = DATA().enemies[e.type];
        const u = Object.assign({}, tpl, {
          col: e.col, row: e.row,
          dead: false, hp: tpl.maxHp,
          screenX: 0, screenY: 0,
          anim: this._sprites.createAnimator(tpl.sprite, 'idle'),
          actedThisTurn: false,
        });
        const w = grid.toWorldCenter(u.col, u.row);
        u.screenX = w.x; u.screenY = w.y + cfg.battle.cellSize / 2 - 2;
        grid.placeOccupant(u, u.col, u.row);
        this._units.push(u);
      });

      // Hook battle events
      this._unsubs = [
        engine.events.on('battle:turn_start', d => this._onTurnStart(d.unit)),
        engine.events.on('battle:complete',   d => this._onComplete(d.result)),
      ];

      // Cursor & camera
      this._cursor = { col: this._units[0].col, row: this._units[0].row };
      this._reachable = [];
      this._attackable = [];
      this._floatingTexts = [];

      // Phase: start with intro
      this._phase = PHASE.INTRO;
      this._introDone = false;

      // Begin
      this._battle.start({ units: this._units });
      // The battle system will fire turn_start; we'll intercept the first turn
      // and queue the dialogue intro before allowing input.
      // Suppress the menu until intro finishes:
      this._pendingFirstUnit = this._battle.currentUnit();

      // Run intro dialogue
      this._dialogue.start(this._chapter.intro);
      const off = engine.events.on('dialogue:end', () => {
        off();
        this._introDone = true;
        if (this._pendingFirstUnit) {
          this._beginUnitTurn(this._pendingFirstUnit);
          this._pendingFirstUnit = null;
        }
      });
    }

    destroy(engine) {
      this._unsubs.forEach(fn => fn());
      this._grids.remove(this._grid);
    }

    // ── Battle event handlers ─────────────────────────────────────────────────

    _onTurnStart(unit) {
      if (!this._introDone) {
        this._pendingFirstUnit = unit;
        return;
      }
      this._beginUnitTurn(unit);
    }

    _beginUnitTurn(unit) {
      this._activeUnit = unit;
      this._cursor = { col: unit.col, row: unit.row };
      // Recompute reachable and attackable for the unit
      this._reachable  = this._grid.tilesInRange(unit, unit.move, { team: unit.team, ignore: unit });
      this._attackable = []; // computed when picking attack
      if (unit.team === 'player') {
        this._buildActionMenu(unit);
        this._phase = PHASE.UNIT_TURN;
      } else {
        this._phase = PHASE.ENEMY_THINK;
        this._enemyThinkTimer = CFG().battle.enemyTurnDelayMs / 1000;
      }
    }

    _buildActionMenu(unit) {
      const items = [
        { label: 'Move',   value: 'move',   enabled: this._reachable.length > 1 },
        { label: 'Attack', value: 'attack', enabled: this._anyAttackTargets(unit) },
      ];
      if (unit.spell) {
        items.push({ label: unit.spell.name, value: 'spell',
                     enabled: this._anySpellTargets(unit) });
      }
      items.push({ label: 'Wait', value: 'wait', enabled: true });

      this._menu = new GF.CursorMenu({
        items,
        onSelect: it => this._onMenuSelect(it),
        onCancel: () => {},
        actions : { up: ['ArrowUp','KeyW'], down: ['ArrowDown','KeyS'],
                    select: ['Enter','Space','KeyZ'], cancel: ['Escape','KeyX'] },
      });
    }

    _anyAttackTargets(unit) {
      const cells = this._grid.cellsInRing(unit, unit.attackRange.min, unit.attackRange.max);
      return cells.some(({col,row}) => {
        const occ = this._grid.occupantAt(col, row);
        return occ && !occ.dead && occ.team !== unit.team;
      });
    }
    _anySpellTargets(unit) {
      if (!unit.spell) return false;
      const cells = this._grid.cellsInRing(unit, 1, unit.spell.range);
      return cells.some(({col,row}) => {
        const occ = this._grid.occupantAt(col, row);
        return occ && !occ.dead && occ.team !== unit.team;
      });
    }

    _onMenuSelect(item) {
      this._audio.play('confirm');
      if (item.value === 'move') {
        this._phase = PHASE.PICK_MOVE;
        // Initial cursor: nearest reachable cell (current cell)
      } else if (item.value === 'attack') {
        this._phase = PHASE.PICK_ATTACK;
        this._attackable = this._grid.cellsInRing(
          this._activeUnit,
          this._activeUnit.attackRange.min,
          this._activeUnit.attackRange.max
        ).filter(({col,row}) => {
          const occ = this._grid.occupantAt(col, row);
          return occ && !occ.dead && occ.team !== this._activeUnit.team;
        });
        this._cursor = { col: this._attackable[0].col, row: this._attackable[0].row };
      } else if (item.value === 'spell') {
        this._phase = PHASE.PICK_SPELL;
        this._attackable = this._grid.cellsInRing(
          this._activeUnit, 1, this._activeUnit.spell.range
        ).filter(({col,row}) => {
          const occ = this._grid.occupantAt(col, row);
          return occ && !occ.dead && occ.team !== this._activeUnit.team;
        });
        this._cursor = { col: this._attackable[0].col, row: this._attackable[0].row };
      } else if (item.value === 'wait') {
        this._endActiveTurn();
      }
    }

    _endActiveTurn() {
      this._menu = null;
      this._reachable = [];
      this._attackable = [];
      this._battle.endTurn();
    }

    _onComplete(result) {
      if (result === 'victory') {
        // Sync HP back to persistent party
        State.party.forEach(p => {
          const battleU = this._units.find(u => u.id === p.id);
          if (battleU) { p.hp = battleU.hp; p.dead = battleU.dead; }
        });
        // Heal slightly between chapters
        State.party.forEach(p => { if (!p.dead) p.hp = Math.min(p.maxHp, p.hp + 6); });

        State.chapterIdx = this._chapter.nextChapter !== null
          ? this._chapter.nextChapter
          : State.chapterIdx + 1;
        this._audio.play('victory');
        this._phase = PHASE.OUTRO;
        this._dialogue.start(this._chapter.victory);
        const off = this._engine.events.on('dialogue:end', () => {
          off();
          if (this._chapter.nextChapter === null) {
            // Final chapter — go to TownScene; player will see finale on king
          }
          this._scenes.replaceWithTransition(new TownScene(),
            { type: 'fade', duration: 0.7, color: '#000000' });
        });
      } else {
        this._audio.play('defeat');
        this._phase = PHASE.DEFEAT;
        setTimeout(() => {
          this._scenes.replaceWithTransition(new GameOverScene(),
            { type: 'iris', duration: 1.0, color: '#000000' });
        }, 1500);
      }
    }

    // ── Update ───────────────────────────────────────────────────────────────

    update(dt, engine) {
      // Keep all units' idle animations rolling
      this._units.forEach(u => { if (!u.dead) u.anim.update(dt); });

      // Floating text update
      this._floatingTexts.forEach(ft => { ft.t += dt; ft.y -= 24 * dt; });
      this._floatingTexts = this._floatingTexts.filter(ft => ft.t < 1.0);

      if (this._dialogue.isActive) return;

      switch (this._phase) {
        case PHASE.UNIT_TURN:    return this._updateUnitTurn(dt, engine);
        case PHASE.PICK_MOVE:    return this._updatePickMove(dt, engine);
        case PHASE.ANIM_MOVE:    return this._updateAnimMove(dt, engine);
        case PHASE.PICK_ATTACK:  return this._updatePickTarget(dt, engine, false);
        case PHASE.PICK_SPELL:   return this._updatePickTarget(dt, engine, true);
        case PHASE.ANIM_ATTACK:  return this._updateAnimAttack(dt, engine);
        case PHASE.ENEMY_THINK:  return this._updateEnemyThink(dt, engine);
        // INTRO/OUTRO/DEFEAT are passive — driven by dialogue end / timers
      }
    }

    _updateUnitTurn(dt, engine) {
      this._menu.update(engine.input);
    }

    _updatePickMove(dt, engine) {
      this._moveCursor(engine);
      if (engine.input.wasPressed('cancel')) {
        this._audio.play('cancel');
        this._phase = PHASE.UNIT_TURN;
        return;
      }
      if (engine.input.wasPressed('confirm')) {
        const cell = this._reachable.find(r => r.col === this._cursor.col && r.row === this._cursor.row);
        if (!cell) { this._audio.play('cancel'); return; }
        this._audio.play('confirm');
        // Compute and animate path
        const path = this._grid.findPath(
          { col: this._activeUnit.col, row: this._activeUnit.row },
          { col: this._cursor.col, row: this._cursor.row },
          { team: this._activeUnit.team, ignore: this._activeUnit }
        );
        if (!path || path.length < 2) { this._audio.play('cancel'); return; }
        this._beginMoveAnim(path);
      }
    }

    _beginMoveAnim(path) {
      this._phase = PHASE.ANIM_MOVE;
      this._movePath = path;
      this._movePathIdx = 0;
      this._moveStepTimer = 0;
      // Free origin cell now (will re-place at end)
      this._grid.removeOccupant(this._activeUnit);
    }

    _updateAnimMove(dt, engine) {
      const u = this._activeUnit;
      const cs = CFG().battle.cellSize;
      const stepDuration = 0.16;        // seconds per tile

      this._moveStepTimer += dt;
      while (this._moveStepTimer >= stepDuration && this._movePathIdx < this._movePath.length - 1) {
        this._moveStepTimer -= stepDuration;
        this._movePathIdx++;
        this._audio.play('step');
      }
      const fromIdx = Math.max(0, this._movePathIdx - 1);
      const toIdx   = Math.min(this._movePath.length - 1, this._movePathIdx);
      const a = this._movePath[fromIdx], b = this._movePath[toIdx];
      const t = Math.min(1, this._moveStepTimer / stepDuration);
      const aw = this._grid.toWorldCenter(a.col, a.row);
      const bw = this._grid.toWorldCenter(b.col, b.row);
      u.screenX = aw.x + (bw.x - aw.x) * t;
      u.screenY = aw.y + (bw.y - aw.y) * t + cs / 2 - 2;

      // Face direction
      const dx = b.col - a.col, dy = b.row - a.row;
      let dir = 'walk_s';
      if (dx > 0) dir = 'walk_e';
      else if (dx < 0) dir = 'walk_w';
      else if (dy < 0) dir = 'walk_n';
      else if (dy > 0) dir = 'walk_s';
      if (u.anim) u.anim.play(dir);

      // Done?
      if (this._movePathIdx >= this._movePath.length - 1 && t >= 1) {
        const last = this._movePath[this._movePath.length - 1];
        u.col = last.col; u.row = last.row;
        const wc = this._grid.toWorldCenter(u.col, u.row);
        u.screenX = wc.x; u.screenY = wc.y + cs / 2 - 2;
        this._grid.placeOccupant(u, u.col, u.row);
        if (u.anim) u.anim.play(u.team === 'player' ? 'walk_s' : 'idle');

        if (u.team === 'player') {
          // After moving, reopen action menu with attack/spell/wait only
          const items = [
            { label: 'Attack', value: 'attack', enabled: this._anyAttackTargets(u) },
          ];
          if (u.spell) items.push({ label: u.spell.name, value: 'spell',
                                     enabled: this._anySpellTargets(u) });
          items.push({ label: 'Wait', value: 'wait', enabled: true });
          this._menu = new GF.CursorMenu({
            items,
            onSelect: it => this._onMenuSelect(it),
            onCancel: () => {},
            actions : { up: ['ArrowUp','KeyW'], down: ['ArrowDown','KeyS'],
                        select: ['Enter','Space','KeyZ'], cancel: ['Escape','KeyX'] },
          });
          this._phase = PHASE.UNIT_TURN;
        } else {
          // Enemy continues to attack phase
          this._enemyAttackPhase();
        }
      }
    }

    _updatePickTarget(dt, engine, isSpell) {
      this._moveCursor(engine);
      if (engine.input.wasPressed('cancel')) {
        this._audio.play('cancel');
        // Back to unit-turn or post-move menu
        this._phase = PHASE.UNIT_TURN;
        return;
      }
      if (engine.input.wasPressed('confirm')) {
        const valid = this._attackable.find(c => c.col === this._cursor.col && c.row === this._cursor.row);
        if (!valid) { this._audio.play('cancel'); return; }
        const target = this._grid.occupantAt(this._cursor.col, this._cursor.row);
        if (!target || target.dead || target.team === this._activeUnit.team) {
          this._audio.play('cancel'); return;
        }
        this._beginAttack(this._activeUnit, target, isSpell);
      }
    }

    _beginAttack(attacker, target, isSpell) {
      this._phase = PHASE.ANIM_ATTACK;
      this._audio.play(isSpell ? 'spell' : 'hit');
      // Schedule the hit and animation
      this._attackPending = {
        attacker, target, isSpell,
        timer: 0, duration: isSpell ? 0.65 : 0.5,
        applied: false,
      };
    }

    _updateAnimAttack(dt, engine) {
      const a = this._attackPending;
      if (!a) return;
      a.timer += dt;
      // Apply damage near the start of the animation
      if (!a.applied && a.timer > a.duration * 0.35) {
        a.applied = true;
        const dmg = this._calcDamage(a.attacker, a.target, a.isSpell);
        const before = a.target.hp;
        this._battle.dealDamage(a.target, dmg.amount, a.attacker);
        const dealt = before - a.target.hp;
        // Floating text
        this._floatingTexts.push({
          x: a.target.screenX, y: a.target.screenY - 32,
          text: dealt + (dmg.crit ? ' CRIT!' : ''),
          color: dmg.crit ? '#ffff66' : '#ffffff',
          t: 0,
        });
        // Particles
        this._particles.burst(a.target.screenX, a.target.screenY - 16, {
          count: 18, colors: a.isSpell
            ? ['#aa44ff','#ffffff','#ddaaff']
            : ['#ff4444','#ffaa44','#ffffff'],
          speed: [60, 200], life: [0.3, 0.7], size: [2, 5],
          fadeOut: true, shape: 'star',
        });
        if (dmg.crit) this._audio.play('crit');
        if (a.target.dead) {
          this._audio.play('death');
          this._floatingTexts.push({
            x: a.target.screenX, y: a.target.screenY - 50,
            text: 'DEFEATED', color: '#ff5566', t: 0,
          });
          this._grid.removeOccupant(a.target);
        }
      }
      if (a.timer >= a.duration) {
        this._attackPending = null;
        this._endActiveTurn();
      }
    }

    _calcDamage(attacker, target, isSpell) {
      const cfg = CFG().battle;
      let base;
      if (isSpell) {
        const [lo, hi] = attacker.spell.dmg;
        base = GF.Math.rand(lo, hi);
      } else {
        base = Math.max(1, attacker.atk - target.def * 0.6);
      }
      const variance = 1 + (Math.random() * 2 - 1) * cfg.damageVariance;
      base *= variance;
      const crit = !isSpell && Math.random() < (attacker.critChance || 0);
      if (crit) base *= cfg.critMultiplier;
      return { amount: Math.max(1, Math.round(base)), crit };
    }

    _updateEnemyThink(dt, engine) {
      this._enemyThinkTimer -= dt;
      if (this._enemyThinkTimer > 0) return;

      const u = this._activeUnit;
      // Find best target: nearest living player
      const targets = this._units.filter(t => t.team === 'player' && !t.dead);
      if (!targets.length) { this._endActiveTurn(); return; }
      let bestTarget = targets[0], bestDist = Infinity;
      for (const t of targets) {
        const d = GF.Grid.manhattan(u, t);
        if (d < bestDist) { bestDist = d; bestTarget = t; }
      }

      // Already in attack range?
      const inRange = bestDist >= u.attackRange.min && bestDist <= u.attackRange.max;
      if (inRange) {
        this._enemyAttackPhase(bestTarget);
        return;
      }

      // Find a tile in our reachable set that is adjacent (ideally min<=d<=max) to target
      const want = u.attackRange.max;
      const reach = this._grid.tilesInRange(u, u.move, { team: u.team, ignore: u });
      let bestCell = null, bestScore = Infinity;
      for (const cell of reach) {
        const d = Math.abs(cell.col - bestTarget.col) + Math.abs(cell.row - bestTarget.row);
        // Prefer cells that put us in attack range; otherwise minimise distance
        const score = (d >= u.attackRange.min && d <= u.attackRange.max) ? -100 + d : d * 10 + cell.cost;
        if (score < bestScore) { bestScore = score; bestCell = cell; }
      }

      if (bestCell && (bestCell.col !== u.col || bestCell.row !== u.row)) {
        const path = this._grid.findPath(
          { col: u.col, row: u.row }, { col: bestCell.col, row: bestCell.row },
          { team: u.team, ignore: u }
        );
        if (path && path.length > 1) {
          this._aiQueuedTarget = bestTarget;
          this._beginMoveAnim(path);
          return;
        }
      }
      // No useful move — try attack from current spot (rare) or just wait
      this._enemyAttackPhase(bestTarget);
    }

    _enemyAttackPhase(target) {
      const u = this._activeUnit;
      target = target || this._aiQueuedTarget;
      this._aiQueuedTarget = null;
      // Re-check range
      const targets = (this._units.filter(t =>
        t.team === 'player' && !t.dead &&
        GF.Grid.manhattan(u, t) >= u.attackRange.min &&
        GF.Grid.manhattan(u, t) <= u.attackRange.max
      ));
      const pick = targets.includes(target) ? target : targets[0];
      if (pick) {
        this._beginAttack(u, pick, false);
      } else {
        this._endActiveTurn();
      }
    }

    _moveCursor(engine) {
      let moved = false;
      if (engine.input.wasPressed('left'))  { this._cursor.col = Math.max(0, this._cursor.col - 1); moved = true; }
      if (engine.input.wasPressed('right')) { this._cursor.col = Math.min(this._chapter.cols - 1, this._cursor.col + 1); moved = true; }
      if (engine.input.wasPressed('up'))    { this._cursor.row = Math.max(0, this._cursor.row - 1); moved = true; }
      if (engine.input.wasPressed('down'))  { this._cursor.row = Math.min(this._chapter.rows - 1, this._cursor.row + 1); moved = true; }
      if (moved) this._audio.play('cursor');
    }

    // ── Render ───────────────────────────────────────────────────────────────

    render(ctx, engine) {
      const cfg  = CFG();
      const W    = engine.config.width;
      const H    = engine.config.height;
      const cs   = cfg.battle.cellSize;
      const ox   = cfg.battle.gridOffset.x, oy = cfg.battle.gridOffset.y;
      const ui   = GF.UISystem;

      // ── Battle map ───────────────────────────────────────────────────────
      for (let r = 0; r < this._chapter.rows; r++) {
        for (let c = 0; c < this._chapter.cols; c++) {
          drawBattleTile(ctx, this._chapter.terrain[r][c], ox + c * cs, oy + r * cs, cs);
        }
      }

      // Reachable highlights (when picking move)
      if (this._phase === PHASE.PICK_MOVE) {
        for (const cell of this._reachable) {
          ctx.fillStyle = cfg.ui.moveTileColor;
          ctx.fillRect(ox + cell.col * cs, oy + cell.row * cs, cs, cs);
        }
        // Path preview from active to cursor
        const path = this._grid.findPath(
          { col: this._activeUnit.col, row: this._activeUnit.row },
          { col: this._cursor.col, row: this._cursor.row },
          { team: this._activeUnit.team, ignore: this._activeUnit }
        );
        if (path) {
          ctx.fillStyle = cfg.ui.pathTileColor;
          for (let i = 1; i < path.length; i++) {
            ctx.fillRect(ox + path[i].col * cs + 8, oy + path[i].row * cs + 8, cs - 16, cs - 16);
          }
        }
      }
      // Attackable highlights
      if (this._phase === PHASE.PICK_ATTACK || this._phase === PHASE.PICK_SPELL) {
        for (const cell of this._attackable) {
          ctx.fillStyle = cfg.ui.attackTileColor;
          ctx.fillRect(ox + cell.col * cs, oy + cell.row * cs, cs, cs);
        }
      }

      // ── Units ─────────────────────────────────────────────────────────────
      // Sort by row so back-row draws behind front-row
      const sorted = this._units.filter(u => !u.dead).slice()
        .sort((a, b) => a.screenY - b.screenY);
      for (const u of sorted) {
        u.anim.draw(ctx, u.screenX, u.screenY);
        // Tiny HP bar above
        const barW = 24, barH = 3;
        const bx = u.screenX - barW / 2, by = u.screenY - 50;
        ctx.fillStyle = '#000000';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
        ctx.fillStyle = u.team === 'player' ? '#66ccff' : '#ff5566';
        ctx.fillRect(bx, by, Math.max(0, barW * (u.hp / u.maxHp)), barH);
        // Active marker
        if (u === this._activeUnit && this._phase !== PHASE.ANIM_MOVE && this._phase !== PHASE.ANIM_ATTACK) {
          const t = Date.now() / 200;
          ctx.fillStyle = u.team === 'player' ? '#88ddff' : '#ff8888';
          ctx.beginPath();
          ctx.moveTo(u.screenX - 5, by - 6 - Math.abs(Math.sin(t)) * 3);
          ctx.lineTo(u.screenX + 5, by - 6 - Math.abs(Math.sin(t)) * 3);
          ctx.lineTo(u.screenX,     by - 1);
          ctx.closePath();
          ctx.fill();
        }
      }

      // ── Cursor ────────────────────────────────────────────────────────────
      if (this._phase === PHASE.PICK_MOVE || this._phase === PHASE.PICK_ATTACK ||
          this._phase === PHASE.PICK_SPELL) {
        const cx = ox + this._cursor.col * cs, cy = oy + this._cursor.row * cs;
        const t = Date.now() / 250;
        const a = 0.6 + Math.sin(t) * 0.3;
        ctx.strokeStyle = cfg.ui.cursorColor;
        ctx.globalAlpha = a;
        ctx.lineWidth = 3;
        ctx.strokeRect(cx + 2, cy + 2, cs - 4, cs - 4);
        ctx.globalAlpha = 1;
      }

      // ── Floating texts ───────────────────────────────────────────────────
      for (const ft of this._floatingTexts) {
        const a = 1 - ft.t;
        ctx.globalAlpha = Math.max(0, a);
        ui.drawText(ctx, ft.text, ft.x, ft.y, {
          font: 'bold 14px monospace', color: ft.color, align: 'center', baseline: 'middle',
          stroke: '#000000', strokeWidth: 3,
        });
        ctx.globalAlpha = 1;
      }

      // ── Action menu ──────────────────────────────────────────────────────
      if (this._phase === PHASE.UNIT_TURN && this._menu) {
        const m = this._menu.measure();
        // Place near active unit but inside the screen
        let mx = this._activeUnit.screenX + 24;
        let my = this._activeUnit.screenY - m.height / 2;
        if (mx + m.width > W - 8) mx = W - 8 - m.width;
        if (my < 8)               my = 8;
        if (my + m.height > H - 88) my = H - 88 - m.height;
        this._menu.draw(ctx, mx, my);
      }

      // ── HUD ──────────────────────────────────────────────────────────────
      this._renderHUD(ctx, engine);

      // ── Hovered cell terrain info ────────────────────────────────────────
      if (this._phase === PHASE.PICK_MOVE || this._phase === PHASE.PICK_ATTACK || this._phase === PHASE.PICK_SPELL) {
        const t = this._chapter.terrain[this._cursor.row][this._cursor.col];
        const pal = TERRAIN_PALETTE[t];
        const occ = this._grid.occupantAt(this._cursor.col, this._cursor.row);
        let line = `Terrain: ${pal.name}`;
        if (occ) line += `   |   ${occ.name}  HP ${occ.hp}/${occ.maxHp}  ATK ${occ.atk}  DEF ${occ.def}`;
        ui.drawText(ctx, line, 16, 8, {
          font: cfg.ui.hudFont, color: '#ffffff', shadow: true,
        });
      }
    }

    _renderHUD(ctx, engine) {
      const W = engine.config.width, H = engine.config.height;
      const ui = GF.UISystem;
      const cfg = CFG();

      // Bottom panel
      ui.drawPanel(ctx, 8, H - 80, W - 16, 72, {
        bgColor: cfg.ui.panelBg, borderColor: cfg.ui.panelBorder, radius: 4, borderWidth: 2,
      });

      // Active unit
      const u = this._activeUnit;
      ui.drawText(ctx, this._chapter.title, 16, H - 70, {
        font: 'bold 13px monospace', color: cfg.ui.titleColor,
      });
      if (u) {
        ui.drawText(ctx, `${u.team === 'player' ? '★' : '✖'}  ${u.name}  (${u.clazz || 'Foe'})`,
          16, H - 50, { font: 'bold 14px monospace',
            color: u.team === 'player' ? cfg.ui.playerTeamColor : cfg.ui.enemyTeamColor });
        ui.drawText(ctx, `HP ${u.hp}/${u.maxHp}   ATK ${u.atk}   DEF ${u.def}   AGI ${u.agility}   MOV ${u.move}`,
          16, H - 30, { font: cfg.ui.hudFont, color: '#dddddd' });
      }

      // Right: party rolls
      const partyAlive = this._units.filter(p => p.team === 'player' && !p.dead);
      const enemyAlive = this._units.filter(p => p.team === 'enemy'  && !p.dead);
      ui.drawText(ctx, `Allies ${partyAlive.length}/${this._units.filter(p=>p.team==='player').length}`,
        W - 200, H - 50, { font: cfg.ui.hudFont, color: cfg.ui.playerTeamColor });
      ui.drawText(ctx, `Foes   ${enemyAlive.length}/${this._units.filter(p=>p.team==='enemy').length}`,
        W - 200, H - 30, { font: cfg.ui.hudFont, color: cfg.ui.enemyTeamColor });

      // Phase hint
      let hint = '';
      if (this._phase === PHASE.UNIT_TURN)   hint = '↑↓: choose   SPACE: confirm';
      if (this._phase === PHASE.PICK_MOVE)   hint = 'Move where?  SPACE: go   X: cancel';
      if (this._phase === PHASE.PICK_ATTACK) hint = 'Attack which target?  SPACE: hit   X: cancel';
      if (this._phase === PHASE.PICK_SPELL)  hint = 'Cast where?   SPACE: cast   X: cancel';
      if (this._phase === PHASE.ENEMY_THINK) hint = 'Enemy thinking…';
      ui.drawText(ctx, hint, W - 16, H - 70, {
        font: cfg.ui.hudFont, color: '#aaccee', align: 'right',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── GameOverScene / VictoryScene ───────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  class GameOverScene extends GF.Scene {
    init(engine) {
      this._t = 0;
      engine.input.bind('confirm', ...CFG().controls.confirm);
    }
    update(dt, engine) {
      this._t += dt;
      if (this._t > 1.0 && engine.input.wasPressed('confirm')) {
        engine.getSystem('SceneManager').replaceWithTransition(new TitleScene(),
          { type: 'fade', duration: 0.6, color: '#000000' });
      }
    }
    render(ctx, engine) {
      const W = engine.config.width, H = engine.config.height;
      const ui = GF.UISystem;
      ctx.fillStyle = '#0a0006';
      ctx.fillRect(0, 0, W, H);
      ui.drawText(ctx, 'YOUR FORCE HAS FALLEN', W / 2, H / 2 - 30, {
        font: 'bold 36px monospace', color: '#ff4455',
        align: 'center', baseline: 'middle',
        glow: '#ff0022', glowBlur: 24, stroke: '#220000', strokeWidth: 4,
      });
      ui.drawText(ctx, `Chapter ${State.chapterIdx + 1} ended in defeat.`, W/2, H/2 + 14, {
        font: '16px monospace', color: '#dd9999', align: 'center', baseline: 'middle',
      });
      if (this._t > 1.0 && Math.floor(this._t * 2) % 2 === 0) {
        ui.drawText(ctx, '— Press SPACE to return to the title —', W/2, H - 60, {
          font: '14px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
    }
  }

  class VictoryScene extends GF.Scene {
    init(engine) {
      this._t = 0;
      engine.input.bind('confirm', ...CFG().controls.confirm);
      try { engine.getSystem('AudioSystem').play('victory'); } catch(e) {}
    }
    update(dt, engine) {
      this._t += dt;
      if (this._t > 1.5 && engine.input.wasPressed('confirm')) {
        engine.getSystem('SceneManager').replaceWithTransition(new TitleScene(),
          { type: 'iris', duration: 0.8, color: '#000000' });
      }
    }
    render(ctx, engine) {
      const W = engine.config.width, H = engine.config.height;
      const ui = GF.UISystem;
      // Soft golden background
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
      grd.addColorStop(0, '#332211'); grd.addColorStop(1, '#000000');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      // Sparkles
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 87 + this._t * 30) % W) | 0;
        const sy = ((i * 53 + this._t * 13) % H) | 0;
        ctx.fillStyle = `rgba(255,${200 + (i%40)},${80 + (i%40)},${0.4 + 0.6 * Math.sin(this._t*2 + i)})`;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ui.drawText(ctx, 'THE REALM IS SAVED', W/2, H/2 - 30, {
        font: 'bold 38px monospace', color: '#ffdd66',
        align: 'center', baseline: 'middle',
        glow: '#ff9911', glowBlur: 28, stroke: '#332200', strokeWidth: 4,
      });
      ui.drawText(ctx, 'Your Force returns home in glory.', W/2, H/2 + 18, {
        font: '16px monospace', color: '#ffe6aa', align: 'center', baseline: 'middle',
      });
      if (this._t > 1.5 && Math.floor(this._t * 2) % 2 === 0) {
        ui.drawText(ctx, '— Press SPACE to return to the title —', W/2, H - 60, {
          font: '14px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Bootstrap ──────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  window.addEventListener('GF:ready', async function () {
    const cfg = CFG();
    const game = await GF.createGameAsync(cfg.engine, cfg.physics, {
      gameName: 'ShiningQuest',
      grids   : true,
      battle  : true,
      dialogue: true,
      tilemap : false,    // we render our own tile palette directly
      models  : false,
      setup(loader, game) {
        // Framework character sprites
        if (GF.sprites) game.sprites.registerSprites(GF.sprites);
        // Game-specific (monsters)
        if (GF.spriteRegistrations) {
          Object.values(GF.spriteRegistrations).forEach(map =>
            game.sprites.registerSprites(map));
        }
      },
    });

    const { engine, scenes } = game;
    scenes.push(new TitleScene(), engine);
    engine.start();
  });

})(window.GF = window.GF || {});
