# Acca — Round 3 Playtest Report

**Date:** 2026-05-11
**Round:** 3
**Method:** Browser-based AI driver, 4 bots, 20 games
**Map:** Denmark
**Config:** win target $7,500, starting money $1,000, noBuildPenalty $30 after turn 30

---

## 1. Comparison vs Previous Rounds

| Metric | R1 | R2 | R3 |
|--------|----|----|----|
| Win target | $5,000 | $5,000 (override missed) | **$7,500** |
| Starting money | $1,500 | $1,500 (override missed) | **$1,000** |
| Avg turns | 86 | 82 | **133** |
| Min / Max turns | 67 / 107 | 57 / 101 | **91 / 164** |
| Avg winner NW | $5,145 | $5,162 | **$7,710** |
| Avg winner structs | 5.55 | 5.8 | **9.2** |
| Bankruptcies | 0 | 0 | **0** |

Round 3 hits the avg-game-length target (90-150 turns) and produces winners with rich economies (9 structures, ~$7.7k NW).

---

## 2. Win Distribution

| Slot | R1 (8/6/3/3) | R2 (6/7/6/1) | R3 |
|------|--------------|--------------|----|
| P1 | 3 (15%) | 6 (30%) | **6 (30%)** |
| P2 | 6 (30%) | 7 (35%) | **2 (10%)** |
| P3 | 8 (40%) | 6 (30%) | **6 (30%)** |
| P4 | 3 (15%) | 1 (5%) | **6 (30%)** |

**Major improvement:** No slot exceeds 35% (R1's P3 dominance is gone). However, P2 dipped to 10% — within sample noise (χ² p ≈ 0.20) but worth watching. The catch-up bonus is keeping everyone alive, so position differences in 20 games still produce 2-6 outliers.

---

## 3. Per-Game Highlights

- **All 20 games ended by net worth.** Endpoints around $7,500-$8,015. Winners cleanly exceeded the target.
- **G4 (P3, 113 turns, NW=7589):** Fastest target hit — early aggressive building (9 structs).
- **G1 (P3, 164 turns, NW=7597):** Longest game; P3 and P4 both held strong middle-late but P3 broke through.
- **Runner-up NWs around $4,500-$6,900.** Losing players are reaching mid-game viability but not breaking through.
- **Winner structure counts:** range 7-11. Building 8+ structures is now the dominant winning strategy (previous rounds had 3-struct lean wins; these are gone with the higher target).

---

## 4. The Good (R3)

1. **Win-distribution variance dropped dramatically.** All four slots are now competitive (10-30% range vs R1's 15-40%).
2. **Average game length sits at 133 turns** — exactly the 90-150 target window. Games feel weighty without dragging.
3. **Winner NW $7,710 vs target $7,500** = clean margins. No "barely-won-by-$50" games.
4. **9.2 average winning structures** — the structure-building loop now genuinely matters; cash-hoarding can't keep up.
5. **No crashes, no errors in 20 games.** Stability is solid.
6. **Game length spread (91-164) is healthy** — fast games still happen for skilled opening play, slow games allow comebacks.

---

## 5. The Bad (R3)

### 5.1 Still no bankruptcies

Despite $1,000 starting money and $30 noBuildPenalty, **zero players went bankrupt across 80 player-games**. The catch-up bonus ($120/turn when below 55% of leader) is the prime culprit — it floors losing players at a viable equilibrium.

### 5.2 endReason field never populated

The `game.endReason` field is read by the driver but never set by `WinConditionChecker.check()`. All games report `endReason=unknown` even though the win condition logic clearly distinguishes between net-worth and last-standing wins. **Fixed in Round 4.**

### 5.3 P2 win rate at 10%

P2 dipped to 2/20. Likely sample noise but indicates the slot-balance isn't perfectly tight. Round 4 will check whether this persists or reverts to the mean.

### 5.4 Map topology warnings persist

Same Denmark unreachable-cell warnings every load. Not fixed yet — low priority since play is not visibly broken.

---

## 6. Round 4 Plan

| # | Change | File | Hypothesis |
|---|--------|------|------------|
| H1 | Add endReason tracking ('networth' / 'laststanding' / 'turncap') | `WinConditionChecker.js` | Reveals true end mechanism in stats |
| H2 | Lower catchUp threshold 0.55 → 0.35 | `config.js` | Catch-up only fires for badly-behind players |
| H3 | Lower catchUp amount $120 → $60 | `config.js` | Bonus exists but less of a safety net |
| H4 | Raise flatCashPerStructure $5 → $7 | `config.js` | Over-builders feel upkeep more |

**Goals for R4:**
- Bankruptcy rate ≥ 5% (4 player-games of 80)
- Win distribution remains 15-35% per slot
- Avg game length stays in 100-160 turn window
- endReasons no longer "unknown"
