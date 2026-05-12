# Acca — Round 2 Playtest Report

**Date:** 2026-05-11
**Round:** 2 (post-fix iteration)
**Games played:** 20

---

## 1. Round 2 Fixes Attempted

| ID | Change | File | Status |
|----|--------|------|--------|
| F1 | `rollDuration: 1.4 → 0.4` | `config.js` | Applied (driver also overrides to 0.01) |
| F2 | `win.target: 5000 → 8000` | `config.js` | **Did not take effect** — overridden by `game.json` launcher default `$5 000` |
| F3 | Build menu shows upkeep cost | `managers/TurnManager.js` | Applied — upkeep now visible in build menu hints |
| F4 | `animHoldSec` falsy-zero bug | `AccaGame.js:_beginBetweenTurns` | Applied — `!= null` guard now correct |
| F5 | Income line logging | `EconomyManager.js` | Already in place (`addMoney(amount, reason)` logs internally) |
| F6 | P3 spawn investigation | `AccaGame.js:_initPlayers` | Confirmed all 4 players start on same cell — P3 advantage is sample noise, not spawn |
| F7 | `startingMoney: 1500 → 1000` | `config.js` | **Did not take effect** — overridden by `game.json` launcher default `$1 500` |
| F8 | `noBuildPenalty: 20 → 30`, after-turn `20 → 30` | `config.js` | Applied (verified in running game) |

**Critical discovery:** `games/Acca/game.json` defines launcher option defaults that override `config.js` values at game start. F2 and F7 silently failed for this reason. Round 3 fix below applies these via `game.json` defaults.

---

## 2. Top-line Stats (Round 2)

| Metric | Round 1 | Round 2 |
|--------|---------|---------|
| Total games | 20 | 20 |
| Avg turns | 86 | **82** |
| Min/Max turns | 67/107 | **57/101** |
| Avg winner NW | $5,145 | $5,162 |
| Avg winner structs | 5.55 | **5.8** |
| Bankruptcies | 0 | 0 |
| End reason | networth | unknown (game's endReason field not set) |

Win target was effectively still $5,000 due to the game.json override, so winner NW unsurprisingly hovered around $5,000.

---

## 3. Win Distribution Shift

| Slot | Round 1 | Round 2 |
|------|---------|---------|
| P1 | 3 (15%) | **6 (30%)** |
| P2 | 6 (30%) | **7 (35%)** |
| P3 | **8 (40%)** | 6 (30%) |
| P4 | 3 (15%) | **1 (5%)** |

P3 over-representation softened but P4 collapsed to 1 win. The noBuildPenalty bump (20→30) and the increased after-turn threshold (20→30) didn't trigger bankruptcies, but did seem to shift the per-slot economy slightly. With only the irrelevant changes taking effect, this distribution shift is mostly noise — Round 3 with real config changes will be the real test.

---

## 4. Round 3 Plan

| # | Change | Where | Why |
|---|--------|-------|-----|
| G1 | `Starting Money` launcher default: `$1 500 → $1 000` | `game.json` | Apply F7 properly |
| G2 | `Win Target` launcher default: `$5 000 → $7 500` | `game.json` | Apply F2 (close to F2's $8k goal; $7.5k is an existing option) |
| G3 | Re-run 20-game driver | runtime | Validate impact of higher target + lower starting money |

If Round 3 still produces 0 bankruptcies, the upkeep system is genuinely too forgiving and we'll need to either raise resource upkeep, increase `noBuildPenalty` further, or shorten the catch-up grace period.
