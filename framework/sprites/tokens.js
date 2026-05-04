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