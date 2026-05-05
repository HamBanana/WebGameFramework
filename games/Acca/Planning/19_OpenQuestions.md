# 19 — Open Questions

Questions either inherited from `Gameplan.txt §6` or raised by this planning pass. Each item is parked here with one or more candidate answers; final decision belongs to the design owner.

## 19.1 Tax balance under high population

> *How can we balance the tax system to avoid punishing players for high population growth?*

Candidate answers:

- **A.** Cap tax income per region (`cfg.region.taxIncomeCap`) so very large populations stop scaling.
- **B.** Make tax happiness penalty depend on the *target* tax rate vs. `taxComfortRate` (already in 08), so high taxes hurt regardless of population.
- **C.** Reframe: large populations don't *need* to be over-taxed because employment fills more businesses → more income from production. This is implicit in the v1 design and may be sufficient.

Recommendation: ship v1 with C, watch playtests, add (A) only if needed.

## 19.2 Migration capitalization

> *Should migration between regions allow opposing players to capitalize on incoming populations?*

The 08 plan says yes — incoming residents go to *any* region with happiness ≥ floor, including those mayored by other players. This is intentional: it rewards keeping your region happy, even if you're not the population's source. Counter-argument: it may feel unfair if the destination is randomly your worst rival. Mitigation: open the `MANAGE` modal so a current Mayor can pre-empt by raising/lowering tax rate before the next end-of-turn step.

Outstanding: should the migrating player at least see *which* destination got the residents? v1: yes (notification names the region and its mayor).

## 19.3 Endgame property auctions

> *How will properties and businesses handle endgame scenarios (e.g., auctions for final properties)?*

Two related sub-questions:

- **Bankruptcy auctions.** v1 routes bankrupted properties back to the bank at `bankBuybackRate × improvedValue` (see 5.7). This is simpler than a multi-bidder auction and avoids an extra UI flow. Add bidding only if playtests find the bank-buyback feels flat.
- **End-of-game tie scenarios.** When two players cross a money/value threshold on the same end-of-turn, the active player wins (see 15.1). Document this clearly in the game-over screen.

## 19.4 Hot-seat trade UX

> Trading in hot-seat games means physically passing input. How tolerable is this?

Options to make it less awkward:

- Auto-pause game music and dim the screen when waiting for the responder.
- Display a giant "Player B's turn to respond" overlay that the active player can press a key to dismiss.
- Bake in a mock "AI auto-decline" toggle for solo testing.

v1: ship the giant overlay; AI is post-v1.

## 19.5 Resource cell auto-yield vs. business-only

When a player owns a `forest` cell but builds no `lumber_mill`, should they still passively get +1 wood per turn?

- **A.** Yes — owning the cell is enough; business amplifies the yield. Encourages claiming resource cells early.
- **B.** No — must build the business. Encourages investment.

Recommendation: A, with a small base yield (`cfg.resource.passiveYield = 1`). Scales with tier so high-tier resource cells produce 2–3 even without a business.

## 19.6 Sabotage attribution

> Should the sabotaged player learn who attacked?

`cfg.sabotage.revealAttacker` defaults to `false`. Designer-tunable. Hidden attribution adds cold-war style paranoia; revealed attribution invites direct retaliation. Both are valid for different scenarios.

## 19.7 Multiple companies, one region

Can a player own two companies that both hold properties in the same region? The 07 plan allows `Reassign` only inside one region — but doesn't prohibit creating a second company in the same region from scratch. Effect: bonus stacking via two specialised companies in one region. Decision deferred — start permissive and tune if it breaks balance.

## 19.8 Bot players (AI) priority

Out of v1, but flagged so we don't paint it into a corner:

- AI should access only public information (board, prices, public events) plus its own private state.
- AI decisions plug in via a strategy interface on `Player` (`makeTurnDecision()`, `respondToTrade(proposal)`). Adding AI later requires no change to the systems.

## 19.9 Save format compatibility

If `cfg.businesses.catalog` changes between save versions (a business is renamed or removed), how does load behave?

- v1 plan: load fails loudly with a migration message. We do not silently mutate save data.

## 19.10 Camera + larger maps

The current canvas is 1024×576. Maps larger than that need a camera — the framework has `Camera.js`. Mid-implementation question: when does the camera start scrolling vs. zooming-out to fit? Default proposal: try-fit with `maxZoomOut = 0.6×`; below that, scroll-follow.
