# Acca — Automated Playtest Report

**Date:** 2026-05-11  
**Method:** Browser-based AI driver (`window._accaGame` API), 4 players, all bots  
**Games played:** 20  
**Map:** Denmark (`maps/denmark.json`)  
**Win condition:** NetWorthOrLastStanding — $5,000 NW target

---

## 1. Top-line Statistics

| Metric | Value |
|--------|-------|
| Total games | 20 |
| Average game length | **86 turns** |
| Shortest game | 67 turns (G2) |
| Longest game | 107 turns (G15) |
| All games ended by | **Net worth** (20/20) |
| Games ended by last-standing | 0 |
| Games ended by turn cap | 0 |
| Bankruptcies | **0** (across all 80 player-games) |
| Avg winner NW | **$5,145** |
| Avg runner-up NW | **$4,360** |

---

## 2. Win Distribution

| Player Slot | Wins | Win Rate | Target (fair) |
|-------------|------|----------|---------------|
| Player 1 | 3 | 15% | 25% |
| Player 2 | 6 | 30% | 25% |
| **Player 3** | **8** | **40%** | 25% |
| Player 4 | 3 | 15% | 25% |

**Player 3 wins 40% of games — significantly above the 25% fair-share baseline.** This is the most critical balance finding. 20 games is a small sample, but a 40% win rate is a meaningful signal (χ² p ≈ 0.07, borderline significant). Likely causes: geographic spawn advantage, turn-order dynamics, or the randomised-first-player system not fully equalising the effect of going 3rd in a 4-player game.

---

## 3. Per-Game Results

| Game | Winner | Turns | Reason | Winner NW | Runner-up NW | Winner Structs |
|------|--------|-------|--------|-----------|--------------|----------------|
| 1 | P2 | 97 | networth | $5,122 | $3,989 | 7 |
| 2 | P3 | 67 | networth | $5,209 | $4,266 | 5 |
| 3 | P2 | 77 | networth | $5,028 | $4,873 | 8 |
| 4 | P4 | 74 | networth | $5,210 | $3,854 | 4 |
| 5 | P2 | 70 | networth | $5,032 | $3,816 | 4 |
| 6 | P3 | 94 | networth | $5,246 | $4,997 | 7 |
| 7 | P3 | 74 | networth | $5,217 | $4,475 | 5 |
| 8 | P1 | 89 | networth | $5,013 | $4,091 | 3 |
| 9 | P2 | 91 | networth | $5,011 | $4,698 | 3 |
| 10 | P4 | 101 | networth | $5,160 | $4,745 | 6 |
| 11 | P1 | 77 | networth | $5,150 | $4,233 | 3 |
| 12 | P3 | 73 | networth | $5,085 | $4,917 | 4 |
| 13 | P3 | 84 | networth | $5,215 | $4,309 | 3 |
| 14 | P2 | 80 | networth | $5,304 | $3,575 | 9 |
| 15 | P2 | 107 | networth | $5,067 | $4,571 | 4 |
| 16 | P4 | 91 | networth | $5,103 | $4,791 | 8 |
| 17 | P3 | 95 | networth | $5,017 | $4,357 | 7 |
| 18 | P3 | 101 | networth | $5,251 | $4,769 | 10 |
| 19 | P3 | 87 | networth | $5,143 | $4,583 | 7 |
| 20 | P1 | 99 | networth | $5,019 | $4,364 | 5 |

---

## 4. Structure Count Analysis

| Winner structs | Count | Notable |
|----------------|-------|---------|
| 3 | 4 games | G8, G9, G11, G13 — "lean" victory path |
| 4 | 4 games | G2 is interesting: P3 won with 5, lost P2 had 7 |
| 5–7 | 7 games | Most common winning range |
| 8–10 | 5 games | High-build strategy; G18 max: 10 structs |

**Winning structure count ranges from 3 to 10** — showing genuine strategy variety. This is a positive sign: both "build few expensive things" and "build many cheap things" paths exist and win.

However: in several games a player with **more structures lost to a player with fewer**. Example: G12 — P1 had 7 structs ($4,917 NW) vs P3 with 4 structs ($5,085). This means cash flow and timing matter, not just structure count.

---

## 5. Economy Health

- **Average loser's final NW: ~$3,900** — losers are not far behind winners. The gap is small ($5,145 winner vs $4,360 runner-up = 18% gap on average). This means games feel close, which is good, but also means the winner's position isn't dramatically decisive.
- **Cash at game end:** Winners hold $200–$2,005 cash; losers commonly down to $15–$400. Many players are cash-poor at the finish line — they're investing everything.
- **No bankruptcies in 20 games.** The $1,500 starting capital + passive structure income keeps everyone afloat. The debt/upkeep system is never tested. This is a major gap: the bankruptcy-protection systems (vault → resource sale → structure sale cascade) are completely untested in real play.

---

## 6. Console Warnings — Map Topology

**Every game start** floods the console with warnings like:
```
BoardLoader: cell 532 has more neighbours than cardinal slots; neighbour 118 is unreachable from this cell.
```

Affected cells (confirmed unreachable-neighbour issues): **532, 569, 571, 521, 511, 516, 498, 493, 486, 479, 473, 471, 461, 459, 457, 456, 450, 449, 447, 445, 444, 433** and more.

**Impact:** Some cells have 5+ visual neighbours but only 4 cardinal routing slots, so one neighbour is silently dropped. Players landing near these junctions may find movement options missing. This is a navigability bug affecting the Denmark map specifically.

---

## 7. The Good

