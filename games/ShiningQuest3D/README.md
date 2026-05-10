# Shining Quest 3D

A 3D, open-world version of the Shining Force-style tactical RPG. Built on
GameFramework + Three.js. The original 2D Shining Quest under
`games/ShiningQuest/` is unchanged — this is a fully separate game folder.

## File layout

```
games/ShiningQuest3D/
  index.html              ← canvas, Three.js CDN, framework, game
  config.js               ← FRAMEWORK_CONFIG (sprite NAMES only, no asset paths)
  ShiningQuest3DGame.js   ← scenes, 3D meshes, AI, animations, world
  launch.js               ← standalone dev server
  data/gameData.js        ← party, enemy, chapter, dialogue definitions
  sprites/portraits.js    ← procedurally drawn dialogue portraits (HUD)
```

## How to run

```
cd games/ShiningQuest3D
node launch.js          # default port 3000
node launch.js 8080     # custom port
```

## World

The whole game now lives in a single 60×40 open world. There is no separate
"talk to the King to start a chapter" hub — encounters happen as you traverse
the realm.

Layout (north is up):

```
   ┌────────────── 60 cols ──────────────┐
   │ Castle Aric ░░░░░░░ Mountain Pass    │
   │ ║ NPCs      ░░ ░░░░ ░░░  ░░ ░░░ ░░   │ rows 0-15
   │ ║──── path → Greenfields → →★ Dragon │
   │ ║           greens forests           │
   │ ░░ ▼ Crypt approach                  │ rows 15-30
   │     ★ Crypt altar                    │
   │ Crypt chamber                        │
   └─────────────────────────────────────┘
```

- **Castle Aric (NW)** — friendly NPCs, the King, party HP readout. Safe zone.
- **Greenfields (centre)** — Chapter-1 ambushes (goblins / bats). Boss marker
  ★ at the goblin warband camp.
- **Crypt approach + chamber (S)** — Chapter-2 ambushes (skeletons / bats).
  Boss marker ★ at the crypt altar (gated until the goblin chieftain falls).
- **Mountain pass (E)** — Chapter-3 ambushes (dark mages / bats). Boss marker
  ★ at the Dragon's Maw (gated until the crypt is silenced).

### Encounters

While walking inside a biome's bounding box, an "ambush risk" meter ticks up
(visible in the top-right HUD). When it fills, a small synthesised battle
fires using a few enemies sampled from that biome's pool. Win the fight and
you spawn back at the exact spot you triggered it.

### Bosses

The orange glowing pillars at the boss tiles are scripted set-pieces using
the chapter battle layouts in `data/gameData.js`. Stand on a pillar and press
SPACE to engage. They unlock in order (goblin warband → crypt altar → dragon).
After the dragon falls, the finale dialogue plays and the game cuts to the
victory scene.

## Architecture

- **`Three3DScene` (framework)** — Installed by the game's bootstrap into the
  engine. Creates a Three.js `WebGLRenderer` and inserts its canvas behind
  the engine's 2D canvas. Scenes call `three.add(obj)`, `three.setCamera(cam)`,
  `three.clearScene()`, and `three.worldToScreen(vec3)` to project 3D
  positions for the 2D HUD.
- **2D HUD overlay** — The engine canvas (z-index 1, transparent background)
  is used for dialogue boxes, the action menu, HP bars over each unit, the
  ambush-risk meter, and the bottom info panel. Everything else is drawn in 3D.

## Scenes

| Scene             | World                                                           |
|-------------------|-----------------------------------------------------------------|
| `TitleScene3D`    | Slowly orbiting camera around a procedural castle               |
| `TownScene3D`     | The full 60×40 open world (was a small castle plaza in v1)      |
| `BattleScene3D`   | Isometric tactical grid with terrain blocks and units           |
| `GameOverScene3D` | Red-lit ground with fallen party silhouettes                    |
| `VictoryScene3D`  | Golden ground with the surviving party + sparkle drift          |

## Persistent state

`State.world` holds open-world progression across battles:

```
State.world = {
  encountersWonByZone : { green: N, crypt: N, mountain: N },
  bossesCleared       : { b1: bool, b2: bool, b3: bool },
  savedPos            : { x: …, z: … },   // where to respawn after combat
  zonesEntered        : Set,              // for one-time zone intros
}
```

Reset to `null` on TitleScene3D enter so a Game Over → restart begins fresh.

## Camera

The overworld camera is a fixed-direction follow camera: it always sits south
of the player at a constant offset and looks north, so turning the character
no longer spins the world. The battle camera is a smoothed isometric pan that
tracks the active unit.

## Controls

- WASD / Arrow Keys — walk in the world; move cursor in battle
- Space / Enter — confirm / advance dialogue / interact / engage boss
- X / Escape — cancel
- F1 — toggle debug overlay (if enabled in config)

## Adding new content

- **New zone** — append a `WORLD_ZONES` entry: bounding box, enemy pool, mini
  battle terrain & size, intro/victory dialogue.
- **New boss tile** — append a `WORLD_BOSSES` entry pointing at a chapter
  index in `data/gameData.js`.
- **New enemy type** — add a template in `data/gameData.js`'s `enemies` and
  teach `buildUnitMesh` how to draw it (search for `unit.sprite ===`).
- **New class** — add the party member, then teach `buildUnitMesh` how to
  draw the new `unit.clazz`.
