# Shining Quest 3D

A 3D version of the Shining Force-style tactical RPG, rendered with Three.js
on top of GameFramework. The original 2D Shining Quest under
`games/ShiningQuest/` is unchanged — this is a fully separate game folder.

## File layout

```
games/ShiningQuest3D/
  index.html              ← canvas, Three.js CDN, framework, game
  config.js               ← FRAMEWORK_CONFIG (sprite NAMES only, no asset paths)
  ShiningQuest3DGame.js   ← scenes, 3D meshes, AI, animations
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

## Architecture

- **`Three3DScene` (framework)**
  Installed by the game's bootstrap into the engine. It creates a Three.js
  `WebGLRenderer` and inserts its canvas behind the engine's 2D canvas.
  Scenes call `three.add(obj)`, `three.setCamera(cam)`, `three.clearScene()`
  and use `three.worldToScreen(vec3)` to project 3D positions for the 2D HUD.
- **2D HUD overlay**
  The engine canvas (z-index 1, transparent background) is used for dialogue
  boxes, the action menu, HP bars over each unit, floating damage numbers,
  and the bottom info panel. Everything else is drawn in 3D.

## Scenes

| Scene             | World                                                  |
|-------------------|--------------------------------------------------------|
| `TitleScene3D`    | Slowly orbiting camera around a procedural castle      |
| `TownScene3D`     | 3D castle town, third-person follow-cam, walking NPCs  |
| `BattleScene3D`   | Isometric tactical grid with terrain blocks and units  |
| `GameOverScene3D` | Red-lit ground with fallen party silhouettes           |
| `VictoryScene3D`  | Golden ground with the surviving party + sparkle drift |

## Battle flow

The battle scene uses the framework's `TurnBasedBattleSystem`, `GridSystem`,
`DialogueSystem`, `CursorMenu`, and `TweenSystem` exactly the way the original
2D game does. Only the renderer changes: terrain becomes 3D box columns,
units become procedural Three.js groups, the cursor is a pulsing 3D ring, and
floating damage numbers are projected from world space onto the 2D HUD.

## Controls

- WASD / Arrow Keys — move cursor (battle), walk player (town)
- Space / Enter — confirm / advance dialogue / interact
- X / Escape — cancel
- F1 — toggle debug overlay (if enabled in config)

## Adding new content

- **New chapter** — add an entry to `chapters` in `data/gameData.js` (cols,
  rows, terrain matrix, spawns, enemies, intro/victory dialogue, nextChapter).
  The 3D terrain auto-builds from the same matrix the 2D game uses.
- **New enemy type** — add a template in `data/gameData.js`'s `enemies`.
  Then teach the unit-mesh builder a new branch (search for `unit.sprite ===`
  inside `buildUnitMesh`).
- **New class** — add the party member, then teach `buildUnitMesh` how to
  draw the new `unit.clazz`.

## Why a separate folder

This was specifically requested as a new game — not a refactor. The
`Three3DScene` system lives in the framework so any future 3D game can use
it; the original 2D Shining Quest remains the simpler reference example.
