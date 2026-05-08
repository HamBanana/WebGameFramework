// GameFramework/framework/sprites/portraits.js
// Auto-generated portrait loader. Portraits are single-frame images used
// by the DialogueSystem (getPortrait callback) and other UI elements.

(function (GF) {
  'use strict';
  GF.portraits = GF.portraits || {};

  const BASE = '../../Sprites/Portraits';

  // kestra
  GF.portraits['kestra'] = (function () {
    const img = new Image();
    img.src = BASE + '/Kestra/spritesheet.png';
    return img;
  })();

  // nori
  GF.portraits['nori'] = (function () {
    const img = new Image();
    img.src = BASE + '/Nori/spritesheet.png';
    return img;
  })();

  // barrat
  GF.portraits['barrat'] = (function () {
    const img = new Image();
    img.src = BASE + '/Barrat/spritesheet.png';
    return img;
  })();

  // king
  GF.portraits['king'] = (function () {
    const img = new Image();
    img.src = BASE + '/King/spritesheet.png';
    return img;
  })();

  // villager
  GF.portraits['villager'] = (function () {
    const img = new Image();
    img.src = BASE + '/Villager/spritesheet.png';
    return img;
  })();

  // darkLord
  GF.portraits['darkLord'] = (function () {
    const img = new Image();
    img.src = BASE + '/DarkLord/spritesheet.png';
    return img;
  })();

  // theMan -- 384x672 spritesheet (4 cols x 7 rows of 96x96 frames).
  // Animations (row, frames): idle (0,1) | laughing (1,4) | crying (2,4) |
  // angry (3,4) | sad (4,4) | talking (5,4) | shouting (6,4).
  GF.portraits['theMan'] = (function () {
    const img = new Image();
    img.src = BASE + '/TheMan/spritesheet.png';
    return img;
  })();

})(window.GF = window.GF || {});