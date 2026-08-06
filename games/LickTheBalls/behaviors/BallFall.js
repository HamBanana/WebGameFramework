// behaviors/BallFall.js — reusable per-entity behavior.
(function (GF) {
  'use strict';
  GF.behavior('BallFall', (cfg) => ({
onAdd(e, world) {
  e.x = 40 + Math.random() * (world.engine.config.width - 80);
  e.y = -20;
  e.speed = 150 + Math.random() * 150;
  e.rotation = 0;
  e.rotSpeed = (Math.random() - 0.5) * 4;
  // Random candy color
  const colors = ['#ff6b9d', '#c44dff', '#4dff9d', '#ffdd4d', '#4dd8ff', '#ff9d4d'];
  e.color = colors[Math.floor(Math.random() * colors.length)];
  if (e.data.type === 'spicy') {
    e.color = '#ff2244';
    e.speed = 250 + Math.random() * 100;
  }
},
update(dt, e, world) {
  e.y += e.speed * dt;
  e.rotation += e.rotSpeed * dt;
  
  // Check collision with tongue
  const player = world.byTag('tongue')[0];
  if (player && player.alive !== false) {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < (e.w/2 + player.w/2) * 0.7) {
      // LICKED!
      const score = world.data.score || { value: 0, best: 0 };
      score.value += e.data.points;
      if (score.value > score.best) score.best = score.value;
      
      // Visual feedback
      if (e.data.type === 'spicy') {
        // Burn effect - tongue turns red
        player.burning = true;
        player.burnTime = 1.5;
        world.data.screenShake = 5;
      } else {
        // Happy lick!
        world.data.popups.push({
          text: '+' + e.data.points,
          x: e.x,
          y: e.y,
          life: 0.8
        });
      }
      e.destroy();
      return;
    }
  }
  
  // Remove if off screen
  if (e.y > world.engine.config.height + 30) {
    e.destroy();
  }
},
draw(ctx, e, world) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rotation);
  
  const r = e.w / 2;
  const topWidth = r * 0.8;
  const topHeight = r * 1.8;
  const topX = 0;
  const topY = -r * 0.2;
  const baseY = topY + topHeight;
  const leftBall = { x: -r * 0.35, y: baseY + r * 0.15 };
  const rightBall = { x: r * 0.35, y: baseY + r * 0.15 };
  const ballRadius = r * 0.55;
  
  // Glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, e.w);
  gradient.addColorStop(0, e.color);
  gradient.addColorStop(0.7, e.color + 'cc');
  gradient.addColorStop(1, e.color + '44');
  
  ctx.fillStyle = gradient;
  
  // Draw left ball
  ctx.beginPath();
  ctx.arc(leftBall.x, leftBall.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw right ball
  ctx.beginPath();
  ctx.arc(rightBall.x, rightBall.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Connecting shape
  ctx.beginPath();
  ctx.moveTo(leftBall.x - ballRadius * 0.3, leftBall.y - ballRadius * 0.5);
  ctx.quadraticCurveTo(0, -r * 0.3, rightBall.x + ballRadius * 0.3, rightBall.y - ballRadius * 0.5);
  ctx.quadraticCurveTo(rightBall.x + ballRadius * 0.3, rightBall.y + ballRadius * 0.3, 0, rightBall.y + ballRadius * 0.6);
  ctx.quadraticCurveTo(leftBall.x - ballRadius * 0.3, leftBall.y + ballRadius * 0.3, leftBall.x - ballRadius * 0.3, leftBall.y - ballRadius * 0.5);
  ctx.fill();
  
  // Top shape
  
  ctx.fillStyle = e.color;
  ctx.beginPath();
  // Stem
  ctx.moveTo(topX - topWidth * 0.45, topY + topHeight);
  ctx.lineTo(topX - topWidth * 0.4, topY);
  // Head
  ctx.quadraticCurveTo(topX - topWidth * 0.7, topY - topHeight * 0.15, topX - topWidth * 0.5, topY - topHeight * 0.25);
  ctx.quadraticCurveTo(topX, topY - topHeight * 0.4, topX + topWidth * 0.5, topY - topHeight * 0.25);
  ctx.quadraticCurveTo(topX + topWidth * 0.7, topY - topHeight * 0.15, topX + topWidth * 0.4, topY);
  ctx.lineTo(topX + topWidth * 0.45, topY + topHeight);
  ctx.closePath();
  ctx.fill();
  
  // Highlights
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(leftBall.x - 3, leftBall.y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightBall.x - 3, rightBall.y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  // Top highlight
  ctx.beginPath();
  ctx.ellipse(topX - topWidth * 0.15, topY - topHeight * 0.1, topWidth * 0.15, topHeight * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Fire for spicy balls
  if (e.data.type === 'spicy') {
    const t = Date.now() / 100;
    ctx.fillStyle = '#ffaa00';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + t;
      const fx = Math.cos(angle) * 18;
      const fy = Math.sin(angle) * 18;
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}
  }));
})(window.GF);
