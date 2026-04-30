// GameFramework/games/FightingGame/sprites/hana.js
// HANA – The Flame Warrior
// Stockier build with fire-based color scheme.
// Drawn at natural size; origin = feet center (26, 76)

(function (GF) {
  'use strict';

  const P = {
    body  : '#3a0c0c',   // dark crimson
    bodyHL: '#6e1a1a',   // lighter crimson
    armor : '#8b0000',   // armor plates
    belt  : '#ff6600',   // orange belt
    eye   : '#ffdd00',   // yellow eyes
    glove : '#5a0000',
    boot  : '#2a0000',
    fire  : '#ff4500',
    glow  : 'rgba(255,100,0,0.5)',
    hair  : '#cc2200',
  };

  // ── Drawing helpers ──────────────────────────────────────────────────────────

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

  // Frame size: 52 × 76  |  Origin at (26, 76)
  // Hana is wider/stockier than Kuro.

  function drawHana(ctx, p) {
    p = p || {};
    const bY  = p.bY  || 0;
    const hY  = p.hY  || 0;
    const lax = p.lax || 0;
    const lay = p.lay || 0;
    const rax = p.rax || 0;
    const ray = p.ray || 0;
    const llx = p.llx || 0;
    const lly = p.lly || 0;
    const rlx = p.rlx || 0;
    const rly = p.rly || 0;
    const squat = p.squat || 0;
    const sq = squat * 14;

    // --- Boots ---
    r(ctx, 8  + llx, 56 + lly + sq, 13, 18 - sq, P.boot);
    r(ctx,  4 + llx, 70 + lly,      17, 5,        P.boot);
    r(ctx, 31 + rlx, 56 + rly + sq, 13, 18 - sq, P.boot);
    r(ctx, 31 + rlx, 70 + rly,      17, 5,        P.boot);

    // --- Legs ---
    r(ctx, 10 + llx, 44 + lly + sq, 11, 14 - sq, P.bodyHL);
    r(ctx, 31 + rlx, 44 + rly + sq, 11, 14 - sq, P.bodyHL);

    // --- Torso (wider) ---
    r(ctx,  8, 24 + bY + sq, 36, 24, P.body);
    // Armor chest plate
    r(ctx, 10, 25 + bY + sq, 32, 14, P.armor);
    r(ctx, 12, 26 + bY + sq, 10, 6,  P.bodyHL);
    r(ctx, 30, 26 + bY + sq, 10, 6,  P.bodyHL);
    // Belt
    r(ctx,  6, 44 + bY + sq, 40, 5,  P.belt);

    // --- Left arm (brawny) ---
    r(ctx,  0 + lax, 26 + bY + lay, 9, 22, P.bodyHL);
    r(ctx, -2 + lax, 46 + bY + lay, 12, 9, P.glove);

    // --- Right arm ---
    r(ctx, 43 + rax, 26 + bY + ray, 9, 22, P.bodyHL);
    r(ctx, 42 + rax, 46 + bY + ray, 12, 9, P.glove);

    // --- Neck ---
    r(ctx, 22, 18 + bY + hY + sq, 8, 8, P.body);

    // --- Head ---
    r(ctx, 14, 3 + hY + sq, 24, 18, P.body);
    // Headband
    r(ctx, 12, 8 + hY + sq, 28, 4,  P.belt);
    // Hair (spiky)
    r(ctx, 18, 0 + hY + sq,  6, 5, P.hair);
    r(ctx, 26, -2+ hY + sq,  6, 6, P.hair);
    r(ctx, 34, 1 + hY + sq,  5, 4, P.hair);
    // Eyes
    r(ctx, 17, 10 + hY + sq, 6, 3, P.eye);
    r(ctx, 29, 10 + hY + sq, 6, 3, P.eye);
    // Scar (battle-worn detail)
    r(ctx, 24, 8 + hY + sq, 2, 7, P.hair);
  }

  // ── Frames ───────────────────────────────────────────────────────────────────

  function idle0(ctx) { drawHana(ctx, {}); }
  function idle1(ctx) { drawHana(ctx, { bY:-1, hY:-1 }); }

  function walk0(ctx) { drawHana(ctx, { llx:-4, lly:-5, rlx: 4, rly: 4, lax:-2, lay:-2, rax: 2, ray: 2 }); }
  function walk1(ctx) { drawHana(ctx, { llx:-2, lly:-2, rlx: 2, rly: 2 }); }
  function walk2(ctx) { drawHana(ctx, {}); }
  function walk3(ctx) { drawHana(ctx, { llx: 4, lly: 4, rlx:-4, rly:-5, lax: 2, lay: 2, rax:-2, ray:-2 }); }
  function walk4(ctx) { drawHana(ctx, { llx: 2, lly: 2, rlx:-2, rly:-2 }); }

  function jump0(ctx) { drawHana(ctx, { bY:-4, hY:-4, lly:-8, rly:-8, lay:-5, ray:-5 }); }
  function jump1(ctx) { drawHana(ctx, { bY:-7, hY:-7, lly:-14, rly:-14, lay:-8, ray:-8 }); }
  function fall0(ctx) { drawHana(ctx, { bY:-2, hY:-2, lly: 4, rly: 4 }); }

  function crouch0(ctx) { drawHana(ctx, { squat: 0.9, bY: 0, hY: 4 }); }

  function block0(ctx) {
    drawHana(ctx, { lay:-12, ray:-12, lax:-4, rax: 4, hY: 2 });
    ctx.fillStyle = P.armor;
    ctx.fillRect(5, 8, 42, 8);
  }

  // Light punch
  function lp0(ctx) { drawHana(ctx, {}); }
  function lp1(ctx) {
    drawHana(ctx, { rax: 10, ray:-4, lax:-2, lay: 2 });
    r(ctx, 54, 28, 14, 10, P.glove);
  }
  function lp2(ctx) {
    drawHana(ctx, { rax: 14, ray:-6, bY:-1, lax:-2, lay: 2 });
    r(ctx, 58, 26, 16, 10, P.glove);
    c(ctx, 72, 31, 6, P.glow, 0.8);
  }

  // Heavy punch (flame-charged)
  function hp0(ctx) { drawHana(ctx, {}); }
  function hp1(ctx) {
    drawHana(ctx, { rax: 6, ray:-8, lax:-4, lay: 4, bY:-2 });
    r(ctx, 50, 22, 14, 10, P.glove);
  }
  function hp2(ctx) {
    drawHana(ctx, { rax: 18, ray:-10, lax:-6, lay: 6, bY:-4, hY:-2 });
    r(ctx, 62, 20, 18, 11, P.glove);
    // Flame burst
    c(ctx, 78, 26, 9,  P.fire, 0.9);
    c(ctx, 78, 26, 15, P.glow, 0.4);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.6 - i * 0.15;
      ctx.fillStyle   = P.fire;
      ctx.fillRect(68 + i * 6, 18 + i * 4, 8, 4);
      ctx.globalAlpha = 1;
    }
  }
  function hp3(ctx) {
    drawHana(ctx, { rax: 10, ray:-5, bY:-2 });
    r(ctx, 54, 22, 14, 10, P.glove);
    c(ctx, 68, 27, 5, P.glow, 0.5);
  }
  function hp4(ctx) { drawHana(ctx, {}); }

  // Light kick
  function lk0(ctx) { drawHana(ctx, {}); }
  function lk1(ctx) { drawHana(ctx, { rlx: 8, rly:-8, lly: 4, ray:-4 }); }
  function lk2(ctx) {
    drawHana(ctx, { rlx: 18, rly:-14, lly: 6, ray:-6, bY:-2 });
    r(ctx, 48, 48, 14, 8, P.boot);
  }

  // Heavy kick (flame drop kick)
  function hk0(ctx) { drawHana(ctx, {}); }
  function hk1(ctx) { drawHana(ctx, { rlx: 4, rly:-4, lly: 4, lay:-4, bY:-2 }); }
  function hk2(ctx) {
    drawHana(ctx, { rlx: 22, rly:-22, lly: 8, bY:-5, hY:-3, ray:-6 });
    r(ctx, 50, 36, 16, 10, P.boot);
    c(ctx, 60, 40, 8, P.fire, 0.7);
    c(ctx, 60, 40, 14, P.glow, 0.3);
  }
  function hk3(ctx) {
    drawHana(ctx, { rlx: 14, rly:-12, bY:-3 });
  }

  // Special – Inferno Surge
  function sp0(ctx) { drawHana(ctx, { lay: 4, ray:-4, bY: 2 }); }
  function sp1(ctx) {
    drawHana(ctx, { lay: 6, ray:-6, bY: 4 });
    c(ctx, 26, 26, 8, P.glow, 0.3);
  }
  function sp2(ctx) {
    drawHana(ctx, { lay: 8, ray:-8, bY: 5, hY:-2 });
    // Rising flame pillar
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.9 - i * 0.12;
      ctx.fillStyle = P.fire;
      ctx.fillRect(18, -i * 10, 16, 12);
      ctx.globalAlpha = 1;
    }
    c(ctx, 26, 8, 12, P.glow, 0.5);
  }
  function sp3(ctx) {
    drawHana(ctx, { lay: 4, ray:-4, bY: 2, hY:-2 });
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.5 - i * 0.1;
      ctx.fillStyle = P.fire;
      ctx.fillRect(14 + i * 6, -i * 8, 20, 8);
      ctx.globalAlpha = 1;
    }
  }
  function sp4(ctx) { drawHana(ctx, {}); }

  // Hit
  function hit0(ctx) { drawHana(ctx, { bY: 2, hY: 3, lax: 4, rax:-6, lay: 4, ray: 4 }); }
  function hit1(ctx) { drawHana(ctx, { bY: 1 }); }

  // KO
  function ko0(ctx) { drawHana(ctx, { bY: 4, hY: 4 }); }
  function ko1(ctx) {
    ctx.save();
    ctx.translate(26, 76);
    ctx.rotate(-0.3);
    ctx.translate(-26, -76);
    drawHana(ctx, { bY: 10, hY: 8, lly: 6, rly: 6 });
    ctx.restore();
  }
  function ko2(ctx) {
    ctx.save();
    ctx.translate(26, 76);
    ctx.rotate(-1.4);
    ctx.translate(-26, -76);
    drawHana(ctx, { bY: 20 });
    ctx.restore();
  }

  // Victory
  function vic0(ctx) { drawHana(ctx, { lay:-14, ray:-14, hY:-3 }); }
  function vic1(ctx) {
    drawHana(ctx, { lay:-18, ray:-18, hY:-5, bY:-2 });
    // Flame aura
    c(ctx, 26, 40, 28, P.glow, 0.15);
  }

  // ── Sprite definition ────────────────────────────────────────────────────────

  const HANA_SPRITE = {
    frameWidth : 52,
    frameHeight: 76,
    originX    : 26,
    originY    : 76,
    displayName: 'HANA',
    color      : P.belt,
    animations : {
      idle       : { fps: 5,  loop: true,  frames: [idle0, idle1, idle0, idle1] },
      walk       : { fps: 10, loop: true,  frames: [walk0, walk1, walk2, walk3, walk4, walk2] },
      jump       : { fps: 10, loop: false, frames: [jump0, jump1] },
      fall       : { fps: 4,  loop: true,  frames: [fall0] },
      crouch     : { fps: 4,  loop: true,  frames: [crouch0] },
      block      : { fps: 4,  loop: true,  frames: [block0] },
      lightPunch : { fps: 16, loop: false, frames: [lp0, lp1, lp2, lp1, lp0] },
      heavyPunch : { fps: 12, loop: false, frames: [hp0, hp1, hp2, hp2, hp3, hp4] },
      lightKick  : { fps: 14, loop: false, frames: [lk0, lk1, lk2, lk1, lk0] },
      heavyKick  : { fps: 12, loop: false, frames: [hk0, hk1, hk2, hk2, hk3, hk0] },
      special    : { fps: 10, loop: false, frames: [sp0, sp1, sp2, sp2, sp3, sp4] },
      hit        : { fps: 10, loop: false, frames: [hit0, hit1] },
      ko         : { fps: 6,  loop: false, frames: [ko0, ko1, ko2] },
      victory    : { fps: 5,  loop: true,  frames: [vic0, vic1] },
    },
    hitFrames: {
      lightPunch: [2, 2],
      heavyPunch: [2, 3],
      lightKick : [2, 2],
      heavyKick : [2, 3],
      special   : [2, 3],
    },
  };

  GF.sprites = GF.sprites || {};
  GF.sprites['hana'] = HANA_SPRITE;

})(window.GF = window.GF || {});
