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