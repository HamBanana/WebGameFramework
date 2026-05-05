# Acca — Feature Evaluation

**Date:** 2026-05-05
**Scope:** Every cell type and every player-built structure in Acca, evaluated from two viewpoints — what happens when the *owner* enters/lands on it, and what happens when an *opponent* (visitor) enters/lands on it. Pass-through effects, owner passive incomes, and upkeep are included where relevant.
**Sources:** `managers/TurnManager.js`, `managers/StructureManager.js`, `managers/EconomyManager.js`, `systems/ChanceSystem.js`, `config.js`, `Planning/03_BoardAndCells.md`, `Planning/05_StructuresAndBuildings.md`.

---

## 1. Map cell types (set by the map JSON, never owned)

These are the cell `type`s the map can declare. None of them are purchasable in their own right — they trigger the listed effect for whichever player lands on them. There is no "owner vs visitor" distinction at the cell level (only at the *structure* level, §2).

### 1.1 `bank`
- **Pass-through (any player):** No effect. The pass-through hook only fires for toll gates.
- **Landing (any player):** `TurnManager._handleLanding` adds **+$200** and logs *"<name> stops at the Bank. +$200."*. Then `END_TURN`.
- **Notes:** This is also the spawn cell. The planning doc described the bank as a no-op on landing "with room for a passive bonus"; the implementation already pays the $200 stipend. Worth reconciling the two.

### 1.2 `chance`
- **Pass-through:** No effect.
- **Landing (any player):** Calls `_handleChance`, which delegates to `ChanceSystem.draw`. The draw is weight-based with a `repeatGuard` of 3 (recently-drawn ids excluded) and the modal shows the event label, message, and category. The 19-event pool spans five categories — *economy*, *population*, *resource*, *weather*, *social* — and effect kinds (`money`, `money_pct`, `resource`, `happiness`, `migration_in`, `sabotage`, `modify_die`). Scope is per-event (`self`, `all`, `leader`, `lowest`, `mayor`).
  - Self-only money swings: Stock Market Crash (-10% cash), Tax Audit (-$120), Property Repairs (-$80), Bonus Pay (+$100), Supplier Discount (+$80), Regional Festival (+$150).
  - All-player swings: Trade Embargo (-$200 each), Rainy Season (+5 water each), Drought (-5 water each), Plague (-10 happiness all regions).
  - Lowest-cash player: Philanthropy (+$200).
  - Leader: Rivalry (random structure of the leader is sabotaged).
  - Self resource grants: Oil Discovery (+3 oil), Industrial Surge (+5 steel), Coal Seam (+5 coal), Energy Surplus (+10 elec), Resource Boom (+5 of a random resource).
  - Self die override: Lucky Die (next roll is 4–6).
  - Mayor scope: Regional Festival happiness event (+10 in your mayoral districts).
- **Near-miss bonus:** Even when a player lands on a *non-chance* cell that is cardinally adjacent to a chance cell, `nearMissProb = 0.25` will fire a chance event instead of the cell's normal landing effect. This is invisible to the player and can be confusing — see Findings.

### 1.3 `market`
- **Pass-through:** No effect.
- **Landing (any player):** Opens the Market modal directly (`_showMarketMenu`). Player can buy/sell each of the seven resources (`wood, steel, electricity, water, food, coal, oil`) in batches of 1 or 5. Prices come from `MarketSystem`, with a `sellSpread` of 0.9 between buy and sell. After choosing **Done**, the turn ends.
- **Notes:** This is the only cell that *forces* a sub-menu before the turn can end. Players who land here purely en route are required to exit through "Done".

### 1.4 `power_plant`
- **Pass-through:** No effect.
- **Landing (any player):** `_grantResource(cell, 'electricity', 3, 'Power Plant')` → **+3 electricity**, log line, `END_TURN`.

### 1.5 `well`
- **Pass-through:** No effect.
- **Landing (any player):** **+3 water**, log line, `END_TURN`.

