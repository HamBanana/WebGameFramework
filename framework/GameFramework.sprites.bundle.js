// GameFramework.sprites.bundle.js - AUTO-GENERATED, DO NOT EDIT
// Built: 2026-08-14T04:16:40.520Z
// Source: framework/build.js (sprites (optional))

// -- sprites/claude.js -------------------------------------------

// GameFramework/framework/sprites/claude.js
// Framework-level character sprite: "claude"
//
// This file owns the asset path for the Claude spritesheet so that games
// only have to reference the sprite by NAME — no asset paths leak into
// game code or config.js.
//
// Animations available on the "claude" sprite:
//   idle      — 8 frames, looping
//   walk_s    — 8 frames, looping (south / facing camera)
//   walk_n    — 8 frames, looping (north / facing away)
//   walk_e    — 8 frames, looping (east  / facing right)
//   walk_w    — 8 frames, looping (west  / facing left)
//   walk_se   — 8 frames, looping
//   walk_sw   — 8 frames, looping
//   walk_ne   — 8 frames, looping
//   walk_nw   — 8 frames, looping
//   scared    — 8 frames, looping
//   excited   — 8 frames, looping
//
// Each frame is 32 × 48 px. Origin is feet-center (16, 48) so positions
// passed to the animator's draw(ctx, x, y) place the character's feet at (x, y).

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  // ── Asset path (private to framework) ──────────────────────────────────────
  // Resolved relative to the host HTML page. By convention games live at
  // games/<name>/index.html, so the spritesheet at /Sprites/Claude/ is two
  // directories up.
  const SPRITESHEET_PATH = '../../Sprites/Claude/spritesheet.png';

  const FRAME_W   = 32;
  const FRAME_H   = 48;
  const ORIGIN_X  = 16;   // feet-center horizontally
  const ORIGIN_Y  = 48;   // feet-center vertically (bottom of frame)

  // Each row of the spritesheet maps to one animation, in this order:
  const ANIMATION_ROWS = [
    'idle',     // y =   0
    'walk_s',   // y =  48
    'walk_n',   // y =  96
    'walk_e',   // y = 144
    'walk_w',   // y = 192
    'walk_se',  // y = 240
    'walk_sw',  // y = 288
    'walk_ne',  // y = 336
    'walk_nw',  // y = 384
    'scared',   // y = 432
    'excited',  // y = 480
  ];
  const FRAMES_PER_ANIM = 8;

  // ── Image loading ──────────────────────────────────────────────────────────
  const image = new Image();
  image.src = SPRITESHEET_PATH;
  let loaded = false;
  image.addEventListener('load',  () => { loaded = true;  });
  image.addEventListener('error', () => {
    console.warn(`[claude sprite] failed to load spritesheet at ${SPRITESHEET_PATH}`);
  });

  // ── Build a draw function for one cell of the spritesheet ──────────────────
  function makeFrameDrawer(sx, sy) {
    return function (ctx) {
      // If the image hasn't loaded yet, draw a discreet placeholder block so
      // sprite consumers still have something to render.
      if (!loaded) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, FRAME_W - 4, FRAME_H - 4);
        return;
      }
      // Pixel-perfect blit. Imaging smoothing is left to the caller.
      ctx.drawImage(image, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    };
  }

  function makeAnimationFrames(rowIndex) {
    const sy = rowIndex * FRAME_H;
    const frames = [];
    for (let i = 0; i < FRAMES_PER_ANIM; i++) {
      frames.push(makeFrameDrawer(i * FRAME_W, sy));
    }
    return frames;
  }

  // ── Default tempo (frames per second) per animation tag ────────────────────
  const DEFAULT_FPS = {
    idle    :  6,
    walk_s  : 12,
    walk_n  : 12,
    walk_e  : 12,
    walk_w  : 12,
    walk_se : 12,
    walk_sw : 12,
    walk_ne : 12,
    walk_nw : 12,
    scared  :  8,
    excited :  9,
  };

  const animations = {};
  ANIMATION_ROWS.forEach((name, idx) => {
    animations[name] = {
      fps   : DEFAULT_FPS[name] || 10,
      loop  : true,
      frames: makeAnimationFrames(idx),
    };
  });

  // ── Register under the public name "claude" ───────────────────────────────
  GF.sprites['claude'] = {
    frameWidth : FRAME_W,
    frameHeight: FRAME_H,
    originX    : ORIGIN_X,
    originY    : ORIGIN_Y,
    animations : animations,
  };

})(window.GF = window.GF || {});


// -- sprites/claudia.js ------------------------------------------

