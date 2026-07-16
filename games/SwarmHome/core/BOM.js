// GameFramework/games/SwarmHome/core/BOM.js
// Bill-of-materials generator: derives the real-world component list, carrier
// PCB layout and GPIO pin map for any robot or device design spec. This is
// the "what would I actually order/print/etch" view of a design — wheel
// count drives motor/driver count, FOV picks the camera lens, carrier type
// adds servos, battery Wh sizes the LiPo cell, and so on.
//
// buildRobotBOM(spec)            → { title, components, pcb, totalUSD }
// buildDeviceBOM(key, spec, x)   → same shape (pcb may be null)
//
// components: [{ qty, part, mpn, role, usd }]
// pcb: { name, wMM, hMM, layers, parts: [{ref,label,x,y,w,h}], pins: [{pin,net,to}] }
//      part placement in normalised 0..1 board coords.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  const mm = (m) => Math.round(m * 1000);
  const C = (qty, part, mpn, role, usd) => ({ qty, part, mpn, role, usd });

  // ── Robot ─────────────────────────────────────────────────────────────────

  function buildRobotBOM(spec) {
    const motors = spec.wheels.type === 'quad4' ? 4 : 2;
    const drivers = Math.ceil(motors / 2);
    const wide = spec.camera.fov > 75;
    // Sim energy units → 1S cell size: 100 units ≈ 1000 mAh (3.7 Wh class)
    const mAh = Math.min(2000, Math.max(400, Math.round(spec.battery.capacity * 10 / 50) * 50));
    const wheelD = mm(spec.wheels.radius * 2);
    const gripper = spec.carrier.type === 'gripper';

    const components = [
      C(1, 'FireBeetle 2 ESP32-P4', 'DFRobot DFR1172', 'main controller · WiFi6 via ESP32-C6 · H.264 video', 11.90),
      C(1, `OV5647 MIPI camera (${wide ? '120° wide' : '72° std'} lens)`, wide ? 'OV5647-120' : 'OV5647-72', `vision stream, FOV ${spec.camera.fov}°, tilt ${spec.camera.tilt}°`, 5.90),
      C(motors, 'N20 micro gear motor 6V 150rpm + encoder', 'GA12-N20-ENC', `${spec.wheels.type} drive, ${spec.speed} m/s design speed`, 3.80),
      C(drivers, 'TB6612FNG dual H-bridge breakout', 'SparkFun ROB-14451', 'motor driver (2 ch each)', 2.40),
      C(motors, `wheel Ø${wheelD} mm (printed hub + TPU tire)`, `PRINT-WHL${wheelD}`, 'drive wheels', 0.60),
      ...(motors === 2 ? [C(1, 'ball caster Ø12.7 mm', 'Pololu 952', 'rear support point', 1.20)] : []),
      C(1, 'VL53L1X time-of-flight sensor', 'ST VL53L1X', 'forward obstacle ranging (4 m)', 3.95),
      C(2, 'ITR20001/T reflective IR sensor', 'ITR20001', 'cliff detection — tabletop edge safety', 0.45),
      C(1, 'MPU-6050 6-axis IMU', 'TDK MPU-6050', 'heading + lift-ride detection', 2.10),
      C(1, 'INMP441 I2S MEMS microphone', 'InvenSense INMP441', 'audio events → host classifier', 2.60),
      C(1, 'WS2812B status LED', 'WS2812B-5050', 'state colour (matches sim LED)', 0.25),
      ...(gripper
        ? [C(2, 'SG90 micro servo', 'TowerPro SG90', 'gripper actuation', 2.30),
           C(1, `gripper fingers, span ${mm(spec.carrier.size)} mm (printed PETG)`, 'PRINT-GRIP', 'payload clamp', 0.40)]
        : [C(1, `cup tray ${mm(spec.carrier.size)}×${mm(spec.carrier.size)} mm + lip (printed PETG)`, 'PRINT-TRAY', 'payload platform', 0.50)]),
      C(1, `LiPo 1S ${mAh} mAh w/ protection`, `LP-1S-${mAh}`, `sized for ${spec.battery.capacity} sim energy units`, Math.round((4 + mAh / 250) * 10) / 10),
      C(1, 'TP4054 charge controller', 'TP4054', 'dock charging via pogo pins', 0.90),
      C(1, 'MT3608 boost converter (5 V)', 'MT3608', 'servo/sensor rail', 0.80),
      C(2, 'pogo pin pair P75-E2', 'P75-E2', 'dock charge contacts (underside)', 0.30),
      C(1, `M3 brass standoff mast, ${mm(spec.mast.height)} mm`, `M3-${mm(spec.mast.height)}`, 'camera/mic mast', 0.70),
      C(1, `chassis ${mm(spec.chassis.width)}×${mm(spec.chassis.length)}×${mm(spec.chassis.height)} mm (printed PETG)`, 'PRINT-CHAS', `${spec.chassis.type} body`, 1.20),
      C(1, 'SwarmBot carrier PCB rev A (2-layer FR-4)', 'SWB-CARRIER-A', 'everything below solders to this', 4.10),
    ];

    // ── Carrier PCB: placement + GPIO map ──
    const pins = [
      { pin: 'GPIO20/21', net: 'M_A IN1/IN2', to: 'TB6612 #1 ch A (left front)' },
      { pin: 'GPIO22/23', net: 'M_B IN1/IN2', to: 'TB6612 #1 ch B (right front)' },
      { pin: 'GPIO24/25', net: 'PWM_A / PWM_B', to: 'TB6612 #1 PWMA/PWMB' },
      ...(drivers > 1 ? [
        { pin: 'GPIO26/27', net: 'M_C IN1/IN2', to: 'TB6612 #2 ch A (left rear)' },
        { pin: 'GPIO28/29', net: 'M_D IN1/IN2', to: 'TB6612 #2 ch B (right rear)' },
        { pin: 'GPIO30/31', net: 'PWM_C / PWM_D', to: 'TB6612 #2 PWMA/PWMB' },
      ] : []),
      { pin: 'GPIO32', net: 'MOTOR_STBY', to: 'TB6612 standby (all)' },
      { pin: 'GPIO15-18', net: 'ENC_1..4', to: 'N20 encoder channels' },
      { pin: 'GPIO7/8', net: 'I2C SDA/SCL', to: 'VL53L1X + MPU-6050' },
      { pin: 'GPIO9/10/11', net: 'I2S WS/SCK/SD', to: 'INMP441 microphone' },
      { pin: 'GPIO12', net: 'LED_DATA', to: 'WS2812B status LED' },
      ...(gripper ? [{ pin: 'GPIO13/14', net: 'SERVO_L / SERVO_R', to: 'SG90 gripper pair' }] : []),
      { pin: 'GPIO3/4', net: 'CLIFF_L / CLIFF_R', to: 'ITR20001 IR sensors (front underside)' },
      { pin: 'GPIO5 (ADC)', net: 'VDOCK_SENSE', to: 'pogo pin + divider (dock detect)' },
      { pin: 'GPIO6 (ADC)', net: 'VBAT_SENSE', to: 'battery divider (fuel gauge)' },
      { pin: 'MIPI-CSI', net: 'CAM', to: 'OV5647 15-pin FFC' },
    ];

    const parts = [
      { ref: 'U1', label: 'ESP32-P4', x: 0.50, y: 0.26, w: 0.44, h: 0.34 },
      { ref: 'J1', label: 'CSI', x: 0.50, y: 0.05, w: 0.30, h: 0.07 },
      { ref: 'U2', label: 'TB6612', x: 0.13, y: 0.42, w: 0.16, h: 0.20 },
      ...(drivers > 1 ? [{ ref: 'U3', label: 'TB6612', x: 0.13, y: 0.68, w: 0.16, h: 0.20 }] : []),
      { ref: 'U4', label: 'IMU', x: 0.50, y: 0.55, w: 0.14, h: 0.10 },
      { ref: 'U5', label: 'MIC', x: 0.86, y: 0.30, w: 0.12, h: 0.10 },
      { ref: 'U6', label: 'TP4054', x: 0.22, y: 0.90, w: 0.14, h: 0.08 },
      { ref: 'U7', label: 'MT3608', x: 0.42, y: 0.90, w: 0.14, h: 0.08 },
      { ref: 'J2', label: 'BATT', x: 0.64, y: 0.91, w: 0.14, h: 0.08 },
      { ref: 'J3', label: 'MOT_L', x: 0.04, y: 0.30, w: 0.07, h: 0.16 },
      { ref: 'J4', label: 'MOT_R', x: 0.96, y: 0.55, w: 0.07, h: 0.16 },
      { ref: 'J5', label: 'ToF', x: 0.86, y: 0.10, w: 0.10, h: 0.08 },
      { ref: 'D1', label: 'WS2812', x: 0.86, y: 0.72, w: 0.09, h: 0.07 },
      { ref: 'PP', label: 'POGO', x: 0.88, y: 0.92, w: 0.10, h: 0.06 },
      ...(gripper ? [{ ref: 'J6', label: 'SRV', x: 0.04, y: 0.10, w: 0.07, h: 0.12 }] : []),
    ];

    const pcb = {
      name: 'SwarmBot carrier rev A',
      wMM: Math.max(36, mm(spec.chassis.width) - 12),
      hMM: Math.max(44, mm(spec.chassis.length) - 14),
      layers: 2,
      parts, pins,
    };

    return finish(`${spec.name} (${spec.id})`, components, pcb);
  }

  // ── Devices ───────────────────────────────────────────────────────────────

  function buildDeviceBOM(key, spec, extra) {
    extra = extra || {};

    if (key === 'kitchenLift' || key === 'bedsideLift') {
      const travel = mm(extra.travel || 0.6);
      const plate = mm(spec.platform);
      const components = [
        C(1, 'ESP32-C3 SuperMini', 'ESP32-C3FH4', 'lift controller node (MQTT)', 2.90),
        C(1, 'NEMA17 stepper 42×38 mm', '17HS4401', `platform hoist, ${spec.speed} m/s design speed`, 9.20),
        C(1, 'A4988 stepper driver', 'A4988', 'microstepping driver', 1.80),
        C(1, `GT2 belt loop ~${Math.round(travel * 2.4)} mm + 20T pulleys ×2`, 'GT2-6', 'drive transmission', 4.20),
        C(2, `drawer slide rail ${Math.ceil((travel + 80) / 50) * 50} mm`, 'DS-BB', 'platform guidance', 2.60),
        C(2, 'micro limit switch', 'KW12-3', 'top/bottom endstops', 0.50),
        C(1, `platform plate ${plate}×${plate} mm (printed PETG + alu sheet)`, 'PRINT-PLAT', 'robot deck, yellow edge stripe', 2.10),
        C(1, '12 V 2 A PSU', 'PSU-12-2', 'motor + logic supply', 7.50),
        C(1, 'Lift controller PCB rev A (2-layer)', 'SWB-LIFT-A', 'C3 + driver + endstop headers', 3.60),
      ];
      const pcb = {
        name: 'Lift controller rev A',
        wMM: 58, hMM: 42, layers: 2,
        parts: [
          { ref: 'U1', label: 'ESP32-C3', x: 0.28, y: 0.32, w: 0.34, h: 0.40 },
          { ref: 'U2', label: 'A4988', x: 0.72, y: 0.32, w: 0.22, h: 0.40 },
          { ref: 'J1', label: '12V', x: 0.10, y: 0.86, w: 0.14, h: 0.16 },
          { ref: 'J2', label: 'MOT', x: 0.88, y: 0.80, w: 0.12, h: 0.22 },
          { ref: 'J3', label: 'END1', x: 0.38, y: 0.88, w: 0.12, h: 0.12 },
          { ref: 'J4', label: 'END2', x: 0.56, y: 0.88, w: 0.12, h: 0.12 },
          { ref: 'U3', label: 'BUCK', x: 0.28, y: 0.70, w: 0.18, h: 0.14 },
        ],
        pins: [
          { pin: 'GPIO2/3', net: 'STEP / DIR', to: 'A4988' },
          { pin: 'GPIO4', net: 'EN', to: 'A4988 enable' },
          { pin: 'GPIO5/6', net: 'END_TOP / END_BOT', to: 'limit switches' },
          { pin: 'GPIO8', net: 'LED', to: 'status LED' },
        ],
      };
      return finish(spec.label, components, pcb);
    }

    if (key === 'coffeeMachine') {
      const components = [
        C(1, 'ESP32-C3 SuperMini', 'ESP32-C3FH4', 'appliance node (MQTT)', 2.90),
        C(1, '2-channel 5 V relay module', 'SRD-05VDC', 'brew trigger + pump', 2.40),
        C(1, 'ACS712-5A current sensor', 'ACS712ELC-05B', `brew-done detect (~${spec.brewMinutes} min cycle)`, 1.90),
        C(1, 'DS18B20 temp probe', 'DS18B20', 'boiler temperature', 1.60),
        C(1, 'HX711 + 1 kg load cell', 'HX711', 'cup-present / fill-level check', 3.20),
        C(1, 'Appliance node PCB rev A', 'SWB-APPL-A', 'C3 + relay + sense headers', 3.30),
      ];
      const pcb = {
        name: 'Appliance node rev A',
        wMM: 52, hMM: 38, layers: 2,
        parts: [
          { ref: 'U1', label: 'ESP32-C3', x: 0.30, y: 0.35, w: 0.36, h: 0.46 },
          { ref: 'K1', label: 'RELAY', x: 0.76, y: 0.30, w: 0.26, h: 0.36 },
          { ref: 'U2', label: 'ACS712', x: 0.74, y: 0.78, w: 0.22, h: 0.20 },
          { ref: 'J1', label: 'TEMP', x: 0.12, y: 0.84, w: 0.12, h: 0.16 },
          { ref: 'J2', label: 'HX711', x: 0.36, y: 0.84, w: 0.14, h: 0.16 },
        ],
        pins: [
          { pin: 'GPIO2/3', net: 'RELAY_1/2', to: 'brew + pump relays' },
          { pin: 'GPIO4 (ADC)', net: 'I_SENSE', to: 'ACS712 out' },
          { pin: 'GPIO5', net: '1-WIRE', to: 'DS18B20' },
          { pin: 'GPIO6/7', net: 'HX_DT / HX_SCK', to: 'HX711 load cell amp' },
        ],
      };
      return finish(spec.label, components, pcb);
    }

    if (key === 'crate') {
      const s = mm(spec.size);
      return finish('Carry crate', [
        C(1, `plywood crate ${s}×${s}×${Math.round(s * 0.7)} mm`, 'WOOD-CRATE', 'cooperative-carry payload', 4.00),
        C(2, 'side handle rail (printed PETG)', 'PRINT-HNDL', 'gripper engagement points', 0.60),
        C(4, 'AprilTag 36h11 fiducial 40 mm', 'TAG36-40', 'pose lock for both carriers', 0.10),
      ], null);
    }

    return finish(key, [], null);
  }

  function finish(title, components, pcb) {
    const totalUSD = Math.round(components.reduce((s, c) => s + c.qty * c.usd, 0) * 100) / 100;
    return { title, components, pcb, totalUSD };
  }

  SH.BOM = { buildRobotBOM, buildDeviceBOM };

})(window.GF = window.GF || {});