### 1.6 `mine` (subType: `coal` | `iron`; legacy `oil` accepted)
- **Pass-through:** No effect.
- **Landing (any player):** Reads `subType` from the map JSON. `iron` mines grant **+3 steel**; `coal` mines grant **+3 coal**; an `oil` subtype would grant **+3 oil**. Falls back to coal if subType is missing.
- **Notes:** The dispatch goes through `GF.mapData.cells.find(c => c.id === cell.id)` to read `subType`, instead of reading it off the live `Cell` instance — fragile if the mapData reference is missing.

### 1.7 `buildable` (and `empty`, treated identically)
- **Pass-through:** No effect (unless a structure has been built on it — see §2).
- **Landing — empty plot:** `_showBuildMenu(cell)` opens the build menu. Catalog is sorted by cost ascending. Each row is enabled only if the player can afford it; if the player can't afford the cheapest (Shop, $250) the menu collapses to a single **Skip** option (a deliberate UX patch — the all-disabled list took 7 keypresses to clear). On confirm, the structure is built, cost deducted, mayor recomputed, and the turn ends.
- **Landing — built plot:** dispatched into §2 (owner vs visitor effect for the structure that sits on the cell).

### 1.8 `structure` (pre-placed, neutral)
- The map can declare a cell as `type: "structure"` with a `structureType` (e.g. a fixed shop). These render as the structure's sprite but have `ownerIndex = -1`. The landing dispatch in `TurnManager` does **not** include a `case 'structure'`, so they fall through to `default → END_TURN`. In effect, pre-placed neutral structures currently have no on-land or pass-through behaviour. (Planning doc §3.1 lists them as a valid cell type; runtime behaviour is a no-op.)

---

## 2. Player structures (built on `buildable` cells)

Each row below covers all four interaction surfaces that exist for a structure: **owner landing**, **opponent landing**, **opponent pass-through**, and **start-of-turn passive (owner-only)**. Build cost and the per-tick consumable upkeep are listed at the top of each entry.

### 2.1 Shop — $250 build, 1 electricity/turn
- **Owner landing (`StructureManager.ownerOptionsFor`):** Menu offers **Invest $100** (raises `currentValue` by `shopInvestStep = 100`, capped at `shopBaseCap + structuresInDistrict × shopCapPerStructure` = $800 + $200 per same-district structure). A status row shows `Cap` and `Current`. **Continue** ends the turn.
- **Opponent landing (`visitorEffect`):** Pays rent = `max(1, round(currentValue × shopVisitRate))`. With `shopVisitRate = 0.2`, a base $250-value Shop charges **$50** per visit; a fully-invested $1,000 Shop charges **$200**. After paying, the takeover/skip menu appears (see §3).
- **Opponent pass-through:** No effect.
- **Owner passive (start-of-turn):** Flat **+$20** if not idled/sabotaged.
- **Sabotage modifier:** When `sabotagedUntilTurn > turnCounter`, owner income is suppressed and visitor rent is multiplied by `rentReductionMul = 0.5`.

### 2.2 Toll Gate — $400 build, 0 electricity/turn
- **Owner landing:** Owner action menu lists **`(passive — owner takes no action)`** then **Continue**. The owner does **not** auto-collect tolls on landing — the option *to collect* is implicitly bundled into landing in the doc but is not implemented as a menu item; the accrued cup keeps growing until owner-passive income substitutes for it.
  - **Discrepancy with the doc:** Planning §5.4 says owner landing offers **Collect tolls ($tollAccrued)** but the code only emits the passive label. `tollAccrued` is never zeroed at runtime. Worth fixing (either drain it on owner landing or remove it from the data model).
- **Opponent landing:** Already paid on pass-through; landing is a no-op. Still goes through the takeover offer.
- **Opponent pass-through:** Every step into the cell, the visitor pays the current `tollAccrued` value to the owner (logged as *"<name> pays $X to <owner> (pass a Toll Gate)"*; if `tollAccrued` is 0, logged as *"free this time"*). Then **`tollIncrement = 25`** is added to the cup. So the very first traversal of a brand-new toll gate is free, the second costs $25, the third $50, etc., until somebody collects.
- **Owner passive (start-of-turn):** **+$8** (`tollOwnerIncome`).

