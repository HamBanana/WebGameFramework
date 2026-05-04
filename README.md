# GameFramework — Developer Guide

**Version 2.3.0**

## What's new in 2.3.0

- **New systems** promoted from games:
  - `GF.StateMachine` — finite state machine with timed states (FightingGame's character logic)
  - `GF.PlayerController` — pre-wired movement/animation controller (platformer / topdown / sideways modes)
  - `GF.ScoreManager` — score, persistent high score, combo multiplier (SpaceInvaders, scene transitions)
  - `GF.WaveSpawner` — wave-based enemy spawning with difficulty ramp
  - `GF.ParallaxSystem` — multi-layer scroll backgrounds (RoadToSkagen)
- **New scene templates**: `GF.TitleScene`, `GF.GameOverScene`
- **New procedural-audio helpers**: `GF.Audio.makeToneBuffer`, `GF.Audio.makeArpeggioBuffer`, `GF.Audio.registerStandardSet` (extracted from SpaceInvaders/ShiningQuest)
- **Built-in sprites**: 109 sprites + 6 portraits previously inside individual games are now available in the framework. Asset paths live in `framework/sprites/<category>.js`; games refer to sprites by name only (e.g. `'goblin'`, `'tree_pine'`, `'token_red'`, `'hana'`). Categories: `aliens`, `boss`, `businesses`, `cells`, `characters`, `landmarks`, `monsters`, `player`, `portraits`, `resources`, `scenery`, `tokens`, `ui`, `vehicles`, `wildlife`.
- **Sprite assets** rendered to `/Sprites/<Category>/<Name>/spritesheet.png` + `animate.json` (Aseprite frameTags format) — same layout as `Claude` and `Claudia`.
- Two bundles now: `GameFramework.bundle.js` (core, ~217 KB) and `GameFramework.sprites.bundle.js` (optional, all built-in sprite registrations, ~84 KB). Include the second only if you want every sprite eagerly loaded.

GameFramework is a modular JavaScript framework for building HTML-based games. A game only needs to include the bundled framework script in its `index.html`; all asset paths, sprite registrations, and system wiring live inside the framework and your game's config file — keeping individual game files lean and focused on logic.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Quick Start](#2-quick-start)
3. [GAME_CONFIG Pattern](#3-game_config-pattern)
4. [Creating a Game — `GF.createGame`](#4-creating-a-game)
5. [Engine](#5-engine)
6. [Input](#6-input)
7. [Scenes & Scene Manager](#7-scenes--scene-manager)
8. [Sprites & Animation](#8-sprites--animation)
9. [Physics](#9-physics)
10. [Camera](#10-camera)
11. [Tilemaps](#11-tilemaps)
12. [UI Drawing Utilities](#12-ui-drawing-utilities)
13. [Audio](#13-audio)
14. [Tweens](#14-tweens)
15. [Particles](#15-particles)
16. [Dialogue System](#16-dialogue-system)
17. [Save System](#17-save-system)
18. [Asset Loader](#18-asset-loader)
19. [Debug Overlay](#19-debug-overlay)
20. [Math Utilities](#20-math-utilities)
21. [Events](#21-events)
22. [Full Minimal Example](#22-full-minimal-example)

---

## 1. Project Structure

```
GameFramework/
├── framework/
│   ├── core/
│   │   ├── Engine.js           # Game loop & canvas management
│   │   ├── EventBus.js         # Pub/sub event system
│   │   ├── InputManager.js     # Keyboard input
│   │   ├── AssetLoader.js      # Asset pre-loading
│   │   └── SceneManager.js     # Scene stack
│   ├── systems/
│   │   ├── SpriteSystem.js     # Sprite defs & animators
│   │   ├── PhysicsSystem.js    # AABB physics + gravity
│   │   ├── UISystem.js         # HUD drawing helpers
│   │   ├── AudioSystem.js      # Web Audio wrapper
│   │   ├── TweenSystem.js      # Property animation
│   │   ├── ParticleSystem.js   # Particle emitters
│   │   ├── Camera.js           # Scrolling viewport
│   │   ├── TilemapSystem.js    # Grid-based tilemaps
│   │   ├── SaveSystem.js       # localStorage save/load
│   │   ├── DialogueSystem.js   # Dialogue sequencer
│   │   └── DebugOverlay.js     # Dev overlay (F1)
│   ├── sprites/                # Built-in sprite definitions
│   ├── utils/
│   │   └── MathUtils.js        # Math helpers & easing
│   ├── GameFramework.js        # Main API (source)
│   └── GameFramework.bundle.js # Bundled output (include this)
├── games/                      # Example games
└── Sprites/                    # Sprite asset files
```

Your game's `index.html` includes `GameFramework.bundle.js` (or the source file) once. Everything else is your game's own JS files.

---

## 2. Quick Start

**index.html**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Game</title>
</head>
<body>
  <canvas id="gameCanvas"></canvas>

  <!-- 1. Framework -->
  <script src="../../framework/GameFramework.bundle.js"></script>

  <!-- 2. Your game files -->
  <script src="config.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

**config.js**
```javascript
(function (GF) {
  'use strict';
  GF.GAME_CONFIG = {
    engine: { width: 800, height: 450, canvasId: 'gameCanvas', backgroundColor: '#1a1a2e' },
    physics: { gravity: 2200, floorY: 400, leftWall: 0, rightWall: 800 },
  };
})(window.GF = window.GF || {});
```

**game.js**
```javascript
(function (GF) {
  'use strict';

  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG;

    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName: 'MyGame',
      audio: true,
      tweens: true,
      particles: true,
      scenes: true,
      debug: true,
    });

    // Bind inputs
    game.engine.input
      .bind('left',  'ArrowLeft',  'KeyA')
      .bind('right', 'ArrowRight', 'KeyD')
      .bind('jump',  'Space',      'KeyW');

    // Push first scene
    game.scenes.push(new MainScene(game), game.engine);
    game.engine.start();
  });

})(window.GF = window.GF || {});
```

---

## 3. GAME_CONFIG Pattern

Every game defines a `GF.GAME_CONFIG` object inside an IIFE before the main game script runs. This keeps configuration separate from logic and lets the launcher override settings via `localStorage`.

```javascript
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
    // Passed directly to the Engine constructor
    engine: {
      width: 800,           // Canvas width in pixels
      height: 450,          // Canvas height in pixels
      canvasId: 'gameCanvas',
      backgroundColor: '#000000',
    },

    // Passed to PhysicsSystem
    physics: {
      gravity: 2200,        // Downward acceleration px/s²
      floorY: 400,          // Y position of the ground
      leftWall: 0,
      rightWall: 800,
    },

    // Add any game-specific constants here — balance values,
    // level data, character stats, etc.
    player: { speed: 220, jumpPower: 700 },
  };

  // Optional: let the launcher override settings (e.g. fullscreen mode)
  window.addEventListener('GF:ready', () => GF.applyLauncherConfig('MyGame'));

})(window.GF = window.GF || {});
```

Rule: **never put full asset paths in `GAME_CONFIG`**. Use sprite names and let the framework resolve paths.

---

## 4. Creating a Game

### `GF.createGame(engineConfig, physicsConfig, opts)`

Synchronously creates and wires all enabled systems. Returns a `game` object with references to every system.

```javascript
const game = GF.createGame(cfg.engine, cfg.physics, {
  gameName:    'MyGame',   // Namespace for SaveSystem
  audio:       true,
  tweens:      true,
  particles:   true,
  scenes:      true,
  tilemap:     true,
  debug:       true,
  dialogue:    true,

  // Fine-grained system options
  audioOpts:    { masterVolume: 0.8 },
  particleOpts: { poolSize: 256 },
  dialogueOpts: { typeSpeed: 30, advanceKey: 'interact' },
  debugOpts:    { toggleKey: 'F1', enabled: false },
  saveOpts:     { namespace: 'MyGame' },
});

// Returned object
game.engine    // Engine instance
game.sprites   // SpriteSystem
game.physics   // PhysicsSystem
game.ui        // UISystem
game.save      // SaveSystem
game.audio     // AudioSystem   (if audio: true)
game.tweens    // TweenSystem   (if tweens: true)
game.particles // ParticleSystem (if particles: true)
game.scenes    // SceneManager  (if scenes: true)
game.tilemap   // TilemapSystem (if tilemap: true)
game.debug     // DebugOverlay  (if debug: true)
game.dialogue  // DialogueSystem (if dialogue: true)
```

### `GF.createGameAsync(engineConfig, physicsConfig, opts)` → `Promise<game>`

Same as above but with built-in asset loading. Provide a `setup` callback to register assets; the framework loads them before resolving the promise.

```javascript
GF.createGameAsync(cfg.engine, cfg.physics, {
  gameName: 'MyGame',
  audio: true,
  setup(loader, game) {
    loader.addImage('hero',   'sprites/hero.png');
    loader.addAudio('bgm',    'audio/theme.ogg');
    loader.addJSON('level1',  'data/level1.json');
  },
}).then(game => {
  // All assets ready
  const heroImg = game.engine.loader.get('hero');
  game.engine.start();
});
```

---

## 5. Engine

The `Engine` drives the game loop, owns the canvas, and provides access to the `EventBus` and `InputManager`.

### Configuration

```javascript
{
  width: 800,
  height: 450,
  canvasId: 'gameCanvas',     // id of an existing <canvas> element
  backgroundColor: '#1a1a2e', // Cleared to this color every frame
}
```

### Key API

```javascript
// Lifecycle
engine.start()   // Begin the loop
engine.stop()    // Pause the loop

// Callbacks (can chain)
engine.onUpdate((dt, engine) => { /* dt = elapsed seconds */ })
engine.onRender((ctx, engine) => { /* draw here */ })

// Systems
engine.addSystem(system)      // Register a custom system
engine.getSystem('name')      // Retrieve by name

// References
engine.canvas    // HTMLCanvasElement
engine.ctx       // CanvasRenderingContext2D
engine.events    // EventBus
engine.input     // InputManager
engine.fps       // Current frames per second
engine.systems   // Object with shortcut refs to all active systems
```

The engine calls `.update(dt)` then `.render(ctx)` on every registered system each frame before invoking your `onUpdate` / `onRender` callbacks.

**Accessing Systems from Scenes**

Inside scene methods, you receive the `engine` parameter. Access systems via the shortcut property:

```javascript
class MyScene extends GF.Scene {
  init(engine) {
    // Access any system through engine.systems
    engine.systems.physics.addBody(body);
    engine.systems.sprites.createAnimator('hero', 'idle');
    engine.systems.audio.play('sfx');
  }
}
```

Alternatively, capture a reference to the game object outside the scene and pass it during initialization if you need frequent access.

---

## 6. Input

`InputManager` translates raw `KeyboardEvent.code` values into named *actions*. All code uses action names, never raw key codes.

### Binding

```javascript
engine.input
  .bind('left',     'ArrowLeft',  'KeyA')
  .bind('right',    'ArrowRight', 'KeyD')
  .bind('jump',     'Space',      'KeyW')
  .bind('attack',   'KeyZ',       'Period')
  .bind('interact', 'KeyE',       'Enter');
```

### Querying

```javascript
// True every frame the key is held
if (engine.input.isDown('left')) { player.vx = -speed; }

// True only on the exact frame the key was pressed
if (engine.input.wasPressed('jump')) { player.vy = -jumpPower; }

// True only on the exact frame the key was released
if (engine.input.wasReleased('attack')) { /* end charge */ }
```

### Common Key Codes

| Code | Key |
|------|-----|
| `ArrowLeft / Right / Up / Down` | Arrow keys |
| `KeyA` … `KeyZ` | Letter keys |
| `Digit0` … `Digit9` | Number row |
| `Space` | Spacebar |
| `Enter` | Enter |
| `Escape` | Escape |
| `ShiftLeft`, `ShiftRight` | Shift |
| `F1` … `F12` | Function keys |

---

## 7. Scenes & Scene Manager

Scenes are the primary way to separate game states (menus, gameplay, pause screens, game-over screens, etc.). The `SceneManager` maintains a stack — only the top scene runs each frame.

### Creating a Scene

Extend `GF.Scene` and override the lifecycle methods you need:

```javascript
class GameplayScene extends GF.Scene {

  // Called once, the very first time this scene is pushed.
  // Heavy setup (spawning entities, building tilemaps) goes here.
  // Access systems via engine.systems.SYSTEM_NAME
  init(engine) {
    this.engine = engine;  // Save for later use
    this.player = spawnPlayer();
    engine.systems.physics.addBody(this.player.body);
  }

  // Called every time this scene becomes the top of the stack
  // (after a pop returns to it, or on first push after init).
  enter(engine) {
    engine.systems.audio.playMusic('bgm', { fadeIn: 1 });
  }

  // Game logic — called every frame while active.
  update(dt, engine) {
    this.player.update(dt, engine);
    // Access systems: engine.systems.physics, engine.systems.audio, etc.
  }

  // Drawing — called every frame while active.
  render(ctx, engine) {
    this.player.draw(ctx);
    // Draw HUD after camera.end() to avoid world transform
  }

  // Called when another scene is pushed on top, covering this one.
  exit(engine) {
    engine.systems.audio.stopMusic({ fadeOut: 0.5 });
  }

  // Called when this scene is permanently removed from the stack.
  destroy(engine) {
    // Free resources
  }
}
```

### Stack Operations

```javascript
const { scenes, engine } = game;

// Push a new scene on top
scenes.push(new GameplayScene(), engine);

// Replace the top scene
scenes.replace(new GameOverScene(), engine);

// Remove the top scene (returns to the scene below)
scenes.pop(engine);

// Remove everything
scenes.clear(engine);

// Inspect the stack
scenes.current   // Top scene
scenes.depth     // Number of scenes
scenes.stack     // Array, index 0 = bottom
```

### Animated Transitions

All stack operations have a `WithTransition` variant:

```javascript
scenes.pushWithTransition(new LevelScene(), {
  type:     'fade',    // 'fade' | 'flash' | 'wipe' | 'iris'
  duration: 0.6,       // Total seconds (fade-out + fade-in)
  color:    '#000000',
  ease:     'inOutQuad',
});

scenes.popWithTransition({ type: 'iris', duration: 0.4 });
scenes.replaceWithTransition(new MenuScene(), { type: 'wipe', duration: 0.5 });
scenes.replaceAllWithTransition(new TitleScene(), { type: 'fade' });
```

---

## 8. Sprites & Animation

GameFramework uses **programmatic sprites** — frames are drawing functions, not image slices. This means sprites are fully resolution-independent and require no external image files, though you can draw images inside a frame function if you wish.

### Defining a Sprite

```javascript
const HeroSprite = {
  frameWidth:  48,
  frameHeight: 64,
  originX:     24,  // Pivot X (centre horizontally)
  originY:     64,  // Pivot Y (feet, for ground alignment)

  animations: {
    idle: {
      fps:  8,
      loop: true,
      frames: [
        (ctx) => {
          // Draw frame 0 — canvas is pre-translated to (0,0) at the origin
          ctx.fillStyle = '#4488ff';
          ctx.fillRect(-12, -48, 24, 48); // body
          ctx.fillStyle = '#ffddaa';
          ctx.beginPath();
          ctx.arc(0, -54, 10, 0, Math.PI * 2);
          ctx.fill();
        },
        // … more frames
      ],
    },

    run: {
      fps:  12,
      loop: true,
      frames: [ /* … */ ],
    },

    jump: {
      fps:  8,
      loop: false,  // Plays once and stops on the last frame
      frames: [ /* … */ ],
    },
  },
};
```

### Registering Sprites

```javascript
// Register one
game.sprites.registerSprite('hero', HeroSprite);

// Register many at once
game.sprites.registerSprites({
  'hero':   HeroSprite,
  'enemy':  EnemySprite,
  'coin':   CoinSprite,
});
```

### Animators

Create one `SpriteAnimator` per entity that needs independent playback state.

```javascript
const anim = game.sprites.createAnimator('hero', 'idle');

// Inside entity update:
if (input.isDown('right')) {
  anim.play('run');
  anim.flipX = false;
} else if (input.isDown('left')) {
  anim.play('run');
  anim.flipX = true;
} else {
  anim.play('idle');
}

if (input.wasPressed('jump')) {
  anim.play('jump').onFinish(() => anim.play('idle'));
}

anim.update(dt);

// Inside entity render:
anim.draw(ctx, player.x, player.y);  // x, y = feet centre position
```

### Direct Frame Drawing

When you don't need per-entity state (e.g. drawing a static icon):

```javascript
game.sprites.drawFrame(ctx, 'coin', 'spin', frameIndex, x, y, flipX);
```

### Built-in Sprites

The framework ships with `claude` and `claudia` sprite definitions, available immediately after registering:

```javascript
game.sprites.registerSprite('claude',  GF.Sprites.claude);
game.sprites.registerSprite('claudia', GF.Sprites.claudia);
```

---

## 9. Physics

`PhysicsSystem` provides axis-aligned bounding box (AABB) collision with gravity, friction, and wall/floor clamping. It is intentionally simple — suitable for platformers and fighting games.

### Configuration

```javascript
// Passed to GF.createGame as physicsConfig
{
  gravity:    2200,  // px/s² downward
  floorY:     400,   // Y of the main floor
  leftWall:   0,
  rightWall:  800,
}
```

### Creating Bodies

```javascript
const body = new GF.PhysicsBody({
  x: 100, y: 300,     // Top-left position
  width: 32, height: 48,
  gravityScale: 1,    // 0 = float, 1 = full gravity, -1 = reverse
  maxSpeedX: 500,
  maxSpeedY: 1200,
  friction: 0.8,      // Applied to vx while grounded (0–1)
  tag: 'player',      // Custom string identifier
});

game.physics.addBody(body);
```

### Using Bodies

```javascript
// Apply velocity directly
body.vx = speed;
body.vy = -jumpPower;

// Useful read-only properties
body.centerX   // x + width  / 2
body.centerY   // y + height / 2
body.right     // x + width
body.bottom    // y + height
body.grounded  // true when resting on floor or solid tilemap tile

// AABB overlap test
if (body.overlaps(otherBody)) { handleCollision(); }
```

### Removing Bodies

```javascript
game.physics.removeBody(body);
```

---

## 10. Camera

`Camera` applies a viewport transform so the canvas shows a scrolling window into a larger world.

### Creating a Camera

```javascript
const camera = new GF.Camera({
  width:      800,    // Viewport width (usually engine width)
  height:     450,    // Viewport height
  worldWidth: 3200,   // Total world width
  worldHeight: 900,
  lerp:       0.1,    // Smoothing factor (0 = instant, 1 = no lag)
});
```

### Following an Entity

```javascript
// Follow any object with .x, .y, .width, .height properties
camera.follow(player, 0, -60);  // Optional world-space offset

camera.unfollow();
```

### Manual Positioning

```javascript
camera.snapTo(worldX, worldY);   // Instantly jump
camera.lookAt(worldX, worldY);   // Smooth move towards
```

### Wrapping Draw Calls

```javascript
render(ctx, engine) {
  camera.begin(ctx);   // Apply world-to-screen transform

  // Draw world-space elements here
  tilemap.draw(ctx, camera);
  player.draw(ctx);

  camera.end(ctx);     // Restore transform

  // Draw screen-space HUD here (not affected by camera)
  ui.drawText(ctx, `Score: ${score}`, 10, 10);
}
```

### Coordinate Conversion

```javascript
const screen = camera.worldToScreen(wx, wy);
const world  = camera.screenToWorld(sx, sy);

// Frustum culling
if (camera.isVisible(entity.x, entity.y, entity.width, entity.height)) {
  entity.draw(ctx);
}
```

---

## 11. Tilemaps

`TilemapSystem` renders 2D grid tilemaps and resolves collisions between physics bodies and solid tiles.

### Creating a Tilemap

```javascript
const map = game.tilemap.create({
  tileset:     'tileset',  // Asset key (image registered with the loader)
  tilesetCols: 8,          // Number of tile columns in the tileset image
  tileWidth:   32,
  tileHeight:  32,
  x: 0, y: 0,             // World-space top-left position

  // 2D array: 0 = empty, positive integer = tile index (1-based)
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],

  // Which tile indices are solid (everything else is decorative)
  solidTiles: [1, 2, 3],
});
```

### Querying Tiles

```javascript
map.getTile(col, row)              // Tile index at grid position
map.getTileAtWorld(worldX, worldY) // Tile index at world position
map.isSolid(col, row)              // Is this grid cell solid?
map.isSolidAt(worldX, worldY)      // World-space solid check
```

### Physics Integration

Call `resolveCollision` **after** the physics system has updated, once per body that should interact with the map:

```javascript
engine.onUpdate((dt, engine) => {
  // PhysicsSystem.update is called automatically via engine.addSystem
  map.resolveCollision(playerBody);
  map.resolveCollision(enemyBody);
});
```

### Rendering

```javascript
render(ctx, engine) {
  camera.begin(ctx);
  map.draw(ctx, camera);  // Pass camera to enable culling
  camera.end(ctx);
}
```

---

## 12. UI Drawing Utilities

`UISystem` provides static helpers for drawing common HUD elements. All coordinates are in screen space (draw after `camera.end()`).

### Text

```javascript
game.ui.drawText(ctx, 'Score: 100', x, y, {
  font:      '20px monospace',
  color:     '#ffffff',
  align:     'left',      // textAlign: 'left' | 'center' | 'right'
  baseline:  'top',       // textBaseline
  shadow:    true,        // Drop shadow
  glow:      '#00ffff',   // Glow colour
  glowBlur:  12,
  stroke:    '#000000',   // Outline colour
  strokeWidth: 3,
});
```

### Health / Progress Bar

```javascript
game.ui.drawHealthBar(ctx, x, y, width, height, current, max, {
  reversed:    false,       // Fill from right
  bgColor:     '#222222',
  fillColor:   '#00ff00',   // Omit for auto green→yellow→red
  borderColor: '#ffffff',
  borderWidth: 2,
});
```

### Panel / Box

```javascript
game.ui.drawPanel(ctx, x, y, width, height, {
  alpha:       1,
  bgColor:     'rgba(0,0,0,0.75)',
  borderColor: '#888888',
  borderWidth: 2,
  radius:      8,           // Rounded corners
});
```

---

## 13. Audio

`AudioSystem` wraps the Web Audio API with a simple named-clip model and separate volume controls for music and sound effects.

### Registering Sounds

The easiest path is via `createGameAsync` — any `addAudio` call in the `setup` callback is automatically registered:

```javascript
setup(loader, game) {
  loader.addAudio('jump',  'audio/jump.ogg');
  loader.addAudio('bgm',   'audio/theme.ogg');
  loader.addAudio('coins', 'audio/coins.ogg');
}
```

Or register manually after loading:

```javascript
game.audio.attachLoader(loader);  // Register all loader audio assets at once
```

### Playback

```javascript
// Sound effects
game.audio.play('jump');
game.audio.play('coins', { volume: 0.6, pitch: 1.2, delay: 0.05 });

// Music (one track at a time)
game.audio.playMusic('bgm', { fadeIn: 1.5, volume: 0.7 });
game.audio.stopMusic({ fadeOut: 1.0 });

game.audio.isMusicPlaying   // → boolean
game.audio.stopAllSfx()
```

### Volume

```javascript
game.audio.setMasterVolume(0.8);   // [0, 1]
game.audio.setMusicVolume(0.6);
game.audio.setSfxVolume(1.0);

game.audio.mute();
game.audio.unmute();
```

---

## 14. Tweens

`TweenSystem` animates any numeric properties on any object over time, with easing and optional looping.

### Creating a Tween

```javascript
const tween = game.tweens.create(
  target,         // Any object — entity, colour object, UI element, etc.
  { x: 400, alpha: 0 },  // End values
  0.8,            // Duration in seconds
  {
    ease:       'outCubic',
    delay:      0.1,
    loop:       false,
    yoyo:       false,   // Reverse on repeat
    onUpdate:   (target, progress) => { /* 0→1 */ },
    onComplete: (target) => { /* finished */ },
  }
);

// Control
tween.pause();
tween.resume();
tween.stop();
```

### Instant Snap

```javascript
game.tweens.set(target, { x: 0, alpha: 1 });
```

### Chaining

```javascript
game.tweens
  .create(obj, { x: 200 }, 0.4, { ease: 'outQuad' })
  .chain(obj, { y: 100 }, 0.3, { ease: 'inSine' })
  .chain(obj, { alpha: 0 }, 0.2);
```

### Bulk Control

```javascript
game.tweens.killAll(target);   // Stop all tweens on target
game.tweens.killAll();         // Stop every tween
game.tweens.isTweening(target) // → boolean
```

### Available Easings

`linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, `inOutCubic`, `inQuart`, `outQuart`, `inOutQuart`, `inSine`, `outSine`, `inOutSine`, `inExpo`, `outExpo`, `inOutExpo`, `inBack`, `outBack`, `outBounce`, `inBounce`, `outElastic`, `inElastic`

---

## 15. Particles

`ParticleSystem` manages a pool of reusable particles. You create emitters and configure them declaratively.

### One-Shot Burst

```javascript
game.particles.burst(x, y, {
  count:     20,
  colors:    ['#ff4444', '#ffaa00', '#ffffff'],
  speed:     [80, 200],
  size:      [3, 8],
  life:      [0.4, 1.0],
  gravity:   400,
  fadeOut:   true,
  shrink:    true,
  shape:     'circle',   // 'circle' | 'square' | 'star'
});
```

### Continuous Emitter

```javascript
const smoke = game.particles.startEmitter(x, y, {
  rate:      15,           // Particles per second
  colors:    ['#888888', '#aaaaaa'],
  speed:     [20, 60],
  direction: -Math.PI / 2, // Straight up
  spread:    0.4,          // Half-angle in radians
  size:      [4, 12],
  life:      [0.8, 1.5],
  gravity:   -50,
  friction:  0.95,
  fadeOut:   true,
  shrink:    true,
});

// Later, move or stop it
smoke.x = entity.x;
smoke.y = entity.y;
smoke.stop();
```

### Emitter Properties

| Property | Type | Description |
|----------|------|-------------|
| `x`, `y` | number | Emit origin |
| `direction` | radians | Base emit angle |
| `spread` | radians | Half-angle cone |
| `speed` | `[min, max]` | px/s |
| `colors` | `string[]` | Colour pool |
| `size` | `[min, max]` | Pixels |
| `life` | `[min, max]` | Seconds |
| `gravity` | number | px/s² down |
| `friction` | number | Velocity multiplier/s |
| `fadeOut` | boolean | Fade alpha to 0 |
| `shrink` | boolean | Shrink to 0 |
| `rotation` | boolean | Spin particles |
| `shape` | string | `circle` \| `square` \| `star` |
| `rate` | number | Particles/s (continuous) |
| `count` | number | Burst count |
| `duration` | number | Auto-stop after N seconds |
| `onEmpty` | function | Callback when done |

---

## 16. Dialogue System

`DialogueSystem` plays scripted dialogue sequences — speaker names, portrait images, type-writer text, and event triggers.

### Configuration

```javascript
// Passed via dialogueOpts in createGame
{
  advanceKey: 'interact',  // Input action that advances
  typeSpeed:  40,          // Characters per second
  getPortrait: (name) => portraitImageElement,  // Optional
  box: {
    x: 40, y: 330, width: 720, height: 110,
    bgColor: 'rgba(0,0,0,0.85)',
    borderColor: '#ffffff',
    font: '18px serif',
    textColor: '#ffffff',
  },
}
```

### Writing Scripts

A script is an array of step objects:

```javascript
const introScript = [
  {
    type:     'text',
    speaker:  'Guide',
    portrait: 'guide_happy',
    text:     'Welcome to the dungeon, brave adventurer!',
  },
  { type: 'pause', duration: 0.5 },
  {
    type: 'text',
    text: 'The exit lies to the east. Do not stray from the path.',
  },
  { type: 'event', id: 'intro_done' },  // Fires 'dialogue:event'
];
```

### Playing

```javascript
game.dialogue.start(introScript);

// Check if dialogue is in progress
if (game.dialogue.isActive) { /* block player input */ }

// Advance manually (if not using advanceKey)
game.dialogue.next();

// Stop early
game.dialogue.stop();
```

### Listening for Events

```javascript
engine.events.on('dialogue:event', ({ id }) => {
  if (id === 'intro_done') spawnEnemy();
});

engine.events.on('dialogue:end', () => {
  resumeGameplay();
});
```

---

## 17. Save System

`SaveSystem` is a thin, namespaced wrapper around `localStorage`.

### Writing & Reading

```javascript
// Save game data to a numbered slot
game.save.write(1, {
  level: 3,
  score: 4200,
  inventory: ['sword', 'potion'],
}, /* version= */ 2);

// Read back
const record = game.save.read(1);
// record = { data: { level: 3, ... }, version: 2, timestamp: 1714500000000 }

if (record) {
  loadState(record.data);
}
```

### Managing Slots

```javascript
game.save.exists(1)    // → boolean
game.save.delete(1)
game.save.list()       // → [{ slot, version, timestamp }, …] newest first
game.save.clear()      // Wipe all slots in namespace
```

---

## 18. Asset Loader

`AssetLoader` registers and pre-fetches assets before the game starts. When used with `createGameAsync`, the loader is created and run for you. You can also use it manually.

### Registering Assets

```javascript
loader.addImage('bg',     'images/background.png');
loader.addImage('tileset','images/tiles.png');
loader.addAudio('jump',   'audio/jump.ogg');
loader.addJSON('map1',    'data/map1.json');
loader.addText('credits', 'credits.txt');
```

### Loading

```javascript
loader.load((progress, loaded, total) => {
  drawLoadingBar(progress);  // progress = 0–1
}).then(() => {
  startGame();
});
```

### Retrieving Assets

```javascript
const img = loader.get('bg');    // HTMLImageElement
const sfx = loader.get('jump');  // AudioBuffer
const map = loader.get('map1');  // Parsed JSON object

loader.has('bg')       // → boolean
loader.isLoaded        // → boolean (true after load() resolves)
```

### On-Demand Loading

```javascript
loader.addAndLoad('bonus', 'image', 'images/bonus.png').then(img => {
  // img is ready immediately
});
```

---

## 19. Debug Overlay

`DebugOverlay` draws an in-game development panel, toggled with the `F1` key (configurable). It shows FPS, physics body wireframes, velocity vectors, and custom watch values.

### Enabling

```javascript
// Via createGame options
debug: true,
debugOpts: { toggleKey: 'F1', enabled: true }  // enabled: true to start visible
```

### Custom Watches

```javascript
game.debug.watch('Player X',    () => player.x.toFixed(1));
game.debug.watch('Player Y',    () => player.y.toFixed(1));
game.debug.watch('On Ground',   () => playerBody.grounded);
game.debug.watch('Scene Depth', () => game.scenes.depth);

game.debug.removeWatch('Player X');
game.debug.clearWatches();
```

Press `F1` in-game to toggle the overlay.

---

## 20. Math Utilities

All helpers live on `GF.Math`.

### Scalars

```javascript
GF.Math.clamp(value, min, max)
GF.Math.lerp(a, b, t)                            // Linear interpolation
GF.Math.map(v, inMin, inMax, outMin, outMax)      // Remap range
GF.Math.mapClamp(v, inMin, inMax, outMin, outMax) // Remap + clamp
GF.Math.smoothstep(edge0, edge1, t)
GF.Math.wrap(v, min, max)                         // Modular wrap
GF.Math.roundTo(v, decimals)
```

### Angles

```javascript
GF.Math.toRad(degrees)
GF.Math.toDeg(radians)
GF.Math.angleDiff(a, b)          // Shortest difference between two angles
GF.Math.angleTo(x1, y1, x2, y2) // Angle from point A to point B
```

### Random

```javascript
GF.Math.rand(min, max)           // Float in [min, max)
GF.Math.randInt(min, max)        // Integer in [min, max] inclusive
GF.Math.randChoice(array)        // Random element
GF.Math.randWeighted([{ item: 'sword', weight: 10 }, { item: 'axe', weight: 3 }])
GF.Math.randAngle()              // Random angle in [0, TAU)
GF.Math.randBool(probability)    // true with given probability (default 0.5)
GF.Math.shuffle(array)           // Fisher-Yates in-place, returns array
```

### Geometry

```javascript
GF.Math.pointInRect(px, py, rx, ry, rw, rh)
GF.Math.pointInCircle(px, py, cx, cy, r)
GF.Math.rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh)
```

### Vec2

All Vec2 functions return new `{x, y}` objects and never mutate inputs.

```javascript
const v = GF.Math.Vec2;

v.create(x, y)
v.add(a, b)
v.sub(a, b)
v.scale(a, scalar)
v.dot(a, b)
v.mag(a)             // Magnitude
v.magSq(a)           // Magnitude squared (faster, avoid sqrt)
v.normalize(a)
v.dist(a, b)
v.distSq(a, b)
v.lerp(a, b, t)
v.fromAngle(angle, mag)
v.angle(a)
v.perp(a)            // 90° clockwise rotation
v.rotate(a, angle)
v.clampMag(a, maxMag)
```

### Constants

```javascript
GF.Math.PI   // Math.PI
GF.Math.TAU  // Math.PI * 2
```

### Easing Functions

Available as `GF.Math.ease.outCubic(t)` etc., or by name string in `TweenSystem.create`.

`linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, `inOutCubic`, `inQuart`, `outQuart`, `inOutQuart`, `inSine`, `outSine`, `inOutSine`, `inExpo`, `outExpo`, `inOutExpo`, `inBack`, `outBack`, `outBounce`, `inBounce`, `outElastic`, `inElastic`

---

## 21. Events

`EventBus` is the framework's pub/sub backbone. The engine's bus (`engine.events`) is the central channel. Systems communicate through it, and your game code can subscribe to or emit any event.

### API

```javascript
// Subscribe (returns an unsubscribe function)
const off = engine.events.on('player:jump', ({ x, y }) => {
  game.particles.burst(x, y, jumpDustConfig);
});

// Emit
engine.events.emit('player:jump', { x: player.x, y: player.y });

// One-time listener
engine.events.once('boss:dead', () => { showVictoryScreen(); });

// Unsubscribe
off();                              // Via returned function
engine.events.off('event', fn);     // Via reference

// Clear all listeners for an event
engine.events.clear('player:jump');

// Clear all listeners everywhere
engine.events.clear();
```

### Built-in Framework Events

| Event | Payload | Fired when |
|-------|---------|------------|
| `engine:start` | `{}` | Engine loop begins |
| `engine:stop` | `{}` | Engine loop stops |
| `scene:push` | `{ scene }` | Scene pushed |
| `scene:pop` | `{ scene }` | Scene popped |
| `scene:replace` | `{ scene }` | Scene replaced |
| `dialogue:start` | `{}` | Dialogue begins |
| `dialogue:advance` | `{ index, step }` | Player advances text |
| `dialogue:event` | `{ id, step }` | Event step reached |
| `dialogue:end` | `{}` | Dialogue finishes |

---

## 22. Full Minimal Example

A complete, self-contained platformer skeleton showing all common patterns together.

**config.js**
```javascript
(function (GF) {
  'use strict';
  GF.GAME_CONFIG = {
    engine:  { width: 800, height: 450, canvasId: 'gameCanvas', backgroundColor: '#1a1a2e' },
    physics: { gravity: 2200, floorY: 408, leftWall: 0, rightWall: 800 },
    player:  { speed: 220, jumpPower: 680 },
  };
})(window.GF = window.GF || {});
```

**game.js**
```javascript
(function (GF) {
  'use strict';

  // ── Sprite definition ───────────────────────────────────────────
  const HeroSprite = {
    frameWidth: 32, frameHeight: 48,
    originX: 16, originY: 48,
    animations: {
      idle: {
        fps: 6, loop: true,
        frames: [(ctx) => {
          ctx.fillStyle = '#4488ff';
          ctx.fillRect(-10, -40, 20, 40);
          ctx.fillStyle = '#ffddaa';
          ctx.beginPath(); ctx.arc(0, -46, 8, 0, GF.Math.TAU); ctx.fill();
        }],
      },
      run: {
        fps: 10, loop: true,
        frames: [
          (ctx) => { /* frame 0 */ ctx.fillStyle = '#4488ff'; ctx.fillRect(-10, -40, 20, 40); },
          (ctx) => { /* frame 1 */ ctx.fillStyle = '#3366cc'; ctx.fillRect(-10, -40, 20, 40); },
        ],
      },
    },
  };

  // ── Scene ────────────────────────────────────────────────────────
  class GameScene extends GF.Scene {
    init(engine) {
      const cfg = GF.GAME_CONFIG;
      this.cfg = cfg.player;

      // Physics body
      this.body = new GF.PhysicsBody({ x: 100, y: 300, width: 20, height: 40, tag: 'player' });
      engine.systems.physics.addBody(this.body);

      // Animator
      this.anim = engine.systems.sprites.createAnimator('hero', 'idle');

      // Score
      this.score = 0;
      this.coins = [];
      for (let i = 0; i < 5; i++) {
        this.coins.push({ x: 150 + i * 120, y: 340, active: true });
      }
    }

    update(dt, engine) {
      const { input, systems } = engine;
      const body = this.body;

      // Movement
      if (input.isDown('left'))  { body.vx = -this.cfg.speed; this.anim.play('run'); this.anim.flipX = true;  }
      else if (input.isDown('right')) { body.vx = this.cfg.speed; this.anim.play('run'); this.anim.flipX = false; }
      else                       { this.anim.play('idle'); }

      if (input.wasPressed('jump') && body.grounded) {
        body.vy = -this.cfg.jumpPower;
        engine.events.emit('player:jump', { x: body.centerX, y: body.bottom });
      }

      this.anim.update(dt);

      // Coin collection
      for (const coin of this.coins) {
        if (!coin.active) continue;
        if (GF.Math.rectsOverlap(body.x, body.y, body.width, body.height,
                                  coin.x - 10, coin.y - 10, 20, 20)) {
          coin.active = false;
          this.score += 100;
          engine.systems.particles.burst(coin.x, coin.y, {
            count: 12, colors: ['#ffdd00', '#ffaa00'],
            speed: [60, 160], size: [3, 7], life: [0.4, 0.9],
            gravity: 200, fadeOut: true,
          });
          engine.systems.audio.play('coin');
        }
      }
    }

    render(ctx, engine) {
      // Coins
      ctx.fillStyle = '#ffdd00';
      for (const coin of this.coins) {
        if (!coin.active) continue;
        ctx.beginPath(); ctx.arc(coin.x, coin.y, 10, 0, GF.Math.TAU); ctx.fill();
      }

      // Player
      this.anim.draw(ctx, this.body.centerX, this.body.bottom);

      // HUD
      engine.systems.ui.drawText(ctx, `Score: ${this.score}`, 10, 10, {
        font: '20px monospace', color: '#ffffff',
      });
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────
  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG;

    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName: 'PlatformerDemo',
      audio: true, tweens: true, particles: true, scenes: true, debug: true,
    });

    game.sprites.registerSprite('hero', HeroSprite);

    game.engine.input
      .bind('left',  'ArrowLeft',  'KeyA')
      .bind('right', 'ArrowRight', 'KeyD')
      .bind('jump',  'Space',      'KeyW', 'ArrowUp');

    // Jump dust
    game.engine.events.on('player:jump', ({ x, y }) => {
      game.particles.burst(x, y, {
        count: 8, colors: ['#aaaaaa', '#888888'],
        speed: [30, 80], direction: Math.PI / 2, spread: 1.2,
        size: [2, 5], life: [0.2, 0.5], fadeOut: true,
      });
    });

    game.scenes.push(new GameScene(), game.engine);
    game.engine.start();
  });

})(window.GF = window.GF || {});
```

---

*This guide covers GameFramework v2.1.0. Check `GF.VERSION` at runtime to verify the loaded version.*
