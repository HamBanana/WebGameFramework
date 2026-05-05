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

###