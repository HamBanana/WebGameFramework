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