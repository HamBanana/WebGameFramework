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