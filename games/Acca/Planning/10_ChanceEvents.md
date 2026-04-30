# 10 — Chance Events

## 10.1 System

`games/Acca/systems/ChanceSystem.js`:

```js
class ChanceSystem {
  pool;             // [event, ...]
  recentlyDrawn;    // queue of last N event ids — avoids back-to-back repeats
  draw(player);     // returns an event after applying
}
```

The pool comes from `cfg.chance` (already partially populated) plus any region- or weather-specific entries. Drawing weights events by `event.weight` (default 1) and excludes any id in `recentlyDrawn`. After applying, the drawn id is pushed to `recentlyDrawn` (queue length = `cfg.chance.repeatGuard`, default 3).

## 10.2 Event schema

```js
{
  id: 'stock_crash',
  label: 'Stock Market Crash',
  category: 'economy' | 'population' | 'resource' | 'weather' | 'social',
  weight: 1.0,                  // selection weight
  effect: 'money'               // see effect handlers below
       | 'money_pct'
       | 'resource'
       | 'happiness'
       | 'migration_in'
       | 'sabotage'
       | 'free_property'
       | 'modify_die',
  value: -0.10,                 // depends on effect
  scope: 'self' | 'all' | 'mayor' | 'region',
  message: 'Stock market crash! ...',
  duration: 0,                  // turns the effect persists for non-instant effects
}
```

## 10.3 Effect handlers

| Effect | Behavior |
|--------|----------|
| `money` | Add `value` (signed) to scope's money. |
| `money_pct` | Add `value × current money` to scope's money. |
| `resource` | Add `{resource, qty}` (in `value`) to scope's resources. |
| `happiness` | Add `value` to happiness for `scope` regions. |
| `migration_in` | Inject `value` residents into a random qualifying region. |
| `sabotage` | Mark a random property in scope as sabotaged for `duration` turns. |
| `free_property` | Grant ownership of a random unowned property in scope (if any). |
| `modify_die` | Replace next die for `scope` with override range from `value` (e.g. `{min:1,max:4}`). |

`scope = 'self'` is just the drawing player. `scope = 'mayor'` applies to mayors of the player's controlled regions. `scope = 'all'` applies to every player.

## 10.4 v1 default pool

Already in `cfg.chance`; expand to give each category at least three entries:

- `economy`: stock_crash, festival, bonus_pay, tax_audit, oil_strike, repair_bill, supplier_discount, trade_embargo
- `population`: regional_festival (happiness +10 self mayor regions), plague (happiness -10, all regions, duration 3), boom_town (migration_in +20 to lowest-population region)
- `resource`: resource_boom (resource +5 random, self), industrial_surge (steel +5, self), energy_surplus (electricity +10, self)
- `weather`: rainy_season (water +5 all), drought (water -5 all, happiness -5 all)
- `social`: rivalry (sabotage one of leader's properties for 2 turns), philanthropy (money +200 to lowest-cash player)

Designers tune weights per scenario.

## 10.5 UI presentation

When a chance event resolves:

1. ChanceSystem returns the event.
2. TurnManager emits `chance:drawn` and switches to `LAND_PROMPT`.
3. UI shows a card-style modal: title, illustration (sprite by `event.id`), one-line message, applied delta (e.g. "-$120"), `OK` button.
4. Audio plays `sfx_chance_<category>` (configured in 13_AudioVisualFeedback.md).

## 10.6 Replayability concern

To prevent the pool from feeling stale across long matches:

- `cfg.chance.shuffleEvery` (default 12 turns) reshuffles the weight buckets, temporarily boosting under-drawn events.
- Designers can tag events as `seasonal` to enable/disable based on a turn-count modulus.
