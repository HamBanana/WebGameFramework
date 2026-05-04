// GameFramework/framework/sprites/player.js
// Auto-generated framework loader for category "Player".
// Loads every spritesheet under /Sprites/Player/<Name>/ and registers
// it under GF.sprites[<spriteKey>] so games can use the sprite by name only.
//
// Asset paths live here (in the framework) - never in game code.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const BASE = '../../Sprites/Player';

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

  // playerShip - 36x22, origin (18, 22)
  (function () {
    const sheet = loadSheet('PlayerShip');
    const FW = 36, FH = 22;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 36, 0),
      ],
    };
    animations['dead'] = {
      fps: 12, loop: false,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 22),
        makeFrameDrawer(sheet, FW, FH, 36, 22),
        makeFrameDrawer(sheet, FW, FH, 72, 22),
      ],
    };
    GF.sprites['playerShip'] = {
      frameWidth: FW, frameHeight: FH, originX: 18, originY: 22,
      animations,
    };
  })();

  // playerBullet - 4x12, origin (2, 12)
  (function () {
    const sheet = loadSheet('PlayerBullet');
    const FW = 4, FH = 12;
    const animations = {};
    animations['idle'] = {
      fps: 12, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 4, 0),
      ],
    };
    GF.sprites['playerBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 2, originY: 12,
      animations,
    };
  })();

  // megaLaserBullet - 8x16, origin (4, 16)
  (function () {
    const sheet = loadSheet('MegaLaserBullet');
    const FW = 8, FH = 16;
    const animations = {};
    animations['idle'] = {
      fps: 14, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 8, 0),
      ],
    };
    GF.sprites['megaLaserBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 4, originY: 16,
      animations,
    };
  })();

  // alienBullet - 4x12, origin (2, 12)
  (function () {
    const sheet = loadSheet('AlienBullet');
    const FW = 4, FH = 12;
    const animations = {};
    animations['idle'] = {
      fps: 8, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 4, 0),
      ],
    };
    GF.sprites['alienBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 2, originY: 12,
      animations,
    };
  })();

  // bossBullet - 8x12, origin (4, 12)
  (function () {
    const sheet = loadSheet('BossBullet');
    const FW = 8, FH = 12;
    const animations = {};
    animations['idle'] = {
      fps: 10, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 8, 0),
      ],
    };
    GF.sprites['bossBullet'] = {
      frameWidth: FW, frameHeight: FH, originX: 4, originY: 12,
      animations,
    };
  })();

  // powerupRapidFire - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupRapidFire');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupRapidFire'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupDoubleShot - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupDoubleShot');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupDoubleShot'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupShield - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupShield');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 5, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupShield'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupSmartBomb - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupSmartBomb');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupSmartBomb'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupMegaLaser - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupMegaLaser');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupMegaLaser'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

  // powerupExtraLife - 20x20, origin (10, 10)
  (function () {
    const sheet = loadSheet('PowerupExtraLife');
    const FW = 20, FH = 20;
    const animations = {};
    animations['idle'] = {
      fps: 6, loop: true,
      frames: [
        makeFrameDrawer(sheet, FW, FH, 0, 0),
        makeFrameDrawer(sheet, FW, FH, 20, 0),
      ],
    };
    GF.sprites['powerupExtraLife'] = {
      frameWidth: FW, frameHeight: FH, originX: 10, originY: 10,
      animations,
    };
  })();

})(window.GF = window.GF || {});