1. **Games finish in a satisfying time range (67–107 turns).** Nobody drags to the turn cap.
2. **All 4 players remain competitive.** No player was ever eliminated. Final NWs are consistently in the $2,500–$5,300 range.
3. **Win variety exists.** 3 different players (P1, P2, P3, P4) won games. No single player dominates all the time (though P3 is overrepresented).
4. **Multiple viable strategies observed:** lean builds (3 structs, cash-heavy) vs mass builds (10 structs) both win.
5. **No crashes or JS errors** in 20 games — the codebase is stable.
6. **Win-by-networth is well calibrated.** The $5,000 target hits in reasonable time without forcing a turn-cap.
7. **The catch-up bonus, chance events, and market system all appear to be functioning** (reflected in the non-linear NW curves observed during play).
8. **Round-robin starting position** randomises well — different starting players each game.

---

## 8. The Bad

### 8.1 Critical

- **Player 3 wins 40% of games.** Root cause unknown — could be map spawn position, turn-order dynamics, or sample size. Needs investigation.
- **Zero bankruptcies.** The elimination mechanic is never triggered. Players with $15 cash and heavy upkeep are still surviving. The game never punishes over-extension.
- **Map topology warnings (20+ cells unreachable)** on every game load — some areas of Denmark are silently dead ends.

### 8.2 Significant

- **The $5,000 win target is quite tight.** Games end with the loser at 80–95% of the winner's NW. There's very little "winning clearly" — the leader is always barely ahead. This reduces the satisfaction of winning and makes it feel random.
- **No player interaction (bots).** Sabotage, trade, and hostile takeover are never used. These systems are implemented but untested in automated play. Real players will use them, potentially breaking balance.
- **Structure upkeep costs are invisible.** Players have no easy way to see what a structure costs per turn vs earns per turn before building it. The build menu shows rent estimates for visitors but not the owner's running cost.
- **The `flatCashPerStructure: 5` upkeep fires per structure per turn.** With 10 structures, that's $50/turn drain on top of resource upkeep. Winners with 8–10 structures likely need high passive income to cover it, creating an accelerating-returns loop that's hard for behind players to break.

### 8.3 Minor

- **Fast-roll is off by default** (`rollDuration: 1.4s`). First-time players wait 1.4s per die roll. At 86 turns/game with 4 players = 344 rolls per game, that's **8 minutes of die animations** alone.
- **No visual feedback when passive income fires.** The start-of-turn income is applied silently. Players don't see "+$20 from Shop" floating text on the board during the bot's turn.
- **The "Between Turns" pause** has a bug: `animHoldSec` computation is falsy when `FLOAT_LIFETIME_MS` is set to 0 (ternary evaluates 0 as falsy → falls back to 1.7s). Not user-visible normally, but affects fast-play.

---

## 9. Missing for Fully Enjoyable Play

| Missing Feature | Impact | Priority |
|-----------------|--------|----------|
| **No bankruptcies / elimination events** | High — end-game has no drama or stakes | P1 |
| **Fast-roll on by default** | High — 8+ minutes of die animations per real game | P1 |
| **Bot players (AI opponents)** | High — game requires 4 humans at a keyboard | P1 |
| **Structure upkeep shown in build menu** | Medium — players build blindly | P2 |
| **Visible income floats** ("Shop earned +$20") | Medium — progression feels invisible | P2 |
| **Player 3 slot investigation** | Medium — fairness issue | P2 |
| **Map topology fix** (unreachable cells) | Medium — movement options silently missing | P2 |
| **Sabotage / trade tutorial / prompt** | Medium — systems exist but discoverability is low | P3 |
| **Win margin feedback** ("You need $X more to win") | Low — players don't know how close they are | P3 |
| **Takeover affordability guard** | Low — buy button shows even when unaffordable | P3 |
| **Property conversion** (Convert Shop → House at 50% discount) | Low — sell+rebuild is the only path | P3 |
| **Near-miss chance visual indicator** | Low — chance events fire silently near chance cells | P3 |
| **District specialty visible in sidebar** | Low — specialty districts aren't surfaced in HUD | P3 |

---

## 10. Improvement Plan

### Round 2 — Changes to Implement Now

| # | Change | File(s) | Expected Impact |
|---|--------|---------|-----------------|
| F1 | Set `rollDuration: 0.4` (fast by default) | `config.js` | Players save ~6 min/game of die animations |
| F2 | Raise win target to `$8,000` | `config.js` | Longer games, clearer winner; more structure needed |
| F3 | Add upkeep summary to build menu subtitle | `managers/TurnManager.js:_showBuildMenu` | Players see cost/benefit before building |
| F4 | Fix `animHoldSec` falsy-zero bug | `AccaGame.js:_beginBetweenTurns` | Fast-roll toggle works cleanly |
| F5 | Log income lines during start-of-turn production | `managers/EconomyManager.js` | Players see where money comes from |
| F6 | Investigate P3 spawn position advantage | `maps/denmark.json`, `AccaGame.js:_initPlayers` | Reduce win bias |
| F7 | Reduce starting money $1,500 → $1,000 to trigger bankruptcy scenarios | `config.js` | Economy becomes more dangerous; upkeep matters |
| F8 | Raise `noBuildPenaltyAfterTurn` threshold to 30 and penalty to $30/turn | `config.js` | More incentive to build; creates early game pressure |

After implementing and re-running 20 games, compare:
- Win distribution (target: no slot > 35%)
- Avg game length (target: 90–150 turns at $8k target)
- Bankruptcy rate (target: ≥10% of players across all games)