// GameFramework/framework/sprites/claudia.js
// Framework-level character sprite: "claudia"
//
// Female counterpart to the "claude" sprite. Same frame layout / animation
// set so games can swap between the two without changing any animation
// names. Distinguishing visual features: long hair past the shoulders,
// pink hair-bow, A-line skirt instead of trousers.
//
// This file owns the asset path for the Claudia spritesheet so that games
// only have to reference the sprite by NAME — no asset paths leak into
// game code or config.js.
//
// Animations available on the "claudia" sprite:
//   idle      — 8 frames, looping
//   walk_s    — 8 frames, looping (south / facing camera)
//   walk_n    — 8 frames, looping (north / facing away)
//   walk_e    — 8 frames, looping (east  / facing right)
//   walk_w    — 8 frames, looping (west  / facing left)
//   walk_se   — 8 frames, looping
//   walk_sw   — 8 frames, looping
//   walk_ne   — 8 frames, looping
//   walk_nw   — 8 frames, looping
//   scared    — 8 frames, looping
//   excited   — 8 frames, looping
//
// Each frame is 32 × 48 px. Origin is feet-center (16, 48) so positions
// passed to the animator's draw(ctx, x, y) place the character's feet at (x, y).

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  // ── Asset path (private to framework) ──────────────────────────────────────
  // Resolved relative to the host HTML page. By convention games live at
  // games/<name>/index.html, so the spritesheet at /Sprites/Claudia/ is two
  // directories up.
  const SPRITESHEET_PATH = '../../Sprites/Claudia/spritesheet.png';

  const FRAME_W   = 32;
  const FRAME_H   = 48;
  const ORIGIN_X  = 16;   // feet-center horizontally
  const ORIGIN_Y  = 48;   // feet-center vertically (bottom of frame)

  // Each row of the spritesheet maps to one animation, in this order:
  const ANIMATION_ROWS = [
    'idle',     // y =   0
    'walk_s',   // y =  48
    'walk_n',   // y =  96
    'walk_e',   // y = 144
    'walk_w',   // y = 192
    'walk_se',  // y = 240
    'walk_sw',  // y = 288
    'walk_ne',  // y = 336
    'walk_nw',  // y = 384
    'scared',   // y = 432
    'excited',  // y = 480
  ];
  const FRAMES_PER_ANIM = 8;

  // ── Image loading ──────────────────────────────────────────────────────────
  const image = new Image();
  image.src = SPRITESHEET_PATH;
  let loaded = false;
  image.addEventListener('load',  () => { loaded = true;  });
  image.addEventListener('error', () => {
    console.warn(`[claudia sprite] failed to load spritesheet at ${SPRITESHEET_PATH}`);
  });

  // ── Build a draw function for one cell of the spritesheet ──────────────────
  function makeFrameDrawer(sx, sy) {
    return function (ctx) {
      // If the image hasn't loaded yet, draw a discreet placeholder block so
      // sprite consumers still have something to render.
      if (!loaded) {
        ctx.fillStyle = '#644';
        ctx.fillRect(2, 2, FRAME_W - 4, FRAME_H - 4);
        return;
      }
      // Pixel-perfect blit. Imaging smoothing is left to the caller.
      ctx.drawImage(image, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    };
  }

  function makeAnimationFrames(rowIndex) {
    const sy = rowIndex * FRAME_H;
    const frames = [];
    for (let i = 0; i < FRAMES_PER_ANIM; i++) {
      frames.push(makeFrameDrawer(i * FRAME_W, sy));
    }
    return frames;
  }

  // ── Default tempo (frames per second) per animation tag ────────────────────
  const DEFAULT_FPS = {
    idle    :  6,
    walk_s  : 12,
    walk_n  : 12,
    walk_e  : 12,
    walk_w  : 12,
    walk_se : 12,
    walk_sw : 12,
    walk_ne : 12,
    walk_nw : 12,
    scared  :  8,
    excited :  9,
  };

  const animations = {};
  ANIMATION_ROWS.forEach((name, idx) => {
    animations[name] = {
      fps   : DEFAULT_FPS[name] || 10,
      loop  : true,
      frames: makeAnimationFrames(idx),
    };
  });

  // ── Register under the public name "claudia" ──────────────────────────────
  GF.sprites['claudia'] = {
    frameWidth : FRAME_W,
    frameHeight: FRAME_H,
    originX    : ORIGIN_X,
    originY    : ORIGIN_Y,
    animations : animations,
  };

})(window.GF = window.GF || {});


// -- sprites/aliens.js -------------------------------------------

