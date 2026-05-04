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