### 2.3 Teleporter — $500 build, 1 electricity/turn
- **Owner landing:** For every *other* teleporter the same player owns, an option **Teleport to <district / cell #>** appears (free). If the player only owns this one teleporter, the menu shows `(no other teleporter to use)`. Then **Continue**.
- **Opponent landing:** For every other teleporter that *the owner* owns, if the visitor has at least `teleportFee = $75`, an option **Teleport to <terminal> ($75)** appears. The fee transfers from visitor → owner. **Pass** is always available. Takeover offer follows.
- **Opponent pass-through:** No effect.
- **Owner passive (start-of-turn):** **+$12** (`teleporterOwnerIncome`).

### 2.4 House — $300 build, 1 food + 1 electricity/turn
- **Owner landing:** If the player is mayor of this district, **Collect taxes (+$60)** is available (`houseTaxIfMayor`). If not, the option is replaced with the explanatory line *"Need mayor of <district> to tax"*. Then **Continue**.
- **Opponent landing:** Pays rent = `max(1, round(baseValue × houseRentRate))` = `max(1, round(300 × 0.25))` = **$75**. Note this uses *baseValue* (always the build cost), not currentValue — Houses currently have no investment lever, so the rent never grows. Then takeover offer.
- **Opponent pass-through:** No effect.
- **Owner passive (start-of-turn):** **+$18** (`houseOwnerIncome`) and **+4 residents** added to the district population (`housePopContribution`). If a Food shortage idles the House, neither the cash nor the population add fires that turn.

### 2.5 Factory — $600 build, 1 oil/turn
- **Owner landing:** **Collect <qty> <resource>** — quantity is `max(1, round(factoryBaseRate × (1 + housesOwned × factoryHouseBonus)))`. With `factoryBaseRate = 1` and `factoryHouseBonus = 0.25`, owning 0 houses yields 1, 2 houses yields 2, 4 houses yields 2, 6 houses yields 3, etc. Resource is `factoryResource = food` unless the cell's district has a `specialty`, in which case the specialty is produced instead.
- **Opponent landing:** Pays rent = `max(1, round(baseValue × houseRentRate))` = `max(1, round(600 × 0.25))` = **$150** (note: factory rent uses `houseRentRate`, the same coefficient as a House — see Findings). Then takeover offer.
- **Opponent pass-through:** No effect.
- **Owner passive (start-of-turn):** Produces the same `qty/resource` calc above, *automatically*, every turn; `+specialtyBonus = 1` is added if the district has a specialty. The owner also benefits from `passiveYield = 1` of food + 1 of electricity each turn (a global stipend, not a Factory effect).

### 2.6 Police Station — $700 build, 1 electricity/turn
- **Owner landing:** Menu shows **`(passive — owner takes no action)`** and **Continue**.
- **Opponent landing:** Logs *"<name> passes the Police Station."* — no rent, no fee. Takeover offer follows.
- **Opponent pass-through:** No effect.
- **Owner passive (start-of-turn):** **+$30** (`policeOwnerIncome`).
- **Protection radius:** Any owned structure within `policeProtectionTier = 1` Manhattan-distance cells of an active police station rejects sabotage attempts via `TradeSystem.canSabotage`.

### 2.7 Vault — $1000 build (L1, capacity $5,000), 0 electricity/turn
- **Owner landing:** A combined deposit/withdraw/upgrade menu (`_appendVaultOptions`):
  - **Deposit** in $100 / $500 / $1000 increments and "all-in", clipped to `min(player.money, room)`.
  - **Withdraw** in $100 / $500 / $1000 + **Withdraw all $X**.
  - **Upgrade to L<n+1>** ($2,000 → L2 cap $15k; $3,000 → L3 cap $30k; $4,000 → L4 cap $50k; $5,000 → L5 cap $75k) — disabled when underfunded; the upgrade cost is added to `currentValue`.
  - At max level, the Upgrade row is replaced with an "at max level" line.
