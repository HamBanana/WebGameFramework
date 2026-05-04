// GameFramework/games/HappyPup/sprites/scenery.js
// Static park decoration: tree, bush, bench, lamp post.
// Each sprite has a single 'idle' frame. Origin is base-center (so sprites
// sit on the ground line at the supplied y). Drawn via drawFrame().

(function (GF) {
  'use strict';

  // ---- Park tree ------------------------------------------------------------

  const ParkTree = {
    frameWidth: 96, frameHeight: 140,
    originX: 48, originY: 140,
    animations: {
      idle: {
        fps: 1, loop: true,
        frames: [(ctx) => {
          // Trunk
          ctx.fillStyle = '#5b3a1c';
          ctx.fillRect(-6, -54, 12, 54);
          // Trunk shading
          ctx.fillStyle = '#3d2511';
          ctx.fillRect(2, -54, 4, 54);
          // Foliage layers (back-to-front for depth)
          const leafBack  = '#2f7a3a';
          const leafMid   = '#3f9b48';
          const leafFront = '#69c073';
          ctx.fillStyle = leafBack;
          ctx.beginPath(); ctx.arc(-22, -78, 22, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.arc( 22, -78, 22, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(  0, -100, 26, 0, GF.Math.TAU); ctx.fill();
          ctx.fillStyle = leafMid;
          ctx.beginPath(); ctx.arc(-12, -84, 18, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.arc( 14, -90, 19, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(  0, -106, 22, 0, GF.Math.TAU); ctx.fill();
          ctx.fillStyle = leafFront;
          ctx.beginPath(); ctx.arc( -6, -94, 12, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(  8, -100, 11, 0, GF.Math.TAU); ctx.fill();
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath(); ctx.arc(-2, -110, 6, 0, GF.Math.TAU); ctx.fill();
        }],
      },
    },
  };

  // ---- Park bush ------------------------------------------------------------

  const ParkBush = {
    frameWidth: 64, frameHeight: 40,
    originX: 32, originY: 40,
    animations: {
      idle: {
        fps: 1, loop: true,
        frames: [(ctx) => {
          ctx.fillStyle = '#2a6a32';
          ctx.beginPath(); ctx.ellipse(-12, -10, 12, 10, 0, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse( 12, -10, 12, 10, 0, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(  0, -16, 14, 12, 0, 0, GF.Math.TAU); ctx.fill();
          ctx.fillStyle = '#3f9b48';
          ctx.beginPath(); ctx.ellipse(-8, -14, 8, 7, 0, 0, GF.Math.TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse( 7, -16, 8, 7, 0, 0, GF.Math.TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.20)';
          ctx.beginPath(); ctx.ellipse(2, -20, 4, 2, 0, 0, GF.Math.TAU); ctx.fill();
        }],
      },
    },
  };

  // ---- Park bench -----------------------------------------------------------

  const ParkBench = {
    frameWidth: 80, frameHeight: 44,
    originX: 40, originY: 44,
    animations: {
      idle: {
        fps: 1, loop: true,
        frames: [(ctx) => {
          // Legs
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(-30, -22, 5, 22);
          ctx.fillRect( 25, -22, 5, 22);
          // Seat
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(-34, -22, 68, 6);
          // Backrest planks
          ctx.fillRect(-30, -38, 60, 4);
          ctx.fillRect(-30, -32, 60, 4);
          // Highlights along plank tops
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(-30, -38, 60, 1);
          ctx.fillRect(-30, -32, 60, 1);
          ctx.fillRect(-34, -22, 68, 1);
          // Back legs (small support behind seat)
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(-26, -34, 4, 14);
          ctx.fillRect( 22, -34, 4, 14);
        }],
      },
    },
  };

  // ---- Park lamp ------------------------------------------------------------

  const ParkLamp = {
    frameWidth: 40, frameHeight: 130,
    originX: 20, originY: 130,
    animations: {
      idle: {
        fps: 1, loop: true,
        frames: [(ctx) => {
          // Base
          ctx.fillStyle = '#222';
          ctx.fillRect(-8, -6, 16, 6);
          ctx.fillRect(-5, -100, 10, 94);
          // Lamp head bracket
          ctx.fillRect(-10, -110, 20, 4);
          // Bulb housing
          ctx.fillStyle = '#3a3a3a';
          ctx.beginPath();
          ctx.moveTo(-10, -110);
          ctx.lineTo( 10, -110);
          ctx.lineTo(  6, -120);
          ctx.lineTo( -6, -120);
          ctx.closePath();
          ctx.fill();
          // Glow / bulb
          ctx.fillStyle = '#ffe9a3';
          ctx.beginPath();
          ctx.ellipse(0, -113, 5, 4, 0, 0, GF.Math.TAU);
          ctx.fill();
          // Soft halo
          const grad = ctx.createRadialGradient(0, -113, 2, 0, -113, 18);
          grad.addColorStop(0, 'rgba(255,233,163,0.55)');
          grad.addColorStop(1, 'rgba(255,233,163,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, -113, 18, 0, GF.Math.TAU);
          ctx.fill();
        }],
      },
    },
  };

  GF.GameSprites = GF.GameSprites || {};
  GF.GameSprites.parkTree  = ParkTree;
  GF.GameSprites.parkBush  = ParkBush;
  GF.GameSprites.parkBench = ParkBench;
  GF.GameSprites.parkLamp  = ParkLamp;

})(window.GF = window.GF || {});
