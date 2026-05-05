# 11 — Trading and Sabotage

## 11.1 Goals

- **Trading** is the lever for cooperation: two players negotiate an exchange of cash, resources, and structures.
- **Hostile takeover** is the lever for late-game pressure: a player pays a multiple of a structure's value to seize it.
- **Sabotage** is the lever for asymmetric attack: a player burns a small amount of money + 1 oil to cripple a target structure for several turns.

All three live in `games/Acca2/systems/TradeSystem.js`.

## 11.2 Trade flow

`tradeSys.executeTrade(playerA, playerB, proposal)` is atomic — if any step fails, no state changes.

```js
proposal = {
  give:    { money?: number, resources?: { wood: 2, ... }, structures?: [structureRef, ...] },
  receive: { money?: number, resources?: { ...           }, structures?: [structureRef, ...] }
}
```

Pre-flight checks:

1. `give` and `receive` are well-formed.
2. Each side actually owns what they're offering (cash, resources ≥ qty, structures owned).
3. **Imbalance ratio** — total dollar value of one side ≤ `cfg.trade.maxImbalanceRatio` (= 5) × the other side, unless `cfg.trade.allowImbalanced` (= false) is set. This is the anti-collusion guard against giveaway trades.
4. Returns `{ ok: false, reason }` on any failure.

On success:

- Cash deltas applied first.
- Resources moved.
- Structures re-pointed (`cell.structure.ownerIndex` updated; arrays moved).
- Mayor recompute fires for any affected district.
- Returns `{ ok: true }`.

## 11.3 UI

Trade is opened from the start-of-turn menu (Trade) or as a follow-up to landing on another player's structure.

`TurnManager` builds a simple "preset offer" list for hot-seat speed:

- "Give $200 for 5 of any resource."
- "Give the structure X for $Y."
- "Free swap: my resource X for your resource Y."
- "Custom" — open the full trade builder with two columns (give / receive) and resource quantity steppers.

The custom builder validates against `tradeSys.executeTrade` on every change so the player sees red-lit options when they're invalid.

## 11.4 Hostile takeover

`tradeSys.canTakeover(attacker, structure)` returns `{ok, reason?, cost?}`. Rules:

- Structure must be owned by another (non-bankrupt) player.
- Attacker has not already taken over a structure this turn (see `cfg.property.maxTakeoversPerTurn` = 1, tracked in `TradeSystem.state` per attacker).
- `cost = structure.currentValue × cfg.property.takeoverMultiplier` (× 5).
- Attacker has the cash.

`tradeSys.takeover(attacker, structure, players, turn)`:

- Deducts `cost` from attacker.
- Pays `cost` to the previous owner.
- Re-points `structure.ownerIndex` and updates `ownedStructures` arrays.
- Resets `currentValue` to `baseValue` (the takeover does not preserve invested upgrades — the previous owner retains the cash equivalent).
- Increments `state.get(attackerIndex).takeoversThisTurn`.
- `districtSys.recomputeMayor` fires for the affected district.

`TurnManager` exposes Takeover from the visitor-effect menu (when the visitor lands on a foreign-owned structure).

## 11.5 Sabotage

`tradeSys.canSabotage(attacker, structure, turn)` returns `{ok, reason?, cost?}`. Rules:

- Structure must be owned by another player.
- Attacker has 1 oil and `cfg.sabotage.cost` ($300) cash.
- Attacker is not on cooldown (`state.get(attackerIndex).sabotageCooldownUntil > turn`).
- Target is **not protected** by an active police station within `cfg.structures.policeProtectionTier` (= 1) cells.

`tradeSys.sabotage(attacker, structure, players, turn)`:

- Deducts $300 + 1 oil from attacker.
- Sets `structure.sabotagedUntilTurn = turn + cfg.sabotage.duration` (3).
- Sets `state.get(attackerIndex).sabotageCooldownUntil = turn + cfg.sabotage.cooldown` (4).
- Emits `business:sabotaged({ structure, attacker })`. `AccaGame` logs it to the in-game notifications.
- `cfg.sabotage.revealAttacker` (= false) controls whether the message names the attacker. v2 hides the attacker by default.

While sabotaged, the structure produces no owner income, and visitor rent is multiplied by `cfg.sabotage.rentReductionMul` (= 0.5).

## 11.6 Anti-collusion guards

- **Imbalance ratio** on trades — see 11.2.
- **One takeover per turn** — `maxTakeoversPerTurn`.
- **Sabotage cooldown** — `cfg.sabotage.cooldown` (4 turns).
- **Police protection** — see 5.7.
- **Takeover shield** — `state.get(playerIndex).takeoverShieldUntil` is reserved (not yet set anywhere in v2). It would prevent immediate counter-takeovers if the design adds it.

## 11.7 Edge cases

- Bankrupt players are filtered out of `getLeader`/`getLowestCash` so chance-event sabotage doesn't target them.
- A player about to bankrupt with a vault: `runEndOfTurn` withdraws stored money first, so vault contents pay debts before structures are sold.
- A structure traded mid-turn doesn't break the Mayor recompute — mayor change events fire correctly because `executeTrade` calls `districtSys.recomputeMayor` for both pre- and post-state districts.

## 11.8 Δ v1 roundup for this chapter

- The **5× takeover multiplier** survived from v1.
- Sabotage **costs 1 oil** in v2 (v1 did not require oil — this was added to give oil a non-migration use).
- Police protection is new — v1 had no protection mechanic.
- Imbalance ratio anti-collusion is new — v1 allowed any trade.
