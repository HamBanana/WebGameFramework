// GameFramework/games/SwarmHome/core/parts.js
// Shared procedural-mesh helpers for SwarmHome.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  function mkMat(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.r !== undefined ? opts.r : 0.85,
      metalness: opts.m || 0,
      emissive: opts.e ? new THREE.Color(opts.e) : new THREE.Color(0),
      emissiveIntensity: opts.ei || 0,
      transparent: !!opts.t,
      opacity: opts.o !== undefined ? opts.o : 1,
    });
  }

  function mkBox(w, h, d, c, o) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mkMat(c, o));
  }
  function mkCyl(r, h, segs, c, o) {
    return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs || 12), mkMat(c, o));
  }
  function mkSphere(r, c, o) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), mkMat(c, o));
  }

  /** Create mesh helper: position, shadow, add to parent, return mesh. */
  function add(parent, mesh, x, y, z) {
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** Canvas-texture name plate sprite (floats above robots/devices). */
  function makeLabel(text, accent) {
    const cvs = document.createElement('canvas');
    cvs.width = 256; cvs.height = 64;
    const c = cvs.getContext('2d');
    c.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
    const w = Math.min(cvs.width - 8, c.measureText(text).width + 28);
    const x0 = (cvs.width - w) / 2;
    c.fillStyle = 'rgba(12,14,26,0.78)';
    roundedRect(c, x0, 10, w, 44, 10); c.fill();
    c.strokeStyle = accent || 'rgba(120,160,220,0.8)';
    c.lineWidth = 3;
    roundedRect(c, x0, 10, w, 44, 10); c.stroke();
    c.fillStyle = '#e8eeff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, cvs.width / 2, 33);

    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(0.6, 0.15, 1);
    return sprite;
  }

  function roundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  /** Build a coffee cup mesh (origin at base centre). */
  function makeCup() {
    const g = new THREE.Group();
    const body = add(g, mkCyl(0.035, 0.07, 14, 0xf2f0ea, { r: 0.5 }), 0, 0.035, 0);
    body.castShadow = true;
    const coffee = add(g, new THREE.Mesh(
      new THREE.CircleGeometry(0.030, 14),
      mkMat(0x3a2412, { r: 0.4, e: 0x1a0e06, ei: 0.3 })
    ), 0, 0.0705, 0);
    coffee.rotation.x = -Math.PI / 2;
    coffee.castShadow = false;
    const handle = add(g, new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.005, 6, 12, Math.PI),
      mkMat(0xf2f0ea, { r: 0.5 })
    ), 0.037, 0.035, 0);
    handle.rotation.z = -Math.PI / 2;
    g.userData.isCup = true;
    return g;
  }

  SH.parts = { mkMat, mkBox, mkCyl, mkSphere, add, makeLabel, makeCup };

})(window.GF = window.GF || {});
