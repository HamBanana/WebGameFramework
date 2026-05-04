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