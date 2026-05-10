// Phase 3 — map variety pass.
// Reduces 'property' cell density by reassigning a deterministic share of
// property cells to more varied types: more chance, banks, markets, and
// resource cells.
//
// Run from games/Acca/maps/:  node transform_variety.js
//
// Targets (572-cell Denmark map):
//   property  447 → ~286   (78% → ~50%)
//   chance     18 → ~53    (+35,  3% → 9%)
//   bank        4 → ~29    (+25,  0.7% → 5%)
//   market     19 → ~34    (+15,  3.3% → 6%)
//   forest     16 → ~34    (+18)
//   farm       18 → ~36    (+18)
//   power_p.   20 → ~35    (+15)
//   well       11 → ~26    (+15)
//   oil_rig    10 → ~20    (+10)
//   mine        7 → ~17    (+10)

const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'denmark.json');
const DST = SRC;

const map = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// Cell-id-keyed deterministic pseudo-random — same cell always converts the
// same way across re-runs. Different from the prand seed in the original
// transform_denmark.js so the two passes don't collide.
function prand(seed) {
  let h = (seed + 17) * 2654435761 >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 1597334677); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Conversion targets — keyed in the order they're tested. First-match wins,
// so list rare/specific types first and common types last. Each entry's
// `chance` is the fraction of property cells routed into that type.
const TARGETS = [
  // Chance cells — 8% of property → chance (0.08 × 447 ≈ 36)
  { type: 'chance',      subType: undefined, chance: 0.08 },
  // Bank cells — 6% of property → bank (0.06 × 447 ≈ 27)
  { type: 'bank',        subType: undefined, chance: 0.06 },
  // Market cells — 4% of property → market
  { type: 'market',      subType: undefined, chance: 0.04 },
  // Resource cells — geographically biased below; 0.10 fallback share total.
];

// Geographic biases for resources — predicate(cell) → resource type.
// Returns null if the cell is in no biased zone. Density is moderated by the
// caller via prand thresholds.
function geoBias(cell) {
  // Coastal / island biases
  if (cell.x > 6000) return prand(cell.id + 1) < 0.5 ? 'mine_iron' : 'forest';
  if (cell.x < 384)  return prand(cell.id + 2) < 0.6 ? 'oil_rig' : 'power_plant';
  if (cell.y < 600)  return prand(cell.id + 3) < 0.5 ? 'farm'    : 'well';
  if (cell.y > 5100 && cell.x > 2900 && cell.x < 4100)
                     return prand(cell.id + 4) < 0.6 ? 'farm' : 'power_plant';
  // Forested zones (Silkeborg lake district, Rebild, Hillerød)
  if ((cell.x >= 1300 && cell.x <= 1900 && cell.y >= 2700 && cell.y <= 3100) ||
      (cell.x >= 1700 && cell.x <= 2050 && cell.y >= 1500 && cell.y <= 1850) ||
      (cell.x >= 4000 && cell.x <= 4400 && cell.y >= 3100 && cell.y <= 3400)) {
    return prand(cell.id + 5) < 0.5 ? 'forest' : 'well';
  }
  // Limfjord wells
  if (cell.y >= 1200 && cell.y <= 2000 && cell.x < 1600) {
    return prand(cell.id + 6) < 0.4 ? 'well' : null;
  }
  // Mariagerfjord limestone (iron mine proxy)
  if (cell.x >= 1600 && cell.x <= 1900 && cell.y >= 1900 && cell.y <= 2150) {
    return prand(cell.id + 7) < 0.4 ? 'mine_iron' : null;
  }
  // Funen / Tønder farms
  if ((cell.x >= 1900 && cell.x <= 2400 && cell.y >= 4350 && cell.y <= 4800) ||
      (cell.x >= 600  && cell.x <= 1100 && cell.y >= 4900 && cell.y <= 5200)) {
    return prand(cell.id + 8) < 0.4 ? 'farm' : null;
  }
  return null;
}

const counts = {};
const incr = k => { counts[k] = (counts[k] || 0) + 1; };

// First pass — fixed-share conversions (chance / bank / market). Use a
// per-cell roll into [0,1) and bucket into the TARGETS list.
const firstPassConverted = new Set();
map.cells.forEach(cell => {
  if (cell.type !== 'property') return;
  const r = prand(cell.id + 100);
  let cum = 0;
  for (const t of TARGETS) {
    cum += t.chance;
    if (r < cum) {
      cell.type = t.type;
      cell.subType = t.subType;
      incr(t.type);
      firstPassConverted.add(cell.id);
      return;
    }
  }
});

// Second pass — geographic-bias resource conversions on still-property cells.
// Only ~30% of biased cells convert (so the bias produces a sprinkle, not a
// solid band).
map.cells.forEach(cell => {
  if (cell.type !== 'property') return;
  if (firstPassConverted.has(cell.id)) return;
  const bias = geoBias(cell);
  if (!bias) return;
  // Apply with a probability so we don't over-fill biased regions.
  if (prand(cell.id + 200) > 0.40) return;

  if (bias === 'mine_iron') {
    cell.type = 'mine';
    cell.subType = 'iron';
    incr('mine');
  } else {
    cell.type = bias;
    cell.subType = undefined;
    incr(bias);
  }
});

// Final tally
const finalDist = {};
map.cells.forEach(c => { finalDist[c.type] = (finalDist[c.type] || 0) + 1; });

fs.writeFileSync(DST, JSON.stringify(map, null, 2), 'utf8');
console.log('Variety pass complete.');
console.log('Conversions made:', counts);
console.log('Final cell distribution:', finalDist);
console.log(`Property cells: ${finalDist.property} / ${map.cells.length} (${Math.round(finalDist.property/map.cells.length*100)}%)`);
