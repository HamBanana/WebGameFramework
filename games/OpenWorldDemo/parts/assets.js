// parts/assets.js — preloads every PNG this game draws directly with ctx.drawImage.
// Images live in games/OpenWorldDemo/sprites/ (copied from the framework sprite
// packs with clean, space-free names). Each becomes G.state.img[name] = Image.
(function (G) {
  'use strict';
  G.state = G.state || {};
  G.state.img = G.state.img || {};

  const NAMES = [
    // top-down cars (racing + parking packs) — all point NORTH (up)
    'car_black', 'car_blue', 'car_green', 'car_red', 'car_yellow',
    'car_red2', 'car_blue2', 'car_green_small', 'pcar_purple', 'pcar_orange', 'moto_red',
    // top-down characters
    'char_player', 'char_npc1', 'char_npc2', 'char_npc3',
    // props
    'tree_small', 'tree_large', 'rock', 'barrel', 'cone', 'tires', 'tent',
    // buildings (public-domain pack — drawn as upright billboards)
    'bld_church', 'bld_cathedral', 'bld_gate', 'bld_house',
    // ambient
    'bird', 'crow',
    // isometric vehicle spritesheets (256x256 = 8 types x 8 headings, 32px cells)
    'iso_red', 'iso_blue', 'iso_green', 'iso_yellow',
    'iso_black', 'iso_white', 'iso_orange', 'iso_grey',
  ];

  NAMES.forEach((n) => {
    const img = new Image();
    img.src = 'sprites/' + n + '.png';
    G.state.img[n] = img;
  });

  // Draw a north-pointing sprite centred at (x,y feet-ish), rotated to `angle`
  // (radians, 0 = east, +y down), scaled by `scale`. Anchor is sprite centre.
  G.drawRotated = function (ctx, img, x, y, angle, scale) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2); // sprite forward is (-Y) -> align to heading
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  };

  // Draw an upright billboard sprite (buildings, trees) anchored at feet (x, y).
  G.drawBillboard = function (ctx, img, x, y, scale) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, x - w / 2, y - h, w, h);
    return true;
  };

  // Draw one 32x32 frame from an isometric vehicle sheet: row = vehicle type
  // (0..7), col = heading (0..7). Anchored centre at (x, y), upscaled by `scale`.
  G.drawIsoFrame = function (ctx, img, row, col, x, y, scale) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const S = 32, d = S * scale;
    ctx.drawImage(img, col * S, row * S, S, S, x - d / 2, y - d / 2, d, d);
    return true;
  };
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} });
