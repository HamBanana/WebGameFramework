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