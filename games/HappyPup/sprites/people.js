// GameFramework/games/HappyPup/sprites/people.js
// Programmatic park-NPC sprites for Happy Pup.
//
// Four variants are produced via a shared factory. Each has two animations:
//   sad   — droopy shoulders, frown, looping tear shimmer
//   happy — big grin, arms slightly raised, bobbing, sparkle aura
//
// All variants share dimensions and pivot. Origin is feet-center at (20, 80)
// so animator.draw(ctx, x, y) places the NPC's feet at (x, y).

(function (GF) {
  'use strict';

  const FW = 40, FH = 80;
  const OX = 20, OY = 80;

  // Shared neutral colors
  const OUTLINE   = '#1a1a1a';
  const TEAR      = '#7ec8ff';
  const TEAR_DK   = '#3a85cc';
  const SPARK_HOT = '#fff7a8';
  const SPARK_LO  = '#ffe066';
  const CHEEK     = 'rgba(255,140,160,0.55)';

  // Variant palettes
  const VARIANTS = {
    personA: {
      skin:   '#f2c79a',
      hair:   '#3a2410',
      shirt:  '#e15b5b',
      pants:  '#3a4a78',
      shoes:  '#1f1a14',
      hairStyle: 'short',
    },
    personB: {
      skin:   '#c98c63',
      hair:   '#1a120a',
      shirt:  '#4a8d57',
      pants:  '#5a4326',
      shoes:  '#1f1a14',
      hairStyle: 'bun',
    },
    personC: {
      skin:   '#efbe97',
      hair:   '#a6722c',
      shirt:  '#7e57c2',
      pants:  '#2c2c34',
      shoes:  '#1f1a14',
      hairStyle: 'long',
    },
    personD: {
      skin:   '#a06a47',
      hair:   '#dcdcdc',
      shirt:  '#f0a93c',
      pants:  '#37474f',
      shoes:  '#1f1a14',
      hairStyle: 'short',
    },
  };

  // ---- Drawing primitives ---------------------------------------------------

  function drawShadow(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, -1, 14, 3, 0, 0, GF.Math.TAU);
    ctx.fill();
  }

  function drawShoes(ctx, p) {
    ctx.fillStyle = p.shoes;
    ctx.fillRect(-9, -6, 7, 5);
    ctx.fillRect( 2, -6, 7, 5);
  }

  function drawPants(ctx, p) {
    ctx.fillStyle = p.pants;
    ctx.fillRect(-9, -28, 7, 22);
    ctx.fillRect( 2, -28, 7, 22);
    // Subtle shading down the inseam
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-1, -28, 2, 22);
  }

  function drawTorso(ctx, p, armLift) {
    // Shirt body
    ctx.fillStyle = p.shirt;
    ctx.fillRect(-12, -50, 24, 23);
    // Shoulder/waist tucks
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-12, -28, 24, 2);

    // Arms (rectangles). armLift in radians: 0 = straight down.
    drawArm(ctx, p, -12, -47, -armLift);   // left arm
    drawArm(ctx, p,  12, -47,  armLift);   // right arm
  }

  function drawArm(ctx, p, sx, sy, angle) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.fillStyle = p.shirt;
    ctx.fillRect(-3, 0, 6, 14);
    // Forearm in skin
    ctx.fillStyle = p.skin;
    ctx.fillRect(-3, 14, 6, 10);
    // Hand
    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.arc(0, 25, 2.8, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHead(ctx, p, opts) {
    const yJitter = opts.yJitter || 0;
    const expression = opts.expression; // 'sad' | 'happy'
    const cheekFlush = opts.cheekFlush;

    // Neck
    ctx.fillStyle = p.skin;
    ctx.fillRect(-3, -52 + yJitter, 6, 4);

    // Head
    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.arc(0, -60 + yJitter, 9, 0, GF.Math.TAU);
    ctx.fill();

    // Hair
    drawHair(ctx, p, yJitter);

    // Eyes
    if (expression === 'happy') {
      // Closed-eye smile arcs
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(-3, -60 + yJitter, 2, Math.PI, 0, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc( 3, -60 + yJitter, 2, Math.PI, 0, false);
      ctx.stroke();
    } else {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.arc(-3, -60 + yJitter, 1.2, 0, GF.Math.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc( 3, -60 + yJitter, 1.2, 0, GF.Math.TAU);
      ctx.fill();
      // Sad eyebrows tilted inward & down
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5.5, -64 + yJitter);
      ctx.lineTo(-1.5, -63 + yJitter);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo( 1.5, -63 + yJitter);
      ctx.lineTo( 5.5, -64 + yJitter);
      ctx.stroke();
    }

    // Mouth
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    if (expression === 'happy') {
      ctx.beginPath();
      ctx.arc(0, -56 + yJitter, 3.2, 0.15, Math.PI - 0.15);
      ctx.stroke();
      // Tongue hint inside the smile
      ctx.fillStyle = '#ff8c8c';
      ctx.beginPath();
      ctx.ellipse(0, -54.4 + yJitter, 1.5, 0.7, 0, 0, GF.Math.TAU);
      ctx.fill();
    } else {
      // Frown — arc the other way
      ctx.beginPath();
      ctx.arc(0, -54 + yJitter, 2.4, Math.PI + 0.2, GF.Math.TAU - 0.2);
      ctx.stroke();
    }

    // Cheeks
    if (cheekFlush) {
      ctx.fillStyle = CHEEK;
      ctx.beginPath();
      ctx.arc(-5, -57 + yJitter, 1.6, 0, GF.Math.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc( 5, -57 + yJitter, 1.6, 0, GF.Math.TAU);
      ctx.fill();
    }
  }

  function drawHair(ctx, p, yJitter) {
    ctx.fillStyle = p.hair;
    if (p.hairStyle === 'short') {
      // Rounded cap
      ctx.beginPath();
      ctx.arc(0, -62 + yJitter, 9.5, Math.PI + 0.2, GF.Math.TAU - 0.2);
      ctx.fill();
      ctx.fillRect(-9, -64 + yJitter, 18, 4);
    } else if (p.hairStyle === 'bun') {
      ctx.beginPath();
      ctx.arc(0, -62 + yJitter, 9.5, Math.PI, GF.Math.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -71 + yJitter, 4.2, 0, GF.Math.TAU);
      ctx.fill();
    } else if (p.hairStyle === 'long') {
      ctx.beginPath();
      ctx.arc(0, -62 + yJitter, 9.8, Math.PI, GF.Math.TAU);
      ctx.fill();
      // Hair down the sides past shoulders
      ctx.fillRect(-10, -62 + yJitter, 4, 18);
      ctx.fillRect(  6, -62 + yJitter, 4, 18);
    }
  }

  function drawSadDecor(ctx, t) {
    // Slow tear sliding down the cheek
    const fall = (t % 1);
    const tx = 4;
    const ty = -57 + fall * 9;
    ctx.fillStyle = TEAR;
    ctx.beginPath();
    ctx.ellipse(tx, ty, 1.2, 1.8, 0, 0, GF.Math.TAU);
    ctx.fill();
    ctx.fillStyle = TEAR_DK;
    ctx.beginPath();
    ctx.arc(tx + 0.3, ty + 0.5, 0.5, 0, GF.Math.TAU);
    ctx.fill();

    // A small rain cloud floats above the head
    ctx.save();
    ctx.translate(0, -82);
    ctx.fillStyle = '#bcc7d4';
    ctx.beginPath();
    ctx.arc(-5, 0, 4, 0, GF.Math.TAU);
    ctx.arc( 0, -2, 5, 0, GF.Math.TAU);
    ctx.arc( 5, 0, 4, 0, GF.Math.TAU);
    ctx.fill();
    ctx.fillStyle = '#8a96a6';
    ctx.beginPath();
    ctx.arc( -2, 1, 3.5, 0, GF.Math.TAU);
    ctx.arc(  3, 1, 3.5, 0, GF.Math.TAU);
    ctx.fill();
    // a falling drop
    ctx.fillStyle = TEAR_DK;
    const drop = ((t * 1.4) % 1);
    ctx.beginPath();
    ctx.ellipse(-1, 4 + drop * 8, 1.1, 1.7, 0, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHappyDecor(ctx, t) {
    // Sparkles orbiting the head
    const positions = [
      { a: 0.0, r: 14 },
      { a: 0.5, r: 16 },
      { a: 0.25, r: 12 },
      { a: 0.75, r: 14 },
    ];
    for (let i = 0; i < positions.length; i++) {
      const phase = (t + positions[i].a) % 1;
      const angle = phase * GF.Math.TAU;
      const r = positions[i].r;
      const sx = Math.cos(angle) * r;
      const sy = -62 + Math.sin(angle) * (r * 0.55);
      const size = 1.2 + Math.sin(phase * GF.Math.TAU * 2) * 0.6;
      drawSparkle(ctx, sx, sy, size);
    }
    // Floating heart
    const yBob = Math.sin(t * GF.Math.TAU) * 1.4;
    ctx.save();
    ctx.translate(0, -82 + yBob);
    ctx.fillStyle = '#ff5d8f';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-6, -5, -7,  2, 0, 6);
    ctx.bezierCurveTo( 7,  2,  6, -5, 0, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(-2, -1, 1.3, 0.7, -0.5, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkle(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = SPARK_HOT;
    ctx.beginPath();
    ctx.moveTo(0, -s * 2);
    ctx.lineTo(s * 0.5, 0);
    ctx.lineTo(0, s * 2);
    ctx.lineTo(-s * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = SPARK_LO;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1);
    ctx.lineTo(s * 1.2, 0);
    ctx.lineTo(0, s * 1);
    ctx.lineTo(-s * 1.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- Sprite factory -------------------------------------------------------

  function buildPersonSprite(palette) {
    const sadFrames = [
      makeSadFrame(palette, 0,    0.0),
      makeSadFrame(palette, 0.6,  0.25),
      makeSadFrame(palette, 1,    0.5),
      makeSadFrame(palette, 0.6,  0.75),
    ];

    // Happy animation: 6 frames of bouncing joy
    const happyFrames = [];
    const HF = 6;
    for (let i = 0; i < HF; i++) {
      const t = i / HF;
      const bounce = Math.abs(Math.sin(t * Math.PI));
      happyFrames.push(makeHappyFrame(palette, bounce, t));
    }

    return {
      frameWidth:  FW,
      frameHeight: FH,
      originX:     OX,
      originY:     OY,
      animations: {
        sad:   { fps: 4, loop: true, frames: sadFrames },
        happy: { fps: 8, loop: true, frames: happyFrames },
      },
    };
  }

  function makeSadFrame(palette, breath, decorPhase) {
    return function (ctx) {
      const sag = 1; // shoulders sag down 1px
      drawShadow(ctx);
      drawShoes(ctx, palette);
      drawPants(ctx, palette);
      // Slightly compressed torso, droopy arms hanging straight down
      ctx.save();
      ctx.translate(0, sag - breath * 0.6);
      drawTorso(ctx, palette, 0); // arms straight down
      drawHead(ctx, palette, {
        yJitter: 1 - breath * 0.4,
        expression: 'sad',
        cheekFlush: false,
      });
      drawSadDecor(ctx, decorPhase);
      ctx.restore();
    };
  }

  function makeHappyFrame(palette, bounce, decorPhase) {
    return function (ctx) {
      drawShadow(ctx);
      ctx.save();
      ctx.translate(0, -bounce * 3); // bounce up
      drawShoes(ctx, palette);
      drawPants(ctx, palette);
      drawTorso(ctx, palette, 0.9 + bounce * 0.4); // arms up
      drawHead(ctx, palette, {
        yJitter: -bounce * 0.6,
        expression: 'happy',
        cheekFlush: true,
      });
      drawHappyDecor(ctx, decorPhase);
      ctx.restore();
    };
  }

  // Build all variants and expose
  GF.GameSprites = GF.GameSprites || {};
  for (const name of Object.keys(VARIANTS)) {
    GF.GameSprites[name] = buildPersonSprite(VARIANTS[name]);
  }

  // Also expose the variant list so the game can iterate it.
  GF.GameSprites._personVariantNames = Object.keys(VARIANTS);

})(window.GF = window.GF || {});
