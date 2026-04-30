// GameFramework/games/FightingGame/sprites/kuro.js
// KURO – The Shadow Ninja
// Drawn at natural size; origin = feet center (24, 76)
// Flip horizontally when facing left.

(function (GF) {
  'use strict';

  // Palette
  const P = {
    body  : '#1a1a3e',   // dark navy
    bodyHL: '#2a2a6e',   // lighter navy highlight
    mask  : '#0c0c22',   // near-black mask
    belt  : '#00e5ff',   // cyan belt/trim
    eye   : '#ff3300',   // red eyes
    glove : '#0c0c22',
    boot  : '#111130',
    scarf : '#003355',
    glow  : 'rgba(0,229,255,0.5)',
  };

  // ── Drawing helpers ─────────────────────────────────────────────────────────

  function r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function c(ctx, cx, cy, radius, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Base body builder ────────────────────────────────────────────────────────
  // All coordinates are offsets from the sprite's top-left corner (0,0).
  // Frame size: 48 × 76  |  Origin at (24, 76)

  function drawKuro(ctx, p) {
    p = p || {};
    const bY  = p.bY  || 0;   // body vertical shift
    const hY  = p.hY  || 0;   // head vertical shift
    const lax = p.lax || 0;   // left-arm extra x
    const lay = p.lay || 0;   // left-arm extra y
    const rax = p.rax || 0;
    const ray = p.ray || 0;
    const llx = p.llx || 0;   // left-leg extra x
    const lly = p.lly || 0;
    const rlx = p.rlx || 0;
    const rly = p.rly || 0;
    const squat = p.squat || 0; // 0-1 crouch factor

    const sq = squat * 16;

    // --- Boots ---
    r(ctx, 10 + llx, 58 + lly + sq, 10, 16 - sq, P.boot);
    r(ctx,  6 + llx, 70 + lly,      14, 5,        P.boot);
    r(ctx, 28 + rlx, 58 + rly + sq, 10, 16 - sq, P.boot);
    r(ctx, 28 + rlx, 70 + rly,      14, 5,        P.boot);

    // --- Legs (shin guards) ---
    r(ctx, 12 + llx, 46 + lly + sq, 8, 14 - sq, P.bodyHL);
    r(ctx, 28 + rlx, 46 + rly + sq, 8, 14 - sq, P.bodyHL);

    // --- Torso ---
    r(ctx, 10, 26 + bY + sq, 28, 22, P.body);
    // Torso highlight
    r(ctx, 12, 27 + bY + sq, 10, 8,  P.bodyHL);
    // Belt
    r(ctx,  8, 44 + bY + sq, 32, 4,  P.belt);

    // --- Left arm ---
    r(ctx,  2 + lax, 28 + bY + lay, 8, 20, P.body);
    r(ctx,  0 + lax, 46 + bY + lay, 10, 8, P.glove);

    // --- Right arm ---
    r(ctx, 38 + rax, 28 + bY + ray, 8, 20, P.body);
    r(ctx, 38 + rax, 46 + bY + ray, 10, 8, P.glove);

    // --- Neck ---
    r(ctx, 20, 20 + bY + hY + sq, 8, 8, P.mask);

    // --- Head ---
    r(ctx, 13, 4 + hY + sq, 22, 18, P.mask);
    // Hood spikes (top)
    r(ctx, 16, 1 + hY + sq,  6, 5, P.body);
    r(ctx, 24, 0 + hY + sq,  5, 5, P.body);
    // Scarf
    r(ctx,  9, 18 + hY + sq, 30, 4, P.scarf);
    // Eyes
    r(ctx, 15, 10 + hY + sq, 6, 3, P.eye);
    r(ctx, 27, 10 + hY + sq, 6, 3, P.eye);
    // Eye glow
    c(ctx, 18, 11 + hY + sq, 4, P.eye, 0.3);
    c(ctx, 30, 11 + hY + sq, 4, P.eye, 0.3);
  }

  // ── Animation frame helpers ──────────────────────────────────────────────────

  function idle0(ctx) { drawKuro(ctx, { bY: 0, hY: 0 }); }
  function idle1(ctx) { drawKuro(ctx, { bY:-1, hY:-1 }); }

  function walk0(ctx) { drawKuro(ctx, { llx:-4, lly:-6, rlx: 4, rly: 4, lax:-2, lay:-2, rax: 2, ray: 2 }); }
  function walk1(ctx) { drawKuro(ctx, { llx:-2, lly:-3, rlx: 2, rly: 2 }); }
  function walk2(ctx) { drawKuro(ctx, {}); }
  function walk3(ctx) { drawKuro(ctx, { llx: 4, lly: 4, rlx:-4, rly:-6, lax: 2, lay: 2, rax:-2, ray:-2 }); }
  function walk4(ctx) { drawKuro(ctx, { llx: 2, lly: 2, rlx:-2, rly:-3 }); }

  function jump0(ctx) { drawKuro(ctx, { bY:-4, hY:-4, lly:-8, rly:-8, lay:-6, ray:-6 }); }
  function jump1(ctx) { drawKuro(ctx, { bY:-6, hY:-6, lly:-12, rly:-12, lay:-8, ray:-8 }); }
  function fall0(ctx) { drawKuro(ctx, { bY:-2, hY:-2, lly: 4, rly: 4, lay: 4, ray: 4 }); }

  function crouch0(ctx) { drawKuro(ctx, { squat: 0.9, bY: 0, hY: 4 }); }

  function block0(ctx) {
    drawKuro(ctx, { lay:-14, ray:-14, lax:-4, rax: 4, hY: 2 });
    // arm shield overlay
    const ctx2 = ctx;
    ctx2.fillStyle = P.bodyHL;
    ctx2.fillRect(4, 8, 40, 8);
  }

  // Attack - Light Punch (right fist forward)
  function lp0(ctx) { drawKuro(ctx, {}); }
  function lp1(ctx) {
    drawKuro(ctx, { rax: 10, ray:-4, lax:-2, lay: 2 });
    r(ctx, 48, 26, 14, 8, P.glove);   // extended fist
  }
  function lp2(ctx) {
    drawKuro(ctx, { rax: 14, ray:-6, bY:-1, lax:-2, lay: 2 });
    r(ctx, 52, 24, 16, 9, P.glove);
    c(ctx, 66, 28, 6, P.glow, 0.7);   // impact glow
  }

  // Attack - Heavy Punch (full lean)
  function hp0(ctx) { drawKuro(ctx, { bY: 0 }); }
  function hp1(ctx) {
    drawKuro(ctx, { rax: 6, ray:-8, lax:-4, lay: 4, bY:-2 });
    r(ctx, 46, 22, 12, 9, P.glove);
  }
  function hp2(ctx) {
    drawKuro(ctx, { rax: 16, ray:-10, lax:-6, lay: 6, bY:-4, hY:-2 });
    r(ctx, 54, 20, 18, 10, P.glove);
    c(ctx, 70, 25, 8,  P.belt, 0.8);  // cyan energy burst
    c(ctx, 70, 25, 14, P.belt, 0.3);
  }
  function hp3(ctx) {
    drawKuro(ctx, { rax: 10, ray:-6, bY:-2 });
    r(ctx, 48, 22, 14, 9, P.glove);
  }

  // Attack - Light Kick (right leg side kick)
  function lk0(ctx) { drawKuro(ctx, {}); }
  function lk1(ctx) { drawKuro(ctx, { rlx: 8, rly:-8, lly: 4, ray:-4 }); }
  function lk2(ctx) {
    drawKuro(ctx, { rlx: 18, rly:-14, lly: 6, ray:-6, bY:-2 });
    r(ctx, 46, 46, 14, 8, P.boot);  // extended boot
  }

  // Attack - Heavy Kick (spinning heel)
  function hk0(ctx) { drawKuro(ctx, {}); }
  function hk1(ctx) { drawKuro(ctx, { rlx: 4, rly:-4, lay:-4 }); }
  function hk2(ctx) {
    drawKuro(ctx, { rlx: 22, rly:-20, lly: 8, bY:-4, hY:-2, ray:-8 });
    r(ctx, 46, 38, 16, 9, P.boot);
    c(ctx, 56, 42, 8, P.belt, 0.6);
  }
  function hk3(ctx) {
    drawKuro(ctx, { rlx: 14, rly:-12, bY:-2 });
  }

  // Special – Shadow Slash energy wave
  function sp0(ctx) { drawKuro(ctx, { lay:-6, ray: 4 }); }
  function sp1(ctx) {
    drawKuro(ctx, { lay:-10, ray: 6, bY:-2 });
    r(ctx,  2, 14, 6, 4, P.belt);
  }
  function sp2(ctx) {
    drawKuro(ctx, { lay:-14, ray: 6, bY:-4, hY:-2 });
    // Energy slash lines
    for (let i = 0; i < 4; i++) {
      const c2 = ctx;
      c2.globalAlpha = 0.9 - i * 0.15;
      r(ctx, 48 + i * 10, 18 + i * 6, 28, 5, P.belt);
      c2.globalAlpha = 1;
    }
    c(ctx, 76, 28, 10, P.glow, 0.5);
  }
  function sp3(ctx) {
    drawKuro(ctx, { lay:-10, ray: 4, bY:-2 });
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.5 - i * 0.1;
      r(ctx, 56 + i * 14, 22 + i * 5, 20, 4, P.belt);
      ctx.globalAlpha = 1;
    }
  }
  function sp4(ctx) { drawKuro(ctx, {}); }

  // Hit reaction
  function hit0(ctx) { drawKuro(ctx, { bY: 2, hY: 2, lax: 4, rax:-6, lay: 4, ray: 4 }); }
  function hit1(ctx) { drawKuro(ctx, { bY: 1, hY: 1 }); }

  // KO (falling)
  function ko0(ctx) { drawKuro(ctx, { bY: 4, hY: 4, lay: 6, ray: 6, lly: 4, rly: 4 }); }
  function ko1(ctx) {
    // Tipping sideways – rotate slightly via transform
    ctx.save();
    ctx.translate(24, 76);
    ctx.rotate(0.3);
    ctx.translate(-24, -76);
    drawKuro(ctx, { bY: 12, hY: 8, lly: 8, rly: 8 });
    ctx.restore();
  }
  function ko2(ctx) {
    ctx.save();
    ctx.translate(24, 76);
    ctx.rotate(1.4);
    ctx.translate(-24, -76);
    drawKuro(ctx, { bY: 20, hY: 16 });
    ctx.restore();
  }

  // Victory
  function vic0(ctx) { drawKuro(ctx, { lay:-18, ray:-18, hY:-3 }); }
  function vic1(ctx) { drawKuro(ctx, { lay:-22, ray:-22, hY:-5, bY:-2 }); }

  // ── Sprite definition ────────────────────────────────────────────────────────

  const KURO_SPRITE = {
    frameWidth : 48,
    frameHeight: 76,
    originX    : 24,   // feet-center x within frame
    originY    : 76,   // feet y within frame
    displayName: 'KURO',
    color      : P.belt,  // accent color for UI
    animations : {
      idle       : { fps: 5,  loop: true,  frames: [idle0, idle1, idle0, idle1] },
      walk       : { fps: 10, loop: true,  frames: [walk0, walk1, walk2, walk3, walk4, walk2] },
      jump       : { fps: 10, loop: false, frames: [jump0, jump1] },
      fall       : { fps: 4,  loop: true,  frames: [fall0] },
      crouch     : { fps: 4,  loop: true,  frames: [crouch0] },
      block      : { fps: 4,  loop: true,  frames: [block0] },
      lightPunch : { fps: 16, loop: false, frames: [lp0, lp1, lp2, lp1, lp0] },
      heavyPunch : { fps: 12, loop: false, frames: [hp0, hp1, hp2, hp2, hp3, hp0] },
      lightKick  : { fps: 14, loop: false, frames: [lk0, lk1, lk2, lk1, lk0] },
      heavyKick  : { fps: 12, loop: false, frames: [hk0, hk1, hk2, hk2, hk3, hk0] },
      special    : { fps: 10, loop: false, frames: [sp0, sp1, sp2, sp2, sp3, sp4] },
      hit        : { fps: 10, loop: false, frames: [hit0, hit1] },
      ko         : { fps: 6,  loop: false, frames: [ko0, ko1, ko2] },
      victory    : { fps: 5,  loop: true,  frames: [vic0, vic1] },
    },
    // Attack hit-window frame indices (inclusive)
    hitFrames: {
      lightPunch: [2, 2],
      heavyPunch: [2, 3],
      lightKick : [2, 2],
      heavyKick : [2, 3],
      special   : [2, 3],
    },
  };

  // Register globally when framework is ready
  window.addEventListener('GF:ready', function () {
    GF._pendingSprites = GF._pendingSprites || {};
    GF._pendingSprites['kuro'] = KURO_SPRITE;
  });

  // Also expose directly
  GF.sprites = GF.sprites || {};
  GF.sprites['kuro'] = KURO_SPRITE;

})(window.GF = window.GF || {});