- **Opponent landing:** Logs *"<name> walks past <owner>'s Vault."* — no rent. Takeover offer still appears (vaults *can* be taken over and sabotaged).
- **Opponent pass-through:** No effect.
- **Owner passive (start-of-turn):** **+$10** (`vaultOwnerIncome`) plus `round(storedMoney × 0.01)` interest deposited back into the Vault. Stored money counts toward `netWorth`.
- **Debt resolution:** Vault `storedMoney` is the **first** thing auto-withdrawn when the owner's cash goes negative at end of turn — interest is preserved across that withdrawal.

---

## 3. Cross-cutting behaviour after any visitor landing on an opponent's structure

After `visitorEffect` runs (and after any follow-up menu like the teleporter's), `TurnManager._offerTakeoverOnLand` always presents:

- **Buy from `<owner>` ($cost = round(currentValue × 5))** — disabled-with-explanation if the visitor can't afford it. Confirming hands the structure to the visitor via `TradeSystem.takeover`, which re-points `ownerIndex` and rebases `currentValue` to `baseValue`.
- **Continue** — ends the turn.

`maxTakeoversPerTurn = 1` enforces one hostile-takeover-by-landing per turn. There is no "land on your own structure → buy out" path; takeover only triggers on opponent-owned cells.

Sabotage is **not** offered from the landing menu (despite Planning §5.5 listing it). To sabotage, the player must use **Other → Trade / Hostile actions → Sabotage a structure**, costing $300 + 1 oil with a 4-turn cooldown and a 3-turn duration.

---

## 4. Findings, balance notes, and discrepancies

### 4.1 Documentation vs. implementation drift
- **Toll gate owner-landing.** Doc says "Collect tolls" is available on owner landing; code only shows a passive label. `tollAccrued` therefore grows unbounded on this turn type. Either implement the menu item (cleanest) or change the doc to reflect that toll income is collected via the per-turn `tollOwnerIncome = $8` instead.
- **Bank cell.** Doc says landing has no enforced effect; code pays $200. Either is defensible — either delete the payout (and add a tip), or update the doc.
- **Sabotage on landing.** Doc §5.5 mentions a sabotage option in the visitor menu; code only shows the takeover/continue pair.
- **Pre-placed `structure` cells.** Declared as a valid map type but the landing dispatch has no case for them, so they're dead weight at runtime.

### 4.2 Balance signals worth investigating
- **Factory rent uses `houseRentRate` (0.25)** rather than `baseRentRate` (0.15) cited in the planning doc. That is the largest visitor-rent strike in the game ($150 baseline). Worth confirming this is intentional, or pivoting Factory rent to `shopVisitRate` / `baseRentRate` for consistency.
- **Shop vs House passive income.** Shops earn a flat $20/turn vs Houses' $18 — but Houses additionally pay $75 on visitor landing and grow district population (+4/turn) and let the mayor levy taxes. With investment maxed (district cap $800–$1600), Shops outscale Houses on rent only at full investment. The relative attractiveness is fine on paper; the playtest log shows bots converged on Shops because of the $250 entry cost, not because Shops were strictly better.
- **Toll gate revenue is event-driven.** Without tuning `tollIncrement` upward (currently $25/step) or making the owner empty the cup automatically, the Toll Gate's value is bounded by how often opponents traverse it. On the default 8×12 map this is rare, and the opportunity cost vs a $250 Shop is steep ($400 build + the missed Shop cash flow).
- **Vault economy.** $1000 entry, $10/turn passive, plus 1% interest → 100 turns to break even on the build cost ignoring stored interest. The instrument's real value is the bankruptcy buffer (auto-withdraw before structures sell), not the yield. Worth flagging in tooltip.
- **Teleporter.** Charges visitors $75 to use, owner income $12/turn, and consumes 1 electricity. With only one teleporter the network has zero combat value. Two are required to be useful — that's a $1000 sunk-cost commitment before any return.
- **Catch-up bonus.** Last-place player earning <55% of leader's net worth gets a $120 stipend at start of turn. With `startingMoney = 1500` and four players, this is rarely triggered until mid-game; consider lowering the threshold or scaling with leader's net worth.
- **Near-miss chance (0.25)** is invisible. A player who lands on, say, a `power_plant` adjacent to a `chance` cell will sometimes get a chance event *instead of* electricity, with no on-screen indication that they "almost" hit chance. Either expose this in the log ("near-miss chance triggered") or rename the log line to clarify what happened.

### 4.3 Player-facing affordances missing
- **No on-cell preview of expected rent.** Visitor doesn't see the rent number until after they land. Prompt suggestion: in the build menu, surface the per-visit rent for each option.
- **No portfolio-from-anywhere action menu.** The Manage → Properties menu spotlights a structure but doesn't let the player invest or upgrade from there — they have to land on the cell. Investing in a Shop should be possible from the portfolio screen.
- **House rent is fixed at baseValue × 0.25.** Houses have no equivalent of Shop's invest lever, so visitor rent is effectively pinned at $75 forever. Adding an "Renovate" option that bumps `currentValue` (and thus rent) would parallel the Shop pattern.

### 4.4 Edge cases / fragility
- **Mine subType lookup** reads `GF.mapData.cells.find(c => c.id === cell.id)` instead of `cell.subType` — if `GF.mapData` is missing or out-of-sync (e.g. after a save/load), all mines silently default to coal.
- **`_offerTakeoverOnLand` is called even for Vaults and Police Stations** — that's by design, but the modal title still reads "<Type> owned by <name>" with the same label. A vault takeover is mechanically identical to any other takeover; consider whether vault contents should transfer with the structure (currently `currentValue` is rebased and `storedMoney` keeps moving with the structure, but this isn't documented).
- **Multiple chance events per turn** are possible if the near-miss check fires *after* the actual landing dispatch — the code returns early on near-miss, so this is OK in practice. But the rename suggested above would prevent confusion if the logic is ever refactored.

