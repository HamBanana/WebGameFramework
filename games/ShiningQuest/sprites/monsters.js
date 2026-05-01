// GameFramework/games/ShiningQuest/sprites/monsters.js
// Procedurally drawn enemy sprites — kept code-only so the game has no
// external assets. Each sprite registers under a name; the game's BattleScene
// renders them via SpriteSystem.drawFrame().
//
// All monster sprites use the same canvas layout:
//   frameWidth  = 32, frameHeight = 32
//   originX = 16, originY = 32   (feet centre, like the framework character sprites)
//
// Animations: 'idle' (2 frames, looping) and 'hit' (1 frame, hurt pose).

(function (GF) {
  'use strict';

  GF.spriteRegistrations = GF.spriteRegistrations || {};

  // ── Common drawing helpers ──────────────────────────────────────────────────

  function fillCircle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function pixelEye(ctx, x, y, color) {
    ctx.fillStyle = color || '#ffffff';
    ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, 1, 1);
  }

  // ── GOBLIN ──────────────────────────────────────────────────────────────────
  function drawGoblin(ctx, bob, hurt) {
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const yOff = bob;
    // Body
    ctx.fillStyle = hurt ? '#995533' : '#5a8a3a';
    ctx.fillRect(8, 12 + yOff, 16, 14);
    // Head
    ctx.fillStyle = hurt ? '#cc7755' : '#7aa450';
    ctx.beginPath();
    ctx.arc(16, 9 + yOff, 7, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(9,  6 + yOff); ctx.lineTo(5,  3 + yOff); ctx.lineTo(11, 9 + yOff);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(23, 6 + yOff); ctx.lineTo(27, 3 + yOff); ctx.lineTo(21, 9 + yOff);
    ctx.closePath(); ctx.fill();
    // Eyes
    pixelEye(ctx, 12, 8 + yOff, '#ffff66');
    pixelEye(ctx, 18, 8 + yOff, '#ffff66');
    // Mouth fang
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 12 + yOff, 1, 2);
    // Club
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(23, 14 + yOff, 3, 9);
    ctx.fillStyle = '#8b5a36';
    ctx.fillRect(22, 13 + yOff, 5, 3);
    // Legs
    ctx.fillStyle = hurt ? '#7a3322' : '#3e6028';
    ctx.fillRect(10, 26, 4, 4);
    ctx.fillRect(18, 26, 4, 4);
  }

  // ── SKELETON ────────────────────────────────────────────────────────────────
  function drawSkeleton(ctx, bob, hurt) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const yOff = bob;
    const bone = hurt ? '#cccccc' : '#ece4cc';
    // Skull
    fillCircle(ctx, 16, 9 + yOff, 6, bone);
    // Eye sockets
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 8 + yOff, 2, 2);
    ctx.fillRect(18, 8 + yOff, 2, 2);
    // Teeth
    ctx.fillStyle = bone;
    ctx.fillRect(12, 13 + yOff, 8, 1);
    ctx.fillStyle = '#000000';
    ctx.fillRect(14, 13 + yOff, 1, 1);
    ctx.fillRect(17, 13 + yOff, 1, 1);
    // Ribs
    ctx.fillStyle = bone;
    ctx.fillRect(11, 16 + yOff, 10, 2);
    ctx.fillRect(11, 19 + yOff, 10, 2);
    ctx.fillRect(11, 22 + yOff, 10, 2);
    // Spine
    ctx.fillStyle = '#aaa088';
    ctx.fillRect(15, 16 + yOff, 2, 9);
    // Sword
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 11 + yOff); ctx.lineTo(28, 22 + yOff);
    ctx.stroke();
    ctx.fillStyle = '#88553a';
    ctx.fillRect(23, 21 + yOff, 6, 2);
    // Legs
    ctx.fillStyle = bone;
    ctx.fillRect(11, 25, 3, 5);
    ctx.fillRect(18, 25, 3, 5);
  }

  // ── BAT ────────────────────────────────────────────────────────────────────
  function drawBat(ctx, frame, hurt) {
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingSpread = frame === 0 ? 1 : 0;
    const body = hurt ? '#aa6666' : '#6a3a8a';
    // Body
    fillCircle(ctx, 16, 14, 5, body);
    // Wings
    ctx.fillStyle = body;
    ctx.beginPath();
    if (wingSpread) {
      ctx.moveTo(11, 14);
      ctx.lineTo(2, 8);
      ctx.lineTo(4, 16);
      ctx.lineTo(11, 16);
    } else {
      ctx.moveTo(11, 14);
      ctx.lineTo(6, 16);
      ctx.lineTo(8, 19);
      ctx.lineTo(11, 16);
    }
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    if (wingSpread) {
      ctx.moveTo(21, 14);
      ctx.lineTo(30, 8);
      ctx.lineTo(28, 16);
      ctx.lineTo(21, 16);
    } else {
      ctx.moveTo(21, 14);
      ctx.lineTo(26, 16);
      ctx.lineTo(24, 19);
      ctx.lineTo(21, 16);
    }
    ctx.closePath(); ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(13, 10); ctx.lineTo(14, 6); ctx.lineTo(15, 10);
    ctx.moveTo(17, 10); ctx.lineTo(18, 6); ctx.lineTo(19, 10);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(13, 13, 1, 1);
    ctx.fillRect(18, 13, 1, 1);
    // Fangs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 17, 1, 2);
    ctx.fillRect(17, 17, 1, 2);
  }

  // ── DARK MAGE ──────────────────────────────────────────────────────────────
  function drawDarkMage(ctx, bob, hurt) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const yOff = bob;
    // Robe
    ctx.fillStyle = hurt ? '#664488' : '#3a1f55';
    ctx.beginPath();
    ctx.moveTo(8, 28);
    ctx.lineTo(11, 14 + yOff);
    ctx.lineTo(21, 14 + yOff);
    ctx.lineTo(24, 28);
    ctx.closePath(); ctx.fill();
    // Trim
    ctx.fillStyle = '#aa55cc';
    ctx.fillRect(8, 26, 16, 2);
    // Hood
    ctx.fillStyle = hurt ? '#553377' : '#221033';
    ctx.beginPath();
    ctx.arc(16, 11 + yOff, 7, Math.PI, 0, false);
    ctx.lineTo(22, 14 + yOff);
    ctx.lineTo(10, 14 + yOff);
    ctx.closePath();
    ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#ff44ff';
    ctx.fillRect(13, 11 + yOff, 2, 2);
    ctx.fillRect(17, 11 + yOff, 2, 2);
    // Staff
    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 9 + yOff); ctx.lineTo(26, 28);
    ctx.stroke();
    // Orb
    fillCircle(ctx, 24, 8 + yOff, 3, '#ff44ff');
    fillCircle(ctx, 24, 8 + yOff, 1, '#ffffff');
  }

  // ── DRAGON (boss) ──────────────────────────────────────────────────────────
  function drawDragon(ctx, frame, hurt) {
    // Bigger shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(16, 31, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const wing = frame === 0 ? 0 : -1;
    const body = hurt ? '#cc6644' : '#aa2222';
    const belly= '#ffcc44';

    // Wings (behind body)
    ctx.fillStyle = '#7a1010';
    ctx.beginPath();
    ctx.moveTo(7, 14);
    ctx.lineTo(0, 6 + wing);
    ctx.lineTo(2, 14);
    ctx.lineTo(7, 18);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(25, 14);
    ctx.lineTo(32, 6 + wing);
    ctx.lineTo(30, 14);
    ctx.lineTo(25, 18);
    ctx.closePath(); ctx.fill();

    // Body
    ctx.fillStyle = body;
    ctx.fillRect(8, 14, 16, 12);
    // Belly
    ctx.fillStyle = belly;
    ctx.fillRect(11, 18, 10, 7);
    // Spines
    ctx.fillStyle = '#550000';
    ctx.beginPath();
    ctx.moveTo(10, 14); ctx.lineTo(12, 11); ctx.lineTo(14, 14);
    ctx.moveTo(14, 14); ctx.lineTo(16, 10); ctx.lineTo(18, 14);
    ctx.moveTo(18, 14); ctx.lineTo(20, 11); ctx.lineTo(22, 14);
    ctx.fill();
    // Head
    ctx.fillStyle = body;
    ctx.fillRect(12, 8, 12, 8);
    // Snout
    ctx.fillRect(20, 11, 6, 5);
    // Horns
    ctx.fillStyle = '#fff0cc';
    ctx.beginPath();
    ctx.moveTo(13, 8); ctx.lineTo(11, 4); ctx.lineTo(15, 7);
    ctx.moveTo(19, 8); ctx.lineTo(21, 4); ctx.lineTo(17, 7);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#ffff66';
    ctx.fillRect(15, 11, 2, 2);
    ctx.fillRect(20, 11, 2, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(16, 12, 1, 1);
    ctx.fillRect(21, 12, 1, 1);
    // Nostrils + smoke
    ctx.fillStyle = '#000000';
    ctx.fillRect(24, 13, 1, 1);
    ctx.fillStyle = 'rgba(180,180,200,0.7)';
    ctx.fillRect(26 + (frame === 0 ? 0 : 1), 12, 1, 1);
    ctx.fillRect(28 + (frame === 0 ? 0 : 1), 11, 1, 1);
    // Legs
    ctx.fillStyle = body;
    ctx.fillRect(10, 24, 4, 5);
    ctx.fillRect(18, 24, 4, 5);
    // Claws
    ctx.fillStyle = '#fff0cc';
    ctx.fillRect(10, 28, 1, 2);
    ctx.fillRect(13, 28, 1, 2);
    ctx.fillRect(18, 28, 1, 2);
    ctx.fillRect(21, 28, 1, 2);
  }

  // ── Sprite registration ────────────────────────────────────────────────────

  function buildSprite(drawIdle0, drawIdle1, drawHurt) {
    return {
      frameWidth : 32,
      frameHeight: 32,
      originX    : 16,
      originY    : 32,
      animations : {
        idle: { fps: 3, loop: true,  frames: [drawIdle0, drawIdle1] },
        hit : { fps: 6, loop: false, frames: [drawHurt] },
      },
    };
  }

  GF.spriteRegistrations.monsters = {
    goblin: buildSprite(
      ctx => drawGoblin(ctx, 0, false),
      ctx => drawGoblin(ctx, 1, false),
      ctx => drawGoblin(ctx, 0, true),
    ),
    skeleton: buildSprite(
      ctx => drawSkeleton(ctx, 0, false),
      ctx => drawSkeleton(ctx, 1, false),
      ctx => drawSkeleton(ctx, 0, true),
    ),
    bat: buildSprite(
      ctx => drawBat(ctx, 0, false),
      ctx => drawBat(ctx, 1, false),
      ctx => drawBat(ctx, 0, true),
    ),
    darkMage: buildSprite(
      ctx => drawDarkMage(ctx, 0, false),
      ctx => drawDarkMage(ctx, 1, false),
      ctx => drawDarkMage(ctx, 0, true),
    ),
    dragon: buildSprite(
      ctx => drawDragon(ctx, 0, false),
      ctx => drawDragon(ctx, 1, false),
      ctx => drawDragon(ctx, 0, true),
    ),
  };

})(window.GF = window.GF || {});
