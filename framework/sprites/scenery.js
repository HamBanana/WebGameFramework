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