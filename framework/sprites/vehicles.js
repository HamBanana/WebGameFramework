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