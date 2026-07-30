// behaviors/SpiderPatrol.js — reusable per-entity behavior.
(function (GF) {
  'use strict';
  GF.behavior('SpiderPatrol', (cfg) => ({
onAdd(e) {
  e.vx = (Math.random() < 0.5 ? -1 : 1) * 30;
  e.hasEyeball = true;
},
update(dt, e, world) {
  e.x += e.vx * dt;
  if (e.x < 20 || e.x > 940) { e.vx *= -1; }
},
draw(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI*2);
  ctx.fill();
  if (e.hasEyeball) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -2, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -2, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(-4, -2, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -2, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(0, 3, 3, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = -0.5 + i * 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*10, Math.sin(a)*10);
    ctx.lineTo(Math.cos(a)*22, Math.sin(a)*22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(Math.PI-a)*10, Math.sin(a)*10);
    ctx.lineTo(Math.cos(Math.PI-a)*22, Math.sin(a)*22);
    ctx.stroke();
  }
  ctx.restore();
}
  }));
})(window.GF);
