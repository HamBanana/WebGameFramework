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
- **Built-in sprites**: 109 sprites + 7 portraits previously inside individual games are now available in the framework. Asset paths live in `framework/sprites/<category>.js`; games refer to sprites by name only (e.g. `'goblin'`, `'tree_pine'`, `'token_red'`, `'hana'`). Categories: `aliens`, `boss`, `businesses`, `cells`, `characters`, `landmarks`, `monsters`, `player`, `portraits`, `resources`, `scenery`, `tokens`, `ui`, `vehicles`, `wildlife`.
- **Sprite assets** rendered to `/Sprites/<Category>/<Name>/spritesheet.png` + `animate.json` (Aseprite frameTags format) — same layout as `Claude` and `Claudia`.
- Two bundles now: `GameFramework.bundle.js` (core, ~217 KB) and `GameFramework.sprites.bundle.js` (optional, all built-in sprite registrations, ~84 KB). Include the second only if you want every sprite eagerly loaded.

GameFramework is a modular JavaScript framework for building HTML-based games. A game only needs to include the bundled framework script in its `index.html`; all asset paths, sprite registrations, and system wiring live inside the framework and your game's config file — keeping individual game files lean and focused on logic.

### Feature overview

The framework spans several families of systems — enable the ones a game needs via `GF.createGame` flags:

