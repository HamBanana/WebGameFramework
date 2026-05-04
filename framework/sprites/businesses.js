// GameFramework/framework/sprites/businesses.js
// Auto-generated framework loader for category "Businesses".
// Loads every spritesheet under /Sprites/Businesses/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Businesses';

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

  // biz_shop - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizShop');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_shop'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_factory - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizFactory');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_factory'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_farm - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizFarm');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_farm'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_lumber_mill - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizLumberMill');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_lumber_mill'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_coal_mine - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizCoalMine');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_coal_mine'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_steel_mill - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizSteelMill');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_steel_mill'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_power_plant - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizPowerPlant');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_power_plant'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_oil_rig - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizOilRig');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_oil_rig'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_water_pump - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizWaterPump');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_water_pump'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

  // biz_service - 24x24, origin (12, 12)
  (function () {
    const sheet = loadSheet('BizService');
    const FW = 24, FH = 24;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['biz_service'] = {
      frameWidth: FW, frameHeight: FH, originX: 12, originY: 12,
      animations,
    };
  })();

})(window.GF = window.GF || {});