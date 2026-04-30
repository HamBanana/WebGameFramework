# 17 — File Structure

This is the target tree for `games/Acca/` once the v1 plan is implemented. Items marked **(exists)** are already in the repo. Items marked **(NEW)** are added by the implementation phases.

```
games/Acca/
│
├── index.html                          (exists)   — host page; loads framework + Acca scripts
├── launch.js                           (exists)   — picks up settings from launcher
├── config.js                           (exists)   — GAME_CONFIG; expanded per 16_DataModels
├── game.json                           (exists)   — launcher metadata
├── AccaGame.js                         (exists)   — slimmed: only top-level state machine
├── Gameplan.txt                        (exists)
├── Resource_Outline.txt                (exists)
│
├── Planning/                                        — this folder, design docs only
│
├── entities/                            (NEW)
│   ├── Cell.js                          (NEW)     — extracted from AccaGame
│   ├── Player.js                        (NEW)
│   ├── Property.js                      (NEW)
│   ├── Business.js                      (NEW)
│   ├── Company.js                       (NEW)
│   └── Region.js                        (NEW)
│
├── systems/                             (NEW)
│   ├── Board.js                         (NEW)     — neighbor wiring, board rendering
│   ├── MapLoader.js                     (NEW)
│   ├── TurnManager.js                   (NEW)     — extracted from AccaGame
│   ├── MovementController.js            (NEW)
│   ├── DieController.js                 (NEW)
│   ├── PopulationSystem.js              (NEW)
│   ├── RegionSystem.js                  (NEW)
│   ├── MarketSystem.js                  (NEW)
│   ├── ChanceSystem.js                  (NEW)
│   ├── TradeSystem.js                   (NEW)
│   ├── ScenarioSystem.js                (NEW)
│   └── AccaSave.js                      (NEW)
│
├── ui/                                  (NEW)
│   ├── Menu.js                          (NEW)     — extracted; arrow-list helper
│   ├── HUD.js                           (NEW)
│   ├── Notifications.js                 (NEW)
│   ├── modals/
│   │   ├── ManageModal.js               (NEW)
│   │   ├── TradeModal.js                (NEW)
│   │   ├── MarketModal.js               (NEW)
│   │   ├── ChanceModal.js               (NEW)
│   │   ├── PropertyDetailModal.js       (NEW)
│   │   └── PlayerPicker.js              (NEW)
│   └── widgets/
│       ├── Slider.js                    (NEW)
│       ├── Stepper.js                   (NEW)
│       └── ResourceStrip.js             (NEW)
│
├── utils/                               (NEW)
│   ├── validate.js                      (NEW)     — validateMap / validateConfig / validateSave
│   └── format.js                        (NEW)     — money/percent/region helpers
│
├── sprites/
│   ├── cells.js                         (exists)
│   ├── tokens.js                        (exists)
│   ├── die.js                           (exists)
│   ├── businesses.js                    (NEW)
│   ├── resources.js                     (NEW)
│   └── ui_icons.js                      (NEW)
│
├── maps/
│   ├── default.json                     (exists; bumped to schema v2)
│   └── oil_rush.json                    (NEW)
│
├── scenarios/                           (NEW)
│   └── oil_rush.json                    (NEW)
│
├── themes/                              (NEW)
│   ├── theme_classic.json               (NEW)
│   └── theme_warm.json                  (NEW)
│
└── MapCreator/
    ├── index.html                       (exists)
    └── launch.js                        (exists; extended for schema v2)
```

## 17.1 Loading order in `index.html`

Maintains the existing pattern — additions follow it:

1. `framework/GameFramework.bundle.js`
2. `games/Acca/config.js`
3. `games/Acca/utils/*.js`
4. `games/Acca/sprites/*.js`
5. `games/Acca/entities/*.js`
6. `games/Acca/systems/*.js`
7. `games/Acca/ui/widgets/*.js`
8. `games/Acca/ui/modals/*.js`
9. `games/Acca/ui/*.js` (HUD, Notifications, Menu)
10. `games/Acca/AccaGame.js` (last — instantiates and starts)

If/when build tooling lands, `framework/build.js` should optionally bundle the above into a single `games/Acca/Acca.bundle.js`. v1 may run unbundled to keep iteration fast.

## 17.2 Module conventions

- Each module is an IIFE on `window.GF` (consistent with the existing `AccaGame.js` pattern).
- Public surface goes on `GF.Acca.<Name>`. Private helpers stay inside the IIFE.
- Modules accept their dependencies (engine, sprites, eventBus) via constructor arguments — they do not reach into `GF` for runtime services.
- Every module exposes a small `update(dt)` and (where relevant) `draw(ctx)`. AccaGame is the orchestrator.

## 17.3 Test harness (post-v1, captured here)

A `games/Acca/__tests__/` folder will host tiny harnesses (Node-runnable) for pure logic systems:
- MarketSystem pricing math.
- PopulationSystem happiness/migration math.
- RegionSystem mayor detection.
- ChanceSystem draw weighting.

These tests do not run against the canvas — they instantiate the systems with stub inputs and assert outputs.
