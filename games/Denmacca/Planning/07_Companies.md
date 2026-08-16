# 07 — Companies

> **Δ v1.** v1 designed Companies as a player-owned grouping of properties, each with an industry tag granting a passive bonus. **v2 does not implement Companies.** Players interact with the world directly via `ownedStructures`. This document is preserved as a delta record and a sketch of how to add Companies back if the design calls for it.

## 7.1 Current state in v2

- No `Company` class exists.
- Players hold a flat `ownedStructures` array.
- There is no industry-bonus layer between Player and Structure.
- District specialty (see `06_ResourcesAndMarket.md`) is the only "industry-flavored" multiplier in v2. It buffs factory output and (reserved) market discount.

## 7.2 Why Companies were dropped

- v1 playtest reports (`games/Acca/20260504_PLAYTEST_REPORT_*.md`) showed that the Company UI added a layer of complexity without changing core decisions — bots and casual players almost always picked one company and one industry early, then never revisited the choice.
- Removing the layer simplified the build menu, the manage menu, and serialization. The full v2 codebase (~2500 lines of game logic) compares to v1's ~5000.
- District-level specialty (a per-district resource multiplier authored by the map) covers the "regional industry flavour" use-case more cleanly.

## 7.3 If Companies are reintroduced

Sketch of where the seams are:

- New file: `games/Acca/core/Company.js` exporting `A.Company`. Fields: `id`, `ownerIndex`, `name`, `industry`, `structures[]`, `bonus`.
- Player gains `companies[]` and `companyByStructure(structure) → Company`.
- Cfg gains `cfg.industries.bonusKeys` (industry name → bonus spec).
- TurnManager Manage menu gains a `Companies` submenu (rename, specialize, transfer structures).
- Build flow asks: which company should this structure join? (Default: the company that owns the most structures in this district.)
- Save format gains `players[].companies` + structure→company mapping.
- HUD gains per-company headers in the Players panel.

This is a clean addition — none of v2's modules would need to change behaviour, just attach a parallel `companies[]` to Player and let `EconomyManager` look it up when computing per-structure income.

## 7.4 Industry bonus shape (sketch only)

Reserved JSON (mirrors what v1 used):

```jsonc
{
  "industries": {
    "bonusKeys": {
      "tech":      { "shopVisitRate": 0.05 },     // +5pp visit rate to all owned shops
      "logistics": { "tollIncrement": 5 },         // +5 per pass