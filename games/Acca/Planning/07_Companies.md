# 07 — Companies


## 7.1 Current state

- No `Company` class exists.
- Players hold a flat `ownedStructures` array.
- There is no industry-bonus layer between Player and Structure.
- District specialty (see `06_ResourcesAndMarket.md`) is the only "industry-flavored" multiplier currently. It buffs factory output and (reserved) market discount.

## 7.2 Why Companies were dropped

- Playtesting showed that a Company UI added a layer of complexity without changing core decisions — players almost always picked one company and one industry early and never revisited the choice.
- Removing the layer simplified the build menu, the manage menu, and serialization. The full codebase is approximately 2500 lines of game logic.
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

This is a clean addition — none of Acca's modules would need to change behaviour, just attach a parallel `companies[]` to Player and let `EconomyManager` look it up when computing per-structure income.

## 7.4 Industry bonus shape (sketch only)

Reserved JSON schema:

```jsonc
{
  "industries": {
    "bonusKeys": {
      "tech":      { "shopVisitRate": 0.05 },     // +5pp visit rate to all owned shops
      "logistics": { "tollIncrement": 5 },         // +5 per pass to owned toll gates
      "agri":      { "factoryHouseBonus": 0.05 },  // +5% per house to owned factories
      "energy":    { "marketDiscount":   { "electricity": 0.05, "coal": 0.05 } },
      "finance":   { "vaultInterestRate": 0.005 }
    }
  }
}
```

## 7.5 Win-condition interaction (post-add)

If Companies return, win conditions could be extended with a `CompanyValue ≥ target` mode (the highest-value c