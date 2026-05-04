// GameFramework/framework/sprites/ui.js
// Auto-generated framework loader for category "UI".
// Loads every spritesheet under /Sprites/UI/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/UI';

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

  // die - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('Die');
    const FW = 64, FH = 64;
    const animations = {};
    animations['rolling'] = {
      fps: 18, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 64, 0),
        makeFrameDrawer(sheet, FW, FH, 128, 0),
        makeFrameDrawer(sheet, FW, FH, 192, 0),
        makeFrameDrawer(sheet, FW, FH, 256, 0),
        makeFrameDrawer(sheet, FW, FH, 320, 0),
        makeFrameDrawer(sheet, FW, FH, 384, 0),
        makeFrameDrawer(sheet, FW, FH, 448, 0),
        makeFrameDrawer(sheet, FW, FH, 512, 0),
        makeFrameDrawer(sheet, FW, FH, 576, 0),
        makeFrameDrawer(sheet, FW, FH, 640, 0),
        makeFrameDrawer(sheet, FW, FH, 704, 0),
      ],
    };
    animations['face1'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 64),
      ],
    };
    animations['face2'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 128),
      ],
    };
    animations['face3'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 192),
      ],
    };
    animations['face4'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 256),
      ],
    };
    animations['face5'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 320),
      ],
    };
    animations['face6'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 384),
      ],
    };
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 448),
      ],
    };
    GF.sprites['die'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // pop_face_happy - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceHappy');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_happy'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // pop_face_neutral - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceNeutral');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_neutral'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // pop_face_sad - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceSad');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_sad'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // pop_face_angry - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('PopFaceAngry');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['pop_face_angry'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // ui_crown - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('UiCrown');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['ui_crown'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_economy - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardEconomy');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_economy'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_population - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardPopulation');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_population'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_resource - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardResource');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_resource'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_weather - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardWeather');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_weather'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

  // chance_card_social - 32x32, origin (16, 16)
  (function () {
    const sheet = loadSheet('ChanceCardSocial');
    const FW = 32, FH = 32;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['chance_card_social'] = {
      frameWidth: FW, frameHeight: FH, originX: 16, originY: 16,
      animations,
    };
  })();

})(window.GF = window.GF || {});