# 01 — Game Overview

## 1.1 Vision

**Acca** is a top-down, turn-based board game about money, buildings, and territorial control. Two to four players (hot-seat) move around a connected grid of cells, buy buildable cells, build income-producing structures, hire populations into them, corner districts, manipulate a 7-resource market, and trade or sabotage each other to victory.

It plays as a hybrid of *Monopoly*, *Catan*, and a light city-builder — but always on a single shared board with discrete dice-driven turns.

The game runs as a pure GameFramework game: the host page (`games/Acca/index.html`) declares only the DOM HUD scaffolding and CSS files; everything else happens inside the modules under `games/Acca/` and the framework's runtime.

## 1.2 Design pillars

1. **Strategic depth, low input load.** Decisions are deep (which cell to build on, which structure type, when to deposit in a vault, when to raise taxes), but each turn is short and controller-driven. No menus deeper than two levels.
2. **Visible economy.** A player should be able to look at the board and the HUD and see, at a glance, who is winning and why — money, owned structures, mayor status, resource piles. The DOM HUD makes this readable on a glance.
3. **Players over systems.** Trading, hostile takeovers, and sabotage are first-class — much of the late-game tension comes from interacting with other players, not the board.
4. **Modular code.** v2 splits the game into small focused modules so each subsystem is independently testable and replaceable. New systems plug in via the EventBus rather than reaching into each other.
5. **Moddable through config and JSON.** Map shape, districts, prices, chance pools, win conditions, and resource economy are all data-driven so that *Acca* can be retuned or remade as a different scenario without code changes.

## 1.3 Core loop (one turn)

```
TURN_START  →  ROLL  →  MOVE  →  LANDING
                                     ↓
              cell event resolves (bank/buildable/chance/market/resource)
                                     ↓
                              LAND_PROMPT (optional menu)
                                     ↓
                                  END_TURN
                                     ↓
                                  BETWEEN  ← timer hold + camera zoom-out
                                     ↓
                       advance to next non-bankrupt player
```

This is implemented in `managers/TurnManager.js`, driven by `core/MovementController.js` and `core/DieController.js`. Full description in `04_PlayerAndTurn.md`.

## 1.4 Long-loop (one match)

A match is an indeterminate sequence of turn cycles ending when a win condition fires:

- `MoneyOnHand` — `player.money ≥ target`.
- `NetWorth` — `game.netWorth(player) ≥ target`.
- `Level` — `player.level ≥ target` (advance level via build/structure milestones — see `04_PlayerAndTurn.md`).
- `LastManStanding` — every other player is bankrupt.
- `NetWorthOrLastStanding` (default) — *either* `netWorth ≥ target` *with at least one structure built*, *or* the player is the last one standing.
- **Turn cap fallback** — if `turnCap` (default 300) is reached, the highest-net-worth non-bankrupt player wins.

A typical match should resolve in 30–60 minutes wall-clock with default tuning. Tuning lives in `cfg.win`.

## 1.5 Player experience targets

- **First minute:** player picks player count, sees the board, knows how to roll.
- **First five turns:** player has bought their first structure (a Shop) and earned at least one rent payment from another player visiting them.
- **Mid-game (turn 10–20):** player has a district in sight; uses resources/market; faces at least one chance event.
- **End-game:** outcomes are tense — the leading player can be challenged via takeovers, sabotage, or large purchases; the catch-up bonus keeps trailing players viable.

## 1.6 Scope of v2

The features below are implemented in the v2 codebase. Specific deltas vs Acca v1 are tagged in each later chapter.

- Hot-seat local multi-player (2–4).
- Dice-driven movement on an arbitrary connected grid loaded from a map JSON.
- Seven structure types (shop, toll_gate, teleporter, house, factory, police_station, vault) with build cost, owner effects, visitor effects, and upkeep — all from `cfg.structures`.
- Bank cell (start-of-game spawn; pass-through bonus optional).
- Chance cells with a