// GameFramework/framework/sprites/aliens.js
// Auto-generated framework loader for category "Aliens".
// Loads every spritesheet under /Sprites/Aliens/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Aliens';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // alienSquid - 32x24, origin (16, 24)
  (function () {
    const sheet = loadSheet('AlienSquid');
    const FW = 32, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    GF.sprites['alienSquid'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 24,
      animations,
    };
  })();

  // alienCrab - 32x24, origin (16, 24)
  (function () {
    const sheet = loadSheet('AlienCrab');
    const FW = 32, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    GF.sprites['alienCrab'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 24,
      animations,
    };
  })();

  // alienOctopus - 32x24, origin (16, 24)
  (function () {
    const sheet = loadSheet('AlienOctopus');
    const FW = 32, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    GF.sprites['alienOctopus'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 24,
      animations,
    };
  })();

  // alienUFO - 40x18, origin (20, 18)
  (function () {
    const sheet = loadSheet('AlienUFO');
    const FW = 40, FH = 18;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 40, 0),
      ],
    };
    GF.sprites['alienUFO'] = {
      frameWidth: FW, frameHeight: FH, originX: 20, originY: 18,
      animations,
    };
  })();

  // alienExplosion - 32x24, origin (16, 24)
  (function () {
    const sheet = loadSheet('AlienExplosion');
    const FW = 32, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
        makeFrameDrawer(sheet, FW, FH, 64, 0),
        makeFrameDrawer(sheet, FW, FH, 96, 0),
      ],
    };
    GF.sprites['alienExplosion'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 24,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/boss.js ---------------------------------------------

// GameFramework/framework/sprites/boss.js
// Auto-generated framework loader for category "Boss".
// Loads every spritesheet under /Sprites/Boss/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Boss';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // bossMothership - 96x56, origin (48, 56)
  (function () {
    const sheet = loadSheet('BossMothership');
    const FW = 96, FH = 56;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 96, 0),
      ],
    };
    animations['hit'] = {
      fps: 18, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 56),
        makeFrameDrawer(sheet, FW, FH, 96, 56),
        makeFrameDrawer(sheet, FW, FH, 192, 56),
      ],
    };
    GF.sprites['bossMothership'] = {
      frameWidth: FW, frameHeight: FH, originX: 48, originY: 56,
      animations,
    };
  })();

  // bossMinion - 24x18, origin (12, 18)
  (function () {
    const sheet = loadSheet('BossMinion');
    const FW = 24, FH = 18;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 24, 0),
      ],
    };
    GF.sprites['bossMinion'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 18,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/businesses.js ---------------------------------------

// GameFramework/framework/sprites/businesses.js
// Auto-generated framework loader for category "Businesses".
// Loads every spritesheet under /Sprites/Businesses/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Businesses';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // biz_shop - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizShop');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_shop'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_factory - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizFactory');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_factory'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_farm - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizFarm');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_farm'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_lumber_mill - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizLumberMill');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_lumber_mill'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_coal_mine - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizCoalMine');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_coal_mine'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_steel_mill - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizSteelMill');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_steel_mill'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_power_plant - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizPowerPlant');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_power_plant'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_oil_rig - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizOilRig');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_oil_rig'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_water_pump - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizWaterPump');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_water_pump'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_service - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizService');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_service'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/cells.js --------------------------------------------

// GameFramework/framework/sprites/cells.js
// Auto-generated framework loader for category "Cells".
// Loads every spritesheet under /Sprites/Cells/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Cells';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // cell_normal - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellNormal');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_normal'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_start - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellStart');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_start'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_chance - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellChance');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_chance'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_market - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMarket');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_market'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_property - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellProperty');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_property'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_shop - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellShop');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_shop'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_toll_gate - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellTollGate');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_toll_gate'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_teleporter - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellTeleporter');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_teleporter'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_house - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellHouse');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_house'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_factory - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellFactory');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_factory'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_police_station - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellPoliceStation');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_police_station'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_vault - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellVault');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_vault'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_power_plant - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellPowerPlant');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_power_plant'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_well - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellWell');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_well'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMine');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine_coal - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMineCoal');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine_coal'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine_iron - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMineIron');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine_iron'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine_oil - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMineOil');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine_oil'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/characters.js ---------------------------------------

// GameFramework/framework/sprites/characters.js
// Auto-generated framework loader for category "Characters".
// Loads every spritesheet under /Sprites/Characters/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Characters';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // hana - 52x76, origin (26, 76)
  (function () {
    const sheet = loadSheet('Hana');
    const FW = 52, FH = 76;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 52, 0),
        makeFrameDrawer(sheet, FW, FH, 104, 0),
        makeFrameDrawer(sheet, FW, FH, 156, 0),
      ],
    };
    animations['walk'] = {
      fps: 10, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 76),
        makeFrameDrawer(sheet, FW, FH, 52, 76),
        makeFrameDrawer(sheet, FW, FH, 104, 76),
        makeFrameDrawer(sheet, FW, FH, 156, 76),
        makeFrameDrawer(sheet, FW, FH, 208, 76),
        makeFrameDrawer(sheet, FW, FH, 260, 76),
      ],
    };
    animations['jump'] = {
      fps: 10, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 152),
        makeFrameDrawer(sheet, FW, FH, 52, 152),
      ],
    };
    animations['fall'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 228),
      ],
    };
    animations['crouch'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 304),
      ],
    };
    animations['block'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 380),
      ],
    };
    animations['lightPunch'] = {
      fps: 16, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 456),
        makeFrameDrawer(sheet, FW, FH, 52, 456),
        makeFrameDrawer(sheet, FW, FH, 104, 456),
        makeFrameDrawer(sheet, FW, FH, 156, 456),
        makeFrameDrawer(sheet, FW, FH, 208, 456),
      ],
    };
    animations['heavyPunch'] = {
      fps: 12, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 532),
        makeFrameDrawer(sheet, FW, FH, 52, 532),
        makeFrameDrawer(sheet, FW, FH, 104, 532),
        makeFrameDrawer(sheet, FW, FH, 156, 532),
        makeFrameDrawer(sheet, FW, FH, 208, 532),
        makeFrameDrawer(sheet, FW, FH, 260, 532),
      ],
    };
    animations['lightKick'] = {
      fps: 14, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 608),
        makeFrameDrawer(sheet, FW, FH, 52, 608),
        makeFrameDrawer(sheet, FW, FH, 104, 608),
        makeFrameDrawer(sheet, FW, FH, 156, 608),
        makeFrameDrawer(sheet, FW, FH, 208, 608),
      ],
    };
    animations['heavyKick'] = {
      fps: 12, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 684),
        makeFrameDrawer(sheet, FW, FH, 52, 684),
        makeFrameDrawer(sheet, FW, FH, 104, 684),
        makeFrameDrawer(sheet, FW, FH, 156, 684),
        makeFrameDrawer(sheet, FW, FH, 208, 684),
        makeFrameDrawer(sheet, FW, FH, 260, 684),
      ],
    };
    animations['special'] = {
      fps: 10, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 760),
        makeFrameDrawer(sheet, FW, FH, 52, 760),
        makeFrameDrawer(sheet, FW, FH, 104, 760),
        makeFrameDrawer(sheet, FW, FH, 156, 760),
        makeFrameDrawer(sheet, FW, FH, 208, 760),
        makeFrameDrawer(sheet, FW, FH, 260, 760),
      ],
    };
    animations['hit'] = {
      fps: 10, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 836),
        makeFrameDrawer(sheet, FW, FH, 52, 836),
      ],
    };
    animations['ko'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 912),
        makeFrameDrawer(sheet, FW, FH, 52, 912),
        makeFrameDrawer(sheet, FW, FH, 104, 912),
      ],
    };
    animations['victory'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 988),
        makeFrameDrawer(sheet, FW, FH, 52, 988),
      ],
    };
    GF.sprites['hana'] = {
      frameWidth: FW, frameHeight: FH, originX: 26, originY: 76,
      animations,
    };
  })();

  // kuro - 48x76, origin (24, 76)
  (function () {
    const sheet = loadSheet('Kuro');
    const FW = 48, FH = 76;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 48, 0),
        makeFrameDrawer(sheet, FW, FH, 96, 0),
        makeFrameDrawer(sheet, FW, FH, 144, 0),
      ],
    };
    animations['walk'] = {
      fps: 10, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 76),
        makeFrameDrawer(sheet, FW, FH, 48, 76),
        makeFrameDrawer(sheet, FW, FH, 96, 76),
        makeFrameDrawer(sheet, FW, FH, 144, 76),
        makeFrameDrawer(sheet, FW, FH, 192, 76),
        makeFrameDrawer(sheet, FW, FH, 240, 76),
      ],
    };
    animations['jump'] = {
      fps: 10, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 152),
        makeFrameDrawer(sheet, FW, FH, 48, 152),
      ],
    };
    animations['fall'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 228),
      ],
    };
    animations['crouch'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 304),
      ],
    };
    animations['block'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 380),
      ],
    };
    animations['lightPunch'] = {
      fps: 16, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 456),
        makeFrameDrawer(sheet, FW, FH, 48, 456),
        makeFrameDrawer(sheet, FW, FH, 96, 456),
        makeFrameDrawer(sheet, FW, FH, 144, 456),
        makeFrameDrawer(sheet, FW, FH, 192, 456),
      ],
    };
    animations['heavyPunch'] = {
      fps: 12, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 532),
        makeFrameDrawer(sheet, FW, FH, 48, 532),
        makeFrameDrawer(sheet, FW, FH, 96, 532),
        makeFrameDrawer(sheet, FW, FH, 144, 532),
        makeFrameDrawer(sheet, FW, FH, 192, 532),
        makeFrameDrawer(sheet, FW, FH, 240, 532),
      ],
    };
    animations['lightKick'] = {
      fps: 14, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 608),
        makeFrameDrawer(sheet, FW, FH, 48, 608),
        makeFrameDrawer(sheet, FW, FH, 96, 608),
        makeFrameDrawer(sheet, FW, FH, 144, 608),
        makeFrameDrawer(sheet, FW, FH, 192, 608),
      ],
    };
    animations['heavyKick'] = {
      fps: 12, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 684),
        makeFrameDrawer(sheet, FW, FH, 48, 684),
        makeFrameDrawer(sheet, FW, FH, 96, 684),
        makeFrameDrawer(sheet, FW, FH, 144, 684),
        makeFrameDrawer(sheet, FW, FH, 192, 684),
        makeFrameDrawer(sheet, FW, FH, 240, 684),
      ],
    };
    animations['special'] = {
      fps: 10, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 760),
        makeFrameDrawer(sheet, FW, FH, 48, 760),
        makeFrameDrawer(sheet, FW, FH, 96, 760),
        makeFrameDrawer(sheet, FW, FH, 144, 760),
        makeFrameDrawer(sheet, FW, FH, 192, 760),
        makeFrameDrawer(sheet, FW, FH, 240, 760),
      ],
    };
    animations['hit'] = {
      fps: 10, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 836),
        makeFrameDrawer(sheet, FW, FH, 48, 836),
      ],
    };
    animations['ko'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 912),
        makeFrameDrawer(sheet, FW, FH, 48, 912),
        makeFrameDrawer(sheet, FW, FH, 96, 912),
      ],
    };
    animations['victory'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 988),
        makeFrameDrawer(sheet, FW, FH, 48, 988),
      ],
    };
    GF.sprites['kuro'] = {
      frameWidth: FW, frameHeight: FH, originX: 24, originY: 76,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/landmarks.js ----------------------------------------

// GameFramework/framework/sprites/landmarks.js
// Auto-generated framework loader for category "Landmarks".
// Loads every spritesheet under /Sprites/Landmarks/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Landmarks';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // windmill - 60x96, origin (30, 96)
  (function () {
    const sheet = loadSheet('Windmill');
    const FW = 60, FH = 96;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 60, 0),
        makeFrameDrawer(sheet, FW, FH, 120, 0),
        makeFrameDrawer(sheet, FW, FH, 180, 0),
      ],
    };
    GF.sprites['windmill'] = {
      frameWidth: FW, frameHeight: FH, originX: 30, originY: 96,
      animations,
    };
  })();

  // lighthouse - 80x96, origin (19, 96)
  (function () {
    const sheet = loadSheet('Lighthouse');
    const FW = 80, FH = 96;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 80, 0),
        makeFrameDrawer(sheet, FW, FH, 160, 0),
        makeFrameDrawer(sheet, FW, FH, 240, 0),
      ],
    };
    GF.sprites['lighthouse'] = {
      frameWidth: FW, frameHeight: FH, originX: 19, originY: 96,
      animations,
    };
  })();

  // church - 56x64, origin (28, 64)
  (function () {
    const sheet = loadSheet('Church');
    const FW = 56, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['church'] = {
      frameWidth: FW, frameHeight: FH, originX: 28, originY: 64,
      animations,
    };
  })();

  // farmhouse - 64x40, origin (32, 40)
  (function () {
    const sheet = loadSheet('Farmhouse');
    const FW = 64, FH = 40;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['farmhouse'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 40,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/monsters.js -----------------------------------------

// GameFramework/framework/sprites/monsters.js
// Auto-generated framework loader for category "Monsters".
// Loads every spritesheet under /Sprites/Monsters/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Monsters';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // goblin - 32x32, origin (16, 32)
  (function () {
    const sheet = loadSheet('Goblin');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    animations['hit'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 32),
      ],
    };
    GF.sprites['goblin'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 32,
      animations,
    };
  })();

  // skeleton - 32x32, origin (16, 32)
  (function () {
    const sheet = loadSheet('Skeleton');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    animations['hit'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 32),
      ],
    };
    GF.sprites['skeleton'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 32,
      animations,
    };
  })();

  // bat - 32x32, origin (16, 32)
  (function () {
    const sheet = loadSheet('Bat');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    animations['hit'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 32),
      ],
    };
    GF.sprites['bat'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 32,
      animations,
    };
  })();

  // darkMage - 32x32, origin (16, 32)
  (function () {
    const sheet = loadSheet('DarkMage');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    animations['hit'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 32),
      ],
    };
    GF.sprites['darkMage'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 32,
      animations,
    };
  })();

  // dragon - 32x32, origin (16, 32)
  (function () {
    const sheet = loadSheet('Dragon');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
      ],
    };
    animations['hit'] = {
      fps: 6, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 32),
      ],
    };
    GF.sprites['dragon'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 32,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/player.js -------------------------------------------

// GameFramework/framework/sprites/player.js
// Auto-generated framework loader for category "Player".
// Loads every spritesheet under /Sprites/Player/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Player';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // playerShip - 36x22, origin (18, 22)
  (function () {
    const sheet = loadSheet('PlayerShip');
    const FW = 36, FH = 22;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
      ],
    };
    animations['dead'] = {
      fps: 12, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 22),
        makeFrameDrawer(sheet, FW, FH, 36, 22),
        makeFrameDrawer(sheet, FW, FH, 72, 22),
      ],
    };
    GF.sprites['playerShip'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 22,
      animations,
    };
  })();

  // playerBullet - 4x12, origin (2, 12)
  (function () {
    const sheet = loadSheet('PlayerBullet');
    const FW = 4, FH = 12;
    const animations = {};
    animations['idle'] = {
      fps: 12, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 4, 0),
      ],
    };
    GF.sprites['playerBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 2, originY: 12,
      animations,
    };
  })();

  // megaLaserBullet - 8x16, origin (4, 16)
  (function () {
    const sheet = loadSheet('MegaLaserBullet');
    const FW = 8, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 14, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 8, 0),
      ],
    };
    GF.sprites['megaLaserBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 4, originY: 16,
      animations,
    };
  })();

  // alienBullet - 4x12, origin (2, 12)
  (function () {
    const sheet = loadSheet('AlienBullet');
    const FW = 4, FH = 12;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 4, 0),
      ],
    };
    GF.sprites['alienBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 2, originY: 12,
      animations,
    };
  })();

  // bossBullet - 8x12, origin (4, 12)
  (function () {
    const sheet = loadSheet('BossBullet');
    const FW = 8, FH = 12;
    const animations = {};
    animations['idle'] = {
      fps: 10, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 8, 0),
      ],
    };
    GF.sprites['bossBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 4, originY: 12,
      animations,
    };
  })();

  // powerupRapidFire - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupRapidFire');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupRapidFire'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupDoubleShot - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupDoubleShot');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupDoubleShot'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupShield - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupShield');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupShield'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupSmartBomb - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupSmartBomb');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupSmartBomb'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupMegaLaser - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupMegaLaser');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupMegaLaser'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupExtraLife - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupExtraLife');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupExtraLife'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/portraits.js ----------------------------------------

