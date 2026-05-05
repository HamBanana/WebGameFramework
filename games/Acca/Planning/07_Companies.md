# 07 — Companies

## 7.1 Concept

Per the design doc: *"Players start with one company but can create more to specialize in different industries. Companies group properties and provide bonuses based on business types."* Companies are how a player crystallises their strategy: by specialising a company, they earn passive multipliers on the relevant business types.

## 7.2 Entity

`games/Acca/entities/Company.js`:

```js
class Company {
  id;            // string, unique per player ('coA', 'coB', …)
  ownerIndex;
  name;          // player-set ('Hamco Industries')
  industry;      // null | one of cfg.industries.types
  propertyIds;   // cells where this company owns the property
  treasury;      // optional sub-account; v1: shares the player's cash, this is reserved for v2
}
```

A property is always owned by exactly one company. When a player buys a property, the menu asks which company holds it (defaulting to the company that already owns most of the region).

## 7.3 Industries and bonuses

Defined in `cfg.industries`:

```js
industries: {
  types: ['general', 'logistics', 'service', 'extraction', 'energy', 'agriculture'],
  bonus: {
    general:    { incomeMul: 1.05 },
    logistics:  { rentMul: 1.10, businessTypes: ['shop', 'factory'] },
    service:    { happinessBonus: 2, businessTypes: ['service'] },
    extraction: { productionMul: 1.20, businessTypes: ['lumber_mill','coal_mine','steel_mill','oil_rig'] },
    energy:     { productionMul: 1.25, businessTypes: ['power_plant'] },
    agriculture:{ productionMul: 1.15, businessTypes: ['farm','water_pump'] },
  },
  changeCost: 1000,   // cost to re-specialize an existing company
  newCompanyCost: 500,
}
```

Bonus is applied only to businesses whose `type` is in the company's `industry.businessTypes` list (or unconditionally for `general`).

## 7.4 Creating, renaming, specializing

Modal in `MANAGE`:

- **Create company** — pick name, industry. Pay `cfg.industries.newCompanyCost`. Newly bought properties default to this company until another is created.
- **Specialize company** — change industry. Pay `cfg.industries.changeCost`.
- **Rename** — free.
- **Reassign property** — move a property from company A to company B. Free, but only if the destination company is still in the same region (to discourage shuffling for tax avoidance). v1 caveat: if there's only one company, this is a no-op.

## 7.5 HUD surface

In the `MANAGE` panel, the top row shows the player's companies as tabs. Tab heading: name + industry icon + property count + total weekly income. Selecting a tab filters the property list to that company's holdings.

## 7.6 Win-condition interaction

`TotalValue` win uses the player's grand total across all companies, not per-company. `LastManStanding` is the player, not the company. Companies are organizational, not legal entities, in v1.
