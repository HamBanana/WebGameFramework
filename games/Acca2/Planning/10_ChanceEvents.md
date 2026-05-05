# 10 — Chance Events

## 10.1 System

`games/Acca2/systems/ChanceSystem.js` owns the chance pool and event resolution.

```js
class ChanceSystem {
  constructor(cfg, eventBus, hooks);
  // hooks: {
  //   districtSystem,
  //   getLeader: () => Player,
  //   getLowestCash: () => Player,
  //   sabotageProperty: (structure, duration) => void,
  //   grantFreeStructure: (player) => void,
  // }

  draw(player, players);                       // weighted draw, applies effect, returns event
  consumeDieOverride(playerIndex);             // {min, max} | null
  serialize() / deserialize(data);
}
```

`AccaGame` constructs the system with the hook bag — the system itself doesn't know about Player or Structure internals, it just calls back into the host game.

When a player lands on a `chance` cell, `TurnManager` calls `chanceSys.draw(player, players)` and shows the event message in a one-shot menu (or a toast for non-interactive events).

## 10.2 Repeat guard

`cfg.chance.repeatGuard` (= 3) is the size of a "recently drawn" buffer. The system never picks an event that's currently in that buffer.

`cfg.chance.shuffleEvery` (= 12) — every 12 draws the buffer fully resets. This balances anti-clumping with keeping events feeling random.

`cfg.chance.nearMissProb` (= 0.25) is a reserved hook: when a player passes adjacent to a chance cell without landing, there's a 25% chance to fire a "near-miss" event. (Currently scaffolded but not wired up.)

## 10.3 Event schema

```jsonc
{
  "id":     "stock_crash",         // unique id (used for repeat guard)
  "label":  "Stock Market Crash",  // shown in HUD log
  "category": "economy",           // economy | population | resource | weather | social
  "weight":   1,                   // relative draw weight (floats allowed)
  "effect":   "money_pct",         // see effect handlers (10.4)
  "value":    -0.10,               // type depends on effect
  "scope":    "self",              // self | all | mayor | leader | lowest
  "duration": 3,                   // optional — number of turns the effect lingers
  "message":  "Stock market crash! You lose 10% of your cash."
}
```

## 10.4 Effect handlers

| `effect`        | `value` shape                          | What the system does |
|-----------------|----------------------------------------|----------------------|
| `money`         | number (signed dollars)                | Add/subtract cash. Scope decides who. |
| `money_pct`     | number (signed fraction)               | Add/subtract `value × player.money`. |
| `resource`      | `{resource, qty}`                      | Add/remove resource quantity. `resource: "random"` picks one from `cfg.market.resources`. |
| `happiness`     | number (signed)                        | Modify district happiness (scope `mayor` or `all`). `duration` extends for that many turns. |
| `migration_in`  | number (population)                    | Add residents to a target district (lowest-pop owned, or lowest overall). |
| `sabotage`      | number (= 1, ignored)                  | Sabotage one of the leader's structures via `hooks.sabotageProperty`. `duration` controls how long. |
| `free_property` | number (ignored)                       | Build a random structure for the player on a random empty buildable cell, via `hooks.grantFreeStructure`. |
| `modify_die`    | `{min, max}`                           | Override the player's *next* die roll into [min, max]. Consumed by `TurnManager` via `consumeDieOverride`. |

## 10.5 Scope handlers

| `scope`   | Affects                                                   |
|-----------|-----------------------------------------------------------|
| `self`    | The drawing player only.                                  |
| `all`     | Every non-bankrupt player, including the drawer.          |
| `mayor`   | Only mayoral districts of the drawing player.             |
| `leader`  | The current net-worth leader (`hooks.getLeader()`).        |
| `lowest`  | The current lowest-cash player (`hooks.getLowestCash()`).  |

## 10.6 v2 default pool

21 events ship in `cfg.chance.pool`, grouped by `category`:

**economy (8 events):**
- `stock_crash` (−10% cash, weight 1).
- `festival` (+$150, weight 1). *Note: this is the chance-pool variant, distinct from the mayor-controlled district festival.*
- `bonus_pay` (+$100, weight 1).
- `tax_audit` (−$120, weight 1).
- `oil_strike` (+3 oil, weight 0.6).
- `repair_bill` (−$80, weight 1).
- `supplier_discount` (+$80, weight 0.6).
- `trade_embargo` (−$200 to all, weight 0.4).

**population (3 events):**
- `regional_festival` (+10 happiness in mayoral districts, weight 0.8).
- `plague` (−10 happiness in all districts for 3 turns, weight 0.4).
- `boom_town` (+20 residents, weight 0.5).

**resource (4 events):**
- `resource_boom` (+5 of a random resource, weight 0.7).
- `industrial_surge` (+5 steel, weight 0.6).
- `coal_seam` (+5 coal, weight 0.6).
- `energy_surplus` (+10 electricity, weight 0.6).

**weather (2 events):**
- `rainy_season` (+5 water for all, weight 0.6).
- `drought` (−5 water for all, weight 0.4).

**social (3 events):**
- `rivalry` (sabotage one of the leader's structures for 2 turns, weight 0.3).
- `philanthropy` (+$200 to lowest-cash player, weight 0.6).
- `lucky_die` (next roll forced into 4..6, weight 0.4).

> **Δ v1.** Mostly identical pool. The mayor-controlled district festival was bolted on after v1's chance-only festival was found to be too random for a mayor-driven economy.

## 10.7 UI presentation

`TurnManager` opens a one-shot info menu:

- Title: event `label`.
- Body: the `message` text.
- Single option: "OK".
- A small spotlight is set on the chance cell.
- Cooperative-threat counter ticks up by `cfg.cooperative.threatPerPlague` (= 4) when a `plague` is drawn.

Audio/particles are reserved hooks (see `13_AudioVisualFeedback.md`).

## 10.8 Replayability

The repeat guard plus per-game shuffle keeps the pool from clumping in short matches. For long matches (>50 turns) the same events naturally cycle. Tuning levers:

- Add more events (low-weight) for variety.
- Lower `weight` on the most-draw-able events.
- Increase `repeatGuard` for shorter games.
- Add a category filter when drawing on a particular kind of cell (e.g. "social" cells if you add them).

## 10.9 Δ v1 roundup for this chapter

- v2 ships the same 21-event pool. The mayor-controlled `district:festival` is layered alongside the `chance:festival` event of the same name; the chance one is global (cash bonus to drawer), the mayor one is per-district (happiness boost).
- `cfg.chance.nearMissProb` is reserved but not wired in v2.
- `modify_die` is implemented as a clamp on the *next* roll, not as a forced value; this keeps the die animation honest.