// GameFramework/framework/sprites/portraits.js
// Auto-generated portrait loader. Portraits are single-frame images used
// by the DialogueSystem (getPortrait callback) and other UI elements.

(function (GF) {
  'use strict';
  GF.portraits = GF.portraits || {};

  const BASE = '../../Sprites/Portraits';

  // kestra
  GF.portraits['kestra'] = (function () {
    const img = new Image();
    img.src = BASE + '/Kestra/spritesheet.png';
    return img;
  })();

  // nori
  GF.portraits['nori'] = (function () {
    const img = new Image();
    img.src = BASE + '/Nori/spritesheet.png';
    return img;
  })();

  // barrat
  GF.portraits['barrat'] = (function () {
    const img = new Image();
    img.src = BASE + '/Barrat/spritesheet.png';
    return img;
  })();

  // king
  GF.portraits['king'] = (function () {
    const img = new Image();
    img.src = BASE + '/King/spritesheet.png';
    return img;
  })();

  // villager
  GF.portraits['villager'] = (function () {
    const img = new Image();
    img.src = BASE + '/Villager/spritesheet.png';
    return img;
  })();

  // darkLord
  GF.portraits['darkLord'] = (function () {
    const img = new Image();
    img.src = BASE + '/DarkLord/spritesheet.png';
    return img;
  })();

  // theMan -- 384x672 spritesheet (4 cols x 7 rows of 96x96 frames).
  // Animations (row, frames): idle (0,1) | laughing (1,4) | crying (2,4) |
  // angry (3,4) | sad (4,4) | talking (5,4) | shouting (6,4).
  GF.portraits['theMan'] = (function () {
    const img = new Image();
    img.src = BASE + '/TheMan/spritesheet.png';
    return img;
  })();

})(window.GF = window.GF || {});

