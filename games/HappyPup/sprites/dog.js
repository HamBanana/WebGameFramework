// GameFramework/games/HappyPup/sprites/dog.js
// Programmatic small-dog sprite for Happy Pup.
//
// Animations:
//   idle  — gentle bob, tail wag, mouth closed
//   run   — leg cycle, ears bounce, tongue lolling
//   jump  — body lifted, legs tucked
//   lick  — head tilted up, tongue extended (face-lick frames)
//
// Origin (pivot) is feet-center: animator.draw(ctx, x, y) places the dog's
// paws at (x, y). Frames are 64×48; the sprite faces right by default and
// is mirrored via animator.flipX.

(function (GF) {
  'use strict';

  const FW = 64, FH = 48;
  const OX = 32, OY = 48;

  // Palette
  const FUR        = '#d9a76a';
  const FUR_SHADE  = '#a8773d';
  const FUR_PATCH  = '#553319';
  const BELLY      = '#f3d6a4';
  const NOSE       = '#181818';
  const EYE        = '#181818';
  const EYE_SHINE  = '#ffffff';
  const TONGUE     = '#ff6e8e';
  const TONGUE_DK  = '#c84068';
  const MOUTH_DK   = '#3a1d0d';

  // ---- Drawing primitives ---------------------------------------------------

  function drawShadow(ctx) {
    // Soft ground shadow under the dog
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, -1, 16, 3, 0, 0, GF.Math.TAU);
    ctx.fill();
  }

  function drawBody(ctx, bobY) {
    // Belly oval (drawn first so back patch overlays it)
    ctx.fillStyle = BELLY;
    ctx.beginPath();
    ctx.ellipse(-1, -12 + bobY, 17, 11, 0, 0, GF.Math.TAU);
    ctx.fill();

    // Top half of body (fur color)
    ctx.fillStyle = FUR;
    ctx.beginPath();
    ctx.ellipse(-1, -14 + bobY, 16, 9, 0, 0, GF.Math.TAU);
    ctx.fill();

    // Back patch (darker)
    ctx.fillStyle = FUR_PATCH;
    ctx.beginPath();
    ctx.ellipse(-3, -19 + bobY, 9, 4, 0, 0, GF.Math.TAU);
    ctx.fill();
  }

  function drawTail(ctx, wagAngle, bobY) {
    ctx.save();
    ctx.translate(-15, -19 + bobY);
    ctx.rotate(wagAngle);
    ctx.strokeStyle = FUR;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, -6, -1, -10);
    ctx.stroke();
    // Tail tip highlight
    ctx.fillStyle = BELLY;
    ctx.beginPath();
    ctx.arc(-1, -10, 1.6, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHead(ctx, bobY, opts) {
    const tilt = opts.tilt || 0;        // radians
    const mouth = opts.mouth || 'closed'; // 'closed' | 'open' | 'tongueOut' | 'pant'
    const earSwing = opts.earSwing || 0;
    const blink = !!opts.blink;

    ctx.save();
    ctx.translate(13, -22 + bobY);
    ctx.rotate(tilt);

    // Far ear (back, partially behind head)
    ctx.fillStyle = FUR_SHADE;
    ctx.save();
    ctx.translate(-4, -7);
    ctx.rotate(-0.35 + earSwing * 0.6);
    ctx.beginPath();
    ctx.ellipse(0, 4, 4, 7, 0, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.fillStyle = FUR;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, GF.Math.TAU);
    ctx.fill();

    // Snout
    ctx.fillStyle = BELLY;
    ctx.beginPath();
    ctx.ellipse(7, 3, 6.5, 4, 0, 0, GF.Math.TAU);
    ctx.fill();

    // Mouth / tongue
    if (mouth === 'open' || mouth === 'pant') {
      ctx.fillStyle = MOUTH_DK;
      ctx.beginPath();
      ctx.ellipse(8, 5, 3, 1.4, 0, 0, GF.Math.TAU);
      ctx.fill();
    }
    if (mouth === 'pant') {
      // Tongue lolls slightly out the side
      ctx.fillStyle = TONGUE;
      ctx.beginPath();
      ctx.ellipse(10, 6.5, 2.4, 3, 0.25, 0, GF.Math.TAU);
      ctx.fill();
      ctx.strokeStyle = TONGUE_DK;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(10, 5);
      ctx.lineTo(10.2, 9);
      ctx.stroke();
    }
    if (mouth === 'tongueOut') {
      // Big extended tongue (lick action)
      ctx.fillStyle = MOUTH_DK;
      ctx.beginPath();
      ctx.ellipse(8, 4.5, 3.2, 1.7, 0, 0, GF.Math.TAU);
      ctx.fill();
      ctx.fillStyle = TONGUE;
      ctx.beginPath();
      ctx.moveTo(7.5, 4);
      ctx.quadraticCurveTo(13, 1, 17, -2);
      ctx.quadraticCurveTo(15, 2, 14, 5);
      ctx.quadraticCurveTo(11, 7, 7.5, 5.5);
      ctx.fill();
      ctx.strokeStyle = TONGUE_DK;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(9, 3.6);
      ctx.quadraticCurveTo(12, 1.5, 15, 0);
      ctx.stroke();
    }

    // Nose (drawn after mouth so it sits on top)
    ctx.fillStyle = NOSE;
    ctx.beginPath();
    ctx.ellipse(11, 1.4, 2.3, 1.7, 0, 0, GF.Math.TAU);
    ctx.fill();

    // Eye
    if (blink) {
      ctx.strokeStyle = EYE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(1, -2);
      ctx.lineTo(5, -2);
      ctx.stroke();
    } else {
      ctx.fillStyle = EYE;
      ctx.beginPath();
      ctx.arc(3, -2, 1.7, 0, GF.Math.TAU);
      ctx.fill();
      ctx.fillStyle = EYE_SHINE;
      ctx.beginPath();
      ctx.arc(3.5, -2.5, 0.7, 0, GF.Math.TAU);
      ctx.fill();
    }

    // Front ear (floppy, in front of head)
    ctx.save();
    ctx.translate(3, -6);
    ctx.rotate(0.35 + earSwing);
    ctx.fillStyle = FUR_PATCH;
    ctx.beginPath();
    ctx.ellipse(0, 4, 4.5, 8, 0, 0, GF.Math.TAU);
    ctx.fill();
    // Inner ear shine
    ctx.fillStyle = '#7a4a25';
    ctx.beginPath();
    ctx.ellipse(0, 5, 2, 4, 0, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Legs: 4 small stubs. phase 0..1 cycles a trot.
  function drawLegs(ctx, phase, opts) {
    const tucked = !!opts.tucked;
    ctx.fillStyle = FUR_SHADE;

    if (tucked) {
      // Mid-jump: paws bunched under the body
      [[-9, -3], [-3, -3], [3, -3], [9, -3]].forEach(([lx, ly]) => {
        ctx.fillRect(lx - 2, ly, 4, 5);
      });
      ctx.fillStyle = FUR_PATCH;
      [[-9, 1], [-3, 1], [3, 1], [9, 1]].forEach(([lx, ly]) => {
        ctx.fillRect(lx - 2, ly, 4, 1.5); // paw pad hint
      });
      return;
    }

    // Standing / trotting: legs alternate in two diagonal pairs
    const a = Math.sin(phase * GF.Math.TAU);     // pair A (front-left + back-right)
    const b = Math.sin((phase + 0.5) * GF.Math.TAU); // pair B (front-right + back-left)
    const lift = 2;

    // Layout: back-far(-10), back-near(-4), front-near(4), front-far(10)
    const positions = [
      { x: -10, pair: 'A' },
      { x:  -4, pair: 'B' },
      { x:   4, pair: 'A' },
      { x:  10, pair: 'B' },
    ];

    for (const leg of positions) {
      const phaseVal = leg.pair === 'A' ? a : b;
      const y0 = -2 - Math.max(0, phaseVal) * lift;
      const h  = 7 - Math.max(0, phaseVal) * lift;
      ctx.fillStyle = leg.pair === 'A' ? FUR_SHADE : FUR_PATCH;
      ctx.fillRect(leg.x - 1.5, y0, 3, h);
      // paw tip
      ctx.fillStyle = '#3b2010';
      ctx.fillRect(leg.x - 1.5, y0 + h - 1.2, 3, 1.2);
    }
  }

  // ---- Frame builders -------------------------------------------------------

  function frame(opts) {
    return function (ctx) {
      const bobY = opts.bobY || 0;
      drawShadow(ctx);
      drawTail(ctx, opts.tail || 0, bobY);
      drawLegs(ctx, opts.legPhase || 0, { tucked: !!opts.tucked });
      drawBody(ctx, bobY);
      drawHead(ctx, bobY, {
        tilt:     opts.headTilt || 0,
        mouth:    opts.mouth    || 'closed',
        earSwing: opts.earSwing || 0,
        blink:    !!opts.blink,
      });
    };
  }

  // ---- Animations -----------------------------------------------------------

  const idleFrames = [
    frame({ bobY: 0, tail:  0.10, mouth: 'closed' }),
    frame({ bobY: -1, tail:  0.30, mouth: 'pant'   }),
    frame({ bobY: 0, tail:  0.10, mouth: 'closed' }),
    frame({ bobY: -1, tail: -0.20, mouth: 'pant'   }),
    frame({ bobY: 0, tail:  0.05, mouth: 'closed', blink: true }),
    frame({ bobY: -1, tail:  0.30, mouth: 'pant'   }),
  ];

  const runFrames = [
    frame({ bobY:  0, legPhase: 0.00, tail:  0.40, mouth: 'pant',   earSwing:  0.20 }),
    frame({ bobY: -2, legPhase: 0.16, tail:  0.55, mouth: 'pant',   earSwing:  0.05 }),
    frame({ bobY: -3, legPhase: 0.34, tail:  0.40, mouth: 'pant',   earSwing: -0.15 }),
    frame({ bobY: -2, legPhase: 0.50, tail:  0.20, mouth: 'pant',   earSwing: -0.10 }),
    frame({ bobY:  0, legPhase: 0.66, tail:  0.40, mouth: 'pant',   earSwing:  0.05 }),
    frame({ bobY: -2, legPhase: 0.84, tail:  0.55, mouth: 'pant',   earSwing:  0.20 }),
  ];

  const jumpFrames = [
    frame({ bobY: -4, legPhase: 0, tail:  0.6, tucked: true, mouth: 'open',
            headTilt: -0.18, earSwing: 0.4 }),
    frame({ bobY: -6, legPhase: 0, tail:  0.4, tucked: true, mouth: 'open',
            headTilt: -0.10, earSwing: 0.2 }),
  ];

  const lickFrames = [
    frame({ bobY: -2, legPhase: 0.5, tail: 0.7, mouth: 'open',
            headTilt: -0.45, earSwing: 0.3 }),
    frame({ bobY: -4, legPhase: 0.5, tail: 0.9, mouth: 'tongueOut',
            headTilt: -0.55, earSwing: 0.5 }),
    frame({ bobY: -3, legPhase: 0.5, tail: 0.6, mouth: 'tongueOut',
            headTilt: -0.40, earSwing: 0.2 }),
    frame({ bobY: -2, legPhase: 0.5, tail: 0.4, mouth: 'open',
            headTilt: -0.20, earSwing: 0.0 }),
  ];

  // ---- Sprite definition ----------------------------------------------------

  const PupDog = {
    frameWidth:  FW,
    frameHeight: FH,
    originX:     OX,
    originY:     OY,

    animations: {
      idle: { fps:  6, loop: true,  frames: idleFrames },
      run:  { fps: 14, loop: true,  frames: runFrames  },
      jump: { fps:  8, loop: false, frames: jumpFrames },
      lick: { fps: 12, loop: false, frames: lickFrames },
    },
  };

  // Expose for game registration.
  GF.GameSprites = GF.GameSprites || {};
  GF.GameSprites.pupDog = PupDog;

})(window.GF = window.GF || {});
