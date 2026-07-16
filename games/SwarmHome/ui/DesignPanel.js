// GameFramework/games/SwarmHome/ui/DesignPanel.js
// DOM side panel for live-editing robot and device designs. Changes rebuild
// the 3D meshes immediately and persist via the framework SaveSystem, so a
// design survives reloads. Toggle with G.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  const CSS = `
    #shDesignPanel {
      width: 300px; max-height: 540px; overflow-y: auto; flex: none;
      background: #12151f; border: 1px solid #2a3550; border-radius: 10px;
      color: #c8d4ea; font: 12px 'Segoe UI', system-ui, sans-serif;
      padding: 14px;
    }
    #shDesignPanel h2 { font-size: 14px; color: #e8f0ff; margin-bottom: 10px; }
    #shDesignPanel h3 { font-size: 11px; color: #7a9acc; text-transform: uppercase;
      letter-spacing: 1px; margin: 14px 0 6px; border-bottom: 1px solid #232c44; padding-bottom: 3px; }
    #shDesignPanel label { display: flex; justify-content: space-between; align-items: center;
      margin: 5px 0; gap: 8px; }
    #shDesignPanel label span { flex: none; width: 96px; color: #93a5c5; }
    #shDesignPanel input, #shDesignPanel select {
      flex: 1; min-width: 0; background: #1a2030; color: #dde6f5;
      border: 1px solid #2e3a58; border-radius: 5px; padding: 3px 6px; font: inherit; }
    #shDesignPanel input[type=color] { padding: 1px 2px; height: 24px; }
    #shDesignPanel button {
      background: #24304e; color: #cfe0ff; border: 1px solid #3a4a70; border-radius: 6px;
      padding: 6px 10px; margin: 4px 4px 0 0; cursor: pointer; font: inherit; }
    #shDesignPanel button:hover { background: #2e3e64; }
    #shDesignPanel .status { color: #6fcf97; font-size: 11px; margin-top: 6px; min-height: 14px; }
    #shDesignPanel details { margin: 12px 0 6px; }
    #shDesignPanel summary { cursor: pointer; font-size: 11px; color: #7a9acc;
      text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #232c44;
      padding-bottom: 3px; }
    #shDesignPanel table.bom { width: 100%; border-collapse: collapse; margin-top: 6px; }
    #shDesignPanel table.bom td { padding: 3px 4px; border-bottom: 1px solid #1c2438;
      vertical-align: top; font-size: 11px; }
    #shDesignPanel table.bom .qty { color: #7a9acc; white-space: nowrap; width: 26px; }
    #shDesignPanel table.bom .usd { color: #6fcf97; white-space: nowrap; text-align: right; width: 44px; }
    #shDesignPanel table.bom .part { color: #dde6f5; }
    #shDesignPanel table.bom .role { color: #6e80a5; font-size: 10px; margin-top: 1px; }
    #shDesignPanel .pcbCanvas { display: block; margin: 8px auto 4px; border-radius: 4px; }
    #shDesignPanel .pcbMeta { text-align: center; color: #6e80a5; font-size: 10px; margin-bottom: 6px; }
    #shDesignPanel table.pins { width: 100%; border-collapse: collapse; font-size: 10px; }
    #shDesignPanel table.pins th { text-align: left; color: #7a9acc; font-weight: 600;
      padding: 2px 4px; border-bottom: 1px solid #2e3a58; }
    #shDesignPanel table.pins td { padding: 2px 4px; border-bottom: 1px solid #1c2438;
      color: #b8c6e0; font-family: monospace; }
    #shDesignPanel .closeRow { display: none; }
    #shDesignPanel.mobile {
      position: fixed; top: 0; right: 0; height: 100vh; max-height: 100vh;
      width: min(320px, 88vw); z-index: 60; border-radius: 0;
      border-width: 0 0 0 1px; box-shadow: -8px 0 30px rgba(0,0,0,0.5);
    }
    #shDesignPanel.mobile .closeRow { display: block; text-align: right; margin-bottom: 4px; }
  `;

  class DesignPanel {
    constructor(game) {
      this.game = game;
      this.visible = true;

      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);

      this.el = document.createElement('div');
      this.el.id = 'shDesignPanel';
      document.body.appendChild(this.el);

      // On touch devices the panel is a slide-over (toggled by the 🛠 touch
      // button) instead of a docked sidebar, and starts hidden.
      this.mobile = !!(GF.TouchControls && GF.TouchControls.isTouchDevice());
      if (this.mobile) {
        this.el.classList.add('mobile');
        this.visible = false;
        this.el.style.display = 'none';
      }

      this.selection = game.robots[0] ? 'robot:' + game.robots[0].id : 'device:coffeeMachine';
      this.render();
    }

    toggle() {
      this.visible = !this.visible;
      this.el.style.display = this.visible ? 'block' : 'none';
    }

    selectRobot(id) {
      this.selection = 'robot:' + id;
      this.render();
    }

    // ── Form construction ───────────────────────────────────────────────────

    render() {
      const g = this.game;
      this.el.innerHTML = '';

      const closeRow = document.createElement('div');
      closeRow.className = 'closeRow';
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ close';
      closeBtn.onclick = () => this.toggle();
      closeRow.appendChild(closeBtn);
      this.el.appendChild(closeRow);

      const h2 = document.createElement('h2');
      h2.textContent = '🛠 Design Studio';
      this.el.appendChild(h2);

      // Selector
      const sel = document.createElement('select');
      g.robots.forEach(r => sel.appendChild(new Option(`🤖 ${r.name} (${r.id})`, 'robot:' + r.id)));
      ['kitchenLift', 'bedsideLift', 'coffeeMachine', 'crate'].forEach(k =>
        sel.appendChild(new Option('⚙ ' + (g.cfg.devices[k].label || k), 'device:' + k)));
      sel.value = this.selection;
      sel.onchange = () => { this.selection = sel.value; this.render(); };
      this.el.appendChild(sel);

      const [kind, id] = this.selection.split(':');
      if (kind === 'robot') this.renderRobot(id);
      else this.renderDevice(id);

      // Global buttons
      this.section('Designs');
      this.button('📋 Export JSON', () => this.exportJSON());
      this.button('↺ Reset all designs', () => {
        if (this.game.resetDesigns) this.game.resetDesigns();
      });
      this.status = document.createElement('div');
      this.status.className = 'status';
      this.el.appendChild(this.status);
    }

    renderRobot(id) {
      const g = this.game;
      const r = g.robots.find(x => x.id === id);
      if (!r) return;
      const s = r.spec;
      const apply = () => g.applyRobotSpec(r.id);

      this.section('Identity');
      this.text('Name', s.name, v => { s.name = v; apply(); });
      this.color('Colour', s.color, v => { s.color = v; apply(); });

      this.section('Chassis');
      this.select('Shape', s.chassis.type, ['box', 'cylinder'], v => { s.chassis.type = v; apply(); });
      this.num('Width m', s.chassis.width, 0.06, 0.25, 0.005, v => { s.chassis.width = v; apply(); });
      this.num('Length m', s.chassis.length, 0.06, 0.25, 0.005, v => { s.chassis.length = v; apply(); });
      this.num('Height m', s.chassis.height, 0.02, 0.1, 0.005, v => { s.chassis.height = v; apply(); });

      this.section('Drive');
      this.select('Wheels', s.wheels.type, ['diff2', 'quad4'], v => { s.wheels.type = v; apply(); });
      this.num('Wheel radius', s.wheels.radius, 0.01, 0.05, 0.002, v => { s.wheels.radius = v; apply(); });
      this.num('Speed m/s', s.speed, 0.1, 1, 0.05, v => { s.speed = v; apply(); });
      this.num('Turn rad/s', s.turnSpeed, 1, 6, 0.2, v => { s.turnSpeed = v; apply(); });

      this.section('Vision');
      this.num('Mast height', s.mast.height, 0.03, 0.25, 0.01, v => { s.mast.height = v; apply(); });
      this.num('Camera FOV°', s.camera.fov, 40, 110, 5, v => { s.camera.fov = v; apply(); });
      this.num('Camera tilt°', s.camera.tilt, -40, 10, 1, v => { s.camera.tilt = v; apply(); });

      this.section('Payload');
      this.select('Carrier', s.carrier.type, ['tray', 'gripper'], v => { s.carrier.type = v; apply(); });
      this.num('Carrier size', s.carrier.size, 0.05, 0.15, 0.005, v => { s.carrier.size = v; apply(); });
      this.num('Battery cap.', s.battery.capacity, 50, 200, 10, v => { s.battery.capacity = v; apply(); });

      this.renderBOM(GF.SwarmHome.BOM.buildRobotBOM(s));

      this.section('Run a task now');
      this.button('☕ Coffee run', () => g.routine.startTask('coffeeRun', [r]));
      this.button('👁 Patrol', () => g.routine.startTask('patrol', [r]));
      this.button('📦 Crate (pair)', () => {
        const partner = g.robots.find(x => x !== r && !x.busy);
        if (partner && !r.busy) g.routine.startTask('crateMove', [r, partner]);
      });
    }

    renderDevice(key) {
      const g = this.game;
      const s = g.cfg.devices[key];
      const apply = () => g.applyDeviceSpec(key);

      this.section(s.label || key);
      if (key === 'kitchenLift' || key === 'bedsideLift') {
        this.num('Speed m/s', s.speed, 0.1, 1, 0.05, v => { s.speed = v; apply(); });
        this.num('Platform m', s.platform, 0.3, 0.6, 0.02, v => { s.platform = v; apply(); });
        this.color('Colour', s.color, v => { s.color = v; apply(); });
      } else if (key === 'coffeeMachine') {
        this.num('Brew minutes', s.brewMinutes, 0.5, 10, 0.5, v => { s.brewMinutes = v; apply(); });
        this.color('Colour', s.color, v => { s.color = v; apply(); });
      } else if (key === 'crate') {
        this.num('Size m', s.size, 0.2, 0.6, 0.02, v => { s.size = v; apply(); });
        this.color('Colour', s.color, v => { s.color = v; apply(); });
      }

      const lift = key === 'kitchenLift' ? g.devices.kitchenLift
        : key === 'bedsideLift' ? g.devices.bedsideLift : null;
      this.renderBOM(GF.SwarmHome.BOM.buildDeviceBOM(key, s, lift ? { travel: lift.topY } : {}));
    }

    // ── BOM + PCB rendering ─────────────────────────────────────────────────

    renderBOM(bom) {
      if (!bom || !bom.components.length) return;

      // Bill of materials
      const det = this.details(`📋 Components — $${bom.totalUSD.toFixed(2)}`, this._bomOpen !== false,
        open => { this._bomOpen = open; });
      const table = document.createElement('table');
      table.className = 'bom';
      bom.components.forEach(c => {
        const tr = document.createElement('tr');
        const qty = document.createElement('td');
        qty.className = 'qty';
        qty.textContent = c.qty + '×';
        const cell = document.createElement('td');
        const name = document.createElement('div');
        name.className = 'part';
        name.textContent = `${c.part}  ·  ${c.mpn}`;
        const role = document.createElement('div');
        role.className = 'role';
        role.textContent = c.role;
        cell.appendChild(name);
        cell.appendChild(role);
        const usd = document.createElement('td');
        usd.className = 'usd';
        usd.textContent = '$' + (c.qty * c.usd).toFixed(2);
        tr.appendChild(qty); tr.appendChild(cell); tr.appendChild(usd);
        table.appendChild(tr);
      });
      det.appendChild(table);

      // PCB layout + pin map
      if (bom.pcb) {
        const det2 = this.details(`🔌 PCB — ${bom.pcb.name}`, this._pcbOpen !== false,
          open => { this._pcbOpen = open; });
        det2.appendChild(this.drawPCB(bom.pcb));

        const meta = document.createElement('div');
        meta.className = 'pcbMeta';
        meta.textContent = `${bom.pcb.wMM} × ${bom.pcb.hMM} mm · ${bom.pcb.layers}-layer FR-4`;
        det2.appendChild(meta);

        const pins = document.createElement('table');
        pins.className = 'pins';
        const head = document.createElement('tr');
        ['Pin', 'Net', 'Connects to'].forEach(h => {
          const th = document.createElement('th');
          th.textContent = h;
          head.appendChild(th);
        });
        pins.appendChild(head);
        bom.pcb.pins.forEach(p => {
          const tr = document.createElement('tr');
          [p.pin, p.net, p.to].forEach(v => {
            const td = document.createElement('td');
            td.textContent = v;
            tr.appendChild(td);
          });
          pins.appendChild(tr);
        });
        det2.appendChild(pins);
      }
    }

    /** Render the PCB layout to a small canvas (soldermask + silkscreen). */
    drawPCB(pcb) {
      const cw = 264;
      const chh = Math.round(cw * pcb.hMM / pcb.wMM);
      const cvs = document.createElement('canvas');
      cvs.width = cw * 2; cvs.height = chh * 2;       // 2× for crisp text
      cvs.style.width = cw + 'px';
      cvs.style.height = chh + 'px';
      cvs.className = 'pcbCanvas';
      const c = cvs.getContext('2d');
      if (!c) return cvs;
      c.scale(2, 2);

      // Board
      c.fillStyle = '#0d4a23';
      c.fillRect(0, 0, cw, chh);
      c.strokeStyle = '#1a6b38';
      c.lineWidth = 2;
      c.strokeRect(1, 1, cw - 2, chh - 2);

      // Mounting holes
      c.fillStyle = '#c8b860';
      [[8, 8], [cw - 8, 8], [8, chh - 8], [cw - 8, chh - 8]].forEach(([x, y]) => {
        c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#0a0a0a';
        c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#c8b860';
      });

      // Components (silkscreen)
      pcb.parts.forEach(p => {
        const x = p.x * cw, y = p.y * chh;
        const w = p.w * cw, h = p.h * chh;
        c.fillStyle = 'rgba(20,24,20,0.85)';
        c.fillRect(x - w / 2, y - h / 2, w, h);
        c.strokeStyle = '#e8e8d8';
        c.lineWidth = 1;
        c.strokeRect(x - w / 2, y - h / 2, w, h);
        c.fillStyle = '#e8e8d8';
        c.font = 'bold 7px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(p.label, x, y);
        c.font = '6px monospace';
        c.fillText(p.ref, x, y - h / 2 - 4);
      });
      return cvs;
    }

    /** Collapsible section helper. */
    details(title, open, onToggle) {
      const det = document.createElement('details');
      det.open = !!open;
      const sum = document.createElement('summary');
      sum.textContent = title;
      det.appendChild(sum);
      det.addEventListener('toggle', () => onToggle && onToggle(det.open));
      this.el.appendChild(det);
      return det;
    }

    exportJSON() {
      const g = this.game;
      const BOM = GF.SwarmHome.BOM;
      const data = JSON.stringify({
        robots: g.robots.map(r => ({ ...r.spec, bom: BOM.buildRobotBOM(r.spec) })),
        devices: Object.fromEntries(Object.entries(g.cfg.devices).map(([k, s]) =>
          [k, { ...s, bom: BOM.buildDeviceBOM(k, s) }])),
      }, null, 2);
      console.log('[SwarmHome designs]\n' + data);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(data)
          .then(() => this.setStatus('Copied to clipboard (and console).'))
          .catch(() => this.setStatus('Logged to console.'));
      } else {
        this.setStatus('Logged to console.');
      }
    }

    setStatus(msg) {
      if (this.status) this.status.textContent = msg;
    }

    // ── Tiny field helpers ──────────────────────────────────────────────────

    section(title) {
      const h = document.createElement('h3');
      h.textContent = title;
      this.el.appendChild(h);
    }

    row(labelText, input) {
      const label = document.createElement('label');
      const span = document.createElement('span');
      span.textContent = labelText;
      label.appendChild(span);
      label.appendChild(input);
      this.el.appendChild(label);
    }

    num(labelText, value, min, max, step, onChange) {
      const i = document.createElement('input');
      i.type = 'number';
      i.min = min; i.max = max; i.step = step; i.value = value;
      i.onchange = () => {
        const v = Math.min(max, Math.max(min, parseFloat(i.value) || min));
        i.value = v;
        onChange(v);
      };
      this.row(labelText, i);
    }

    text(labelText, value, onChange) {
      const i = document.createElement('input');
      i.type = 'text'; i.value = value; i.maxLength = 12;
      i.onchange = () => onChange(i.value || 'Bot');
      this.row(labelText, i);
    }

    color(labelText, value, onChange) {
      const i = document.createElement('input');
      i.type = 'color'; i.value = value;
      i.onchange = () => onChange(i.value);
      this.row(labelText, i);
    }

    select(labelText, value, opts, onChange) {
      const s = document.createElement('select');
      opts.forEach(o => s.appendChild(new Option(o, o)));
      s.value = value;
      s.onchange = () => onChange(s.value);
      this.row(labelText, s);
    }

    button(text, onClick) {
      const b = document.createElement('button');
      b.textContent = text;
      b.onclick = onClick;
      this.el.appendChild(b);
    }
  }

  SH.DesignPanel = DesignPanel;

})(window.GF = window.GF || {});
