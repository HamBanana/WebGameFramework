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