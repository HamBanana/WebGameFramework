// GameFramework/games/ShiningQuest3D/sprites/portraits.js
// Procedurally drawn dialogue portraits for the player party and NPCs.
// Each portrait is a 96x96 pixel canvas-friendly drawing, registered as a
// "framed" sprite where the single 'idle' frame holds the portrait artwork.
// The DialogueSystem looks up portraits via getPortrait(name) -> Image-like;
// we satisfy that by pre-rendering each one to an offscreen <canvas>.

(function (GF) {
  'use strict';

  GF.portraits = GF.portraits || {};

  function makePortraitCanvas(drawFn) {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const ctx = c.getContext('2d');
    // Frame
    ctx.fillStyle = '#0a0a20';
    ctx.fillRect(0, 0, 96, 96);
    drawFn(ctx);
    // Inner border
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 94, 94);
    return c;
  }

  // ── KESTRA — knight ────────────────────────────────────────────────────────
  GF.portraits.kestra = makePortraitCanvas(ctx => {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#2a3a55'); bg.addColorStop(1, '#10101a');
    ctx.fillStyle = bg; ctx.fillRect(2, 2, 92, 92);
    // Shoulders/armor
    ctx.fillStyle = '#7888a0';
    ctx.beginPath();
    ctx.moveTo(8, 96); ctx.lineTo(20, 60); ctx.lineTo(76, 60); ctx.lineTo(88, 96);
    ctx.closePath(); ctx.fill();
    // Shoulder pauldrons
    ctx.fillStyle = '#aabbd0';
    ctx.beginPath(); ctx.arc(20, 65, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(76, 65, 9, 0, Math.PI * 2); ctx.fill();
    // Neck
    ctx.fillStyle = '#e0c099';
    ctx.fillRect(42, 50, 12, 14);
    // Head
    ctx.fillStyle = '#f0d2a8';
    ctx.beginPath(); ctx.arc(48, 38, 18, 0, Math.PI * 2); ctx.fill();
    // Hair (auburn ponytail-ish)
    ctx.fillStyle = '#883322';
    ctx.beginPath();
    ctx.moveTo(30, 36); ctx.quadraticCurveTo(48, 12, 66, 36);
    ctx.lineTo(64, 28); ctx.quadraticCurveTo(48, 18, 32, 28);
    ctx.closePath(); ctx.fill();
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 38, 4, 3); ctx.fillRect(52, 38, 4, 3);
    ctx.fillStyle = '#22442a';
    ctx.fillRect(41, 39, 2, 2); ctx.fillRect(53, 39, 2, 2);
    // Brows
    ctx.fillStyle = '#552211';
    ctx.fillRect(39, 35, 6, 1); ctx.fillRect(51, 35, 6, 1);
    // Mouth
    ctx.fillStyle = '#aa3322';
    ctx.fillRect(44, 47, 8, 1);
    // Cheek light
    ctx.fillStyle = 'rgba(255,200,160,0.4)';
    ctx.fillRect(38, 43, 4, 2); ctx.fillRect(54, 43, 4, 2);
  });

  // ── NORI — wizard apprentice ───────────────────────────────────────────────
  GF.portraits.nori = makePortraitCanvas(ctx => {
    const bg = ctx.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#3a2255'); bg.addColorStop(1, '#10101a');
    ctx.fillStyle = bg; ctx.fillRect(2, 2, 92, 92);
    // Robe
    ctx.fillStyle = '#3a2266';
    ctx.beginPath();
    ctx.moveTo(10, 96); ctx.lineTo(22, 58); ctx.lineTo(74, 58); ctx.lineTo(86, 96);
    ctx.closePath(); ctx.fill();
    // Robe trim
    ctx.fillStyle = '#ddcc66';
    ctx.fillRect(28, 58, 40, 3);
    // Neck
    ctx.fillStyle = '#f0d2a8';
    ctx.fillRect(43, 50, 10, 12);
    // Head
    ctx.fillStyle = '#fadeaa';
    ctx.beginPath(); ctx.arc(48, 38, 17, 0, Math.PI * 2); ctx.fill();
    // Hair (long dark)
    ctx.fillStyle = '#332244';
    ctx.beginPath();
    ctx.moveTo(28, 38); ctx.quadraticCurveTo(48, 12, 68, 38);
    ctx.lineTo(70, 60); ctx.lineTo(60, 50);
    ctx.lineTo(60, 30); ctx.quadraticCurveTo(48, 22, 36, 30);
    ctx.lineTo(36, 50); ctx.lineTo(26, 60);
    ctx.closePath(); ctx.fill();
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 38, 4, 3); ctx.fillRect(52, 38, 4, 3);
    ctx.fillStyle = '#3344aa';
    ctx.fillRect(41, 39, 2, 2); ctx.fillRect(53, 39, 2, 2);
    // Brows
    ctx.fillStyle = '#221133';
    ctx.fillRect(39, 35, 6, 1); ctx.fillRect(51, 35, 6, 1);
    // Smile
    ctx.fillStyle = '#aa3344';
    ctx.fillRect(44, 47, 8, 1); ctx.fillRect(45, 48, 6, 1);
    // Star pendant
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    const cx = 48, cy = 66, r = 4;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI/2 + i * (Math.PI*2/5);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.fill();
  });

  // ── BARRAT — mountain warrior ──────────────────────────────────────────────
  GF.portraits.barrat = makePortraitCanvas(ctx => {
    const bg = ctx.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#553322'); bg.addColorStop(1, '#10101a');
    ctx.fillStyle = bg; ctx.fillRect(2, 2, 92, 92);
    // Fur cloak
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath();
    ctx.moveTo(6, 96); ctx.lineTo(18, 56); ctx.lineTo(78, 56); ctx.lineTo(90, 96);
    ctx.closePath(); ctx.fill();
    // Fur trim (jagged)
    ctx.fillStyle = '#88664a';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(18 + i * 4, 54, 3, 4);
    }
    // Chest
    ctx.fillStyle = '#aa6644';
    ctx.fillRect(34, 60, 28, 16);
    // Neck
    ctx.fillStyle = '#dba07a';
    ctx.fillRect(42, 50, 12, 12);
    // Head
    ctx.fillStyle = '#e6b48a';
    ctx.beginPath(); ctx.arc(48, 38, 18, 0, Math.PI * 2); ctx.fill();
    // Wild hair
    ctx.fillStyle = '#221110';
    ctx.beginPath();
    ctx.moveTo(28, 32); ctx.lineTo(34, 16); ctx.lineTo(40, 22);
    ctx.lineTo(48, 14); ctx.lineTo(56, 22); ctx.lineTo(62, 16);
    ctx.lineTo(68, 32); ctx.lineTo(64, 26); ctx.lineTo(60, 30);
    ctx.lineTo(48, 22); ctx.lineTo(36, 30); ctx.lineTo(32, 26);
    ctx.closePath(); ctx.fill();
    // Beard
    ctx.fillStyle = '#221110';
    ctx.beginPath();
    ctx.moveTo(32, 44); ctx.lineTo(40, 56); ctx.lineTo(48, 60);
    ctx.lineTo(56, 56); ctx.lineTo(64, 44); ctx.lineTo(60, 50);
    ctx.lineTo(48, 50); ctx.lineTo(36, 50);
    ctx.closePath(); ctx.fill();
    // Scar
    ctx.strokeStyle = '#882222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(54, 30); ctx.lineTo(60, 42); ctx.stroke();
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 38, 4, 3); ctx.fillRect(52, 38, 4, 3);
    ctx.fillStyle = '#332210';
    ctx.fillRect(41, 39, 2, 2); ctx.fillRect(53, 39, 2, 2);
    // Brows
    ctx.fillStyle = '#221110';
    ctx.fillRect(38, 35, 8, 2); ctx.fillRect(50, 35, 8, 2);
  });

  // ── KING — old monarch (NPC) ──────────────────────────────────────────────
  GF.portraits.king = makePortraitCanvas(ctx => {
    const bg = ctx.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#552233'); bg.addColorStop(1, '#10101a');
    ctx.fillStyle = bg; ctx.fillRect(2, 2, 92, 92);
    // Royal robe
    ctx.fillStyle = '#7a1f3a';
    ctx.beginPath();
    ctx.moveTo(8, 96); ctx.lineTo(20, 58); ctx.lineTo(76, 58); ctx.lineTo(88, 96);
    ctx.closePath(); ctx.fill();
    // Fur trim
    ctx.fillStyle = '#f0e4d2';
    ctx.fillRect(20, 56, 56, 6);
    ctx.fillStyle = '#aa9988';
    for (let i = 0; i < 12; i++) ctx.fillRect(22 + i * 5, 60, 2, 2);
    // Neck
    ctx.fillStyle = '#dca';
    ctx.fillRect(43, 50, 10, 10);
    // Head
    ctx.fillStyle = '#f0d2a8';
    ctx.beginPath(); ctx.arc(48, 36, 17, 0, Math.PI * 2); ctx.fill();
    // Crown
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.moveTo(33, 22); ctx.lineTo(36, 14); ctx.lineTo(42, 20);
    ctx.lineTo(48, 12); ctx.lineTo(54, 20); ctx.lineTo(60, 14);
    ctx.lineTo(63, 22); ctx.lineTo(33, 22);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4477'; ctx.fillRect(46, 17, 4, 4);
    ctx.fillStyle = '#44ddff'; ctx.fillRect(38, 19, 3, 3);
    ctx.fillStyle = '#44ddff'; ctx.fillRect(56, 19, 3, 3);
    // White beard
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.moveTo(34, 40); ctx.lineTo(38, 60); ctx.lineTo(48, 64);
    ctx.lineTo(58, 60); ctx.lineTo(62, 40); ctx.lineTo(58, 46);
    ctx.lineTo(48, 50); ctx.lineTo(38, 46);
    ctx.closePath(); ctx.fill();
    // Mustache
    ctx.fillRect(38, 42, 22, 3);
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 36, 4, 3); ctx.fillRect(52, 36, 4, 3);
    ctx.fillStyle = '#444466';
    ctx.fillRect(41, 37, 2, 2); ctx.fillRect(53, 37, 2, 2);
    // Brows
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(38, 33, 8, 1); ctx.fillRect(50, 33, 8, 1);
  });

  // ── VILLAGER (generic NPC) ─────────────────────────────────────────────────
  GF.portraits.villager = makePortraitCanvas(ctx => {
    const bg = ctx.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#3a4a35'); bg.addColorStop(1, '#10101a');
    ctx.fillStyle = bg; ctx.fillRect(2, 2, 92, 92);
    // Tunic
    ctx.fillStyle = '#5a7a3a';
    ctx.beginPath();
    ctx.moveTo(12, 96); ctx.lineTo(22, 58); ctx.lineTo(74, 58); ctx.lineTo(84, 96);
    ctx.closePath(); ctx.fill();
    // Belt
    ctx.fillStyle = '#553322';
    ctx.fillRect(22, 76, 52, 4);
    // Neck
    ctx.fillStyle = '#dca';
    ctx.fillRect(43, 50, 10, 10);
    // Head
    ctx.fillStyle = '#f0d2a8';
    ctx.beginPath(); ctx.arc(48, 38, 17, 0, Math.PI * 2); ctx.fill();
    // Straw hat
    ctx.fillStyle = '#cca644';
    ctx.beginPath();
    ctx.ellipse(48, 26, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ddbb55';
    ctx.beginPath();
    ctx.ellipse(48, 22, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 38, 4, 3); ctx.fillRect(52, 38, 4, 3);
    ctx.fillStyle = '#664422';
    ctx.fillRect(41, 39, 2, 2); ctx.fillRect(53, 39, 2, 2);
    // Mouth
    ctx.fillStyle = '#aa3322';
    ctx.fillRect(44, 47, 8, 1);
  });

  // ── DARK LORD (boss villain) ──────────────────────────────────────────────
  GF.portraits.darkLord = makePortraitCanvas(ctx => {
    const bg = ctx.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#221125'); bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg; ctx.fillRect(2, 2, 92, 92);
    // Stars in the void
    for (let i = 0; i < 18; i++) {
      const sx = (i * 53) % 92 + 2;
      const sy = (i * 31) % 92 + 2;
      ctx.fillStyle = i % 3 === 0 ? '#ff44ff' : '#5544aa';
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Robe
    ctx.fillStyle = '#1a0a25';
    ctx.beginPath();
    ctx.moveTo(4, 96); ctx.lineTo(18, 50); ctx.lineTo(78, 50); ctx.lineTo(92, 96);
    ctx.closePath(); ctx.fill();
    // Spiked shoulders
    ctx.fillStyle = '#3a1a4a';
    ctx.beginPath();
    ctx.moveTo(18, 60); ctx.lineTo(14, 50); ctx.lineTo(22, 54);
    ctx.lineTo(78, 54); ctx.lineTo(82, 50); ctx.lineTo(78, 60);
    ctx.closePath(); ctx.fill();
    // Hood
    ctx.fillStyle = '#0a0010';
    ctx.beginPath();
    ctx.arc(48, 36, 22, Math.PI, 0, false);
    ctx.lineTo(70, 56); ctx.lineTo(26, 56);
    ctx.closePath(); ctx.fill();
    // Hood inside (face shadow)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(48, 38, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
    // Glowing eyes
    const glow = ctx.createRadialGradient(42, 38, 0, 42, 38, 4);
    glow.addColorStop(0, '#ff66ff'); glow.addColorStop(1, 'rgba(255,102,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(36, 32, 12, 12);
    const glow2 = ctx.createRadialGradient(54, 38, 0, 54, 38, 4);
    glow2.addColorStop(0, '#ff66ff'); glow2.addColorStop(1, 'rgba(255,102,255,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(48, 32, 12, 12);
    ctx.fillStyle = '#ffaaff';
    ctx.fillRect(41, 37, 3, 3); ctx.fillRect(53, 37, 3, 3);
    // Floating crown
    ctx.fillStyle = '#7733aa';
    ctx.beginPath();
    ctx.moveTo(34, 18); ctx.lineTo(38, 10); ctx.lineTo(44, 16);
    ctx.lineTo(48, 8); ctx.lineTo(52, 16); ctx.lineTo(58, 10);
    ctx.lineTo(62, 18); ctx.lineTo(34, 18);
    ctx.closePath(); ctx.fill();
  });

})(window.GF = window.GF || {});
