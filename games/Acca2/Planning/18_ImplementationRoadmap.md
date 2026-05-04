# 18 — Implementation Roadmap

> **Δ v1.** v1's roadmap was a forward plan. v2 is largely implemented — this chapter is split into a *current implementation status* (what's done) and a *next phases* plan (what would build on top).

## 18.1 Current implementation status

Every box ticked here corresponds to working code in `games/Acca2/`.

### Phase 0 — Module split (done)

- ☑ `core/`, `managers/`, `render/`, `ui/`, `systems/` directories.
- ☑ `AccaGame.js` reduced to ~330 lines of orchestration.
- ☑ Constants enum extracted to `core/Constants.js`.

### Phase 1 — Map + cells (done)

- ☑ Map JSON loader (`managers/BoardLoader.js`).
- ☑ Cell types: `bank`, `buildable`, `empty`, `chance`, `market`, `power_plant`, `well`, `mine`, `structure`.
- ☑ Cardinal-slot neighbor wiring.
- ☑ Two maps shipped (`default.json`, `denmark.json`).

### Phase 2 — Resources & market (done)

- ☑ 7-resource catalog.
- ☑ MarketSystem with supply/demand drift, sell spread, floor/ceil clamps.
- ☑ Market UI in TurnManager.

### Phase 3 — Structures & buildings (done)

- ☑ PlayerStructure entity.
- ☑ 7-type catalog.
- ☑ Build flow.
- ☑ Owner / visitor / pass-through effects (`StructureManager`).
- ☑ Vault levels and interest.
- ☑ Idle-on-shortage upkeep.

### Phase 4 — Population, mayor, taxes (done)

- ☑ DistrictSystem with strict-majority mayor election.
- ☑ Tax rate slider, festival, investment grant.
- ☑ PopulationSystem: happiness, growth, migration, oil-gated migration.

### Phase 5 — Trading, takeover, sabotage (done)

- ☑ TradeSystem.executeTrade with imbalance ratio guard.
- ☑ Hostile takeover at 5×.
- ☑ Sabotage with cost + oil + cooldown + police protection.

### Phase 6 — Chance events (done)

- ☑ ChanceSystem with 21-event default pool.
- ☑ 8 effect handlers and 5 scopes.
- ☑ Repeat guard, periodic shuffle.
- ☑ Die-override hook.

### Phase 7 — Polish (partial)

- ☑ DOM HUD with signature caching.
- ☑ Money animations.
- ☑ Camera lerp + spotlight.
- ☑ Themes JSON + CSS variables.
- ☐ Audio (hooks reserved, no sounds bundled yet).
- ☐ Particle effects (only DOM coin-burst is in).
- ☐ Accessibility colour-blind palette wired in.

### Phase 8 — Save / cooperative / scenarios (partial)

- ☑ Save / load to localStorage (`AccaSave`).
- ☑ Per-system serialize/deserialize.
- ☑ Cooperative mode plumbing (threat counter, shared win condition).
- ☐ Scenarios authoring + selection in `game.json`.
- ☐ Cooperative balancing playtest.

### Phase 9 — Test harness (not started)

- ☐ Automated headless run (driver script that simulates N turns).
- ☐ Snapshot/diff testing for major economic decisions.
- ☐ Test harness lives in `games/Acca2/test/` (folder doesn't exist yet).

## 18.2 Next phases

These are the suggested follow-up phases, in order of estimated payoff. Each is a coherent ticket cluster.

### Phase 10 — Wire validators into runtime (≈1 hour)

Call `validate.validateMap(json)` from `BoardLoader.load` and `validate.validateSave(json)` from `AccaSave.load`. Surface errors as in-game notifications, not just console logs.

Files: `managers/BoardLoader.js`, `systems/AccaSave.js`.

### Phase 11 — Audio pass (≈3 hours)

Register a small set of procedural / royalty-free sounds and emit them from the natural seams: die start/settle, build, takeover, sabotage, mayor change. Use `cfg.audio.{sfxVolume, uiVolume, musicVolume}`.

Files: new `framework/audio/...` registrations + emits in `core/DieController.js`, `managers/StructureManager.js`, `systems/TradeSystem.js`, `systems/DistrictSystem.js`, `core/Menu.js`.

### Phase 12 — Particles (≈3 hours)

Hook up the framework's `ParticleSystem` for: roll sparkle, build puff, takeover sweep, sabotage smoke, mayor confetti.

Files: `render/BoardRenderer.js` (drawing the bursts), emit from the same seams as audio.

### Phase 13 — Cooperative mode balancing (≈4 hours, mostly playtest)

The threat counter + shared win condition exist but are barely tested. Run a series of cooperative playtests (use the hot-seat driver from project instructions), tune `cfg.cooperative.*`, and write up the findings in a new playtest report.

Files: `cfg.cooperative.*` (tuning only); new playtest report `YYYYMMDD_PLAYTEST_REPORT_Coop.md`.

### Phase 14 — Scenario authoring (≈6 hours)

Define a JSON scenario shape (map + starting state + win-condition override + chance-pool override). Add a `cfg.scenarios` selector in `game.json`. Author one demo scenario.

Files: new `games/Acca2/scenarios/<name>.json`, new `managers/ScenarioLoader.js`, `AccaGame._beginGame`.

### Phase 15 — Companies (optional re-introduction; ≈8 hours)

Per `07_Companies.md`. Adds a `Company` entity, industry bonuses, and a `CompanyValue` win condition.

### Phase 16 — Test harness (≈8 hours)

Build a headless runner that initialises the engine without canvas, runs N turns deterministically, and emits a structured log. Use it to run regression tests on balance changes.

Files: new `games/Acca2/test/runner.js`, `games/Acca2/test/scenarios/*.json`.

## 18.3 Cross-phase guardrails

- **Determinism.** Wrap any new RNG behind `framework/utils/MathUtils.js`. The headless runner needs reproducible seeds.
- **No new HTML files.** All UI extends the existing `index.html` DOM regions or the canvas.
- **Config-first.** Anything tunable goes into `cfg.*`, not into a function constant. Update `16_DataModels.md` when the cfg shape changes.
- **Update this roadmap.** When a phase moves from "next" to "current", check the box here and add an entry to `20_Changes.md`.
- **Update the API reference.** Any new public method goes in `API_Reference.md`.
