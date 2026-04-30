# 11 — Trading and Sabotage

## 11.1 Goals

Acca's player-to-player tension comes from three optional mechanics, all surfaced through the **Trade** option of `TURN_START`:

1. **Trade** — voluntary, agreed exchange.
2. **Hostile takeover** — buy a property out from under another player at a multiplier.
3. **Sabotage** — temporarily disable an opponent's property.

System: `games/Acca/systems/TradeSystem.js`.

## 11.2 Trade flow

A trade is a *proposal* and an *acceptance*:

1. Active player A picks a target player B.
2. The Trade modal shows two columns: "What I give" / "What I receive". Each column accepts:
   - Cash (numeric stepper).
   - Resource counts (per resource, max = current holding).
   - Property cards (selectable from owned).
3. A submits the proposal.
4. B sees the proposal modal with three options: `Accept`, `Counter`, `Decline`. The active player loop pauses (game state = `PAUSED`) while B decides.
5. On Accept: assets swap atomically; emit `property:soldTo` for any properties; RegionSystem recomputes mayors.
6. On Counter: round-trip — A sees B's revised offer with the same three options.
7. On Decline: modal closes, A returns to `TURN_START`.

A counter-offer does not consume B's turn. Trade is free of any intrinsic cost.

In hot-seat play, B physically takes the keyboard. The framework is single-player at the input layer, so the modal grabs focus and shows "Player B: respond on the keyboard."

## 11.3 Hostile takeover

A player may forcibly purchase any single property they don't own, at a price multiplier of `cfg.property.takeoverMultiplier` (default ×2.0) of `improvedValue`.

- Available only on the player's own turn, from `MANAGE`.
- Limited to one takeover per turn (config: `cfg.property.maxTakeoversPerTurn`, default 1).
- The targeted property's owner is paid in full immediately.
- Any business on the property transfers (the takeover buys the asset, not just the lot).
- Fires a 3-turn cooldown on the target player taking another takeover *back* on the attacker (prevents ping-pong). Tracked on player.

Emits `property:soldTo` with `via: 'takeover'` so HUD/audio can flag it.

## 11.4 Sabotage

Sabotage temporarily disables a target property:

- Cost: `cfg.sabotage.cost` (default $300) plus 1 oil.
- Effect: the target property is marked `sabotagedUntilTurn = currentTurn + cfg.sabotage.duration` (default 3). All businesses on it become idle for the duration. Rent collection by the owner halves.
- Discovery: at end of turn after sabotage triggers, the target gets a notification ("Your property was sabotaged"), but the attacker's identity is hidden by default. `cfg.sabotage.revealAttacker = true` reveals it (designer-tunable).
- Limit: one sabotage per attacker per `cfg.sabotage.cooldown` turns (default 4).

Emits `business:sabotaged` and a particle effect on the property.

## 11.5 UI patterns

- All three actions share a base `PlayerPicker` widget that lists other players with their summary stats.
- Trade and takeover share a `PropertyPicker` that filters to the appropriate player's holdings.
- Sabotage uses a `PropertyPicker` filtered to the *target's* holdings.
- All confirmation dialogs show the projected money outcome ("After this trade you will have $1,240").

## 11.6 Anti-collusion guard

Hot-seat games can't enforce against collusion. v1 takes one preventive step: a trade is rejected if the value imbalance exceeds `cfg.trade.maxImbalanceRatio` (default 5×) — i.e., obviously lopsided trades require an explicit "Allow" toggle in `Options`. This protects the design intent without becoming paternalistic.

## 11.7 Edge cases

- A trade cannot include a property that is currently sabotaged (the asset is encumbered until the sabotage clears).
- A trade cannot reduce a player below $0 (validated before swap).
- A takeover that would bankrupt the *attacker* fails.
- Sabotaging a property whose owner is the active player is forbidden.
