# 15 — Win Conditions and Multiplayer Modes

## 15.1 Win condition types

`managers/WinConditionChecker.js` evaluates a winner once per turn. The configured type is `cfg.win.type`; the target value is `cfg.win.target`; the optional turn cap is `cfg.win.turnCap` (= 300) and the tiebreaker is `cfg.win.tiebreaker` (= `"TotalValue"`).

| Type                       | Trigger                                                                    | Player resolved |
|----------------------------|-----------------------------------------------------------------------------|-----------------|
| `MoneyOnHand`              | `player.money ≥ target`.                                                   | The first player to hit the target. |
| `NetWorth`                 | `game.netWorth(player) ≥ target`.                                          | The first player to hit the target. |
| `Level`                    | `player.level ≥ target`.                                                   | The first player to hit the target. |
| `LastManStanding`          | Only one non-bankrupt player remains.                                      | That player. |
| `NetWorthOrLastStanding`   | `netWorth(player) ≥ target` **with `ownedStructures.length ≥ 1`**, OR last-standing rule. | The qualifying player. *(default)* |
| Turn-cap fallback          | `game.turnCounter ≥ turnCap` and no winner yet.                            | Highest-net-worth non-bankrupt player; ties broken by `tiebreaker`. |

The default config ships with `NetWorthOrLastStanding` and a 300-turn cap.

## 15.2 Configuration

```jsonc
"win": {
  "type":       "NetWorthOrLastStanding",
  "target":     5000,
  "turnCap":    300,
  "tiebreaker": "TotalValue"
}
```

`cfg.win.tiebreaker` is a reserved config field. The shipped `WinConditionChecker.check()` *only* reads `tiebreaker` indirectly: at turn-cap, it sorts `live` players by `game.netWorth(player)` desc and returns the top, which is equivalent to `tiebreaker = "TotalValue"`. The other intuitive values (`"MoneyOnHand"`, `"Districts"`, `"Structures"`) are not yet wired — adding them is a small extension in `WinConditionChecker.check()`'s turn-cap branch.

Note: the `'NetWorth'` and `'TotalValue'` strings are treated as synonyms in the `switch` — both fall through to the same comparison.

`WinConditionChecker.check()` returns the winning Player or `null`. `AccaGame._advanceToNextPlayer` consumes the result; if non-null, transitions to `GAME_OVER`.

The `game.json` launcher file exposes a "Win Target" picker (`$3 000` / `$5 000` / `$7 500` / `$10 000`) that overrides `cfg.win.target` at startup.

## 15.3 Modes

`cfg.mode` selects the multiplayer flavour. Two modes ship.

### 15.3.1 Competitive (default)

`cfg.mode = "competitive"`. Standard hot-seat play. Win conditions evaluate per player; the first to fire wins.

The catch-up bonus stays on by default (`cfg.catchUp.enabled = true`):

- A player whose net worth is below `cfg.catchUp.threshold` (= 0.55 → 55%) of the leader's net worth receives `cfg.catchUp.amount` ($120) at the start of their turn.
- Logged as a tip to the player.

### 15.3.2 Cooperative (opt-in)

`cfg.mode = "cooperative"`. Players still play hot-seat, but instead of competing they co-operate against a shared **threat counter** (`game.cooperativeThreat`).

Threat accumulates each end-of-turn:

- `cfg.cooperative.threatPerTurn` (= 1).
- `cfg.cooperative.threatPerLowHappiness` (= 1) per district below a happiness floor.
- `cfg.cooperative.threatPerPlague` (= 4) when a `plague` chance event resolves.

Lose condition: `cooperativeThreat ≥ cfg.cooperative.threatLimit` (= 30).

Win condition: combined net worth across non-bankrupt players ≥ `target × cfg.cooperative.targetMultiplier` (= 2.5).

The cooperative side is wired but lightly tested — the playtest reports under `games/Acca/` are competitive runs. `19_OpenQuestions.md` flags coop balancing as open work.

### 15.3.3 Scenarios

`cfg.scenarios` is an empty array in v2. Reserved for future authored scenarios — e.g. a fixed map + tweaked starting state + bespoke win condition. The launcher's `game.json` would pick one via a config option.

## 15.4 End-of-game flow

1. `WinConditionChecker.check()` returns a Player.
2. `AccaGame._advanceToNextPlayer` sets `game.winner` and `game.gameState = GAME_OVER`.
3. `_render` calls `OverlayRenderer.drawGameOver`, which dims the world and paints the winner card.
4. On `confirm`, `gameState = MENU` and `HUDRenderer.resetSignatures()` clears the cache so the next match repaints fresh.

## 15.5 Δ v1 roundup for this chapter

- v2 keeps all four v1 win-condition types, adds the hybrid `NetWorthOrLastStanding`, and ships it as the default.
- Turn-cap fallback is new (v1 had no time limit).
- Catch-up bonus is new.
- Cooperative threat track is new.
- Scenarios are reserved but not implemented.