- **Core loop & I/O** — Engine, EventBus, InputManager (with synthetic input + [on-screen TouchControls, attached automatically on phones](#touch-controls-mobile)), AssetLoader, SceneManager (with animated transitions and Title / Game Over scene templates).
- **2D rendering** — programmatic *and* spritesheet-atlas sprites, Camera (follow/lerp/culling), TilemapSystem, ParallaxSystem, UISystem HUD helpers, ParticleSystem, TweenSystem.
- **Worlds & composition** — WorldSystem (data-driven multi-area open worlds with portals), EntityWorld (behavior/prefab composition layer).
- **Gameplay logic** — PhysicsSystem (AABB + gravity), PlayerController (platformer/topdown/sideways presets), StateMachine, ScoreManager (score/high-score/combo), WaveSpawner, GridSystem (tactical grid + A*/BFS pathfinding), CursorMenu, TurnBasedBattleSystem, DialogueSystem.
- **Audio** — AudioSystem (Web Audio wrapper) plus ProceduralAudio synthesis helpers (no asset files needed).
- **3D (Three.js)** — ModelSystem (GLB/GLTF viewer with orbit & first-person walk-gallery modes) and Three3DScene (thin host for procedural 3D worlds).
- **Persistence & debug** — SaveSystem (namespaced localStorage), DebugOverlay (F1).
- **Built-in content** — 109 sprites + 7 portraits across 15 categories, plus `claude` / `claudia` characters and `claude_3d` / `claudia_3d` models.
- **Tooling** — a game launcher, a zero-dependency Node dev server, a Sprite Tool, and a World Builder.

---

## Table of Contents

**Getting started**
1. [Project Structure](#1-project-structure)
2. [Quick Start](#2-quick-start)
3. [GAME_CONFIG Pattern](#3-game_config-pattern)
4. [Creating a Game — `GF.createGame`](#4-creating-a-game)

**Core**
5. [Engine](#5-engine)
6. [Input](#6-input)
7. [Scenes & Scene Manager](#7-scenes--scene-manager)

**2D rendering**
8. [Sprites & Animation](#8-sprites--animation)
9. [Physics](#9-physics)
10. [Camera](#10-camera)
11. [Tilemaps](#11-tilemaps) · [11b. World System](#11b-world-system-open-world) · [11c. Entity World](#11c-entity-world-composition--keeps-scenes-tiny)
12. [UI Drawing Utilities](#12-ui-drawing-utilities)
15. [Particles](#15-particles)
14. [Tweens](#14-tweens)
26. [Parallax System](#26-parallax-system)

**Audio**
13. [Audio](#13-audio) · [30. Procedural Audio](#30-procedural-audio)

**Gameplay logic**
22. [Player Controller](#22-player-controller)
23. [State Machine](#23-state-machine)
24. [Score Manager](#24-score-manager)
25. [Wave Spawner](#25-wave-spawner)
27. [Grid System (tactics + pathfinding)](#27-grid-system-tactics--pathfinding)
28. [Cursor Menu](#28-cursor-menu)
29. [Turn-Based Battle System](#29-turn-based-battle-system)
16. [Dialogue System](#16-dialogue-system)

**3D**
31. [Model System & Three3DScene](#31-3d--model-system--three3dscene)

**Support**
17. [Save System](#17-save-system)
18. [Asset Loader](#18-asset-loader)
19. [Debug Overlay](#19-debug-overlay)
20. [Math Utilities](#20-math-utilities)
21. [Events](#21-events)
32. [Scene Templates (Title / Game Over)](#32-scene-templates-title--game-over)

**Authoring**
36. [Scene Editor & Data-Authored Levels](#36-scene-editor--data-authored-levels)

**Reference**
33. [Tooling & Dev Server](#33-tooling--dev-server)
34. [Full Minimal Example](#34-full-minimal-example)
35. [AI Modification Rules](#35-ai-modification-rules)

---

## 1. Project Structure

```
GameFramework/
├── framework/
│   ├── core/
│   │   ├── Engine.js               # Game loop & canvas management
│   │   ├── EventBus.js             # Pub/sub event system
│   │   ├── InputManager.js         # Keyboard + synthetic input → named actions
│   │   ├── AssetLoader.js          # Asset pre-loading (image/audio/json/text)
│   │   ├── SceneManager.js         # Scene stack + animated transitions
│   │   └── SceneData.js            # JSON levels → a GF.GameScene (GF.dataScene)
│   ├── systems/
│   │   ├── SpriteSystem.js         # Programmatic + spritesheet-atlas sprites
│   │   ├── PhysicsSystem.js        # AABB physics + gravity
│   │   ├── UISystem.js             # HUD drawing helpers
│   │   ├── AudioSystem.js          # Web Audio wrapper
│   │   ├── TweenSystem.js          # Property animation
│   │   ├── ParticleSystem.js       # Particle emitters
│   │   ├── ParallaxSystem.js       # Multi-layer scrolling backgrounds
│   │   ├── Camera.js               # Scrolling viewport (follow / cull)
│   │   ├── TilemapSystem.js        # Grid-based tilemaps
│   │   ├── WorldSystem.js          # Data-driven multi-area open worlds
│   │   ├── EntityWorld.js          # Behavior/prefab composition layer
│   │   ├── GridSystem.js           # Tactical grid + A*/BFS pathfinding
│   │   ├── PlayerController.js     # Platformer/topdown/sideways movement
│   │   ├── StateMachine.js         # Timed finite state machine
│   │   ├── ScoreManager.js         # Score / high score / combo
│   │   ├── WaveSpawner.js          # Wave-based enemy spawning
│   │   ├── MenuSystem.js           # Cursor-driven menu (GF.CursorMenu)
│   │   ├── TurnBasedBattleSystem.js# Turn order / rounds / damage
│   │   ├── TouchControls.js        # On-canvas buttons + virtual joystick
│   │   ├── ModelSystem.js          # 3D GLB/GLTF viewer (Three.js)
│   │   ├── Three3DScene.js         # 3D host for procedural meshes (Three.js)
│   │   ├── SaveSystem.js           # localStorage save/load
│   │   ├── DialogueSystem.js       # Dialogue sequencer
│   │   └── DebugOverlay.js         # Dev overlay (F1)
│   ├── scenes/                     # Reusable scene templates
│   │   ├── TitleScene.js           # GF.TitleScene
│   │   └── GameOverScene.js        # GF.GameOverScene
│   ├── sprites/                    # Built-in sprite definitions (15 categories)
│   ├── utils/
│   │   ├── MathUtils.js            # Math helpers & easing
│   │   └── ProceduralAudio.js      # Synthesised SFX (GF.Audio.*)
│   ├── vendor/                     # three.min.js, GLTFLoader, OrbitControls
│   ├── build.js                    # Bundler → the two .bundle.js files
│   ├── GameFramework.js            # Main API (source)
│   ├── GameFramework.bundle.js         # Core bundle (include this)
│   └── GameFramework.sprites.bundle.js # Optional: all built-in sprites
├── games/                          # 20+ example games
├── tools/
│   ├── spritetool.html             # Slice/scale/tag spritesheets → atlas
│   ├── worldbuilder.html           # Paint WorldSystem areas → world data
│   └── editor.html                 # Visual scene editor → levels/*.json
├── Sprites/                        # Sprite/model asset files
├── SFX/                            # Sound assets
├── launcher.html                   # Browsable game gallery / launcher
├── serve.js                        # Zero-dependency dev HTTP server
└── launch.js                       # Start server + open launcher
```

Your game's `index.html` includes `GameFramework.bundle.js` (or the source file) once. Everything else is your game's own JS files.

### The two bundles

| Bundle | Size | Contents | When to include |
|--------|------|----------|-----------------|
| `GameFramework.bundle.js` | ~217 KB | All core + systems + scene templates + `claude`/`claudia` | Always |
| `GameFramework.sprites.bundle.js` | ~84 KB | Eager registration of all 109 built-in sprites | Only if you want every built-in sprite loaded up-front |

Both are produced by `node framework/build.js` from the source files — never edit a `.bundle.js` by hand (the `.prev.js` files are the previous build, kept for diffing).

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
  gameName:    'MyGame',   // Namespace for SaveSystem & ScoreManager

  // ── Enabled by default (pass false to disable) ──
  audio:       true,
  tweens:      true,
  particles:   true,
  scenes:      true,        // or an array of scene instances: [new MyScene()] — pushed automatically
  tilemap:     true,
  dialogue:    true,
  grids:       true,        // GridSystem (tactical grids + pathfinding)
  battle:      true,        // TurnBasedBattleSystem
  debug:       true,        // (also honours GAME_CONFIG.debug — see below)

  // ── Opt-in (disabled unless set true) ──
  models:      false,       // ModelSystem (3D — requires Three.js)
  score:       false,       // ScoreManager
  parallax:    false,       // ParallaxSystem

  // Fine-grained system options
  audioOpts:    { masterVolume: 0.8 },
  particleOpts: { poolSize: 256 },
  dialogueOpts: { typeSpeed: 30, advanceKey: 'interact' },
  debugOpts:    { toggleKey: 'F1', enabled: false },
  saveOpts:     { namespace: 'MyGame' },
  modelOpts:    { /* ModelSystem config */ },
  scoreOpts:    { comboMaxTime: 1.5, multiplierStep: 0.5, multiplierCap: 4 },
  parallaxOpts: { layers: [ /* … */ ] },
});

// Returned object — a property is null when its system is disabled
game.engine    // Engine instance
game.sprites   // SpriteSystem
game.physics   // PhysicsSystem
game.ui        // UISystem (static helper object)
game.save      // SaveSystem
game.audio     // AudioSystem            (if audio)
game.tweens    // TweenSystem            (if tweens)
game.particles // ParticleSystem         (if particles)
game.scenes    // SceneManager           (if scenes)
game.tilemap   // TilemapSystem          (if tilemap)
game.dialogue  // DialogueSystem         (if dialogue)
game.grids     // GridSystem             (if grids)
game.battle    // TurnBasedBattleSystem  (if battle)
game.debug     // DebugOverlay           (if debug)
game.models    // ModelSystem            (if models)
game.score     // ScoreManager           (if score)
game.parallax  // ParallaxSystem         (if parallax)
```

> **Debug precedence:** `GF.GAME_CONFIG.debug` is authoritative when present — set it to `false` to disable the overlay entirely, or to a config object (`{ enabled, toggleKey }`) to configure it. Only when `GAME_CONFIG.debug` is absent do the `debug` / `debugOpts` flags apply.

> **ParallaxSystem note:** unlike the others, `parallax` is *not* auto-added to the engine's system list — games usually draw it themselves at the start of their scene's `render`. See [§26](#26-parallax-system).

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

### Synthetic Input

Touch overlays, virtual gamepads and replay systems can inject input through
the same pipeline real keys use — game code keeps reading actions unchanged:

```javascript
engine.input.pressAction('jump');    // synthetic key-down (held)
engine.input.releaseAction('jump');  // synthetic key-up
engine.input.tapAction('pause');     // wasPressed() true for exactly one frame
```

### Touch Controls (mobile)

**Every game gets touch controls for free.** `GF.createGame()` attaches a
`GF.TouchControls` overlay, and on a phone or tablet it lays itself out from
the actions the game binds — no touch code in the game at all:

```javascript
engine.input.bind('left','ArrowLeft').bind('right','ArrowRight')
            .bind('fire','Space').bind('pause','KeyP');
// → joystick bottom-left (left/right), 🔥 bottom-right, ⏸ top-right
```

| Bound action | Control |
|---|---|
| `left` `right` `up` `down` | virtual joystick, bottom-left (only the bound axes) |
| `fire` `shoot` `jump` `attack` `action` `use` `run` `roll` `launch` | button arc, bottom-right (held while touched) |
| `confirm` `start` `restart` | tap buttons, bottom-centre |
| `pause` `cancel` `menu` | small tap buttons, top-right |

Buttons that resolve to the same key code are merged, so binding `fire` and
`confirm` both to `Space` yields one button. The layout rebuilds whenever new
actions are bound (a new scene, for instance) and scales with the canvas.

Configure it from `GAME_CONFIG` — it is authoritative over everything else:

```javascript
touch: false                      // no touch controls
touch: { force: true }            // show them on desktop too (handy for testing)
touch: { opacity: 0.4, scale: 1.2 }
touch: { joystick: { anchor:'bl', x:90, y:90, actions:{ left:'left', right:'right' } },
         buttons:  [ { id:'fire', action:'fire', label:'A', anchor:'br', x:70, y:70, mode:'hold' } ] }
```

`?touch=1` on the URL forces the controls on (desktop testing), `?touch=0` off.

**Hand-rolled layouts.** Adding your own `TouchControls` evicts the automatic
one, so a game never ends up with two sets of buttons:

```javascript
const touch = new GF.TouchControls();          // or { autoRender:false, force:true }
engine.addSystem(touch);                       // replaces the automatic overlay

touch
  .addButton({ id:'pause', action:'pause', label:'⏯', anchor:'bc', x:0,  y:42 })
  .addButton({ id:'fire',  action:'fire',  label:'A', anchor:'br', x:60, y:60, mode:'hold' })
  .addJoystick({ id:'move', anchor:'bl', x:90, y:90,
                 actions:{ up:'up', down:'down', left:'left', right:'right' } });

const v = touch.value('move');   // analog stick: { x:-1..1, y:-1..1 }
```

Buttons: `mode:'tap'` (default, one-frame `wasPressed`) or `'hold'` (`isDown`
while touched, plus `wasPressed` on the press frame); `anchor` is one of
`tl tr bl br tc bc` with `x/y` measured inward from that corner/edge.

The system renders as an engine **overlay** — its render pass runs after the
game's `onRender`, so controls always sit on top of the HUD. Pass
`{ autoRender:false }` and call `touch.draw(ctx)` yourself to place the draw
manually.

Input plumbing, so controls behave on real hardware: `pointerdown` is taken on
the canvas' parent in the capture phase (a touch on a control never reaches
OrbitControls or the game's own canvas listeners, while touches elsewhere pass
straight through), moves and releases are tracked on `window` (a finger that
slides off the canvas keeps steering and can never leave an action stuck down),
legacy `touchstart`/`touchmove` on a control is swallowed too, and losing focus
or backgrounding the tab releases everything.

---

## 7. Scenes & Scene Manager

Scenes are the primary way to separate game states (menus, gameplay, pause screens, game-over screens, etc.). The `SceneManager` maintains a stack — only the top scene runs each frame.

Scenes are duck-typed: extend `GF.Scene` for clarity, but any object works — every hook (`init`, `enter`, `update`, `render`, `exit`, `destroy`) is optional and a missing one is simply skipped. Register scenes either with `game.scenes.push(new MyScene(), game.engine)` or by passing them at creation: `GF.createGame(cfg.engine, cfg.physics, { scenes: [new MyScene()] })`.

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

### Spritesheet Sprites (image atlas)

Instead of writing frame draw-functions by hand, you can register a sprite from a
**spritesheet PNG + an atlas** (the Aseprite hash-export shape used by the built-in
sprites' `animate.json` files). The animations are built at runtime — no generated
JS and no bundle rebuild.

```javascript
// Atlas is the parsed animate.json object (load it with the AssetLoader, or inline it):
//   { frames: [ { frame:{x,y,w,h}, duration }... ],
//     meta: { frameTags:[{name,from,to,loop}], origin:{x,y}, frameSize:{w,h} } }

game.sprites.registerSheet('hero', 'sprites/hero/spritesheet.png', heroAtlas);

// URL-only convenience (fetches the atlas for you; returns a Promise):
game.sprites.registerSheetAsync('hero',
  'sprites/hero/spritesheet.png',
  'sprites/hero/animate.json').then(() => { /* ready */ });
```

- Each `frameTags` entry becomes an animation; `loop:false` (or `direction:'once'`)
  makes it play once. `fps` comes from the tag's `fps`, else from the first frame's
  `duration` (ms → fps), else 12.
- `origin` / `frameSize` set the draw pivot and frame dimensions; override with
  `opts = { originX, originY, defaultFps }`.
- With no `frameTags`, all frames become one looping `idle` animation.
- While the PNG is still loading, frames draw a `#446` placeholder rect (so the game
  runs — and renders in the headless harness — before art finishes loading).

The resulting sprite behaves exactly like any other: `createAnimator`, `drawFrame`,
`flipX`, etc. all work unchanged.

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

## 11b. World System (open world)

`WorldSystem` builds a **data-driven, multi-area open world** on top of `Camera` +
`Tilemap`. You describe the world as a plain data object (ship it as a JS object,
not fetched JSON — the headless test harness cannot `fetch`). Each world has named
**areas**; each area has tile **layers**, **entities**, **spawns**, and **portals**
that teleport the player between areas.

### World data shape

```javascript
const GAME_WORLD = {
  tileWidth: 32, tileHeight: 32,
  tileset: { image: 'world/tiles.png', cols: 8 },   // optional — flat colors if omitted
  startArea: 'town', startSpawn: 'default',
  areas: {
    town: {
      cols: 40, rows: 30,
      layers: {
        ground:    [[/* row-major tile indices, -1 = empty */]],  // required
        decor:     [[/* above ground, below entities */]],        // optional
        collision: [[/* any cell >= 0 blocks the player */]],     // optional
        overhead:  [[/* drawn above entities: roofs, canopy */]], // optional
      },
      entities: [ { type:'npc', sprite:'villager', anim:'idle', x:320, y:400 } ],
      spawns:   { default: { x:320, y:400 } },     // feet-center world coords
      portals:  [ { x:1248, y:384, w:32, h:64, toArea:'forest', toSpawn:'fromTown' } ],
      background: '#243',
    },
    forest: { /* … */ },
  },
};
```

### Wiring

```javascript
const world = new GF.WorldSystem({ viewWidth: 800, viewHeight: 450 });
game.engine.addSystem(world);   // add AFTER physics so tile collision resolves last

world.setTileset('world/tiles.png', 8);            // optional (URL or loaded image)
world.setPlayer(playerBody, (ctx) =>               // how to draw the player, y-sorted
  playerAnim.draw(ctx, playerBody.centerX, playerBody.bottom));
world.loadWorld(GAME_WORLD);                        // enters startArea automatically

// In your scene.render — draw the world, then the HUD on top:
render(ctx) {
  world.draw(ctx);                                 // layers + y-sorted entities + overhead
  game.ui.drawText(ctx, area, 10, 10);             // screen-space HUD
}
```

### Behaviour

- **Camera** is created and owned by the system (`world.camera`); it follows the
  player and re-clamps to each area's pixel size on `enterArea`.
- **Collision** reuses `Tilemap.resolveCollision` against the `collision` layer.
  The player and any `world.addDynamicBody(body)` are resolved each `update`.
- **Portals** trigger when the player's feet enter a portal rect;
  `enterArea(toArea, toSpawn)` repositions the player and snaps the camera. An
  arrival lock prevents immediate bounce-back until the player steps off.
- **Rendering** draws `ground` → `decor` → (entities + player, y-sorted by feet,
  frustum-culled) → `overhead`. Without a loaded tileset, tiles draw as stable
  flat colors so the world is visible immediately and in headless screenshots.
- **Entities** with a registered `sprite` get an auto-advanced animator; override
  drawing with `world.onEntityDraw((ctx, e, world) => …)` and behaviour with
  `world.onEntityUpdate((e, dt, world) => …)`.

### Key API

```javascript
world.loadWorld(data)              // load + enter start area
world.enterArea(name, spawnName)   // switch area, place player at spawn
world.setPlayer(body, drawFn)      // register the player
world.setTileset(imageOrUrl, cols) // tileset image + column count
world.addDynamicBody(body)         // extra body that collides with tiles
world.isSolidAt(worldX, worldY)    // collision-layer solid test
world.areaName / world.area / world.entities()
world.onEnterArea(cb) / world.onEntityDraw(cb) / world.onEntityUpdate(cb) / world.onPortal(cb)
world.draw(ctx)                    // call inside scene.render (world.render() is a no-op)
```

---

## 11c. Entity World (composition — keeps scenes tiny)

`EntityWorld` is the **composition layer**. Instead of a scene that owns entity
arrays and inlines all their logic (the classic god-scene), an entity is a
`GameObject` — a bag of small **behaviors** — and the world runs the
update/draw/cull/sweep loop and resolves collisions declaratively. Behaviors and
prefabs each live in their own tiny file, so a scene stays ~40 lines no matter how
big the game gets.

### Behaviors and prefabs (each a small module)

```javascript
// behaviors/FormationMove.js — a reusable behavior. factory(cfg) → hooks.
GF.behavior('FormationMove', (cfg) => ({
  update(dt, e, world) { e.x += (world.data.dir || 1) * (cfg.speed || 60) * dt; },
  // other hooks: onAdd(e,world), draw(ctx,e,world), onRemove(e,world)
}));

// prefabs/invader.js — an entity archetype (data + which behaviors it has).
GF.prefab('invader', {
  tags: ['invader'], w: 32, h: 24, sprite: 'invader',   // sprite → auto animator
  behaviors: ['FormationMove', ['DropOnDeath', { chance: 0.15 }]],  // name | [name, cfg]
  data: { hp: 1 },                                        // free per-entity state
});
```

### The scene (spawn + rules only)

```javascript
init(engine) {
  this.world = engine.getSystem('EntityWorld');   // or new GF.EntityWorld(); engine.addSystem(it)
  this.world.data.dir = 1;
  this.world.spawnGrid('invader', 8, 5, 40, 50, 56, 40);         // 40 invaders
  this.player = this.world.spawn('player', 300, 560);
  // declarative collision — no nested loops:
  this.world.onOverlap('bullet', 'invader', (b, i) => { b.destroy(); i.destroy(); this.score += 10; });
}
update(dt) { this.world.update(dt); }
render(ctx) { this.world.draw(ctx); /* then HUD */ }
```

### GameObject

Top-left `x,y` + `w,h` AABB (like `PhysicsBody`); `centerX/centerY/right/bottom`;
`vx,vy` (auto-integrated unless `static`); `tags` (Set), `data` (free state),
`flipX`. Methods: `addBehavior(name|inst, cfg)`, `behavior(name)`, `has(tag)`,
`play(anim)`, `overlaps(other)`, `destroy()`. With `collideWorld: true` and
`world.setSolid(fn)`, movement is resolved against solid tiles (top-down walls).

### EntityWorld API

```javascript
world.definePrefab(name, spec)          // local prefab (else GF.prefab global)
world.spawn(nameOrSpec, x, y, overrides) // → GameObject (null if unknown prefab)
world.spawnGrid(name, cols, rows, x0, y0, dx, dy, perCell?)
world.destroy(obj)
world.all() / byTag(tag) / first(tag) / count(tag) / clear()
world.onOverlap(tagA, tagB, (a, b, world) => …)   // declarative collision rule
world.onTick((dt, world) => …)          // one world-level tick per frame
world.setCamera(cam) / setSolid((x,y)=>bool)
world.data                              // shared world state (e.g. world.data.dir)
world.update(dt)                        // behaviors → integrate → collisions → tick → sweep
world.draw(ctx, camera?)               // y-sorted by feet, culled; behavior.draw() overrides
```

Draw order per object: a behavior's `draw()` hook wins; else the object's sprite
animator; else a `data.color` box. Registries are global: `GF.behavior(name, factory)`
and `GF.prefab(name, spec)` (load-order independent — resolved by name at spawn).

**Interop with `WorldSystem`:** for an open world, let `WorldSystem` own the
tiles/areas and `EntityWorld` own the actors — `world.setCamera(worldSystem.camera)`
and `world.setSolid((x,y) => worldSystem.isSolidAt(x,y))`, then draw ground →
`entityWorld.draw(ctx, camera)` → overhead.

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

## 22. Player Controller

`GF.PlayerController` wires together a `PhysicsBody`, a `SpriteAnimator`, and the `InputManager` into a ready-made movement controller. Three preset modes cover the bulk of game types.

| Mode | Movement |
|------|----------|
| `platformer` (default) | Left/right run + jump (optional double-jump, air control) |
| `topdown` | 8-direction free movement, no gravity |
| `sideways` | Left/right only, no jump (fighting / arcade) |

### Creating

```javascript
const pc = new GF.PlayerController({
  body:      playerBody,          // GF.PhysicsBody
  animator:  playerAnim,          // GF.SpriteAnimator
  input:     game.engine.input,
  mode:      'platformer',
  speed:     220,                 // px/s walk
  runSpeed:  330,                 // px/s while `run` action held (default speed*1.5)
  jumpPower: 700,                 // upward velocity px/s
  maxJumps:  2,                   // 2 = double-jump
  airControl: 0.6,                // 0..1 horizontal control while airborne

  // Which input actions to read (defaults shown)
  actions:   { left:'left', right:'right', up:'up', down:'down',
               jump:'jump', run:'run', crouch:'crouch', attack:'attack' },

  // Map animation *convention names* → your sprite's animation names
  animations: { walk:'run', jump:'leap' },   // idle/walk/run/jump/fall/land/crouch/attack

  // Hooks
  onJump:   (pc) => game.audio.play('jump'),
  onLand:   (pc) => game.particles.burst(pc.body.centerX, pc.body.bottom, dustCfg),
  onAttack: (pc) => fireProjectile(pc.facing),
});

// Each frame — it moves the body, plays the right animation, and flips the sprite:
pc.update(dt);

pc.facing   // 1 = right, -1 = left
```

The controller only plays an animation if the sprite actually defines it, so a sprite with just `idle`/`walk` degrades gracefully.

---

## 23. State Machine

`GF.StateMachine` is a small, allocation-free finite state machine with timed states and `onEnter` / `onUpdate` / `onExit` hooks. Ideal for fighter logic, boss phases, AI, and dialogue flow.

```javascript
const fsm = new GF.StateMachine({
  initial: 'idle',
  owner:   this,                    // optional — `this` inside hooks
  states: {
    idle: {
      onUpdate(dt, fsm) { if (input.wasPressed('attack')) fsm.go('punch'); },
    },
    punch: {
      duration:   0.4,              // auto-transition after 0.4 s
      onEnter()   { anim.play('punch'); },
      onComplete: 'idle',           // state entered when the timer elapses
    },
    hurt: {
      duration:   0.3,
      onEnter()   { anim.play('hit'); },
      onComplete: (fsm) => fsm.previous,   // dynamic transition
    },
  },
});
```

### API

```javascript
fsm.update(dt);                 // run onUpdate + auto-transitions
fsm.go('punch', payload);       // explicit transition (payload passed to onEnter)
fsm.restart(payload);           // re-enter current state, resetting its timer
fsm.is('idle', 'walk');         // true if current state is any of these
fsm.has('punch');               // state defined?
fsm.handle('hitbox', data);     // fire a state's custom `on_<event>` handler

fsm.current;                    // current state name
fsm.previous;                   // prior state name
fsm.timeInState;                // seconds since entering the current state
```

`onEnter(prevName, fsm, payload)`, `onExit(nextName, fsm)`, `onUpdate(dt, fsm)`. Transitioning to the state you're already in is a no-op (use `restart()` to force a re-enter).

---

## 24. Score Manager

`GF.ScoreManager` tracks score, a persistent high score, and an optional combo multiplier. It persists through `SaveSystem` when available (falling back to `localStorage`). Enable it with `{ score: true }`.

```javascript
const game = GF.createGame(cfg.engine, cfg.physics, {
  gameName: 'MyShooter', score: true,
  scoreOpts: { comboMaxTime: 1.5, multiplierStep: 0.5, multiplierCap: 4 },
});

game.score.add(100);            // adds 100 × current multiplier, bumps combo
game.score.add(50, { combo: false });  // add without touching the combo
game.score.subtract(25);        // clamped at 0
game.score.multiplier();        // current multiplier (1 → cap)

game.score.resetCombo();
game.score.reset();             // score + combo to 0 (keeps high score)
game.score.resetHighScore();

game.score.score;               // current score
game.score.highScore;           // persistent best
game.score.combo;               // current combo count
```

The combo decays after `comboMaxTime` seconds without a scoring `add`. The multiplier is `1 + (combo-1) × multiplierStep`, capped at `multiplierCap`.

### Events (on `engine.events`)

| Event | Payload |
|-------|---------|
| `score:add` | `{ amount, score, combo, multiplier }` |
| `score:multiplier` | `{ multiplier, combo }` |
| `score:newHigh` | `{ score }` |
| `score:reset` | `{}` |

---

## 25. Wave Spawner

`GF.WaveSpawner` schedules wave-based enemy spawning with an optional difficulty ramp. It emits enemies one at a time through a spawn callback and advances to the next wave once every enemy from the current one is dead. Suits shooters, tower defense, and survival modes.

```javascript
const spawner = new GF.WaveSpawner({
  waves: [
    { delay: 0.5, entries: [
      { kind: 'alienSquid', count: 8, spacing: 0.15 },
      { kind: 'alienCrab',  count: 8, spacing: 0.15 },
    ]},
    { delay: 1.0, entries: [
      { kind: 'alienOctopus', count: 12, spacing: 0.10, meta: { boss:true } },
    ]},
  ],
  difficulty:     1,            // multiplies every entry's count
  difficultyRamp: 0.25,         // +0.25× per wave index

  spawn: (kind, info) => spawnEnemy(kind, info),   // must return the entity
  onWaveStart: (index, wave) => showBanner('Wave ' + (index + 1)),
  onWaveClear: (index, wave) => game.score.add(500),
  onAllClear:  () => game.scenes.replace(new VictoryScene(), game.engine),

  events: game.engine.events,   // optional — also emits wave:start/spawn/clear/all_clear
});

spawner.start();
// each frame:
spawner.update(dt);
// when an enemy the spawner created dies, tell it:
spawner.notifyKilled(enemy);

spawner.isActive;               // boolean
spawner.aliveCount;             // enemies still alive this wave
spawner.stop();
```

The `spawn` callback receives `info = { waveIndex, kind, indexInEntry, total }`.

---

## 26. Parallax System

`GF.ParallaxSystem` draws multi-layer scrolling backgrounds. Each layer has its own scroll `factor` (0 = static sky, 1 = moves with the camera) and a draw callback; optionally a layer `tile`s (wraps) horizontally for infinite scrollers.

```javascript
const parallax = new GF.ParallaxSystem({
  viewportW: 800, viewportH: 450,
  layers: [
    { factor: 0.1, draw: drawSky },                    // slowest
    { factor: 0.4, draw: drawMountains, tile: 800 },   // wraps every 800 px
    { factor: 0.8, draw: drawTrees,     tile: 400 },
    { factor: 1.0, draw: drawRoad },                   // foreground
  ],
});

// In your scene render, before world/HUD:
parallax.scrollX = camera.x;
parallax.scrollY = camera.y;   // vertical scroll uses a per-layer `factorY`
parallax.draw(ctx);
```

Each layer callback is `(ctx, layer, system) => …`; the context is pre-translated to the layer's scrolled origin. Manage layers at runtime with `addLayer(layer)` / `removeLayer(layer)`, and give a layer an `update(dt)` method for its own animation timer (call `parallax.update(dt)`).

When enabled via `{ parallax: true }`, the instance is created and returned as `game.parallax` but **not** auto-drawn — you draw it yourself.

---

## 27. Grid System (tactics + pathfinding)

`GF.GridSystem` (enabled by default; also `game.grids`) owns a **logical** tactical playfield — passability, per-cell occupants, movement cost, and pathfinding. It is deliberately orthogonal to `TilemapSystem`: the tilemap draws graphics, the grid answers *"who is on which cell and where can they move."*

```javascript
const grid = game.grids.create({
  cols: 12, rows: 10, cellSize: 32,
  x: 0, y: 0,                 // world-space top-left
  // optional row-major arrays:
  terrainCost: [ /* per-cell move cost, default 1 */ ],
  blocked:     [ /* per-cell true = wall */ ],
});
```

### Coordinates & cell state

```javascript
grid.toWorld(col, row);          // → {x,y} cell top-left
grid.toWorldCenter(col, row);    // → {x,y} cell centre
grid.toGrid(worldX, worldY);     // → {col,row}
grid.inBounds(col, row);

grid.setBlocked(col, row, true); grid.isBlocked(col, row);
grid.setCost(col, row, 2);       grid.getCost(col, row);
```

### Occupancy

Each occupant is any object, tracked by reference. If it exposes a `team` string, range queries treat enemies as blockers and allies as walk-through-only.

```javascript
grid.placeOccupant(unit, 5, 5);   // sets unit.col / unit.row
grid.occupantAt(5, 5);
grid.removeOccupant(unit);
grid.forEachOccupant((occ, col, row) => …);
```

### Pathfinding & range

```javascript
// Every cell a unit can reach & STOP on within a movement budget (Dijkstra/BFS):
const reachable = grid.tilesInRange(unit, 4);      // [{col,row,cost,parent}]

// A* shortest path (inclusive of both ends), or null if unreachable:
const path = grid.findPath({col:5,row:5}, {col:8,row:7}, { team:'player', ignore:unit });

// Attack reach ring (min..max range):
const targets = grid.cellsInRing(unit, 1, 2, 'diamond');  // 'diamond' | 'square'

GF.Grid.manhattan(a, b);   // static helper
```

`isPassable(col,row,{team,ignore})` — can a unit *enter*; `isStoppable(...)` — can it *stop*. Pathing into a goal cell occupied by an enemy is allowed (for "move adjacent and attack" logic). The system is purely logical — `render()` is a no-op; games draw highlights themselves using the returned cells.

---

## 28. Cursor Menu

`GF.CursorMenu` is a cursor-driven vertical menu common to RPGs and strategy games — pure logic plus a draw helper.

```javascript
const menu = new GF.CursorMenu({
  items: [
    { label: 'Attack', value: 'attack' },
    { label: 'Magic',  value: 'magic', enabled: false },   // greyed out, skipped
    { label: 'Item',   value: 'item', hint: 'x3' },        // right-aligned hint
    { label: 'Wait',   value: 'wait' },
  ],
  wrap:     true,
  onSelect: (item) => console.log('chose', item.value),
  onCancel: () => closeMenu(),
  style:    { width: 160, textColor: '#fff', cursorColor: '#ffdd44' },
});

// Each frame:
menu.update(engine.input);     // reads keys directly
menu.draw(ctx, x, y);          // draws a panel with the cursor arrow
```

Default keys: **↑/W** and **↓/S** move, **Enter/Space/Z** select, **Esc/Backspace/X** cancel — override via `cfg.keys` (raw codes) or `cfg.actions` (named input actions). Other API: `move(±1)`, `currentItem()`, `select()`, `cancel()`, `setItems(items, keepCursor)`, `measure()` → `{width,height}` for centring, and `menu.active` to gate input.

---

## 29. Turn-Based Battle System

`GF.TurnBasedBattleSystem` (enabled by default; also `game.battle`) manages turn order, rounds, and the active actor for a classic JRPG-style battle. It renders nothing — the game draws units and menus; the system owns the flow.

Unit shape it reads: `{ id?, team, name, hp, maxHp, agility, dead }`. Higher `agility` acts earlier each round.

```javascript
game.battle.start({
  units: [hero, mage, goblinA, goblinB],
  // Optional custom win/lose predicates (defaults: no enemy / no player alive)
  victory: (units) => !units.some(u => u.team === 'enemy'  && !u.dead),
  defeat:  (units) => !units.some(u => u.team === 'player' && !u.dead),
});

while (!game.battle.finished) {
  const unit = game.battle.currentUnit();     // whose turn it is
  // …game shows menus / plays the chosen action for `unit`…
  game.battle.dealDamage(target, 12, unit);   // clamps at 0, flags `dead`, emits events
  game.battle.heal(ally, 20, unit);
  game.battle.endTurn();                       // advance to next living unit / round
}

game.battle.livingUnits('enemy');   // filter helpers
game.battle.allUnits();
game.battle.forceEnd('victory');
game.battle.result;                  // 'victory' | 'defeat' | 'draw'
```

### Events (on `engine.events`)

`battle:start` · `battle:round` `{round, order}` · `battle:turn_start` `{unit}` · `battle:turn_end` · `battle:unit_damaged` `{unit, source, amount}` · `battle:unit_healed` · `battle:unit_died` · `battle:complete` `{result}`.

---

## 30. Procedural Audio

`GF.Audio.*` synthesises simple sound effects at runtime, so a game needs no audio asset files. Extracted from SpaceInvaders & ShiningQuest.

### Standard SFX set (fastest path)

```javascript
GF.Audio.registerStandardSet(game.audio);        // registers a whole palette
game.audio.play('laser');
game.audio.play('explode');

// Filter which presets get registered:
GF.Audio.registerStandardSet(game.audio, { only: ['laser', 'hit', 'coin'] });
GF.Audio.registerStandardSet(game.audio, { skip: ['gameOver'] });
```

Presets: `laser`/`shoot`, `hit`, `explode`, `coin`, `jump`, `land`, `pickup`/`powerup`, `levelUp`, `gameOver`, `menuMove`, `menuConfirm`, `menuCancel`.

### Building your own buffers

```javascript
const ctx = game.audio._ctx;   // the AudioContext

// Single tone → AudioBuffer. type: 'sine' | 'square' | 'sweep' | 'noise'
const laser = GF.Audio.makeToneBuffer(ctx, 880, 0.12, 'square',
  { attack: 0.005, release: 0.12, volume: 0.2, sweep: 0 });

// Multi-tone arpeggio (chords, pickups):
const coin = GF.Audio.makeArpeggioBuffer(ctx, [880, 1320], 0.07, 'square', { volume: 0.25 });

game.audio.register('laser', laser);   // then game.audio.play('laser')
```

`env` fields: `attack`, `release` (seconds), `volume` (0–1), and `sweep` (Hz/s frequency glide, `sweep` type only).

---

## 31. 3D — Model System & Three3DScene

The framework ships two Three.js-based 3D systems. Both require Three.js loaded **before** `GameFramework.bundle.js`, and expect the 2D canvas to be transparent so the 3D view shows through:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- For ModelSystem also add GLTFLoader.js + OrbitControls.js (see file header) -->
<script src="../../framework/GameFramework.bundle.js"></script>
```
```javascript
engine: { backgroundColor: 'transparent' }   // in GAME_CONFIG
```
(`framework/vendor/` holds local copies of `three.min.js`, `GLTFLoader.js`, and `OrbitControls.js`.)

### ModelSystem — GLB/GLTF viewer

Enable with `{ models: true }` → `game.models`. It creates its own WebGL canvas *behind* the game canvas and supports two interaction modes:

- **orbit** (default) — one model centred at origin; OrbitControls rotate/pan/zoom.
- **walk** — first-person: all loaded models sit on pedestals in a circular gallery; WASD moves and the mouse (pointer-lock) looks, so you can walk around each model.

```javascript
await game.models.loadPreset('claude_3d');   // built-in preset (by name only)
await game.models.loadFromURL('models/ship.glb', 'ship');
game.models.loadFromFile(fileInput.files[0]); // e.g. from a drag-drop / <input type=file>

game.models.setMode('walk');                  // 'walk' | 'orbit'
game.models.showModel('ship');                // focus a model in orbit mode
game.models.playAnimation('Idle');            // GLTF clip by name
game.models.stopAnimation();
game.models.getModelNames();                  // → ['ship', …]
game.models.resetCamera();
game.models.setLighting('studio');
game.models.showGrid(true); game.models.showAxes(true);
game.models.setWireframe(true);
game.models.setWalkSpeed(4, 8); game.models.setLookSensitivity(0.002);
game.models.onModelLoaded((model) => …);  game.models.onError((err) => …);

GF.ModelSystem.registerPreset('robot', '../assets/robot.glb');  // add your own preset
```

Built-in presets: `claude_3d`, `claudia_3d`.

### Three3DScene — procedural 3D host

A thin renderer you populate with your own Three.js meshes (rather than loading GLBs). Swap entire scenes on game-scene transitions with `clearScene()`.

```javascript
const three = new GF.Three3DScene({ bgColor: 0x0a0a14 });
engine.addSystem(three);

// From a Scene.init():
const cube = new THREE.Mesh(geometry, material);
three.add(cube);                 // tracked → bulk-removable
three.setCamera(myCamera);       // override the default camera

// Helpers:
const p = three.worldToScreen(vec3);   // → {x,y} pixel coords on the 2D canvas (draw HUD there)
three.setBackground(0x112233);
three.remove(cube);

// From Scene.destroy():
three.clearScene();              // removes everything added via add()
```

Only one of the two is usually needed per game: `ModelSystem` for viewing/showcasing models, `Three3DScene` for building a procedural 3D world.

---

## 32. Scene Templates (Title / Game Over)

Two ready-made scenes cover the bookends of most games. Both extend `GF.Scene`; subclass or just pass options.

### `GF.TitleScene`

```javascript
game.scenes.push(new GF.TitleScene({
  title:    'COSMIC CONQUEST',
  subtitle: 'Press SPACE to start',   // pulses when `blink: true` (default)
  bgColor:  '#0a0a2e',
  confirmAction: 'jump',              // input action that starts the game
  menuAction:    null,                // optional second action
  onStart: (engine) => engine.systems.scenes.replace(new GameScene(), engine),
  onMenu:  (engine) => showOptions(),
  drawBackground: (ctx, scene) => drawStarfield(ctx),   // optional custom bg
}), game.engine);
```

### `GF.GameOverScene`

Shows a title, score, high score, and a blinking restart prompt. Set `victory: true` to flip it to a green "VICTORY!" palette automatically.

```javascript
game.scenes.replaceWithTransition(new GF.GameOverScene({
  score:     game.score.score,
  highScore: game.score.highScore,
  newRecord: game.score.score === game.score.highScore,
  victory:   false,
  restartAction: 'jump',
  onRestart: () => game.scenes.replace(new GameScene(), game.engine),
  onMenu:    () => game.scenes.replace(new GF.TitleScene({ /* … */ }), game.engine),
}), { type: 'fade', duration: 0.6 });
```

Both degrade gracefully if `UISystem` is unavailable (minimal `fillText` fallback) so they render in the headless test harness.

---

## 33. Tooling & Dev Server

The repo bundles browser-based content tools and a Node dev server. None are required at runtime — they support authoring.

### Dev server & launcher

Because games load audio and JSON, they must be served over HTTP (not `file://`). Two zero-dependency Node scripts handle this:

```bash
node serve.js                 # http://localhost:3000 (loopback only)
node serve.js 8080            # custom port
node serve.js 8080 0.0.0.0    # bind all interfaces (reachable on LAN)

node launch.js                # starts serve.js AND opens launcher.html in your browser
node launch.js 8080 0.0.0.0   # same args as serve.js
```

`launcher.html` is a browsable gallery of every game under `games/`. The server can also read each game's `config.js` (evaluated in a sandbox) so the launcher can apply per-game overrides — stored in `localStorage` under `GF_CONFIG_<GameName>` and merged at boot via `GF.applyLauncherConfig('<GameName>')`.

### Sprite Tool — `tools/spritetool.html`

Slice a spritesheet → scale → tag animations → export a GameFramework-ready **atlas (`animate.json`) + PNG + loader snippet**. The atlas is the Aseprite hash-export shape consumed by `game.sprites.registerSheet(...)` / `registerSheetAsync(...)` (see [§8](#8-sprites--animation)).

### World Builder — `tools/worldbuilder.html`

Paint tile layers, entities, spawns, and portals for a `WorldSystem` world, then export the plain-data world object described in [§11b](#11b-world-system-open-world) (shipped as a JS object, not fetched JSON, so the headless harness can load it).

### Scene Editor — `tools/editor.html`

Place prefabs on a canvas, edit them in an inspector, press Play, and save to a JSON level. A level is a real `GF.GameScene`, so the game's own scene modules run. Full description in [§36](#36-scene-editor--data-authored-levels).

### Rebuilding the bundles

```bash
node framework/build.js
```

Concatenates the source files in dependency order into `GameFramework.bundle.js` and `GameFramework.sprites.bundle.js`. Edit the source files under `framework/`, never the generated bundles.

---

## 34. Full Minimal Example

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

## 35. AI Modification Rules

Games in this repo are routinely modified by AI agents (via `owui-games-tool`).
These rules keep an agent from wrecking a working game — they are enforced by
the tool, and any agent (or human writing agent prompts) should know them.

### Locked files

A game can declare files that must **never be modified** by an AI:

```json
// game.json
{ "ai_locked": ["parts/Main.js"] }
```

Alternatively, put `@ai-locked` in a comment within a file's first few lines.
The tool rejects every write/edit/delete of a locked file with `403 LOCKED`;
the file stays readable. HamInvaders' `parts/Main.js` is locked this way.

To change the *behavior* of a locked file, add a **new part that patches the
class it registers** — never touch the file itself:

```js
// parts/PatchMain.js — changes the locked Main scene WITHOUT editing it.
(function (G, GF) {
  'use strict';
  // Part GF:ready listeners run before boot.js instantiates the scene
  // (boot.js always loads last), so the prototype patch lands in time.
  window.addEventListener('GF:ready', () => {
    const Main = G.scenes.Main;
    if (!Main) return;
    const origUpdate = Main.prototype.update;
    Main.prototype.update = function (dt, engine) {
      origUpdate.call(this, dt, engine);
      // extra behavior here
    };
  });
  G.components.PatchMain = true;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
```

The tool serves this as recipe `patch-locked-part`. Keep one patch part per
locked file and grow it, rather than stacking several patches on one method.

### Editing etiquette for agents

- **Smallest possible change.** One bug = one targeted edit. Never rewrite a
  working file, never add unrequested features, never create/clone a game as a
  workaround for a failing edit.
- **Edits go stale.** After any write, text remembered from an earlier read no
  longer matches. Re-read before re-editing. The tool tracks consecutive
  failed `edit_game_file` matches per file: after 2 misses it instructs the
  agent to switch to `read_game_file(numbered=true)` + `edit_game_lines`;
  after 4 it tells the agent to stop touching the file and report to the user.
- **Warnings are the contract.** Every write returns a `warnings` list (syntax
  errors, dead/duplicate methods, unregistered scenes, wrong GF API calls…).
  Fix them, then stop — a response with no warnings means *done, report the
  play URL*.

---

---

## 36. Scene Editor & Data-Authored Levels

Most of this guide authors a level in code. This section adds the other half: **placement as data**, edited in a GUI.

The split is deliberate. *Where* a thing is — its position, which prefab, which tags — is data, and dragging it beats editing numbers. *What* a thing does stays in behaviors and [scene modules](#32-scene-templates-title--game-over). The editor only ever touches the data half.

### A level is a GF.GameScene, not a new scene system

This is the important part. `GF.dataScene(...)` produces a **[GF.GameScene](framework/scenes/GameScene.js)** — the same scene class everything else uses. Every `GF.sceneModule` the game already has runs unchanged: phases, `order`/`layer`, `scene.state`, `scene.config`, the scene stack. A level document supplies only what a GUI can honestly own:

| Field | What it does |
|---|---|
| `scene` | The scene name modules bind to. |
| `modules` | Which modules attach — see below. |
| `entities` | What is placed, and where. |
| `overlaps` | Tag-vs-tag rules, limited to named actions. |
| `config` | Per-scene tuning, merged under `GAME_CONFIG.scenes[name]`. |
| `state` / `phase` | Starting `scene.state` and phase. |
| `background` | Fallback `config.background`. |

### Borrowing a module stack

A new scene name attaches nothing, and most games keep their gameplay in modules bound to one scene. So a level can borrow another scene's stack and drop what it replaces:

```json
"scene": "Boss",
"modules": { "from": "Main", "exclude": ["Waves", "Formation", "Ufo"] }
```

That reads as *"play exactly like Main, but I place the entities myself"* — combat, HUD, powerups and the game-over screen all come along; wave spawning and the marching formation don't. **No existing module had to change.** Selector fields: `from` (borrow these scenes' modules), `include` (force in regardless of binding), `exclude` (drop by name, wins over both). The editor's Scene panel drives this and shows exactly which modules will attach.

### Opening the editor

```bash
node serve.js
# http://localhost:3000/tools/editor.html   — or the 🎬 button in launcher.html
```

| Action | How |
|---|---|
| Place | Click a prefab to arm it, then click the canvas. Shift-click keeps placing. |
| Select / move | Click; drag to move. Snaps to grid unless snap is off. |
| Pan / zoom | Alt-drag or right-drag; wheel. `fit` re-centres. |
| Delete / duplicate | `Del` / `Ctrl+D` |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z`, or the toolbar arrows |
| Play | Runs the level as a real `GameScene` with its real modules. `Esc` stops. |
| Save | `Ctrl+S` → writes `levels/<name>.json` **and adds it to `manifest.json`** |

Edit mode draws sprites and animations but does not run behavior `update()` hooks — those need a live engine. Press Play for the real thing.

### Loading a level

Levels are preloaded by `GameLoader` from the manifest, so the lookup is synchronous — which it must be, because a scene needs its name and module selection at construction time:

```json
{ "levels": ["boss"] }          // → levels/boss.json
```

```js
// scenes/levels.js
G.scenes.Boss = GF.dataScene('boss');   // a GF.GameScene subclass
```

Any module can then reach it by name: `scene.push('Boss')`.

Other entry points: `GF.buildScene(doc, world)` pours placed entities into a world you built yourself (use the editor for layout only), `GF.applyOverlaps(doc, world)` registers just the rules, and `GF.overlapAction(name, fn)` adds an action the editor will list.

> **Rule ordering.** `EntityWorld` skips a colliding pair once either side is dead. A `DataScene` therefore lets modules register their rules first and applies the document's `overlaps` last — otherwise a declarative `destroyB` would silently starve a module's scoring rule for the same pair.

### Worked example — the HamInvaders boss fight

HamInvaders generates its waves in [Waves.js](games/HamInvaders/modules/Waves.js), so nothing in it was hand-placed. A boss level was added **without editing a single existing file**:

```
games/HamInvaders/
├── sprites/boss.js            # mothership + drone art
├── prefabs/boss.js            # boss, bossDrone   ← the editor's palette
├── behaviors/
│   ├── BossMove.js            # sweep; faster as it takes damage
│   ├── BossGun.js             # volleys of the existing invaderShot
│   └── Shielded.js            # invulnerable while escorts live
├── modules/
│   ├── Boss.js                # damage, health bar, win condition (scene: 'Boss')
│   ├── BossWave.js            # clearing the last wave summons the mothership
│   └── BossEntry.js           # "Press B" shortcut for testing it directly
├── scenes/levels.js           # G.scenes.Boss = GF.dataScene('boss')
└── levels/boss.json           # ← the level, authored in the editor
```

**Reaching it in play.** [Waves.js](games/HamInvaders/modules/Waves.js) already announces the end of a run: it sets `state.won = true` and switches to the `over` phase. `BossWave` listens for exactly that in `onPhase` and calls `scene.replace('Boss', …)` before anything renders, so the "YOU WIN" screen never gets a frame and Waves needed no edit. Raising `GAME_CONFIG.scenes.Main.levels` still works — the escalation keys off *the last wave was cleared*, not off a count. Dying is untouched, because Combat sets `won = false` before the same phase change.

The run carries forward: score and remaining lives are passed through `replace`'s `state`, and `Boss.enter` applies the lives to whichever player the level placed.

> A module bound to `'Main'` also attaches to any scene borrowing Main's stack — including this boss level. `BossWave` therefore guards with `if (!scene.has('Waves')) return;`, so beating the boss cannot summon another one. `scene.has(name)` is the general way to make a module's behaviour conditional on the stack it landed in.

The design point: **the drones you place *are* the difficulty.** `Shielded` makes the mothership invulnerable while any `bossDrone` lives, so placing seven means stripping seven before the boss can be touched. Retuning the fight is dragging drones around and editing `data.hp` in the inspector — no code.

`bossDrone` is tagged `['bossDrone', 'invader']`, so Combat's existing shot-kills-invader rule and the reach-the-player lose condition apply for free.

Play it: `games/HamInvaders/index.html` — clear the waves and the mothership arrives, or press **B** on the title to skip straight to it. Edit it: `/tools/editor.html?game=HamInvaders&scene=boss`.

### Server endpoints

Authoring-only; nothing at runtime depends on them.

| Route | Purpose |
|---|---|
| `GET /api/scene/parts?game=X` | Scripts to load so prefabs/behaviors/modules register. Reads `manifest.json` or `index.html`'s script tags, always includes `config.js`, and excludes `scenes/`, `boot.js` and `levels/` so the editor never starts a second game loop. |
| `GET /api/scene/modules?game=X` | Each module's name and scene binding, parsed statically — the editor shows the real stack without executing game code. |
| `GET /api/scene/list?game=X` | Level documents under `levels/`. |
| `POST /api/scene/save` | Writes the level, registers it in the manifest, returns validation warnings. |

---

*This guide covers GameFramework v2.3.0. Check `GF.VERSION` at runtime to verify the loaded version.*
