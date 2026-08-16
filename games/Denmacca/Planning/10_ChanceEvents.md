# 10 — Chance Events

## 10.1 System

`games/Acca/systems/ChanceSystem.js` owns the chance pool and event resolution.

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

| `scope`   | Affects                