// -- sprites/resources.js ----------------------------------------

// GameFramework/framework/sprites/resources.js
// Auto-generated framework loader for category "Resources".
// Loads every spritesheet under /Sprites/Resources/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Resources';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // res_wood - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResWood');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_wood'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

  // res_steel - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResSteel');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_steel'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

  // res_electricity - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResElectricity');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_electricity'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

  // res_water - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResWater');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_water'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

  // res_food - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResFood');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_food'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

  // res_coal - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResCoal');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_coal'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

  // res_oil - 16x16, origin (8, 8)
  (function () {
    const sheet = loadSheet('ResOil');
    const FW = 16, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['res_oil'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 8,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/scenery.js ------------------------------------------

// GameFramework/framework/sprites/scenery.js
// Auto-generated framework loader for category "Scenery".
// Loads every spritesheet under /Sprites/Scenery/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Scenery';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // tree_pine - 40x64, origin (20, 64)
  (function () {
    const sheet = loadSheet('TreePine');
    const FW = 40, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['tree_pine'] = {
      frameWidth: FW, frameHeight: FH, originX: 20, originY: 64,
      animations,
    };
  })();

  // tree_birch - 36x70, origin (18, 70)
  (function () {
    const sheet = loadSheet('TreeBirch');
    const FW = 36, FH = 70;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['tree_birch'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 70,
      animations,
    };
  })();

  // bush - 28x18, origin (14, 18)
  (function () {
    const sheet = loadSheet('Bush');
    const FW = 28, FH = 18;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['bush'] = {
      frameWidth: FW, frameHeight: FH, originX: 14, originY: 18,
      animations,
    };
  })();

  // signpost - 28x38, origin (14, 38)
  (function () {
    const sheet = loadSheet('Signpost');
    const FW = 28, FH = 38;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['signpost'] = {
      frameWidth: FW, frameHeight: FH, originX: 14, originY: 38,
      animations,
    };
  })();

  // milestone - 20x22, origin (10, 22)
  (function () {
    const sheet = loadSheet('Milestone');
    const FW = 20, FH = 22;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['milestone'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 22,
      animations,
    };
  })();

  // cloud_small - 48x18, origin (24, 18)
  (function () {
    const sheet = loadSheet('CloudSmall');
    const FW = 48, FH = 18;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cloud_small'] = {
      frameWidth: FW, frameHeight: FH, originX: 24, originY: 18,
      animations,
    };
  })();

  // cloud_big - 78x28, origin (39, 28)
  (function () {
    const sheet = loadSheet('CloudBig');
    const FW = 78, FH = 28;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cloud_big'] = {
      frameWidth: FW, frameHeight: FH, originX: 39, originY: 28,
      animations,
    };
  })();

  // sun - 40x40, origin (20, 20)
  (function () {
    const sheet = loadSheet('Sun');
    const FW = 40, FH = 40;
    const animations = {};
    animations['idle'] = {
      fps: 3, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 40, 0),
        makeFrameDrawer(sheet, FW, FH, 80, 0),
        makeFrameDrawer(sheet, FW, FH, 120, 0),
      ],
    };
    GF.sprites['sun'] = {
      frameWidth: FW, frameHeight: FH, originX: 20, originY: 20,
      animations,
    };
  })();

  // moon - 36x36, origin (18, 18)
  (function () {
    const sheet = loadSheet('Moon');
    const FW = 36, FH = 36;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['moon'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 18,
      animations,
    };
  })();

  // star - 8x8, origin (4, 4)
  (function () {
    const sheet = loadSheet('Star');
    const FW = 8, FH = 8;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 8, 0),
        makeFrameDrawer(sheet, FW, FH, 16, 0),
        makeFrameDrawer(sheet, FW, FH, 24, 0),
      ],
    };
    GF.sprites['star'] = {
      frameWidth: FW, frameHeight: FH, originX: 4, originY: 4,
      animations,
    };
  })();

  // fence - 32x18, origin (16, 18)
  (function () {
    const sheet = loadSheet('Fence');
    const FW = 32, FH = 18;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['fence'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 18,
      animations,
    };
  })();

  // building_city - 80x60, origin (40, 60)
  (function () {
    const sheet = loadSheet('BuildingCity');
    const FW = 80, FH = 60;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['building_city'] = {
      frameWidth: FW, frameHeight: FH, originX: 40, originY: 60,
      animations,
    };
  })();

  // road_tile - 32x16, origin (0, 16)
  (function () {
    const sheet = loadSheet('RoadTile');
    const FW = 32, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['road_tile'] = {
      frameWidth: FW, frameHeight: FH, originX: 0, originY: 16,
      animations,
    };
  })();

  // grass_tile - 32x16, origin (0, 16)
  (function () {
    const sheet = loadSheet('GrassTile');
    const FW = 32, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['grass_tile'] = {
      frameWidth: FW, frameHeight: FH, originX: 0, originY: 16,
      animations,
    };
  })();

  // beach_tile - 32x16, origin (0, 16)
  (function () {
    const sheet = loadSheet('BeachTile');
    const FW = 32, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['beach_tile'] = {
      frameWidth: FW, frameHeight: FH, originX: 0, originY: 16,
      animations,
    };
  })();

  // wave - 48x10, origin (24, 10)
  (function () {
    const sheet = loadSheet('Wave');
    const FW = 48, FH = 10;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 48, 0),
        makeFrameDrawer(sheet, FW, FH, 96, 0),
        makeFrameDrawer(sheet, FW, FH, 144, 0),
      ],
    };
    GF.sprites['wave'] = {
      frameWidth: FW, frameHeight: FH, originX: 24, originY: 10,
      animations,
    };
  })();

  // snowflake_pile - 20x10, origin (10, 10)
  (function () {
    const sheet = loadSheet('SnowflakePile');
    const FW = 20, FH = 10;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['snowflake_pile'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/tokens.js -------------------------------------------

// GameFramework/framework/sprites/tokens.js
// Auto-generated framework loader for category "Tokens".
// Loads every spritesheet under /Sprites/Tokens/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Tokens';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // token_red - 36x44, origin (18, 40)
  (function () {
    const sheet = loadSheet('TokenRed');
    const FW = 36, FH = 44;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
        makeFrameDrawer(sheet, FW, FH, 72, 0),
        makeFrameDrawer(sheet, FW, FH, 108, 0),
      ],
    };
    GF.sprites['token_red'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 40,
      animations,
    };
  })();

  // token_blue - 36x44, origin (18, 40)
  (function () {
    const sheet = loadSheet('TokenBlue');
    const FW = 36, FH = 44;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
        makeFrameDrawer(sheet, FW, FH, 72, 0),
        makeFrameDrawer(sheet, FW, FH, 108, 0),
      ],
    };
    GF.sprites['token_blue'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 40,
      animations,
    };
  })();

  // token_green - 36x44, origin (18, 40)
  (function () {
    const sheet = loadSheet('TokenGreen');
    const FW = 36, FH = 44;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
        makeFrameDrawer(sheet, FW, FH, 72, 0),
        makeFrameDrawer(sheet, FW, FH, 108, 0),
      ],
    };
    GF.sprites['token_green'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 40,
      animations,
    };
  })();

  // token_yellow - 36x44, origin (18, 40)
  (function () {
    const sheet = loadSheet('TokenYellow');
    const FW = 36, FH = 44;
    const animations = {};
    animations['idle'] = {
      fps: 4, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
        makeFrameDrawer(sheet, FW, FH, 72, 0),
        makeFrameDrawer(sheet, FW, FH, 108, 0),
      ],
    };
    GF.sprites['token_yellow'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 40,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/ui.js -----------------------------------------------

// GameFramework/framework/sprites/ui.js
// Auto-generated framework loader for category "UI".
// Loads every spritesheet under /Sprites/UI/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/UI';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // die - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('Die');
    const FW = 64, FH = 64;
    const animations = {};
    animations['rolling'] = {
      fps: 18, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 64, 0),
        makeFrameDrawer(sheet, FW, FH, 128, 0),
        makeFrameDrawer(sheet, FW, FH, 192, 0),
        makeFrameDrawer(sheet, FW, FH, 256, 0),
        makeFrameDrawer(sheet, FW, FH, 320, 0),
        makeFrameDrawer(sheet, FW, FH, 384, 0),
        makeFrameDrawer(sheet, FW, FH, 448, 0),
        makeFrameDrawer(sheet, FW, FH, 512, 0),
        makeFrameDrawer(sheet, FW, FH, 576, 0),
        makeFrameDrawer(sheet, FW, FH, 640, 0),
        makeFrameDrawer(sheet, FW, FH, 704, 0),
      ],
    };
    animations['face1'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 64),
      ],
    };
    animations['face2'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 128),
      ],
    };
    animations['face3'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 192),
      ],
    };
    animations['face4'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 256),
      ],
    };
    animations['face5'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 320),
      ],
    };
    animations['face6'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 384),
      ],
    };
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 448),
      ],
    };
    GF.sprites['die'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // pop_face_happy - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceHappy');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_happy'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // pop_face_neutral - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceNeutral');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_neutral'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // pop_face_sad - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceSad');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_sad'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // pop_face_angry - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceAngry');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_angry'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // ui_crown - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('UiCrown');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['ui_crown'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_economy - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardEconomy');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_economy'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_population - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardPopulation');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_population'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_resource - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardResource');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_resource'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_weather - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardWeather');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_weather'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_social - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardSocial');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_social'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/vehicles.js -----------------------------------------

// GameFramework/framework/sprites/vehicles.js
// Auto-generated framework loader for category "Vehicles".
// Loads every spritesheet under /Sprites/Vehicles/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Vehicles';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // car_red - 32x20, origin (16, 20)
  (function () {
    const sheet = loadSheet('CarRed');
    const FW = 32, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['car_red'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 20,
      animations,
    };
  })();

  // car_blue - 32x20, origin (16, 20)
  (function () {
    const sheet = loadSheet('CarBlue');
    const FW = 32, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['car_blue'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 20,
      animations,
    };
  })();

  // cyclist - 18x24, origin (9, 24)
  (function () {
    const sheet = loadSheet('Cyclist');
    const FW = 18, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 18, 0),
      ],
    };
    GF.sprites['cyclist'] = {
      frameWidth: FW, frameHeight: FH, originX: 9, originY: 24,
      animations,
    };
  })();

  // hiker - 14x26, origin (7, 26)
  (function () {
    const sheet = loadSheet('Hiker');
    const FW = 14, FH = 26;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 14, 0),
      ],
    };
    GF.sprites['hiker'] = {
      frameWidth: FW, frameHeight: FH, originX: 7, originY: 26,
      animations,
    };
  })();

  // tractor - 40x28, origin (20, 28)
  (function () {
    const sheet = loadSheet('Tractor');
    const FW = 40, FH = 28;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['tractor'] = {
      frameWidth: FW, frameHeight: FH, originX: 20, originY: 28,
      animations,
    };
  })();

})(window.GF = window.GF || {});