---

## 5. Quick-reference matrix

| Cell / structure   | Owner-landing yield                                                         | Visitor-landing cost (paid to owner)                       | Pass-through                                  | Owner SoT passive            |
|--------------------|-----------------------------------------------------------------------------|------------------------------------------------------------|-----------------------------------------------|------------------------------|
| `bank`             | +$200 (any player)                                                          | +$200 (any player)                                         | —                                             | —                            |
| `chance`           | random event                                                                 | random event                                               | —                                             | —                            |
| `market`           | opens market UI                                                              | opens market UI                                            | —                                             | —                            |
| `power_plant`      | +3 electricity                                                               | +3 electricity                                             | —                                             | —                            |
| `well`             | +3 water                                                                     | +3 water                                                   | —                                             | —                            |
| `mine` (coal/iron) | +3 coal / +3 steel                                                           | same                                                       | —                                             | —                            |
| `buildable` empty  | build menu                                                                   | build menu                                                 | —                                             | —                            |
| `structure` (pre)  | (no-op)                                                                      | (no-op)                                                    | —                                             | —                            |
| **Shop**           | invest $100 step (cap $800 + $200/structure-in-district)                     | $50 base (20% of currentValue)                             | —                                             | +$20                         |
| **Toll Gate**      | passive only (collect-on-land not implemented)                               | landing no-op (paid on pass-through)                       | pay current `tollAccrued`, then +$25 to cup    | +$8                          |
| **Teleporter**     | free teleport to another owned teleporter                                    | $75 to teleport to one of owner's other teleporters         | —                                             | +$12                         |
| **House**          | +$60 if mayor of district                                                    | $75 (25% of baseValue)                                     | —                                             | +$18, +4 district population |
| **Factory**        | +1 resource (district specialty or food), scales with houses owned           | $150 (25% of baseValue)                                    | —                                             | same as owner-land qty (+specialty bonus 1) |
| **Police Station** | passive only                                                                 | log only — no rent                                          | —                                             | +$30, sabotage shield in 1-cell radius |
| **Vault**          | deposit / withdraw / upgrade L1→L5                                           | log only — no rent                                          | —                                             | +$10, +1% on storedMoney     |

