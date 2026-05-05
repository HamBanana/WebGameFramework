# 19 — Open Questions

Design decisions that have been deliberately parked. Each item carries candidate answers and a current recommendation; revisit when the relevant subsystem is reworked.

## 19.1 Should `nearMissProb` chance events fire when passing adjacent to a chance cell?

`cfg.chance.nearMissProb` is set (= 0.25) but no code consumes it.

- **A.** Wire it: when MovementController steps over a cell adjacent to a chance cell, roll `nearMissProb` for a second-tier "minor chance" pool.
- **B.** Drop it from config to avoid the misleading dead key.
- **C.** Repurpose: every step adjacent to a chance cell adds 1 to `cooperativeThreat`.

**Rec.** B for now; revisit if chance feels under-used in playtest. Wiring it (A) is a small change but introduces a "minor chance pool" concept that needs its own balance.

## 19.2 Multiple roads at intersections

`MovementController` keeps `roads[]` and `roadIdx` as a stub. Players can't actually pick between paths at intersections — the controller commits to whatever cardinal direction they press.

- **A.** Implement: when a step has multiple equally-valid neighbors in the chosen direction, show a tiny picker.
- **B.** Implement: highlight the projected step and require confirm.
- **C.** Leave it — most maps are simple enough that the cardinal greedy works.

**Rec.** C unless playtest shows confused players on dense maps. (A) is a relatively small change in `core/MovementController.js`.

## 19.3 Auction on losing mayorship

When a mayor loses majority, taxes simply stop. No auction.

- **A.** Add an auction round across the table when a mayor falls.
- **B.** Grant a one-turn protection on the prior mayor (right of return).
- **C.** Leave it.

**Rec.** C — auctions in hot-seat games slow play. Playtest first.

## 19.4 Hot-seat trade UX

Trade is built around preset offers. The full builder works but is fiddly with arrow keys.

- **A.** Add a "swap columns" hot-key for quick reciprocal offers.
- **B.** Add a "split equally" preset.
- **C.** Leave it.

**Rec.** A — small UX gain.

## 19.5 Resource cell auto-yield vs. structure-only

Resource cells (`power_plant`, `well`, `mine`) currently yield only on landing. They're not buildable, so they don't compound.

- **A.** Make them buildable (player can place a "rig" structure to claim the yield).
- **B.** Leave them as "free" cells — landing is the only interaction.
- **C.** Treat them as auto-yielding to whoever owns the surrounding structures.

**Rec.** B for v2; A for v3 if the resource economy becomes too thin.

## 19.6 Sabotage attribution

`cfg.sabotage.revealAttacker = false` keeps the attacker hidden. This makes the leader paranoid; it also prevents social retaliation, which is sometimes the point.

- **A.** Always reveal.
- **B.** Reveal only if a police station was nearby and "investigated".
- **C.** Leave it hidden by default; per-scenario toggle.

**Rec.** C — keep the option, ship default-off.

## 19.7 One mayor across multiple districts

A single player can mayor every district. There's no soft cap.

- **A.** Soft cap: tax efficiency drops above N districts mayored.
- **B.** Hard cap (e.g. 3).
- **C.** Leave it.

**Rec.** C — the catch-up bonus already pulls trailing players up.

## 19.8 AI opponents

There are no AI players. Playtest uses console hot-seat drivers (per project instructions).

- **A.** Add a heuristic AI in `games/Acca2/ai/Heuristic.js` (greedy: roll → land → build/skip → trade-if-clearly-positive).
- **B.** Add a "random" baseline AI that picks the first menu option.
- **C.** Leave hot-seat-only.

**Rec.** B as a near-term scaffold for testing; A as a fuller feature.

## 19.9 Save format compatibility across maps

`AccaSave` snapshots cell ids by index. If a map is edited between save and load, the cell graph drifts. There's a `mapId` field but no version-bump mechanism.

- **A.** Refuse to load when `mapId` mismatches.
- **B.** Refuse to load when the map's cell-id set no longer matches.
- **C.** Treat saves as transient (single session only).

**Rec.** B — fail loudly when the map structure drifts.

## 19.10 Camera + larger maps

`zoomedInCellsAcross = 6` works for the default map. On `denmark.json` (larger), the zoomed-in view sometimes hides relevant context.

- **A.** Adapt zoom level based on density (more cells visible on dense maps).
- **B.** Add a manual zoom toggle (Z / X keys).
- **C.** Leave it — boards shouldn't get bigger than ~50 cells.

**Rec.** B as a quick win.

## 19.11 Region grouping above districts

v1 reserved a "region" tier above districts (group of districts). v2 doesn't have it.

- **A.** Add `Region` entity + `region` field on District. Useful for very large maps.
- **B.** Skip — districts are enough.

**Rec.** B for v2. Reconsider when boards get larger than 100 cells.

## 19.12 Tradable contracts

Per `06_ResourcesAndMarket.md` §6.8 — a player could lock a resource at a fixed price for N turns.

- **A.** Implement; adds a financial-instrument layer to the market.
- **B.** Skip; the imbalance ratio guard already lets two players negotiate a "fixed rate" trade.

**Rec.** B — too much complexity for the win.
