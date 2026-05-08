// games/Acca2/managers/TurnManager.js
// The per-turn sub-state machine plus every menu the player can reach during
// their own turn. Owns turn flow (TURN_START → ROLL → MOVE → LANDING → …) and
// dispatches to StructureManager / DistrictSystem / TradeSystem / MarketSystem
// for the actual side-effects.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class TurnManager {
    constructor(game) {
      this.game     = game;
      this.stage    = null;
      this.player   = null;
      this.die      = game.die;
      this.movement = game.movement;
      this.menu     = game.menu;
      this.events   = game.engine.events;

      this.events.on('move:complete', () => {
        if (this.stage === A.TURN_STAGE.MOVE) this.enter(A.TURN_STAGE.LANDING);
      });

      this.events.on('cell:enter', ({ player, cell, final }) => {
        // Pass-through effects (toll gate)
        if (!final) this.game.structures.passThroughEffect(cell, player);
      });
    }

    startTurn(player) {
      this.player = player;
      this.enter(A.TURN_STAGE.TURN_START);
    }

    enter(stage) {
      this.stage = stage;
      switch (stage) {
        case A.TURN_STAGE.TURN_START:
          this.game.camera.zoomInOnPlayer(this.player);
          this.game.log(`— ${this.player.name}'s turn —`);
          this.game.economy.runStartOfTurn(this.player);
          this._showStartMenu();
          break;

        case A.TURN_STAGE.ROLL: {
          // Honor any chance-event die override on this player.
          let override = null;
          if (this.game.chanceSys) {
            override = this.game.chanceSys.consumeDieOverride(this.player.index);
          }
          if (this.game.sfx) this.game.sfx.roll();
          this.die.roll(this.game.cfg.turn.rollDuration, (value) => {
            if (override) {
              value = override.min + Math.floor(Math.random() * (override.max - override.min + 1));
              this.die.rolledValue = value;
              this.game.log(`Lucky die! Rolled a ${value} (range ${override.min}-${override.max}).`);
            } else {
              this.game.log(`Rolled a ${value}.`);
            }
            this.game.lastRoll = value;
            if (this.game.engine && this.game.engine.events) {
              this.game.engine.events.emit('roll:done', { player: this.player, value });
            }
            this.enter(A.TURN_STAGE.MOVE);
          });
          break;
        }

        case A.TURN_STAGE.MOVE:
          this.movement.begin(this.player, this.game.lastRoll);
          this.game.log(`Move ${this.game.lastRoll} step(s) — use the arrow keys.`);
          break;

        case A.TURN_STAGE.LANDING:
          this._handleLanding();
          break;

        case A.TURN_STAGE.LAND_PROMPT:
          // Menu was shown by the handler; wait for its action.
          break;

        case A.TURN_STAGE.END_TURN:
          this.game.economy.runEndOfTurn(this.player);
          this.game._beginBetweenTurns();
          this.stage = A.TURN_STAGE.BETWEEN;
          break;

        case A.TURN_STAGE.BETWEEN:
          // Held by AccaGame._betweenTurnsTimer; nothing to do here.
          break;
      }
    }

    // ── Start-of-turn menu (horizontal bottom bar) ───────────────────────
    _showStartMenu() {
      const p    = this.player;
      const opts = [
        { label: 'Roll', action: () => this.enter(A.TURN_STAGE.ROLL) },
      ];
      // Promote the Mayor menu to the top level when this player holds any
      // mayoral district — saves two menu transitions for the most-common
      // mid-game action (Festival / Investment grant). When the player only
      // holds one mayoral seat we skip the Mayor list and route straight to
      // the District submenu.
      if (p.districtsMayoredOf && p.districtsMayoredOf.size > 0) {
        opts.push({
          label: `Mayor (${p.districtsMayoredOf.size})`,
          action: () => {
            if (p.districtsMayoredOf.size === 1 && this.game.districtSys) {
              const onlyId = Array.from(p.districtsMayoredOf)[0];
              const d = this.game.districtSys.get(onlyId);
              if (d) { this._showDistrictMenu(d); return; }
            }
            this._showMayorMenu();
          },
        });
      }
      opts.push({ label: 'Manage properties',  action: () => this._showManageMenu() });
      opts.push({ label: 'Sell assets',        action: () => this._showSellAssetsMenu() });
      opts.push({ label: 'Other',              action: () => this._showOtherMenu() });
      this.menu.show(`${p.name}  •  $${p.money}`, opts, null, { layout: 'horizontal' });
    }

    // ── Other submenu ─────────────────────────────────────────────────────
    _showOtherMenu() {
      const p    = this.player;
      const game = this.game;
      const opts = [];
      if (game.cfg.mode !== 'cooperative' && game.players.length > 1) {
        opts.push({ label: 'Trade / Hostile actions', action: () => this._showTradeRootMenu() });
      }
      opts.push({ label: 'Save game', action: () => {
        if (GF.Acca && GF.Acca.Save) {
          if (GF.Acca.Save.save(game)) game.log('Game saved.');
          else game.log('Save failed.');
        }
        this._showOtherMenu();
      } });
      const hasSave = !!(GF.Acca && GF.Acca.Save && GF.Acca.Save.exists());
      opts.push({
        label: hasSave ? 'Load game' : 'Load game  — no save slot',
        _disabled: !hasSave,
        action: () => {
          if (!hasSave) { this._showOtherMenu(); return; }
          if (GF.Acca.Save.load(game)) {
            game.log('Game loaded.');
            this.player = game.currentPlayer;
            this._showStartMenu();
          } else {
            game.log('Load failed.');
            this._showOtherMenu();
          }
        },
      });
      // Fast-roll toggle — persisted in localStorage. Default off (1.4s) for
      // first-time players who need the dice-rolling visual feedback; once
      // toggled, the value sticks across sessions.
      const fast = (function () {
        try { return localStorage.getItem('acca_fast_roll') === '1'; } catch (e) { return false; }
      })();
      opts.push({
        label: fast ? 'Fast rolls: ON  (0.4s)' : 'Fast rolls: off  (1.4s)',
        action: () => {
          const next = !fast;
          try { localStorage.setItem('acca_fast_roll', next ? '1' : '0'); } catch (e) {}
          game.cfg.turn.rollDuration = next ? 0.4 : 1.4;
          game.log(next ? 'Fast rolls enabled.' : 'Fast rolls disabled.');
          this._showOtherMenu();
        },
      });
      opts.push({ label: 'Game log', action: () => this._showGameLog() });
      opts.push({ label: 'Pass turn', action: () => this.enter(A.TURN_STAGE.END_TURN) });
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
      this.menu.show('Other', opts, `${p.name}  •  $${p.money}`, { layout: 'horizontal' });
    }

    // ── Sell assets submenu — sells RESOURCES at the spot market price.
    // (Structure sales live under Manage → Properties → [pick] → Sell.)
    _showSellAssetsMenu() {
      const p    = this.player;
      const game = this.game;
      const back = () => this._showStartMenu();
      const M    = game.marketSys;

      if (!M) {
        this.menu.show('Sell assets', [
          { label: '(market unavailable)', action: back },
        ]);
        return;
      }

      const resources = (game.cfg.market.resources || [])
        .filter(r => (p.resources[r] || 0) > 0);

      if (resources.length === 0) {
        this.menu.show('Sell assets', [
          { label: '(no resources to sell)', action: back },
        ], 'You hold no tradeable resources.', { layout: 'horizontal' });
        return;
      }

      const opts = resources.map(r => ({
        label: `${r} ×${p.resources[r]}  @ $${M.sellPriceOf(r)} ea`,
        action: () => this._showSellResource(r),
      }));
      opts.push({ label: 'Back', action: back });
      this.menu.show('Sell assets', opts,
        `Cash $${p.money}  ·  Spot prices follow market stock`,
        { layout: 'horizontal' });
    }

    /** Per-resource sell quantity sub-menu (1, 5, all). */
    _showSellResource(resource) {
      const p    = this.player;
      const game = this.game;
      const M    = game.marketSys;
      const have = p.resources[resource] || 0;
      const price = M.sellPriceOf(resource);

      const opts = [];
      const tryQty = (qty, label) => {
        if (qty > have) return;
        opts.push({
          label: `${label} (+$${qty * price})`,
          action: () => {
            const r = M.sell(p, resource, qty);
            if (!r.ok) game.log(`Sell refused: ${r.reason}.`);
            this._showSellAssetsMenu();
          },
        });
      };
      tryQty(1, 'Sell 1');
      tryQty(5, 'Sell 5');
      if (have > 0 && have !== 1 && have !== 5) {
        tryQty(have, `Sell all ${have}`);
      }
      opts.push({ label: 'Back', action: () => this._showSellAssetsMenu() });
      this.menu.show(`Sell ${resource}`, opts,
        `Have ${have}  ·  Sell price $${price} ea`, { layout: 'horizontal' });
    }

    /** Paginated game-log viewer. Shows 14 entries per page in reverse
     *  chronological order (newest first), with prev/next/close. Entries are
     *  {turn,msg,count} objects (or legacy strings); the page header shows the
     *  turn span of the visible slice. */
    _showGameLog() {
      const game = this.game;
      const all  = (game.eventLog || []);

      const fmt = (e) => {
        if (typeof e === 'string') return { line: e, turn: null };
        const txt = e.count > 1 ? `${e.msg} (×${e.count})` : e.msg;
        return { line: txt, turn: e.turn };
      };

      // Group consecutive entries that share the same turn into one heading
      // followed by sub-bullets (matches the user's request: "one log entry
      // per action" with breakdown lines). Headings are disabled rows so
      // confirm slides past them without firing an action; entries themselves
      // are no-op rows the user can highlight without exiting the log.
      const opts = [];
      let lastTurn = null;
      const noop = () => this._showGameLog();
      all.forEach(entry => {
        const f = fmt(entry);
        const text = f.line.length > 56 ? f.line.slice(0, 53) + '…' : f.line;
        if (f.turn != null && f.turn !== lastTurn) {
          opts.push({ label: `── Turn ${f.turn} ──`, action: noop, _disabled: true });
          lastTurn = f.turn;
        }
        opts.push({ label: '  · ' + text, action: noop });
      });
      if (opts.length === 0) {
        opts.push({ label: '(no events yet)', action: () => this._showOtherMenu() });
      }
      opts.push({ label: 'Back', action: () => this._showOtherMenu() });

      this.menu.show('Game log', opts, `${all.length} entries`,
        { maxVisible: 14 });
      // Open at the bottom — auto-scroll to latest entry like a chat window.
      this.menu.index = opts.length - 2 >= 0 ? opts.length - 2 : 0;
      this.menu._adjustScroll();
    }

    // ── Manage submenu ────────────────────────────────────────────────────
    _showManageMenu() {
      const p = this.player;
      const game = this.game;
      const opts = [];
      // Mayor row was promoted to the start menu — no longer duplicated here.
      opts.push({ label: 'Properties: ' + p.ownedStructures.length, action: () => this._showPortfolioMenu() });
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
      this.menu.show('Manage', opts, `Cash $${p.money}  ·  Net $${game.netWorth(p)}`, { layout: 'horizontal' });
    }

    _showMayorMenu() {
      const p = this.player;
      const game = this.game;
      const districts = Array.from(p.districtsMayoredOf).map(id => game.districtSys.get(id)).filter(Boolean);
      const opts = districts.map(d => ({
        label: `${d.id}  pop ${d.population}  hap ${Math.round(d.happiness)}  tax ${Math.round(d.taxRate * 100)}%`,
        action: () => this._showDistrictMenu(d),
      }));
      // Back returns to the start menu — the Mayor row was promoted to top
      // level, so the Manage menu detour was removed.
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
      this.menu.show('Mayor', opts);
    }

    _showDistrictMenu(d) {
      const p = this.player;
      const game = this.game;
      const cfg = game.cfg.district;
      // Decide whether returning Back leads to the Mayor list or the start menu —
      // the start menu's Mayor row routes directly here when the player holds
      // exactly one mayoral seat, so going Back to the Mayor list would
      // introduce a needless click.
      const backToMayorList = p.districtsMayoredOf && p.districtsMayoredOf.size > 1;
      const opts = [
        { label: `Festival ($${cfg.festivalCost})`, action: () => {
          const res = game.districtSys.holdFestival(p, d.id, game.turnCounter);
          game.log(res.ok ? `Festival held in ${d.id}.`
                          : `Festival rejected: ${res.reason}.`);
          this._showDistrictMenu(d);
        } },
        { label: `Investment grant ($${cfg.grantCost} → +${cfg.grantPopulation} pop)`, action: () => {
          const res = game.districtSys.investmentGrant(p, d.id, game.turnCounter);
          game.log(res.ok ? `Grant applied in ${d.id}.`
                          : `Grant rejected: ${res.reason}.`);
          this._showDistrictMenu(d);
        } },
        { label: 'Back', action: () => backToMayorList ? this._showMayorMenu() : this._showStartMenu() },
      ];
      const taxPct = Math.round(d.taxRate * 100);
      this.menu.show(`District: ${d.id}`, opts,
        `Pop ${d.population} · Happiness ${Math.round(d.happiness)} · Tax ${taxPct}% (grows with district value) · Specialty: ${d.specialty || 'none'}`);
    }

    _showPortfolioMenu() {
      const p = this.player;
      const game = this.game;
      const back = () => { game.camera.clearSpotlight(); this._showManageMenu(); };
      const opts = p.ownedStructures.map((s) => ({
        label: `${s.cell.district} · ${this._typeLabel(s.type)} · $${s.currentValue}` +
               ` · cell ${s.cell.id}` +
               (s.sabotagedUntilTurn > game.turnCounter ? ' (sabotaged)' : ''),
        meta: { cell: s.cell, structure: s },
        // Confirming a row opens the standard owner-options menu for that
        // structure (Invest / Renovate / Deposit / Upgrade / Collect tolls / …)
        // — the same menu shown when landing on the cell in person, but
        // without ending the turn after the action.
        action: () => this._showPortfolioStructure(s),
      }));
      if (opts.length === 0) opts.push({ label: '(no structures)', action: back });
      opts.push({ label: 'Back', action: back });
      this.menu.show('Your structures', opts,
        'Confirm a property to manage it; arrows to spotlight on the board.', {
        onIndexChange: (opt) => {
          if (opt && opt.meta && opt.meta.cell) {
            game.camera.spotlightOnCell(opt.meta.cell);
          } else {
            game.camera.clearSpotlight();
          }
        },
        onCancel: back,
      });
    }

    /** Inline owner-options menu for a structure managed from the portfolio.
     *  Reuses StructureManager.ownerOptionsFor so the action surface is
     *  identical to landing on the cell — the only difference is that the
     *  done-callback returns to the portfolio list rather than ending the
     *  turn (which would be punitive for the player just browsing). */
    _showPortfolioStructure(structure) {
      const game = this.game;
      const p    = this.player;
      const onDone = () => this._showPortfolioMenu();
      const opts = game.structures.ownerOptionsFor(structure, p, onDone);

      // Sell-this-structure action — moved out of the old "Sell assets"
      // catch-all so structure sales live alongside the rest of the
      // per-property management (Invest / Renovate / Deposit / …).
      const salePrice = Math.round(structure.currentValue * 0.5);
      opts.push({
        label: `Sell for $${salePrice}  (50% of value)`,
        action: () => {
          p.addMoney(salePrice, `Sold ${this._typeLabel(structure.type)} in ${structure.cell.district}`);
          const idx = p.ownedStructures.indexOf(structure);
          if (idx !== -1) p.ownedStructures.splice(idx, 1);
          const cell = structure.cell;
          cell.structure = null;
          cell.sprite    = null;
          cell.animator  = null;
          if (game.districtSys && cell.district) game.districtSys.recomputeMayor(cell.district);
          game.engine.events.emit('property:sold', { structure, ownerIndex: p.index });
          this._showPortfolioMenu();
        },
      });

      // Replace the implicit Continue at the tail with explicit Back so the
      // origin (portfolio) is unambiguous.
      const continueIdx = opts.findIndex(o => o.label === 'Continue');
      if (continueIdx !== -1) opts.splice(continueIdx, 1);
      opts.push({ label: 'Back', action: onDone });

      const subtitle = `Cell ${structure.cell.id} · ${structure.cell.district || '—'}` +
        ` · Value $${structure.currentValue}` +
        (structure.sabotagedUntilTurn > game.turnCounter ? '  (sabotaged)' : '');
      this.menu.show(`Your ${this._typeLabel(structure.type)}`, opts, subtitle);
      game.camera.spotlightOnCell(structure.cell);
    }

    // ── Trade / Hostile root ──────────────────────────────────────────────
    // Hostile takeover is only available by *landing* on a property
    // (handled in _offerTakeoverOnLand) — not from this menu.
    _showTradeRootMenu() {
      const opts = [
        { label: 'Trade with player',     action: () => this._showTradeTargetMenu() },
        { label: 'Sabotage a structure',  action: () => this._showSabotageTargetMenu() },
        { label: 'Back',                  action: () => this._showOtherMenu() },
      ];
      this.menu.show('Trade / Hostile', opts);
    }

    _otherPlayers() {
      return this.game.players.filter(p => p !== this.player && !p.isBankrupt);
    }

    _showTradeTargetMenu() {
      const opts = this._otherPlayers().map(p => ({
        label: `${p.name}  ($${p.money}, ${p.ownedStructures.length} structures)`,
        action: () => this._showTradeWith(p),
      }));
      opts.push({ label: 'Back', action: () => this._showTradeRootMenu() });
      this.menu.show('Trade target', opts);
    }

    _showTradeWith(target) {
      // Stateful builder — replaces the four hard-coded presets with a
      // two-pane Offer/Request constructor. Each row's action cycles the
      // amount through fixed tiers (0 → small → medium → large → 0). The
      // proposal is held on `this._tradeDraft` so deltas survive sub-menu
      // re-shows.
      this._showTradeBuilder(target);
    }

    /** Cycle a value through tiers; returns the next tier (wraps). */
    _cycleTier(current, tiers) {
      const idx = tiers.indexOf(current);
      if (idx < 0) return tiers[0];
      return tiers[(idx + 1) % tiers.length];
    }

    /** Estimate the cash-equivalent value of one side of a trade. Mirrors
     *  TradeSystem._estimateValue but is computed locally so the builder can
     *  surface running totals without a round-trip. */
    _estimateSide(side) {
      const game = this.game;
      const prices = (game.cfg.market && game.cfg.market.basePrices) || {};
      let v = side.money || 0;
      Object.entries(side.resources || {}).forEach(([r, q]) => {
        v += (prices[r] || 0) * q;
      });
      return Math.round(v);
    }

    _resetTradeDraft(target) {
      const me = this.player;
      this._tradeDraft = {
        target: target,
        give:    { money: 0, resources: {} },
        receive: { money: 0, resources: {} },
      };
      // Initialise resource keys to 0 so cycleTier sees a known starting point.
      const resCfg = (this.game.cfg.market && this.game.cfg.market.resources) || [];
      resCfg.forEach(r => {
        this._tradeDraft.give.resources[r] = 0;
        this._tradeDraft.receive.resources[r] = 0;
      });
      // Mark the target — used to invalidate the draft if the player picks
      // a different opponent later.
      this._tradeDraft.targetIndex = target.index;
      void me;
    }

    _showTradeBuilder(target) {
      const game = this.game;
      const me   = this.player;
      if (!this._tradeDraft || !this._tradeDraft.target
          || this._tradeDraft.targetIndex !== target.index) {
        this._resetTradeDraft(target);
      }
      const draft = this._tradeDraft;
      const resCfg = (game.cfg.market && game.cfg.market.resources) || [];

      // Cash tiers — coarse fixed steps ending at the player's full balance.
      // Resource tiers — every integer 0..max so the user can hit any
      // specific quantity (Planning §G.2 "selecting specific values must
      // be possible"). Capped at 20 to keep menus friendly; for piles
      // bigger than 20, the cycle still hits 0/1/2/.../20 and `max`.
      const buildCashTiers = (max) => {
        const t = [0, 50, 100, 250, 500];
        const out = t.filter(v => v <= max + 0.001);
        if (max > 0 && !out.includes(max)) out.push(max);
        return out;
      };
      const cashTiersGive    = buildCashTiers(me.money);
      const cashTiersReceive = buildCashTiers(target.money);
      const resTiers = (max) => {
        if (max <= 0) return [0];
        const out = [];
        const ceiling = Math.min(20, max);
        for (let i = 0; i <= ceiling; i++) out.push(i);
        if (max > ceiling) out.push(max);
        return out;
      };

      const opts = [];

      // Offer cash row
      opts.push({
        label: `Offer cash: $${draft.give.money}   (Enter cycles)`,
        action: () => {
          draft.give.money = this._cycleTier(draft.give.money, cashTiersGive);
          this._showTradeBuilder(target);
        },
      });
      // Offer resources
      resCfg.forEach(r => {
        const have = me.resources[r] || 0;
        const cur  = draft.give.resources[r] || 0;
        opts.push({
          label: `Offer ${r}: ${cur} / ${have}`,
          _disabled: have === 0 && cur === 0,
          action: () => {
            const tiers = resTiers(have);
            draft.give.resources[r] = this._cycleTier(cur, tiers);
            this._showTradeBuilder(target);
          },
        });
      });

      // Request cash
      opts.push({
        label: `Request cash: $${draft.receive.money}   (Enter cycles)`,
        action: () => {
          draft.receive.money = this._cycleTier(draft.receive.money, cashTiersReceive);
          this._showTradeBuilder(target);
        },
      });
      // Request resources
      resCfg.forEach(r => {
        const has = target.resources[r] || 0;
        const cur = draft.receive.resources[r] || 0;
        opts.push({
          label: `Request ${r}: ${cur} / ${has}`,
          _disabled: has === 0 && cur === 0,
          action: () => {
            const tiers = resTiers(has);
            draft.receive.resources[r] = this._cycleTier(cur, tiers);
            this._showTradeBuilder(target);
          },
        });
      });

      // Build the proposal in the canonical shape and use TradeSystem's
      // own previewTrade so the builder's allow/reason exactly matches what
      // executeTrade would do. Avoids drift between local approximation and
      // the system's actual validation.
      const proposal = {
        give:    { money: draft.give.money,    resources: this._compactBag(draft.give.resources) },
        receive: { money: draft.receive.money, resources: this._compactBag(draft.receive.resources) },
      };
      const preview = game.tradeSys.previewTrade(this.player, target, proposal);
      const giveVal = preview.valA != null ? preview.valA : this._estimateSide(draft.give);
      const recvVal = preview.valB != null ? preview.valB : this._estimateSide(draft.receive);

      opts.push({
        label: preview.ok
          ? `Propose trade   (~$${giveVal} → ~$${recvVal})`
          : `Cannot propose — ${preview.reason}`,
        _disabled: !preview.ok,
        action: () => {
          const r = game.tradeSys.executeTrade(this.player, target, proposal);
          if (r.ok) {
            game.log(`Trade with ${target.name} completed (~$${giveVal} ↔ ~$${recvVal}).`);
          } else {
            game.log(`Trade refused: ${r.reason}.`);
          }
          this._tradeDraft = null;
          this._showStartMenu();
        },
      });
      opts.push({
        label: 'Reset proposal',
        action: () => { this._resetTradeDraft(target); this._showTradeBuilder(target); },
      });
      opts.push({
        label: 'Back',
        action: () => { this._tradeDraft = null; this._showTradeTargetMenu(); },
      });

      // Imbalance ratio bar — visual indication of how lopsided the trade
      // currently is, with the limit marker. Helps the player tune the
      // proposal to a balanced state without trial-and-error.
      const limit = (game.cfg.trade && game.cfg.trade.maxImbalanceRatio) || 5;
      const ratio = (preview && preview.imbalance != null)
        ? preview.imbalance
        : ((giveVal > 0 && recvVal > 0) ? Math.max(giveVal, recvVal) / Math.min(giveVal, recvVal) : 1);
      const segs = 10;
      const fill = Math.min(segs, Math.round((ratio / limit) * segs));
      const limitSeg = segs;
      const bar = Array.from({ length: segs }, (_, i) => {
        if (i < fill) return '█';
        if (i === limitSeg - 1) return '▏';
        return '░';
      }).join('');
      const ratioStr = ratio === 1 && (giveVal === 0 || recvVal === 0)
        ? '—'
        : ratio.toFixed(1) + '×';
      this.menu.show(`Trade with ${target.name}`, opts,
        `You ~$${giveVal} ↔ ${target.name} ~$${recvVal}  ·  imbalance [${bar}] ${ratioStr} (max ${limit}×)`);
    }

    /** Drop zero entries from a resource bag so the proposal validates cleanly
     *  in TradeSystem (which iterates own keys). */
    _compactBag(bag) {
      const out = {};
      Object.entries(bag || {}).forEach(([k, v]) => { if (v > 0) out[k] = v; });
      return out;
    }

    _showSabotageTargetMenu() {
      const game = this.game;
      const cfg  = game.cfg.sabotage;
      const others = this._otherPlayers();
      const candidates = [];
      others.forEach(p => p.ownedStructures.forEach(s => candidates.push({ p, s })));
      if (candidates.length === 0) {
        this.menu.show('Sabotage', [{ label: '(no targets)', action: () => this._showTradeRootMenu() }]);
        return;
      }
      const opts = candidates.map(({ p, s }) => ({
        label: `${s.cell.district}/${this._typeLabel(s.type)} · ${p.name}`,
        action: () => {
          const r = game.tradeSys.sabotage(this.player, s, game.players, game.turnCounter);
          game.log(r.ok ? `Sabotage placed for ${cfg.duration} turns.`
                        : `Sabotage refused: ${r.reason}.`);
          this._showStartMenu();
        },
      }));
      opts.push({ label: 'Back', action: () => this._showTradeRootMenu() });
      this.menu.show(`Sabotage  ($${cfg.cost} + ${cfg.oilCost} oil)`, opts);
    }

    // ── Market modal ──────────────────────────────────────────────────────
    _showMarketMenu() {
      const game = this.game;
      const p    = this.player;
      const M    = game.marketSys;
      if (!M) { this._showStartMenu(); return; }
      const opts = game.cfg.market.resources.map(r => {
        const stock = (M.stock && M.stock[r] != null) ? M.stock[r] : '?';
        return {
          label: `${r}  $${M.priceOf(r)} ea  (pool: ${stock} · you: ${p.resources[r] || 0})`,
          action: () => this._showMarketResource(r),
        };
      });
      opts.push({ label: 'Done', action: () => this.enter(A.TURN_STAGE.END_TURN) });
      this.menu.show('Market', opts, `Cash $${p.money}`);
    }

    _showMarketResource(resource) {
      const game = this.game;
      const p    = this.player;
      const M    = game.marketSys;
      const opts = [
        { label: `Buy 1`, action: () => {
          const r = M.buy(p, resource, 1);
          game.log(r.ok ? `+1 ${resource} for $${r.totalCost}.` : `Buy refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: `Buy 5`, action: () => {
          const r = M.buy(p, resource, 5);
          game.log(r.ok ? `+5 ${resource} for $${r.totalCost}.` : `Buy refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: `Sell 1`, action: () => {
          const r = M.sell(p, resource, 1);
          game.log(r.ok ? `-1 ${resource} for $${r.totalProceeds}.` : `Sell refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: `Sell 5`, action: () => {
          const r = M.sell(p, resource, 5);
          game.log(r.ok ? `-5 ${resource} for $${r.totalProceeds}.` : `Sell refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: 'Back', action: () => this._showMarketMenu() },
      ];
      const stock = (M.stock && M.stock[resource] != null) ? M.stock[resource] : '?';
      this.menu.show(`${resource}`, opts,
        `Spot $${M.priceOf(resource)} · Pool ${stock} · Have ${p.resources[resource] || 0}`);
    }

    // ── Landing dispatch ──────────────────────────────────────────────────
    _handleLanding() {
      const cell = this.player.currentCell;
      // "Near-miss": if the landing cell is adjacent to a chance cell and
      // isn't itself a chance cell, fire a low-probability chance event.
      // Keeps the chance pool engaged on small maps where direct chance-cell
      // landings are rare.
      if (cell.type !== 'chance' && this.game.chanceSys) {
        const adj = [cell.up, cell.down, cell.left, cell.right].filter(Boolean);
        const nearChance = adj.some(n => n.type === 'chance');
        const cfg = this.game.cfg.chance || {};
        const nearMissProb = cfg.nearMissProb || 0;
        if (nearChance && Math.random() < nearMissProb) {
          // Near-miss: a chance event fires even though the player didn't
          // land on a chance cell. Log it explicitly so players understand
          // why the cell's normal landing effect was bypassed.
          this.game.log(`Near-miss chance — adjacent to a Chance cell (${Math.round(nearMissProb * 100)}% chance).`);
          this._handleChance();
          return;
        }
      }
      switch (cell.type) {
        case 'bank':
          this.player.addMoney(200, 'Landed on the Bank');
          this.enter(A.TURN_STAGE.END_TURN);
          break;
        case 'chance':
          this._handleChance();
          break;
        case 'buildable':
          this._handleBuildable(cell);
          break;
        case 'power_plant':
          this._grantResource(cell, 'electricity', 3, 'Power Plant');
          break;
        case 'well':
          this._grantResource(cell, 'water', 3, 'Well');
          break;
        case 'mine': {
          // mine.subType ∈ { coal, iron, oil } — iron mines grant steel.
          // Read straight off the live Cell (BoardLoader copies subType from
          // map JSON onto the Cell at load time); the GF.mapData lookup the
          // earlier implementation used was fragile across save/load.
          const sub = cell.subType || 'coal';
          const resource = (sub === 'iron') ? 'steel' : sub;
          this._grantResource(cell, resource, 3, `${sub.charAt(0).toUpperCase()}${sub.slice(1)} Mine`);
          break;
        }
        case 'market':
          // Visiting a market cell shortcuts the player into the market UI.
          this.game.log(`${this.player.name} stops at the Market.`);
          this._showMarketMenu();
          this.stage = A.TURN_STAGE.LAND_PROMPT;
          break;
        case 'structure': {
          // Pre-placed neutral structure (map-defined). If the cell happens
          // to carry a real PlayerStructure (e.g. seeded by a scenario),
          // route through the buildable handler so the standard
          // owner/visitor flows kick in. Otherwise treat as a flavour cell
          // — log the structure type and end the turn safely.
          if (cell.structure) {
            this._handleBuildable(cell);
          } else {
            const label = cell.structureType
              ? this._typeLabel(cell.structureType)
              : 'fixed structure';
            this.game.log(`${this.player.name} stops at a neutral ${label}.`);
            this.enter(A.TURN_STAGE.END_TURN);
          }
          break;
        }
        default:
          this.enter(A.TURN_STAGE.END_TURN);
          break;
      }
    }

    _grantResource(cell, resource, qty, label) {
      const p = this.player;
      p.resources[resource] = (p.resources[resource] || 0) + qty;
      // Resource-cell yield also tops up the global market pool — a small
      // share of what the cell produces ends up "available for trade." The
      // cellMarketShare config (default 0.5) controls how much of the player
      // yield mirrors into the pool. Keeps prices anchored when a popular
      // mine is being mined frequently.
      const game = this.game;
      const share = (game.cfg.market && game.cfg.market.cellMarketShare != null)
        ? game.cfg.market.cellMarketShare
        : 0.5;
      const dump = Math.max(0, Math.round(qty * share));
      if (dump > 0 && game.marketSys && game.marketSys.addStock) {
        game.marketSys.addStock(resource, dump, label);
      }
      game.log(`${p.name} stops at the ${label} (+${qty} ${resource}).`);
      this.enter(A.TURN_STAGE.END_TURN);
    }

    // ── Buildable cells ───────────────────────────────────────────────────
    _handleBuildable(cell) {
      const p = this.player;
      const game = this.game;

      if (!cell.structure) {
        this._showBuildMenu(cell);
        return;
      }

      const s = cell.structure;
      this.stage = A.TURN_STAGE.LAND_PROMPT;

      if (s.ownerIndex === p.index) {
        const opts = game.structures.ownerOptionsFor(s, p,
          () => this.enter(A.TURN_STAGE.END_TURN));
        this.menu.show(`Your ${this._typeLabel(s.type)}`, opts);
      } else {
        // Apply the visit effect (rent / fee), then — provided the player is
        // still on the cell — offer the option to buy from its owner.
        const visitDoneCb = () => {};
        const followUp = game.structures.visitorEffect(s, p, visitDoneCb);
        const present = () => {
          if (p.currentCell !== s.cell) {
            this.enter(A.TURN_STAGE.END_TURN);
            return;
          }
          this._offerTakeoverOnLand(s);
        };
        if (followUp) {
          const wrapped = followUp.map(opt => ({
            label: opt.label,
            action: () => {
              if (opt.action) opt.action();
              present();
            },
          }));
          this.menu.show(`${this._typeLabel(s.type)} (owner: ${game.players[s.ownerIndex].name})`,
            wrapped);
        } else {
          present();
        }
      }
    }

    /** Offer the landing player the option to take over the structure they
     *  just landed on for 5× current value, or to sabotage it (subject to the
     *  usual cost / oil / police-shield / cooldown rules in TradeSystem). */
    _offerTakeoverOnLand(structure) {
      const game  = this.game;
      const p     = this.player;
      const owner = game.players[structure.ownerIndex];
      const cfgSab = game.cfg.sabotage;

      // Takeover row. Sabotaged properties cost a discounted multiplier
      // (`property.takeoverSabotageMultiplier`) so a sabotage opens up a real
      // takeover window rather than a dead row.
      const sabotaged = structure.sabotagedUntilTurn > game.turnCounter;
      const baseMul = game.cfg.property.takeoverMultiplier || 3;
      const sabMul  = (game.cfg.property.takeoverSabotageMultiplier != null)
        ? game.cfg.property.takeoverSabotageMultiplier
        : 1.5;
      const mul = sabotaged ? sabMul : baseMul;
      const cost = Math.round(structure.currentValue * mul);
      const can  = p.money >= cost;
      const mulLabel = sabotaged ? `${sabMul}× value (sabotaged)` : `${baseMul}× value`;
      const takeoverLabel = can
        ? `Buy from ${owner.name}  ($${cost} = ${mulLabel})`
        : `Buy from ${owner.name}  ($${cost} = ${mulLabel})  — need $${cost - p.money}`;

      // Sabotage row — only meaningful in competitive multiplayer; reuse
      // TradeSystem.canSabotage so we get the same affordability/oil/police
      // shield/cooldown checks as the menu-driven sabotage path.
      const sabCheck = (game.cfg.mode !== 'cooperative' && game.tradeSys)
        ? game.tradeSys.canSabotage(p, structure, game.turnCounter)
        : { ok: false, reason: 'unavailable' };
      const sabLabel = sabCheck.ok
        ? `Sabotage  ($${cfgSab.cost} + ${cfgSab.oilCost} oil, ${cfgSab.duration} turns)`
        : `Sabotage — ${sabCheck.reason}`;

      const opts = [
        {
          label: takeoverLabel,
          _disabled: !can,
          action: () => {
            const r = game.tradeSys.takeover(p, structure, game.players, game.turnCounter);
            game.log(r.ok
              ? `${p.name} bought the ${this._typeLabel(structure.type)} from ${owner.name} for $${r.cost}.`
              : `Purchase refused: ${r.reason}.`);
            this.enter(A.TURN_STAGE.END_TURN);
          },
        },
        {
          label: sabLabel,
          _disabled: !sabCheck.ok,
          action: () => {
            const r = game.tradeSys.sabotage(p, structure, game.players, game.turnCounter);
            game.log(r.ok
              ? `${p.name} sabotaged ${owner.name}'s ${this._typeLabel(structure.type)} for ${cfgSab.duration} turns.`
              : `Sabotage refused: ${r.reason}.`);
            this.enter(A.TURN_STAGE.END_TURN);
          },
        },
        { label: 'Continue', action: () => this.enter(A.TURN_STAGE.END_TURN) },
      ];
      this.menu.show(
        `${this._typeLabel(structure.type)} owned by ${owner.name}`,
        opts,
        `Cell ${structure.cell.id}  ·  Value $${structure.currentValue}`
      );
    }

    _showBuildMenu(cell) {
      const p = this.player;
      const game = this.game;
      const cfg = game.cfg.structures;
      this.stage = A.TURN_STAGE.LAND_PROMPT;

      // Sort the catalog by cost ascending so the cheapest builds are at the
      // top. When the player can't afford the cheapest build, show *only* the
      // Skip option (the all-disabled-rows state was the dominant late-game
      // UX path on a small map and required 7 keypresses to clear).
      const sorted = cfg.catalog.slice().sort((a, b) => a.cost - b.cost);
      const cheapest = sorted[0] ? sorted[0].cost : 0;
      const canAffordAnything = sorted.some(e => p.money >= e.cost);

      const opts = [];
      if (canAffordAnything) {
        sorted.forEach(entry => {
          const cashOk = p.money >= entry.cost;
          const missing = game.structures.missingBuildResources(p, entry);
          const can = cashOk && !missing;
          // Preview the visitor rent (or other earning mechanism) so the
          // buy decision isn't blind. Falls back to a sensible per-type
          // hint for structures that don't charge rent.
          const rent = game.structures.expectedVisitorRent(entry.type, entry.cost);
          let hint;
          if (rent > 0) {
            hint = `rent ~$${rent}/visit`;
          } else if (entry.type === 'toll_gate') {
            const init = (cfg.tollInitialRent != null) ? cfg.tollInitialRent : 10;
            hint = `rent $${init}, +$${cfg.tollIncrement}/pass`;
          } else if (entry.type === 'teleporter') {
            hint = `$${cfg.teleportFee}/visitor teleport`;
          } else if (entry.type === 'police_station') {
            hint = `+$${cfg.policeOwnerIncome}/turn, sabotage shield`;
          } else if (entry.type === 'vault') {
            hint = `+$${cfg.vaultOwnerIncome}/turn + 1% interest`;
          } else {
            hint = '';
          }
          // Resource cost suffix — appears alongside the cash cost so the
          // material requirement is visible upfront.
          const resCost = entry.resourceCost
            ? ' + ' + Object.entries(entry.resourceCost).map(([r, q]) => `${q} ${r}`).join(', ')
            : '';
          const cost = `Build ${entry.label} ($${entry.cost}${resCost})`;
          const tail = hint ? ` — ${hint}` : '';
          let reason = '';
          if (!cashOk)       reason = `  — need $${entry.cost - p.money}`;
          else if (missing)  reason = `  — need ${missing.missing} ${missing.res}`;
          opts.push({
            label: can ? `${cost}${tail}` : `${cost}${reason}`,
            _disabled: !can,
            action: () => {
              p.addMoney(-entry.cost, `Built ${entry.label} in ${cell.district}`);
              game.structures.build(cell, entry.type, p.index);
              if (game.districtSys) game.districtSys.recomputeMayor(cell.district);
              this.enter(A.TURN_STAGE.END_TURN);
            },
          });
        });
      }
      opts.push({ label: 'Skip', action: () => this.enter(A.TURN_STAGE.END_TURN) });

      const baseSubtitle = canAffordAnything
        ? `Cash: $${p.money}  ·  Cheapest: $${cheapest}`
        : `Cash: $${p.money}  ·  Cheapest build: $${cheapest}  — can't afford anything yet`;
      // Live tooltip: as the player moves through the catalog, swap the
      // subtitle to show the highlighted entry's longer description. The Skip
      // row falls back to the base context line.
      const descByLabel = new Map();
      sorted.forEach(entry => {
        if (entry.description) descByLabel.set(entry.label, entry.description);
      });
      const onIndexChange = (opt) => {
        if (!opt) return;
        // Match by leading "Build <label>" prefix (the visible label has cost/hint suffixes).
        const m = /^Build\s+([^\s].*?)\s*\(/.exec(opt.label || '');
        const desc = m && descByLabel.get(m[1]);
        this.menu.subtitle = desc || baseSubtitle;
      };
      this.menu.show(`Empty plot in ${cell.district}`, opts, baseSubtitle, { onIndexChange });
    }

    _typeLabel(type) {
      const cfg = this.game.cfg.structures;
      const entry = cfg.catalog.find(c => c.type === type);
      return entry ? entry.label : type;
    }

    _handleChance() {
      const game = this.game;
      const p = this.player;
      let event;
      if (game.chanceSys) {
        event = game.chanceSys.draw(p, game.players);
      } else {
        const pool = (game.cfg.chance && game.cfg.chance.pool) || [];
        event = pool[Math.floor(Math.random() * pool.length)] || { label: 'Nothing', message: 'A quiet day.' };
      }
      game.log(`Chance — ${event.label}: ${event.message}`);
      this.stage = A.TURN_STAGE.LAND_PROMPT;
      this.menu.show(event.label, [
        { label: 'OK', action: () => this.enter(A.TURN_STAGE.END_TURN) },
      ], event.category ? `[${event.category}]` : '');
    }
  }

  A.TurnManager = TurnManager;

})(window.GF = window.GF || {});