// -- sprites/wildlife.js -----------------------------------------

// GameFramework/framework/sprites/wildlife.js
// Auto-generated framework loader for category "Wildlife".
// Loads every spritesheet under /Sprites/Wildlife/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Wildlife';

  const _imageCache = {};
  function loadSheet(folder) {
    if (_imageCache[folder]) return _imageCache[folder];
    const img = new Image();
    img.src = BASE + '/' + folder + '/spritesheet.png';
    let loaded = false;
    img.addEventListener('load',  () => { loaded = true; });
    img.addEventListener('error', () => {
      console.warn('[' + folder + '] failed to load ' + img.src);
    });
    return _imageCache[folder] = { img, isLoaded: () => loaded };
  }

  function makeFrameDrawer(sheet, fw, fh, sx, sy) {
    return function (ctx) {
      if (!sheet.isLoaded()) {
        ctx.fillStyle = '#446';
        ctx.fillRect(2, 2, fw - 4, fh - 4);
        return;
      }
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
    };
  }

  // cow - 36x26, origin (18, 26)
  (function () {
    const sheet = loadSheet('Cow');
    const FW = 36, FH = 26;
    const animations = {};
    animations['idle'] = {
      fps: 2, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
        makeFrameDrawer(sheet, FW, FH, 72, 0),
        makeFrameDrawer(sheet, FW, FH, 108, 0),
      ],
    };
    GF.sprites['cow'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 26,
      animations,
    };
  })();

  // sheep - 22x20, origin (11, 20)
  (function () {
    const sheet = loadSheet('Sheep');
    const FW = 22, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['sheep'] = {
      frameWidth: FW, frameHeight: FH, originX: 11, originY: 20,
      animations,
    };
  })();

  // deer - 30x30, origin (15, 30)
  (function () {
    const sheet = loadSheet('Deer');
    const FW = 30, FH = 30;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['deer'] = {
      frameWidth: FW, frameHeight: FH, originX: 15, originY: 30,
      animations,
    };
  })();

  // bird - 16x10, origin (8, 5)
  (function () {
    const sheet = loadSheet('Bird');
    const FW = 16, FH = 10;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 16, 0),
        makeFrameDrawer(sheet, FW, FH, 32, 0),
        makeFrameDrawer(sheet, FW, FH, 48, 0),
      ],
    };
    GF.sprites['bird'] = {
      frameWidth: FW, frameHeight: FH, originX: 8, originY: 5,
      animations,
    };
  })();

  // swan - 24x18, origin (12, 18)
  (function () {
    const sheet = loadSheet('Swan');
    const FW = 24, FH = 18;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['swan'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 18,
      animations,
    };
  })();

  // rabbit - 14x14, origin (7, 14)
  (function () {
    const sheet = loadSheet('Rabbit');
    const FW = 14, FH = 14;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['rabbit'] = {
      frameWidth: FW, frameHeight: FH, originX: 7, originY: 14,
      animations,
    };
  })();

})(window.GF = window.GF || {});