> All visitor-landing rows then funnel into the **Buy from owner ($5× currentValue)** offer before the turn ends.

---

## 6. Suggested next steps

1. **Reconcile doc vs code** for Toll Gate owner-landing, Bank landing, and the visitor sabotage option (§4.1). Pick one and update the other.
2. **Surface the near-miss chance event** in the log so players understand what happened (§4.2).
3. **Add a "Renovate" lever to Houses** that grows `currentValue` and visitor rent, mirroring the Shop invest pattern (§4.3).
4. **Show expected rent in the build menu** so the buy decision isn't blind (§4.3).
5. **Decide what the `structure` cell type does** when landed on — either delete the type from the schema or add a real handler (e.g. owner-less rent collected by the bank).
6. **Audit Factory rent rate** — `houseRentRate` (0.25) vs `baseRentRate` (0.15): pick the rate that matches design intent and apply consistently (§4.2).

---

## 7. Resolution log — 2026-05-05

All six items from §6 plus the relevant subset of §4.1 / §4.3 / §4.4 have been addressed in code and docs in the same session as the audit. See `Planning/20_Changes.md` for the full changelog. Summary:

| § ref       | Issue                                              | Resolution |
|-------------|----------------------------------------------------|------------|
| §4.1        | Toll Gate owner-landing missing **Collect tolls**  | Added in `StructureManager.ownerOptionsFor('toll_gate')`. Pays `tollAccrued` and zeroes the cup. |
| §4.1        | Bank landing pays $200 but doc said no-op          | Doc updated (`Planning/03_BoardAndCells.md`) — kept the $200 stipend, removed the "room for a bonus" caveat. |
| §4.1        | Visitor sabotage option missing from landing menu  | Added to `_offerTakeoverOnLand`, gated through `TradeSystem.canSabotage`. Hidden in cooperative mode. |
| §4.1        | Pre-placed `structure` cells fell to `default`     | `_handleLanding` now has a `case 'structure'`: routes through `_handleBuildable` when a `PlayerStructure` is present; otherwise logs and ends turn. |
| §4.2        | Factory rent used `houseRentRate` (0.25)            | Switched to `property.baseRentRate` (0.15) and to `currentValue` instead of `baseValue`. |
| §4.2        | Near-miss chance fired silently                    | Added explicit log line before `_handleChance()`. |
| §4.3        | No on-cell preview of expected rent                | Build menu rows now suffix `— rent ~$N/visit` (or a per-type hint for non-rent structures). New helper `StructureManager.expectedVisitorRent(type, baseValue)`. |
| §4.3        | No portfolio-from-anywhere action menu             | Selecting a row in **Manage → Properties** now opens the structure's owner-options menu inline. New helper `_showPortfolioStructure`. |
| §4.3        | House rent pinned at $75 forever                    | Added **Renovate** owner action; rent now scales with `currentValue`. New config knobs `houseRenovateStep` ($100), `houseBaseCap` ($700), `houseCapPerStructure` ($150). |
| §4.4        | Mine subType lookup via `GF.mapData.cells.find(...)`| `Cell` now has a `subType` field set by `BoardLoader`; `TurnManager` reads `cell.subType` directly. |

The remaining items from §4.2 ("Shop vs House passive income," "Toll gate revenue", "Vault economy", "Teleporter", "Catch-up bonus") and the §4.4 vault-takeover documentation note are design judgement calls rather than bugs and have been left as-is for now — they're worth revisiting after the next playtest pass.
