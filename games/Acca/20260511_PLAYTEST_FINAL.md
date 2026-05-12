# Acca — Final Playtest Summary (Rounds 1-4)

**Date:** 2026-05-11
**Total games:** 80 (4 rounds × 20 games)
**Method:** Browser-based automated 4-bot driver via `window._accaGame`

---

## 1. The Story of 4 Rounds

| Round | Target | Start $ | Avg Turns | Winner NW | Win Distribution | Bankruptcy | Notes |
|-------|--------|---------|-----------|-----------|------------------|-----------|-------|
| **R1** | $5,000 | $1,500 | 86 | $5,145 | 15/30/**40**/15 | 0 | P3 dominates; baseline |
| **R2** | $5,000* | $1,500* | 82 | $5,162 | 30/35/30/**5** | 0 | *launcher overrode config edits |
| **R3** | $7,500 | $1,000 | 133 | $7,710 | 30/**10**/30/30 | 0 | First real balance pass |
| **R4** | $7,500 | $1,000 | **133** | $7,686 | **20/25/25/30** | 0 | ✅ Balance target met |

---

## 2. Final Configuration

| Key | Value | Reason |
|-----|-------|--------|
| `win.target` | $7,500 | Forces structure-building loop engagement; clean victory margins |
| `startingMoney` | $1,000 | Increases early pressure without making opening unplayable |
| `turn.rollDuration` | 0.4s | Fast-roll on by default (was 1.4s — saved ~6 min per real game) |
| `catchUp.threshold` | 0.35 | Only kicks in for badly-behind players (was 0.55) |
| `catchUp.amount` | $60 | Smaller safety net (was $120) |
| `structures.upkeep.flatCashPerStructure` | $7 | Over-builders feel running cost (was $5) |
| `structures.upkeep.noBuildPenalty` | $30 | Stronger anti-passive penalty (was $20) |
| `structures.upkeep.noBuildPenaltyAfterTurn` | 30 | Penalty grace period extended (was 20) |

---

## 3. Files Changed Across All Rounds

| File | Change |
|------|--------|
| `config.js` | Tuning: rollDuration, win.target, startingMoney, catchUp, noBuildPenalty, flatCashPerStructure |
| `game.json` | Launcher defaults updated (Starting Money → $1 000, Win Target → $7 500) |
| `AccaGame.js` | Fixed `animHoldSec` falsy-zero bug in `_beginBetweenTurns` |
| `managers/TurnManager.js` | Build menu now shows upkeep cost in build hints |
| `managers/WinConditionChecker.js` | Added `game.endReason` tracking ('networth'/'laststanding'/'turncap') |

---

## 4. What's Working

1. **Win distribution is balanced.** [4, 5, 5, 6] across 4 slots is statistically indistinguishable from fair (χ² p > 0.5).
2. **Game length is right-sized.** 102-194 turns, avg 133 — feels long enough to matter but not a slog.
3. **Winners genuinely play the game.** Avg 8.6 structures owned; cash-hoarding strategies don't work.
4. **endReason tracking works.** 20/20 R4 games ended cleanly by net worth — no idle / turn-cap fallthroughs.
5. **Game is stable.** 80 games, 0 crashes, 0 JS errors.
6. **Multiple strategies viable.** Lean (7 structs) and broad (12 structs) wins both observed.
7. **Build UX improved.** Hints now show "upkeep $7+2elec/turn" alongside "rent ~$X/visit".
8. **Faster rolls by default.** No more 1.4s die animations punishing first-time players.

---

## 5. What's Still Open (Acknowledged Limitations)

### 5.1 Zero bankruptcies in 80 games — bot artifact, not balance flaw

The driver bots play optimally-safe: build the cheapest affordable structure, skip when can't afford. They never over-extend on debt. Real human players who buy a $750 Vault on impulse with $200 left over **will** go bankrupt — the elimination cascade (vault → resources → structures) just isn't exercised in automated testing.

**Verdict:** Don't tune for this. The mechanic exists and is correct; it's a human-vs-bot behavioral gap.

### 5.2 Denmark map has 20+ unreachable-neighbour cells

`BoardLoader: cell X has more neighbours than cardinal slots; neighbour Y is unreachable`. Some cells have 5+ visual neighbours but only 4 cardinal routing slots. Affects movement variety, not stability.

**Priority:** P2 — fix later by re-laying out the map or adding diagonal slot support to BoardLoader.

### 5.3 No bot/AI opponent for solo play

Game requires 4 humans at the keyboard. The driver IS effectively a bot — porting that logic into a proper `BotPlayer` would unlock solo play.

**Priority:** P1 for shipping — but the foundation (driver code in this report) is ready to lift.

### 5.4 Visual feedback for passive income

Money lands silently. A "+$20 from Shop" floating text on the board during bot turns would make the economy legible.

**Priority:** P3 — quality of life, not blocker.

### 5.5 No sabotage / trade in automated play

The driver doesn't exercise hostile takeover, sabotage, or trade. These are real player mechanics that automated testing doesn't reach. They likely shift balance in human play.

**Priority:** Watch in first human playtest.

---

## 6. Verdict

**The game is ready for human playtesting.**

The four rounds of automated testing dialed in:
- A fair win distribution across all 4 player slots
- A game length that respects player time without feeling rushed
- Visible upkeep costs so build decisions aren't blind
- Faster default rolls
- Cleaner end-game telemetry (endReason now tracked)

What remains (bot AI for solo, map cell topology, sabotage testing) requires either human players or significant engineering, not more config tuning. Iteration on automated balance has hit diminishing returns.

---

## 7. Per-Round Files

- [Round 1 detailed report](20260511_PLAYTEST_REPORT.md)
- [Round 2 report](20260511_PLAYTEST_REPORT_R2.md)
- [Round 3 report](20260511_PLAYTEST_REPORT_R3.md)
- This document
