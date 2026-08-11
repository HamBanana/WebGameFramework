// NextDungeon - Procedurally generated dungeon crawler
// Depends on: config.js (GF.GAME_CONFIG), GameFramework.bundle.js

(function (GF) {
  'use strict';

  const CFG = () => GF.GAME_CONFIG;
  const LOG = document.getElementById('gameLog');
  const UI = {
    floor: document.getElementById('floorDisplay'),
    level: document.getElementById('levelDisplay'),
    hp: document.getElementById('hpDisplay'),
    mana: document.getElementById('manaDisplay'),
    xpBar: document.getElementById('xpBar'),
    xpText: document.getElementById('xpText'),
    str: document.getElementById('strDisplay'),
    dex: document.getElementById('dexDisplay'),
    int: document.getElementById('intDisplay'),
    con: document.getElementById('conDisplay'),
    wis: document.getElementById('wisDisplay'),
    cha: document.getElementById('chaDisplay'),
    nextLevel: document.getElementById('nextLevelDisplay'),
    finalFloor: document.getElementById('finalFloor'),
    finalLevel: document.getElementById('finalLevel'),
    victoryFloor: document.getElementById('victoryFloor'),
  };

  // ── Constants ────────────────────────────────────────────────────────────────
  const TILE_SIZE = 32;
  const MAP_WIDTH = 26;  // 832px / 32px
  const MAP_HEIGHT = 20; // 640px / 32px
  const FLOORS = 100;
  const BASE_XP_REQ = 10;
  const XP_GROWTH_FACTOR = 1.5;

  // ── Game State ──────────────────────────────────────────────────────────────
  const State = {
    floor: 1,
    player: null,
    map: null,
    enemies: [],
    npcs: [],
    items: [],
    stairs: null,
    input: null,
    gameOver: false,
    paused: false,
    levelUpPending: false,
    npcsJoined: [],
    shakeTimer: 0,
  };

  // ── Utility Functions ───────────────────────────────────────────────────────
  function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[Floor ${State.floor}] ${message}`;
    LOG.appendChild(entry);
    LOG.scrollTop = LOG.scrollHeight;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // ── Player Class ────────────────────────────────────────────────────────────
  class Player {
    constructor() {
      this.x = 1;
      this.y = 1;
      this.level = 1;
      this.xp = 0;
      this.xpReq = BASE_XP_REQ;
      this.stats = {
        STR: 10,
        DEX: 10,
        CON: 10,
        INT: 10,
        WIS: 10,
        CHA: 10,
      };
      this.pointsToSpend = 0;
      this._hp = this.maxHp; // Start with full HP
      this._mana = this.maxMana;
      this.inventory = [];
      this.equipment = {
        rightHandWeapon: null,
        leftHandWeapon: null,
        rightHandAccessory: null,
        leftHandAccessory: null,
        chest: null,
        legs: null,
        feet: null,
        shoulders: null,
        head: null,
        knees: null,
        neck: null,
        eyes: null,
        weapon: null,
        armor: null,
        accessory: null
      };
      this.spells = [{ name: 'Fireball', manaCost: 5, damage: 8 }, { name: 'Heal', manaCost: 8, heal: 20 }, { name: 'Shield', manaCost: 6, defenseBoost: 5, duration: 3 }];
      this.shieldTurns = 0;
    }

    get maxHp() {
      return 20 + this.stats.CON * 3 + (this.level - 1) * 5;
    }

    get maxMana() {
      return 10 + this.stats.INT * 2 + (this.level - 1) * 3;
    }

    get hp() {
      return this._hp !== undefined ? this._hp : this.maxHp;
    }

    set hp(value) {
      this._hp = Math.max(0, Math.min(value, this.maxHp));
    }

    get mana() {
      return this._mana !== undefined ? this._mana : this.maxMana;
    }

    set mana(value) {
      this._mana = Math.max(0, Math.min(value, this.maxMana));
    }

    get damage() {
      // Melee damage based on STR + weapon
      const base = 3 + Math.floor(this.stats.STR / 3);
      let weaponBonus = 0;
      for (const slot in this.equipment) {
        const item = this.equipment[slot];
        if (item && item.damageBonus) weaponBonus += item.damageBonus;
      }
      return base + weaponBonus;
    }

    get accuracy() {
      // Ranged/attack accuracy based on DEX
      return 50 + this.stats.DEX * 2;
    }

    get defense() {
      // Defense based on DEX and CON + armor + shield
      const base = this.stats.DEX / 2 + this.stats.CON / 3;
      let armorBonus = 0;
      for (const slot in this.equipment) {
        const item = this.equipment[slot];
        if (item && item.defenseBonus) armorBonus += item.defenseBonus;
      }
      const shieldBonus = this.shieldTurns > 0 ? 5 : 0;
      return base + armorBonus + shieldBonus;
    }

    gainXp(amount) {
      this.xp += amount;
      if (this.xp >= this.xpReq) {
        this.levelUp();
      }
      updateUI();
    }

    levelUp() {
      while (this.xp >= this.xpReq) {
        this.xp -= this.xpReq;
        this.level++;
        this.pointsToSpend++;
        // Increase XP requirement for next level
        this.xpReq = Math.floor(this.xpReq * XP_GROWTH_FACTOR);
        log(`Level up! You are now level ${this.level}.`, 'gain');
      }
      // Show level up screen with accumulated points
      if (this.pointsToSpend > 0) {
        State.levelUpPending = true;
        showLevelUpScreen();
      }
    }

    increaseStat(statName) {
      if (this.pointsToSpend > 0) {
        this.stats[statName]++;
        this.pointsToSpend--;
        log(`Increased ${statName} to ${this.stats[statName]}`, 'gain');
        updateUI();
      }
    }

    attack(target, isMelee = true) {
      // Calculate damage
      let damage = this.damage;
      if (isMelee) {
        damage += Math.floor(this.stats.STR / 5);
      } else {
        damage += Math.floor(this.stats.DEX / 5);
      }

      // Calculate hit chance
      const hitChance = Math.max(10, Math.min(95, this.accuracy - (target.defense || 10)));

      if (Math.random() * 100 < hitChance) {
        target.hp -= damage;
        log(`You hit ${target.name} for ${damage} damage!`, 'success');
        return true;
      } else {
        log(`You missed ${target.name}!`, 'info');
        return false;
      }
    }

    pickupItem(item) {
      if (item.type === 'potion') {
        const heal = item.healAmount;
        this.hp = Math.min(this.maxHp, this.hp + heal);
        log(`Picked up ${item.name} and healed ${heal} HP!`, 'gain');
      } else if (item.type === 'weapon') {
        if (!this.equipment.rightHandWeapon || item.damageBonus > this.equipment.rightHandWeapon.damageBonus) {
          if (this.equipment.rightHandWeapon) this.inventory.push(this.equipment.rightHandWeapon);
          this.equipment.rightHandWeapon = item;
          log(`Equipped ${item.name} to Right hand! Damage +${item.damageBonus}`, 'gain');
        } else {
          this.inventory.push(item);
          log(`Picked up ${item.name} (added to inventory)`, 'info');
        }
      } else if (item.type === 'armor') {
        if (!this.equipment.chest || item.defenseBonus > this.equipment.chest.defenseBonus) {
          if (this.equipment.chest) this.inventory.push(this.equipment.chest);
          this.equipment.chest = item;
          log(`Equipped ${item.name} to Chest! Defense +${item.defenseBonus}`, 'gain');
        } else {
          this.inventory.push(item);
          log(`Picked up ${item.name} (added to inventory)`, 'info');
        }
      } else if (item.type === 'scroll') {
        this.mana = Math.min(this.maxMana, this.mana + 10);
        log(`Picked up ${item.name} and restored mana!`, 'gain');
      }
      updateUI();
    }

    castSpell(index) {
      const spell = this.spells[index];
      if (!spell) return;
      if (this.mana < spell.manaCost) {
        log(`Not enough mana for ${spell.name}!`, 'info');
        return;
      }
      this.mana -= spell.manaCost;
      if (spell.name === 'Fireball') {
        let target = null;
        let bestDist = Infinity;
        State.enemies.forEach(e => {
          const d = dist(this.x, this.y, e.x, e.y);
          if (d < bestDist && d <= 5) { bestDist = d; target = e; }
        });
        if (target) {
          const dmg = spell.damage + Math.floor(this.stats.INT / 2);
          target.hp -= dmg;
          log(`Fireball hits ${target.name} for ${dmg} damage!`, 'success');
          if (target.isDead()) {
            log(`${target.name} defeated! +${target.xpValue} XP`, 'success');
            this.gainXp(target.xpValue);
            if (Math.random() < 0.5) {
              const types = ['potion','weapon','armor','scroll'];
              const type = randomChoice(types);
              let name = '';
              if (type === 'potion') name = 'Health Potion';
              else if (type === 'weapon') name = 'Rusty Dagger';
              else if (type === 'armor') name = 'Chain Vest';
              else name = 'Mystic Scroll';
              const drop = new Item(type, name, State.floor);
              drop.x = target.x;
              drop.y = target.y;
              State.items.push(drop);
            }
            State.enemies = State.enemies.filter(e => e !== target);
          }
        } else {
          log(`Fireball fizzles - no target in range!`, 'info');
        }
      } else if (spell.name === 'Heal') {
        const heal = spell.heal + Math.floor(this.stats.WIS / 2);
        this.hp = Math.min(this.maxHp, this.hp + heal);
        log(`Heal restores ${heal} HP!`, 'gain');
      } else if (spell.name === 'Shield') {
        this.shieldTurns = spell.duration;
        log(`Shield active for ${spell.duration} turns!`, 'info');
      }
      updateUI();
    }
  }

  // ── Enemy Class ─────────────────────────────────────────────────────────────
  class Enemy {
    constructor(type, floorLevel) {
      this.type = type;
      this.floorLevel = floorLevel;
      this.level = Math.max(1, Math.floor(floorLevel / 5) + 1);
      
      // Scale based on floor
      const scale = 1 + (floorLevel - 1) * 0.15;

      if (type === 'slime') {
        this.name = 'Slime';
        this.hp = Math.floor(15 * scale);
        this.maxHp = this.hp;
        this.damage = Math.floor(3 * scale);
        this.defense = Math.floor(1 * scale);
        this.xpValue = 3;
        this.color = '#44aa44';
      } else if (type === 'goblin') {
        this.name = 'Goblin';
        this.hp = Math.floor(25 * scale);
        this.maxHp = this.hp;
        this.damage = Math.floor(5 * scale);
        this.defense = Math.floor(2 * scale);
        this.xpValue = 5;
        this.color = '#448844';
      } else if (type === 'orc') {
        this.name = 'Orc';
        this.hp = Math.floor(40 * scale);
        this.maxHp = this.hp;
        this.damage = Math.floor(8 * scale);
        this.defense = Math.floor(4 * scale);
        this.xpValue = 8;
        this.color = '#886644';
      } else if (type === 'skeleton') {
        this.name = 'Skeleton';
        this.hp = Math.floor(35 * scale);
        this.maxHp = this.hp;
        this.damage = Math.floor(7 * scale);
        this.defense = Math.floor(3 * scale);
        this.xpValue = 7;
        this.color = '#dddddd';
      } else if (type === 'dark-mage') {
        this.name = 'Dark Mage';
        this.hp = Math.floor(30 * scale);
        this.maxHp = this.hp;
        this.damage = Math.floor(12 * scale);
        this.defense = Math.floor(2 * scale);
        this.xpValue = 12;
        this.color = '#8844cc';
      } else if (type === 'boss') {
        this.name = 'Dungeon Boss';
        this.hp = Math.floor(500 * scale);
        this.maxHp = this.hp;
        this.damage = Math.floor(25 * scale);
        this.defense = Math.floor(15 * scale);
        this.xpValue = 500;
        this.color = '#cc0000';
      }
    }

    takeDamage(amount) {
      this.hp -= amount;
    }

    isDead() {
      return this.hp <= 0;
    }
  }

  // ── Item Class ──────────────────────────────────────────────────────────────
  class Item {
    constructor(type, name, floor) {
      this.type = type;
      this.name = name;
      this.floor = floor;
      const scale = 1 + (floor - 1) * 0.1;
      if (type === 'potion') {
        this.healAmount = Math.floor(20 * scale);
        this.color = '#ff4444';
      } else if (type === 'weapon') {
        this.damageBonus = Math.floor(2 * scale);
        this.color = '#aaaaaa';
      } else if (type === 'armor') {
        this.defenseBonus = Math.floor(1 * scale);
        this.color = '#4444ff';
      } else if (type === 'scroll') {
        this.spellPower = Math.floor(5 * scale);
        this.color = '#ffaa44';
      }
    }
  }

  // ── NPC Class ───────────────────────────────────────────────────────────────
  class NPC {
    constructor(floor) {
      this.floor = floor;
      this.level = Math.floor(floor / 10) + 1;
      this.name = this.generateName();
      this.hp = 50 + this.level * 20;
      this.maxHp = this.hp;
      this.quote = this.generateQuote();
    }

    generateName() {
      const names = [
        'Kael', 'Lyra', 'Garrick', 'Elara', 'Thorne',
        'Serena', 'Bram', 'Mirela', 'Vael', 'Corin',
        'Drax', 'Aria', 'Rook', 'Nyx', 'Zarek'
      ];
      return randomChoice(names);
    }

    generateQuote() {
      const quotes = [
        "Greetings, traveler. The dungeon grows darker with each floor.",
        "I seek the boss on floor 100. Will you join me?",
        "Beware the monsters above. They grow stronger with each level.",
        "I've seen many fall to the dungeon's darkness. We must be careful.",
        "The stairs back up are always where you last stood. Remember that!"
      ];
      return randomChoice(quotes);
    }
  }

  // ── Map Utilities ───────────────────────────────────────────────────────────
  function isFloorTile(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    return State.map[y][x].type !== 'wall';
  }

  function findNearestFloorTile(targetX, targetY, maxRadius = 5) {
    // Check the target tile first
    if (isFloorTile(targetX, targetY)) return { x: targetX, y: targetY };
    
    // Expand in a spiral to find the nearest floor tile
    for (let radius = 1; radius <= maxRadius; radius++) {
      // Check perimeter of square
      for (let x = targetX - radius; x <= targetX + radius; x++) {
        for (let y = targetY - radius; y <= targetY + radius; y++) {
          if (Math.abs(x - targetX) === radius || Math.abs(y - targetY) === radius) {
            if (isFloorTile(x, y)) {
              return { x, y };
            }
          }
        }
      }
    }
    
    // Fallback: scan entire map for any floor tile
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (isFloorTile(x, y)) {
          return { x, y };
        }
      }
    }
    return { x: targetX, y: targetY }; // Should never reach here
  }

  function placeInRoomCenter(room) {
    const cx = room.x + Math.floor(room.width / 2);
    const cy = room.y + Math.floor(room.height / 2);
    return findNearestFloorTile(cx, cy, 3);
  }

  // ── Map Generation ──────────────────────────────────────────────────────────
  function generateMap() {
    const map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        // Initialize with walls
        map[y][x] = {
          type: 'wall',
          seen: false,
          visited: false,
          visible: false,
        };
      }
    }

    // Carve rooms using a simple room-based approach
    const rooms = [];
    const numRooms = randomInt(8, 12);

    for (let i = 0; i < numRooms; i++) {
      const roomWidth = randomInt(4, 8);
      const roomHeight = randomInt(4, 6);
      const roomX = randomInt(1, MAP_WIDTH - roomWidth - 1);
      const roomY = randomInt(1, MAP_HEIGHT - roomHeight - 1);

      const room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
      };

      // Carve out the room
      for (let ry = roomY; ry < roomY + roomHeight; ry++) {
        for (let rx = roomX; rx < roomX + roomWidth; rx++) {
          map[ry][rx] = { type: 'floor', seen: false, visited: false, visible: false };
        }
      }

      rooms.push(room);
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
      const prev = rooms[i - 1];
      const curr = rooms[i];

      // Create L-shaped corridor
      const prevCenterX = prev.x + Math.floor(prev.width / 2);
      const prevCenterY = prev.y + Math.floor(prev.height / 2);
      const currCenterX = curr.x + Math.floor(curr.width / 2);
      const currCenterY = curr.y + Math.floor(curr.height / 2);

      // Horizontal corridor first
      const startX = Math.min(prevCenterX, currCenterX);
      const endX = Math.max(prevCenterX, currCenterX);
      for (let x = startX; x <= endX; x++) {
        map[prevCenterY][x] = { type: 'floor', seen: false, visited: false, visible: false };
      }

      // Vertical corridor
      const startY = Math.min(prevCenterY, currCenterY);
      const endY = Math.max(prevCenterY, currCenterY);
      for (let y = startY; y <= endY; y++) {
        map[y][currCenterX] = { type: 'floor', seen: false, visited: false, visible: false };
      }
    }

    // Find a far room for the boss (if floor 100)
    if (State.floor === FLOORS) {
      // Place boss in the last room
      const bossRoom = rooms[rooms.length - 1];
      const bossX = bossRoom.x + Math.floor(bossRoom.width / 2);
      const bossY = bossRoom.y + Math.floor(bossRoom.height / 2);
      
      // Replace the room with a boss room
      for (let ry = bossRoom.y; ry < bossRoom.y + bossRoom.height; ry++) {
        for (let rx = bossRoom.x; rx < bossRoom.x + bossRoom.width; rx++) {
          map[ry][rx] = { type: 'boss_floor', seen: false, visited: false, visible: false };
        }
      }
    }

    return { map, rooms };
  }

  // ── Title Scene ─────────────────────────────────────────────────────────────
  class TitleScene extends GF.Scene {
    init(engine) {
      this._engine = engine;
      // Bind start action to common keys
      engine.input.bind('start', 'Enter', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD');
      // Also respond to canvas click
      const canvas = engine.canvas || document.getElementById('gameCanvas');
      canvas.addEventListener('click', this._onCanvasClick = () => {
        this.startGame(engine);
      });
    }

    update(dt, engine) {
      // Start game on any bound start key
      const input = engine.input;
      if (input.wasPressed('start')) {
        this.startGame(engine);
      }
    }

    startGame(engine) {
      // Reset all state
      State.floor = 1;
      State.player = null;
      State.enemies = [];
      State.npcs = [];
      State.npcsJoined = [];
      State.gameOver = false;
      State.paused = false;
      State.levelUpPending = false;

      // Hide all overlays
      ['gameOverScreen', 'victoryScreen', 'levelUpScreen', 'npcScreen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

      // Clear log
      LOG.innerHTML = '';
      log('Welcome to NextDungeon!', 'success');
      log('Use Arrow Keys or WASD to move', 'info');

      // Switch to main game scene
      engine.getSystem('SceneManager').replace(new MainScene(), engine);
    }

    render(ctx, engine) {
      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // Dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, W, H);

      // Title
      ctx.fillStyle = '#ffcc66';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NextDungeon', W / 2, H / 2 - 60);

      ctx.fillStyle = '#ccddff';
      ctx.font = '16px monospace';
      ctx.fillText('A procedurally generated dungeon crawler', W / 2, H / 2 - 20);
      ctx.fillText('Use Arrow Keys or WASD to move', W / 2, H / 2 + 5);
      ctx.fillText('Collect XP to level up and increase stats', W / 2, H / 2 + 25);
      ctx.fillText('Q/E/R to cast spells, pick up items', W / 2, H / 2 + 45);

      ctx.fillStyle = '#66ccff';
      ctx.font = '18px monospace';
      ctx.fillText('Press any key or click to start', W / 2, H / 2 + 60);
    }

    destroy(engine) {
      // Remove binding by deleting it
      delete engine.input._bindings['start'];
      if (this._onCanvasClick) {
        engine.canvas.removeEventListener('click', this._onCanvasClick);
      }
    }
  }

  // ── Game Scene ──────────────────────────────────────────────────────────────
  class MainScene extends GF.Scene {
    init(engine) {
      this.t = 0;
      engine.input.bind('spell1', 'KeyQ');
      engine.input.bind('spell2', 'KeyE');
      engine.input.bind('spell3', 'KeyR');
      engine.input.bind('inventory', 'KeyI');
      this.setupGame();
    }

    setupGame(stairsOverride) {
      // Initialize player only on very first floor (not when returning via stairs_up)
      if (!State.player || State.player.x === undefined) {
        State.player = new Player();
        State.npcsJoined = [];
      }

      // Generate map
      const mapData = generateMap();
      State.map = mapData.map;
      const rooms = mapData.rooms;

      // Place both stairs: stairs_override for returning, and stairs_down for progressing
      const exitRoom = rooms[rooms.length - 1];
      const downStairPos = placeInRoomCenter(exitRoom);

      if (stairsOverride) {
        // Place the override stairs (up stairs when going down floors, down stairs when going up)
        const nearestOverride = findNearestFloorTile(stairsOverride.x, stairsOverride.y);
        State.stairs = {
          x: nearestOverride.x,
          y: nearestOverride.y,
          direction: stairsOverride.direction,
        };
        State.downStairs = {
          x: downStairPos.x,
          y: downStairPos.y,
        };

        // Spawn player near the override stairs, with a small buffer to avoid immediate stair re-entry
        const stairDirections = [
          { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
          { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
        ];
        let playerPos = null;
        for (const dir of stairDirections) {
          const nx = State.stairs.x + dir.dx;
          const ny = State.stairs.y + dir.dy;
          if (isFloorTile(nx, ny)) {
            playerPos = { x: nx, y: ny };
            break;
          }
        }
        if (!playerPos) {
          playerPos = findNearestFloorTile(State.stairs.x + 2, State.stairs.y, 5);
        }
        State.player.x = playerPos.x;
        State.player.y = playerPos.y;
      } else {
        // First floor: stairs_down only, no stairs_up needed
        State.stairs = {
          x: downStairPos.x,
          y: downStairPos.y,
          direction: 'down',
        };
        State.downStairs = null;

        // Place player in first room
        const playerRoom = rooms[0];
        const playerPos = placeInRoomCenter(playerRoom);
        State.player.x = playerPos.x;
        State.player.y = playerPos.y;
      }

      // Initialize vision for the new floor so player's starting area is lit
      this.updateVision();

      // Generate enemies (skip first room where player starts, and keep far from player)
      State.enemies = [];
      const enemyCount = randomInt(3, 6) + State.floor;
      const enemyTypes = ['slime', 'goblin', 'orc', 'skeleton', 'dark-mage'];
      const MIN_ENEMY_DIST = 6; // Minimum distance from player

      for (let i = 0; i < enemyCount; i++) {
        // Find a random room that's not the first one
        const roomIndex = randomInt(1, rooms.length - 1);
        const room = rooms[roomIndex];
        
        // Place enemy in a random position in the room
        const enemyX = room.x + randomInt(1, room.width - 2);
        const enemyY = room.y + randomInt(1, room.height - 2);

        // Skip if too close to player
        if (dist(enemyX, enemyY, State.player.x, State.player.y) < MIN_ENEMY_DIST) continue;

        // Skip if player is there
        if (enemyX === State.player.x && enemyY === State.player.y) continue;

        // Skip if stairs are there (check both stairs_up and stairs_down)
        if (enemyX === State.stairs.x && enemyY === State.stairs.y) continue;
        if (State.downStairs && enemyX === State.downStairs.x && enemyY === State.downStairs.y) continue;

        // Check if an enemy is already there
        if (State.enemies.some(e => e.x === enemyX && e.y === enemyY)) continue;

        const type = randomChoice(enemyTypes);
        const enemy = new Enemy(type, State.floor);
        enemy.x = enemyX;
        enemy.y = enemyY;
        State.enemies.push(enemy);
      }

      // Place boss on floor 100
      if (State.floor === FLOORS) {
        const bossRoom = rooms[rooms.length - 1];
        const boss = new Enemy('boss', State.floor);
        let bossPos = placeInRoomCenter(bossRoom);
        boss.x = bossPos.x;
        boss.y = bossPos.y;
        // Ensure boss doesn't overlap with stairs or other enemies
        let attempts = 0;
        while (
          ((boss.x === State.stairs.x && boss.y === State.stairs.y) ||
           (State.downStairs && boss.x === State.downStairs.x && boss.y === State.downStairs.y)) ||
          State.enemies.some(e => e.x === boss.x && e.y === boss.y)
        ) {
          const altPos = findNearestFloorTile(bossPos.x + 2 + attempts, bossPos.y + attempts, 5);
          boss.x = altPos.x;
          boss.y = altPos.y;
          attempts++;
          if (attempts > 20) break;
        }
        State.enemies.push(boss);
      }

      // Place NPC on milestone floors (10, 20, 30...)
      State.npcs = [];
      if (State.floor % 10 === 0 && State.floor > 0) {
        const npc = new NPC(State.floor);
        if (rooms.length >= 3) {
          const npcRoomIndex = randomInt(1, rooms.length - 2);
          const npcRoom = rooms[npcRoomIndex];
          const npcPos = placeInRoomCenter(npcRoom);
          npc.x = npcPos.x;
          npc.y = npcPos.y;
        } else {
          const fallbackPos = findNearestFloorTile(5, 5, 10);
          npc.x = fallbackPos.x;
          npc.y = fallbackPos.y;
        }
        State.npcs = [npc];
      }

      // Place items
      State.items = [];
      const itemCount = randomInt(2, 4) + Math.floor(State.floor / 10);
      const itemTypes = ['potion', 'weapon', 'armor', 'scroll'];
      for (let i = 0; i < itemCount; i++) {
        const roomIndex = randomInt(1, rooms.length - 1);
        const room = rooms[roomIndex];
        const ix = room.x + randomInt(1, room.width - 2);
        const iy = room.y + randomInt(1, room.height - 2);
        if (State.enemies.some(e => e.x === ix && e.y === iy)) continue;
        if (ix === State.player.x && iy === State.player.y) continue;
        if (ix === State.stairs.x && iy === State.stairs.y) continue;
        if (State.downStairs && ix === State.downStairs.x && iy === State.downStairs.y) continue;
        const type = randomChoice(itemTypes);
        let name = '';
        if (type === 'potion') name = 'Health Potion';
        else if (type === 'weapon') name = 'Iron Sword';
        else if (type === 'armor') name = 'Leather Armor';
        else name = 'Fire Scroll';
        const item = new Item(type, name, State.floor);
        item.x = ix;
        item.y = iy;
        State.items.push(item);
      }

      log(`Entered floor ${State.floor}`, 'info');
      updateUI();
    }

    update(dt, engine) {
      if (State.gameOver || State.paused) return;

      this.t += dt;

      // Decrement shake timer
      if (State.shakeTimer > 0) State.shakeTimer--;

      const player = State.player;

      // Handle input (using KeyboardEvent.code values for turn-based movement)
      const input = engine.input;
      let moved = false;

      if (input.wasPressed('inventory')) {
        toggleInventory();
      } else if (input.wasPressed('spell1')) {
        player.castSpell(0);
        moved = true;
      } else if (input.wasPressed('spell2')) {
        player.castSpell(1);
        moved = true;
      } else if (input.wasPressed('spell3')) {
        player.castSpell(2);
        moved = true;
      }

      if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW') || input.wasPressed('KeyK')) {
        this.movePlayer(0, -1);
        moved = true;
      } else if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS') || input.wasPressed('KeyJ')) {
        this.movePlayer(0, 1);
        moved = true;
      } else if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA') || input.wasPressed('KeyH')) {
        this.movePlayer(-1, 0);
        moved = true;
      } else if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD') || input.wasPressed('KeyL')) {
        this.movePlayer(1, 0);
        moved = true;
      }

      // Turn-based: enemies only move after the player moves
      if (moved) {
        // Mana regen per turn and shield decay
        if (player) {
          player.mana = Math.min(player.maxMana, player.mana + 1);
          if (player.shieldTurns > 0) player.shieldTurns--;
          updateUI();
        }
        this.updateEnemies();
      }

      // Check for victory - boss must be dead on floor 100
      if (State.floor === FLOORS) {
        const boss = State.enemies.find(e => e.name === 'Dungeon Boss' && e.isDead());
        if (boss) {
          State.enemies = State.enemies.filter(e => e !== boss);
          this.victory();
        }
      }
    }

    movePlayer(dx, dy) {
      const player = State.player;
      const newX = player.x + dx;
      const newY = player.y + dy;

      // Check boundaries
      if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;

      // Check walls
      if (State.map[newY][newX].type === 'wall') {
        State.shakeTimer = 3; // Visual feedback for blocked movement
        return;
      }

      // Check other entities
      const enemy = State.enemies.find(e => e.x === newX && e.y === newY);
      if (enemy) {
        player.attack(enemy);
        if (enemy.isDead()) {
          log(`${enemy.name} defeated! +${enemy.xpValue} XP`, 'success');
          player.gainXp(enemy.xpValue);
          // Drop item chance
          if (Math.random() < 0.5) {
            const types = ['potion','weapon','armor','scroll'];
            const type = randomChoice(types);
            let name = '';
            if (type === 'potion') name = 'Health Potion';
            else if (type === 'weapon') name = 'Rusty Dagger';
            else if (type === 'armor') name = 'Chain Vest';
            else name = 'Mystic Scroll';
            const drop = new Item(type, name, State.floor);
            drop.x = enemy.x;
            drop.y = enemy.y;
            State.items.push(drop);
          }
          // Remove enemy
          State.enemies = State.enemies.filter(e => e !== enemy);
          // Check for NPC interaction
          this.checkNpcInteraction();
        }
        return; // Don't move into enemies
      }

      // Check stairs_down (to go deeper)
      if (State.downStairs && newX === State.downStairs.x && newY === State.downStairs.y) {
        this.nextFloor();
        return;
      }

      // Check stairs_up (to go back)
      if (newX === State.stairs.x && newY === State.stairs.y) {
        if (State.stairs.direction === 'up') {
          this.prevFloor();
        } else if (State.stairs.direction === 'down' && !State.downStairs) {
          // Floor 1: only stairs_down, no separate up stairs
          this.nextFloor();
        }
        return;
      }

      // Move player
      player.x = newX;
      player.y = newY;

      // Pick up items
      const itemIndex = State.items.findIndex(it => it.x === newX && it.y === newY);
      if (itemIndex !== -1) {
        const item = State.items[itemIndex];
        player.pickupItem(item);
        State.items.splice(itemIndex, 1);
      }

      // Update vision
      this.updateVision();

    }

    updateEnemies() {
      const player = State.player;

      State.enemies.forEach(enemy => {
        const distance = dist(player.x, player.y, enemy.x, enemy.y);
        
        // Only move if close to player
        if (distance < 10) {
          // Simple AI: move toward player
          const dx = Math.sign(player.x - enemy.x);
          const dy = Math.sign(player.y - enemy.y);

          let newX = -1, newY = -1;

          // Try horizontal move first (only if dx is non-zero, meaning player is horizontally offset)
          if (dx !== 0) {
            const hX = enemy.x + dx;
            const hY = enemy.y;
            if (hX >= 0 && hX < MAP_WIDTH && hY >= 0 && hY < MAP_HEIGHT && 
                State.map[hY][hX].type !== 'wall') {
              newX = hX;
              newY = hY;
            }
          }

          // If horizontal didn't work or wasn't possible, try vertical move
          if (newX === -1 && dy !== 0) {
            const vX = enemy.x;
            const vY = enemy.y + dy;
            if (vX >= 0 && vX < MAP_WIDTH && vY >= 0 && vY < MAP_HEIGHT &&
                State.map[vY][vX].type !== 'wall') {
              newX = vX;
              newY = vY;
            }
          }

          // Can't move
          if (newX === -1) return;

          // Check if player is at target position - attack instead of moving into them
          if (newX === player.x && newY === player.y) {
            this.enemyAttack(enemy);
            return;
          }

          // Prevent enemies overlapping - don't move into cell occupied by another enemy
          if (State.enemies.some(e => e !== enemy && e.x === newX && e.y === newY)) {
            return;
          }

          enemy.x = newX;
          enemy.y = newY;
        }
      });
    }

    enemyAttack(enemy) {
      const player = State.player;
      
      // Calculate damage
      let damage = enemy.damage;
      // Reduce by player's defense
      damage -= Math.floor(player.defense / 2);
      damage = Math.max(1, damage);

      player.hp -= damage;
      log(`${enemy.name} hits you for ${damage} damage!`, 'danger');

      if (player.hp <= 0) {
        State.gameOver = true;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        UI.finalFloor.textContent = State.floor;
        UI.finalLevel.textContent = player.level;
      }

      updateUI();
    }

    checkNpcInteraction() {
      // Check if any NPC is nearby
      const nearbyNpc = State.npcs.find(npc =>
        dist(State.player.x, State.player.y, npc.x, npc.y) < 3
      );

      if (nearbyNpc && State.npcsJoined.length < 3 && State.npcs.length > 0) {
        showNpcScreen(nearbyNpc);
      }
    }

    nextFloor() {
      State.floor++;
      if (State.floor > FLOORS) {
        this.victory();
        return;
      }

      // Use the down stairs position (where player went down) for the up stairs on the next floor
      // On floor 1, State.stairs IS the down stairs; on floors 2+, use State.downStairs
      const downStairsPos = State.downStairs || State.stairs;
      const upStairs = {
        x: downStairsPos.x,
        y: downStairsPos.y,
        direction: 'up',
      };
      this.setupGame(upStairs);
    }

    prevFloor() {
      if (State.floor > 1) {
        State.floor--;

        // Use the up stairs position (where player went up) for the down stairs on the previous floor
        const downStairs = {
          x: State.stairs.x,
          y: State.stairs.y,
          direction: 'down',
        };
        this.setupGame(downStairs);
      }
    }

    updateVision() {
      const player = State.player;
      if (!player || !State.map) return;
      
      // Clear current visibility flags, keep explored 'seen'
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          State.map[y][x].visible = false;
        }
      }

      // Update visited status
      State.map[player.y][player.x].visited = true;
      State.map[player.y][player.x].seen = true;
      State.map[player.y][player.x].visible = true;

      // Raycasting line of sight with Bresenham
      const VISION_RADIUS = 9;
      const px = player.x;
      const py = player.y;

      const inBounds = (x, y) => x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT;
      const revealTile = (x, y) => {
        if (!inBounds(x, y)) return true;
        State.map[y][x].seen = true;
        State.map[y][x].visited = true;
        State.map[y][x].visible = true;
        return State.map[y][x].type !== 'wall';
      };

      // Cast rays to every tile within the visibility radius
      for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
        for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
          if (dx === 0 && dy === 0) continue;
          const distSq = dx * dx + dy * dy;
          if (distSq > VISION_RADIUS * VISION_RADIUS) continue;
          
          const tx = px + dx;
          const ty = py + dy;
          if (!inBounds(tx, ty)) continue;

          // Generalized Bresenham line algorithm
          let x0 = px;
          let y0 = py;
          const x1 = tx;
          const y1 = ty;
          const dxAbs = Math.abs(x1 - x0);
          const dyAbs = Math.abs(y1 - y0);
          const sx = x1 > x0 ? 1 : -1;
          const sy = y1 > y0 ? 1 : -1;
          let err = dxAbs - dyAbs;

          while (true) {
            // Skip player tile (already revealed)
            if (!(x0 === px && y0 === py)) {
              const canContinue = revealTile(x0, y0);
              if (!canContinue) break; // Wall blocks vision
            }
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dyAbs) {
              err -= dyAbs;
              x0 += sx;
            }
            if (e2 < dxAbs) {
              err += dxAbs;
              y0 += sy;
            }
            if (!inBounds(x0, y0)) break;
          }
        }
      }
    }

    render(ctx, engine) {
      const { width, height } = CFG().engine;

      // Clear screen
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Not ready yet
      if (!State.player) return;

      // Render map
      const offsetX = (width - MAP_WIDTH * TILE_SIZE) / 2;
      const offsetY = (height - MAP_HEIGHT * TILE_SIZE) / 2;

      // Shake effect for blocked movement
      let shakeX = 0, shakeY = 0;
      if (State.shakeTimer && State.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * 4;
        shakeY = (Math.random() - 0.5) * 4;
      }

      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const tile = State.map[y][x];
          if (tile.seen) {
            let color;
            if (tile.visible) {
              if (tile.type === 'wall') {
                color = '#666';
              } else if (tile.type === 'floor') {
                color = '#444';
              } else if (tile.type === 'boss_floor') {
                color = '#733';
              } else {
                color = '#222';
              }
            } else {
              if (tile.type === 'wall') {
                color = '#444';
              } else if (tile.type === 'floor') {
                color = '#222';
              } else if (tile.type === 'boss_floor') {
                color = '#522';
              } else {
                color = '#111';
              }
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(
              offsetX + x * TILE_SIZE,
              offsetY + y * TILE_SIZE,
              TILE_SIZE,
              TILE_SIZE
            );

            // Grid lines
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(
              offsetX + x * TILE_SIZE + 0.5,
              offsetY + y * TILE_SIZE + 0.5,
              TILE_SIZE - 1,
              TILE_SIZE - 1
            );
          } else {
            // Unexplored area
            ctx.fillStyle = '#000';
            ctx.fillRect(
              offsetX + x * TILE_SIZE,
              offsetY + y * TILE_SIZE,
              TILE_SIZE,
              TILE_SIZE
            );
          }
        }
      }

      // Render stairs_up (yellow) - returns to previous floor
      if (State.stairs && State.stairs.direction === 'up' && State.map[State.stairs.y][State.stairs.x].seen) {
        ctx.fillStyle = '#ffcc66';
        ctx.fillRect(
          offsetX + State.stairs.x * TILE_SIZE + 8,
          offsetY + State.stairs.y * TILE_SIZE + 8,
          TILE_SIZE - 16,
          TILE_SIZE - 16
        );
      }

      // Render stairs_down (cyan) - goes to next floor
      // On floors 2+, use State.downStairs; on floor 1, use State.stairs
      const downStairs = State.downStairs || (State.stairs && State.stairs.direction === 'down' ? State.stairs : null);
      if (downStairs && State.map[downStairs.y][downStairs.x].seen) {
        ctx.fillStyle = '#66ccff';
        ctx.fillRect(
          offsetX + downStairs.x * TILE_SIZE + 8,
          offsetY + downStairs.y * TILE_SIZE + 8,
          TILE_SIZE - 16,
          TILE_SIZE - 16
        );
      }

      // Render items
      State.items.forEach(item => {
        if (State.map[item.y] && State.map[item.y][item.x] && State.map[item.y][item.x].seen) {
          ctx.fillStyle = item.color;
          ctx.fillRect(
            offsetX + item.x * TILE_SIZE + 10,
            offsetY + item.y * TILE_SIZE + 10,
            TILE_SIZE - 20,
            TILE_SIZE - 20
          );
        }
      });

      // Render player
      ctx.fillStyle = '#66ccff';
      ctx.fillRect(
        offsetX + State.player.x * TILE_SIZE + 4 + shakeX,
        offsetY + State.player.y * TILE_SIZE + 4 + shakeY,
        TILE_SIZE - 8,
        TILE_SIZE - 8
      );

      // Render enemies
      State.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(
          offsetX + enemy.x * TILE_SIZE + 4,
          offsetY + enemy.y * TILE_SIZE + 4,
          TILE_SIZE - 8,
          TILE_SIZE - 8
        );

        // Health bar (improved visibility)
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        const barWidth = TILE_SIZE - 6;
        const barHeight = 4;
        const barX = offsetX + enemy.x * TILE_SIZE + 3;
        const barY = offsetY + enemy.y * TILE_SIZE - 5;
        
        // Background (red)
        ctx.fillStyle = '#330000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Fill (green to yellow to red based on HP)
        let fillColor;
        if (hpPercent > 0.6) fillColor = '#44ff44';
        else if (hpPercent > 0.3) fillColor = '#ffcc00';
        else fillColor = '#ff4444';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barWidth - 2) * hpPercent), barHeight - 2);
      });

      // Render NPCs
      State.npcs.forEach(npc => {
        ctx.fillStyle = '#66ff66';
        ctx.fillRect(
          offsetX + npc.x * TILE_SIZE + 4,
          offsetY + npc.y * TILE_SIZE + 4,
          TILE_SIZE - 8,
          TILE_SIZE - 8
        );
      });

    }

    victory() {
      State.gameOver = true;
      document.getElementById('victoryScreen').classList.remove('hidden');
      UI.victoryFloor.textContent = FLOORS;
    }
  }

  // ── UI Functions ────────────────────────────────────────────────────────────
  function updateUI() {
    if (!State.player) return;

    UI.floor.textContent = State.floor;
    UI.level.textContent = State.player.level;
    const hpPercent = Math.max(0, Math.min(100, (State.player.hp / State.player.maxHp) * 100));
    UI.hp.style.height = `${hpPercent}%`;
    const manaPercent = Math.max(0, Math.min(100, (State.player.mana / State.player.maxMana) * 100));
    UI.mana.style.height = `${manaPercent}%`;
    UI.xpText.textContent = `${State.player.xp}/${State.player.xpReq}`;

    const xpPercent = (State.player.xp / State.player.xpReq) * 100;
    UI.xpBar.style.width = `${xpPercent}%`;

    UI.str.textContent = State.player.stats.STR;
    UI.dex.textContent = State.player.stats.DEX;
    UI.int.textContent = State.player.stats.INT;
    UI.con.textContent = State.player.stats.CON;
    UI.wis.textContent = State.player.stats.WIS;
    UI.cha.textContent = State.player.stats.CHA;
  }

  function showLevelUpScreen() {
    State.paused = true;
    const screen = document.getElementById('levelUpScreen');
    screen.classList.remove('hidden');
    // Show current level (already incremented) and points remaining
    UI.nextLevel.textContent = State.player.level;
    document.getElementById('pointsToSpendDisplay').textContent = State.player.pointsToSpend;

    const statGrid = document.getElementById('statGrid');
    statGrid.innerHTML = '';

    const statNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    statNames.forEach(stat => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      const canAfford = State.player.pointsToSpend > 0;
      row.innerHTML = `
        <span class="stat-name">${stat}</span>
        <span class="stat-value">${State.player.stats[stat]}</span>
        <button class="stat-plus-btn" onclick="handleStatClick('${stat}')" ${canAfford ? '' : 'disabled'}>+</button>
      `;
      statGrid.appendChild(row);
    });
  }

  window.handleStatClick = function(stat) {
    State.player.increaseStat(stat);
    
    // Refresh the screen to update disabled states and points display
    if (State.player.pointsToSpend > 0) {
      document.getElementById('pointsToSpendDisplay').textContent = State.player.pointsToSpend;
      // Update stat values and button states
      const rows = document.querySelectorAll('.stat-row');
      const statNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
      rows.forEach((row, i) => {
        const name = row.querySelector('.stat-name').textContent;
        row.querySelector('.stat-value').textContent = State.player.stats[name];
        const btn = row.querySelector('.stat-plus-btn');
        btn.disabled = State.player.pointsToSpend <= 0;
      });
    } else {
      document.getElementById('levelUpScreen').classList.add('hidden');
      State.paused = false;
    }
  };

  function showNpcScreen(npc) {
    State.paused = true;
    const screen = document.getElementById('npcScreen');
    screen.classList.remove('hidden');

    document.getElementById('npcName').textContent = npc.name;
    document.getElementById('npcQuote').textContent = `"${npc.quote}"`;
    document.getElementById('npcLevel').textContent = npc.level;
    document.getElementById('npcHp').textContent = npc.hp;
  }

  window.acceptNpc = function() {
    const npc = State.npcs[0];
    State.npcsJoined.push(npc);
    State.npcs = [];
    
    log(`${npc.name} has joined your party!`, 'success');
    
    document.getElementById('npcScreen').classList.add('hidden');
    State.paused = false;
  };

  window.rejectNpc = function() {
    State.npcs = [];
    log("You continued without a companion.", 'info');
    
    document.getElementById('npcScreen').classList.add('hidden');
    State.paused = false;
  };

  window.toggleInventory = function() {
    const screen = document.getElementById('inventoryScreen');
    if (!screen) return;
    if (screen.classList.contains('hidden')) {
      const player = State.player;
      const equipList = document.getElementById('equipmentList');
      const itemsList = document.getElementById('itemsList');
      equipList.innerHTML = '';
      itemsList.innerHTML = '';
      if (player) {
        const slots = [
          { key: 'rightHandWeapon', label: 'Right hand (Weapon)' },
          { key: 'leftHandWeapon', label: 'Left hand (Weapon)' },
          { key: 'rightHandAccessory', label: 'Right hand (Accessory)' },
          { key: 'leftHandAccessory', label: 'Left hand (Accessory)' },
          { key: 'chest', label: 'Chest' },
          { key: 'legs', label: 'Legs' },
          { key: 'feet', label: 'Feet' },
          { key: 'shoulders', label: 'Shoulders' },
          { key: 'head', label: 'Head' },
          { key: 'knees', label: 'Knees' },
          { key: 'neck', label: 'Neck (Accessory)' },
          { key: 'eyes', label: 'Eyes' },
        ];
        slots.forEach(s => {
          const div = document.createElement('div');
          div.style.padding = '4px';
          div.style.border = '1px solid #444';
          div.style.margin = '2px 0';
          div.style.cursor = 'pointer';
          const item = player.equipment[s.key];
          div.textContent = `${s.label}: ${item ? item.name : 'Empty'}`;
          div.dataset.slot = s.key;
          div.onclick = () => {
            if (window._selectedItemIndex !== undefined) {
              const itemToEquip = player.inventory[window._selectedItemIndex];
              const prev = player.equipment[s.key];
              player.inventory.splice(window._selectedItemIndex, 1);
              if (prev) player.inventory.push(prev);
              player.equipment[s.key] = itemToEquip;
              window._selectedItemIndex = undefined;
              screen.classList.add('hidden');
              toggleInventory();
              log(`Equipped ${itemToEquip.name} to ${s.label}`, 'success');
            } else if (item) {
              // Unequip item back to inventory
              player.inventory.push(item);
              player.equipment[s.key] = null;
              screen.classList.add('hidden');
              toggleInventory();
              log(`Unequipped ${item.name} from ${s.label}`, 'info');
            }
          };
          equipList.appendChild(div);
        });

        if (player.inventory.length === 0) {
          itemsList.innerHTML = '<div>Empty</div>';
        } else {
          player.inventory.forEach((it, idx) => {
            const d = document.createElement('div');
            d.style.padding = '4px';
            d.style.border = '1px solid #444';
            d.style.margin = '2px 0';
            d.style.cursor = 'pointer';
            d.textContent = `${it.name} (${it.type})`;
            d.dataset.idx = idx;
            d.onclick = () => {
              [...itemsList.children].forEach(ch => ch.style.background = '');
              d.style.background = '#334455';
              window._selectedItemIndex = idx;
              log(`Selected ${it.name}`, 'info');
            };
            itemsList.appendChild(d);
          });
        }
      }
      State.paused = true;
      screen.classList.remove('hidden');
    } else {
      closeInventory();
    }
  };

  window.closeInventory = function() {
    const screen = document.getElementById('inventoryScreen');
    if (screen) screen.classList.add('hidden');
    State.paused = false;
    window._selectedItemIndex = undefined;
  };

  window.startGame = function() {
    // Restart from title screen (called by buttons in overlays)
    const game = window.game;
    if (!game) return;
    const scenes = game.scenes;
    const engine = game.engine;
    
    // Reset state
    State.floor = 1;
    State.player = null;
    State.enemies = [];
    State.npcs = [];
    State.npcsJoined = [];
    State.gameOver = false;
    State.paused = false;
    State.levelUpPending = false;

    // Hide all overlays
    ['gameOverScreen', 'victoryScreen', 'levelUpScreen', 'npcScreen', 'inventoryScreen'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    // Go back to title scene
    scenes.replace(new TitleScene(), engine);
  };

  // ── Game Initialization ─────────────────────────────────────────────────────
  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG;
    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName: cfg.game.name,
      audio: true,
      tweens: true,
      particles: true,
      scenes: true,
      debug: true,
    });

    window.game = game; // Store reference for restart buttons
    game.scenes.push(new TitleScene(), game.engine);
    game.engine.start();
  });

})(window.GF = window.GF || {});
