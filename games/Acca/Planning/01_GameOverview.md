# 01 — Game Overview

## 1.1 Vision

**Acca** is a top-down, turn-based board game about money, property, and territorial control. Two to four players move around a connected grid of cells, buying property, building businesses, hiring populations, and competing for regional dominance. It plays like a hybrid of *Monopoly*, *Catan*, and a light city-builder, but always with a single shared board and discrete dice-driven turns.

The game must run as a pure GameFramework game — meaning the host page (`games/Acca/index.html`) is minimal and almost everything happens inside `AccaGame.js` and the framework's runtime.

## 1.2 Design pillars

1. **Strategic depth, low input load.** Decisions are deep (which property to buy, when to build vs. save, when to raise taxes), but each turn is short and controller-driven. No menus deeper than two levels.
2. **Visible economy.** A player should be able to look at the board and the HUD and see, at a glance, who is winning and why — money, owned regions, mayor status, resource piles.
3. **Players over systems.** Trading, hostile takeovers, and sabotage are first-class — much of the late-game tension comes from interacting with other players, not the board.
4. **Moddable through config and JSON.** Map shape, regions, prices, chance pools, win conditions, and resource economy are all data-driven so that *Acca* can be retuned or remade as a different scenario without code changes.

## 1.3 Core loop (one turn)

```
TurnStart  →  Roll  →  Move  →  ConfirmLand  →  Landing
                                                  ↓
                              cell event resolves (property/chance/market/bank)
                                                  ↓
                                     LandPrompt (optional menu)
                                                  ↓
                                              EndTurn
                                                  ↓
                            advance to next non-bankrupt player
```

This is already implemented at a basic level in `games/Acca/AccaGame.js`. Full description in `04_PlayerAndTurn.md`.

## 1.4 Long-loop (one match)

A match is an indeterminate sequence of turn cycles ending when a win condition fires:

- `MoneyOnHand ≥ target`
- `TotalValue ≥ target` (cash + property + business value + resources at market price)
- `Level ≥ target` (player level — see `05_PropertiesAndBusinesses.md`)
- `LastManStanding` (every other player is bankrupt)

A typical match should resolve in 30–60 minutes wall-clock with default tuning. Tuning lives in `GAME_CONFIG.win`.

## 1.5 Player experience targets

- **First minute:** player picks player count, sees the board, knows how to roll.
- **First five turns:** player has bought their first property and earned at least one rent payment from another player.
- **Mid-game (turn 10–20):** player has a region in sight; uses resources/market; faces at least one chance event.
- **End-game (last few turns):** outcomes are tense — the leading player can be challenged via takeovers, sabotage, or large purchases.

## 1.6 Scope of v1

Anything in this list lives in v1 ("fully functional game"):

- Multi-player local hot-seat (2–4).
- Dice-driven movement on an arbitrary connected grid loaded from a map JSON.
- Property purchase, ownership ring rendering, basic rent.
- Bank cell (passive income on landing/passing — see 04).
- Chance cell with config-driven event pool.
- Market cell (resource buy/sell with fluctuating prices — see 06).
- Region and Mayor mechanics, including taxes and migration.
- Population per region with happiness, employment, growth, migration.
- Businesses on properties: build, employ, produce/consume resources, generate income.
- Companies: at least one per player, with passive industry bonuses.
- Trading menu (resource ↔ resource ↔ money ↔ property between two players).
- Hostile takeover at multiplier; sabotage that temporarily disables a property.
- Win conditions implemented for all four types.
- Save/Load via the framework's `SaveSystem`.
- Sound + particle feedback for: roll, move, buy, build, takeover, win.
- Win/lose screens, game-over → return to menu.

## 1.7 Out of scope for v1

- Online networked multiplayer.
- AI opponents.
- Procedurally generated maps. (MapCreator is the authoring tool.)
- Mobile/touch controls. v1 targets keyboard + gamepad.
- 3D rendering. The board uses 2D top-down sprites, even though the design doc historically called the game "3D."
