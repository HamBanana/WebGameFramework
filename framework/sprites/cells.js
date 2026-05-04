// GameFramework/framework/sprites/cells.js
// Auto-generated framework loader for category "Cells".
// Loads every spritesheet under /Sprites/Cells/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Cells';

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

  // cell_normal - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellNormal');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_normal'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_start - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellStart');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_start'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_chance - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellChance');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_chance'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_market - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMarket');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_market'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_property - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellProperty');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_property'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_shop - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellShop');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_shop'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_toll_gate - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellTollGate');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_toll_gate'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_teleporter - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellTeleporter');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_teleporter'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_house - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellHouse');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_house'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_factory - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellFactory');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_factory'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_police_station - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellPoliceStation');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_police_station'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_vault - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellVault');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_vault'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_power_plant - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellPowerPlant');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_power_plant'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_well - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellWell');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_well'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMine');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine_coal - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMineCoal');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine_coal'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine_iron - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMineIron');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine_iron'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

  // cell_mine_oil - 64x64, origin (32, 32)
  (function () {
    const sheet = loadSheet('CellMineOil');
    const FW = 64, FH = 64;
    const animations = {};
    animations['idle'] = {
      fps: 1, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
      ],
    };
    GF.sprites['cell_mine_oil'] = {
      frameWidth: FW, frameHeight: FH, originX: 32, originY: 32,
      animations,
    };
  })();

})(window.GF = window.GF || {});