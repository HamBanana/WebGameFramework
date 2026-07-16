// GameFramework/games/SwarmHome/core/RobotBuilder.js
// Builds a robot mesh from a modular design spec. Every part is parameterised
// (and accent geometry scales with the chassis), so the Design Panel can
// rebuild robots live at any size — the defaults are ~11-15 cm desk bots.
//
// Spec shape (see config.js):
//   { id, name, color,
//     chassis: { type:'box'|'cylinder', width, length, height },
//     wheels:  { type:'diff2'|'quad4', radius },
//     mast:    { height },
//     camera:  { fov, tilt },
//     carrier: { type:'tray'|'gripper', size } }
//
// Returns { group, povCam, wheels, led, trayAnchor, label, ring }.
// Robot forward axis = +Z (yaw 0 drives toward +Z).

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};
  const P = () => SH.parts;

  function buildRobot(spec) {
    const { mkMat, mkBox, mkCyl, mkSphere, add, makeLabel } = P();
    const group = new THREE.Group();
    group.name = 'robot_' + spec.id;

    const ch = spec.chassis;
    const cw = ch.width;                    // accent scale reference
    const wheelR = spec.wheels.radius;
    const bodyY = wheelR * 2 + 0.002;       // chassis underside clears the wheels
    const color = new THREE.Color(spec.color);
    const dark = color.clone().multiplyScalar(0.45);

    // ── Chassis ──
    let chassis;
    if (ch.type === 'cylinder') {
      chassis = mkCyl(ch.width / 2, ch.height, 20, color, { r: 0.6, m: 0.15 });
    } else {
      chassis = mkBox(ch.width, ch.height, ch.length, color, { r: 0.6, m: 0.15 });
    }
    add(group, chassis, 0, bodyY + ch.height / 2, 0);

    // Top deck (darker accent slab — the carrier PCB peeking out)
    const deckT = ch.height * 0.15;
    const deck = mkBox(ch.width * 0.86, deckT, ch.length * 0.86, 0x1a4a2a, { r: 0.4, m: 0.3 });
    add(group, deck, 0, bodyY + ch.height + deckT / 2, 0);

    // ── Wheels ──
    const wheels = [];
    const tireW = wheelR * 0.55;
    const wheelMat = mkMat(0x222228, { r: 0.95 });
    const hubMat = mkMat(0x888899, { r: 0.3, m: 0.6 });
    const mkWheel = () => {
      const w = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, tireW, 16), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      w.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelR * 0.45, wheelR * 0.45, tireW * 1.15, 10), hubMat);
      hub.rotation.z = Math.PI / 2;
      w.add(hub);
      return w;
    };
    const halfW = ch.width / 2 + tireW / 2 + 0.002;
    if (spec.wheels.type === 'quad4') {
      const off = ch.length * 0.3;
      [[-halfW, off], [halfW, off], [-halfW, -off], [halfW, -off]].forEach(([x, z]) => {
        const w = mkWheel();
        w.position.set(x, wheelR, z);
        group.add(w);
        wheels.push(w);
      });
    } else {
      // diff2: two drive wheels mid-body + rear caster ball
      [[-halfW, 0], [halfW, 0]].forEach(([x, z]) => {
        const w = mkWheel();
        w.position.set(x, wheelR, z);
        group.add(w);
        wheels.push(w);
      });
      add(group, mkSphere(wheelR * 0.5, 0x555560, { r: 0.4, m: 0.5 }), 0, wheelR * 0.5, -ch.length * 0.38);
    }

    // ── Camera mast + head ──
    const mastBaseY = bodyY + ch.height + deckT;
    const mastR = Math.max(0.004, cw * 0.05);
    add(group, mkCyl(mastR, spec.mast.height, 8, 0x666677, { r: 0.5, m: 0.5 }),
      0, mastBaseY + spec.mast.height / 2, ch.length * 0.18);

    const headW = cw * 0.28, headH = cw * 0.19, headD = cw * 0.22;
    const head = new THREE.Group();
    head.position.set(0, mastBaseY + spec.mast.height + headH / 2, ch.length * 0.18);
    add(head, mkBox(headW, headH, headD, dark, { r: 0.5 }), 0, 0, 0);
    // Lens (faces +Z)
    const lens = add(head, mkCyl(cw * 0.06, cw * 0.05, 12, 0x111118, { r: 0.2, m: 0.4 }), 0, 0, headD * 0.55);
    lens.rotation.x = Math.PI / 2;
    add(head, mkSphere(cw * 0.035, 0x2244ff, { e: 0x2244ff, ei: 0.8, r: 0.2 }), 0, 0, headD * 0.68);
    group.add(head);

    // POV camera — child of head, looking along +Z, pitched by spec.camera.tilt
    const povCam = new THREE.PerspectiveCamera(spec.camera.fov, 16 / 9, 0.01, 50);
    povCam.rotation.order = 'YXZ';
    povCam.rotation.y = Math.PI;                                   // face +Z
    povCam.rotation.x = THREE.MathUtils.degToRad(spec.camera.tilt); // <0 looks down
    povCam.position.set(0, headH * 0.15, headD * 0.7);
    head.add(povCam);

    // ── Status LED ──
    const led = add(group, mkSphere(cw * 0.07, 0x555555, { e: 0x555555, ei: 1.0, r: 0.3 }),
      0, mastBaseY + cw * 0.08, -ch.length * 0.30);
    led.castShadow = false;

    // ── Carrier: front tray or gripper ──
    const trayAnchor = new THREE.Group();   // cups parent here
    const carrierY = mastBaseY + cw * 0.02;
    const cs = spec.carrier.size;
    if (spec.carrier.type === 'gripper') {
      const armSq = Math.max(0.006, cw * 0.07);
      const armZ = ch.length / 2 + cs * 0.4;
      add(group, mkBox(armSq, armSq, cs * 0.8, 0x777788, { r: 0.4, m: 0.5 }), -cs / 2, carrierY, armZ);
      add(group, mkBox(armSq, armSq, cs * 0.8, 0x777788, { r: 0.4, m: 0.5 }), cs / 2, carrierY, armZ);
      add(group, mkBox(cs + armSq, armSq, armSq, 0x777788, { r: 0.4, m: 0.5 }), 0, carrierY, ch.length / 2 + armSq / 2);
      trayAnchor.position.set(0, carrierY + armSq, armZ);
    } else {
      const trayT = Math.max(0.003, cw * 0.035);
      const trayZ = ch.length / 2 + cs / 2 - cw * 0.05;
      const tray = mkBox(cs, trayT, cs, dark, { r: 0.5 });
      add(group, tray, 0, carrierY, trayZ);
      // raised lip so the cup looks held
      const lipMat = P().mkMat(0x99a0b0, { r: 0.4, m: 0.4 });
      const lipW = Math.max(0.002, cw * 0.022), lipH = Math.max(0.006, cw * 0.08);
      [[-cs / 2, 0], [cs / 2, 0], [0, -cs / 2], [0, cs / 2]].forEach(([x, z]) => {
        const lip = new THREE.Mesh(
          new THREE.BoxGeometry(x === 0 ? cs : lipW, lipH, x === 0 ? lipW : cs), lipMat);
        lip.position.set(x, carrierY + lipH / 2, trayZ + z);
        lip.castShadow = true;
        group.add(lip);
      });
      trayAnchor.position.set(0, carrierY + trayT / 2, trayZ);
    }
    group.add(trayAnchor);

    // ── Name label ──
    const label = makeLabel(spec.name, spec.color);
    label.scale.set(0.38, 0.095, 1);
    label.position.set(0, mastBaseY + spec.mast.height + headH + 0.08, 0);
    group.add(label);

    // Selection ring (hidden by default)
    const ringR = Math.max(ch.width, ch.length);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ringR * 0.75, ringR * 0.88, 28),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.006;
    ring.visible = false;
    group.add(ring);

    // Tag every child so raycast hits resolve to this robot
    group.traverse(o => { o.userData.robotId = spec.id; });

    return { group, povCam, wheels, led, trayAnchor, label, ring };
  }

  SH.RobotBuilder = { buildRobot };

})(window.GF = window.GF || {});
