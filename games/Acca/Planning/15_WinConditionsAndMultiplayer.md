# 15 — Win Conditions and Multiplayer Modes

## 15.1 Win condition types

All four types are config-driven via `cfg.win`:

| Type | Trigger | Player resolved |
|------|---------|-----------------|
| `MoneyOnHand` | Any player's `money ≥ target` at end of turn. | The player who first crosses the line. |
| `TotalValue` | `totalValue ≥ target`. | First crosser. |
| `Level` | `level ≥ target` (player level = avg property tier rounded down). | First crosser. |
| `LastManStanding` | All but one player are bankrupt. | The remaining solvent player. |

Multiple targets crossing on the same end-of-turn tick are tied — winner is the player whose turn just ended (creates a small "advantage to the active player" rule, which is acceptable and observable).

## 15.2 Configuration

```js
win: {
  type: 'MoneyOnHand',
  target: 5000,
  // Optional secondary condition for tie-breaks:
  tiebreaker: 'TotalValue',
}
```

`tiebreaker` is consulted only when two conditions resolve simultaneously (rare). v1: ignore beyond first resolution.

## 15.3 Modes

### 15.3.1 Competitive (default)

Each player plays for themselves. All four win-condition types apply.

### 15.3.2 Cooperative

All players belong to one team and share a global `teamMoney`, `teamTotalValue`. Win condition target is multiplied by `cfg.cooperative.targetMultiplier` (default 2.5×). All competing player-vs-player mechanics (hostile takeover, sabotage) are disabled. Trades become free, intra-team transfers.

Cooperative mode introduces a new **threat track**: a counter that ticks up each turn. When it reaches `cfg.cooperative.threatLimit`, the players collectively lose. The track ticks faster on bad outcomes (every plague event, every region with happiness < 20).

Implementation pointer: gate competitive-only systems behind `if (game.mode === 'competitive')` checks at the SystemBus level rather than in each subsystem.

### 15.3.3 Custom scenarios (future hook)

A `games/Acca/scenarios/*.json` directory lets designers ship preset configs:

- map id
- starting money / resources / properties per player
- custom win condition (e.g. "Be the first to mayor 3 regions")
- victory script (extension point — calls into `ScenarioSystem.js`)

v1 ships one scenario beyond the default: `scenarios/oil_rush.json` (oil resources, $0 starting money, win at total value $3000).

## 15.4 End-of-game flow

See `04_PlayerAndTurn.md §4.8`. The game-over screen lists final standings sorted by win-condition score, plus secondary rankings (regions mayored, properties owned, total value). Players can:

- Return to title.
- Replay same map/players ("Rematch").
- Save a final-state snapshot.
