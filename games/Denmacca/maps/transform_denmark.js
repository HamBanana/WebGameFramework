// One-time transformation script for denmark.json:
//  • Re-divides the 5 Danish regions into ~25 municipality-sized districts.
//  • Converts well-placed property cells into resource cells (forest, farm,
//    oil_rig, well, power_plant, mine) based on real Danish geography.
//  • Adds extra markets in major cities and additional chance cells.
//
// Run from games/Acca/maps/:  node transform_denmark.js

const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'denmark.json');
const DST = SRC;

const map = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// ── Municipality anchors (name, color, specialty, anchor x/y) ──────────────
// Anchor coords picked from existing labelled major cities in the map.
const MUNICIPALITIES = [
  // Capital area
  { id: 0,  name: 'København',       color: '#e74c3c', specialty: 'electricity', x: 4480, y: 3712 },
  { id: 1,  name: 'Gentofte',        color: '#ec7063', specialty: 'food',        x: 4416, y: 3520 },
  { id: 2,  name: 'Helsingør',       color: '#f1948a', specialty: 'water',       x: 4544, y: 3072 },
  { id: 3,  name: 'Hillerød',        color: '#f5b7b1', specialty: 'wood',        x: 4224, y: 3264 },
  { id: 4,  name: 'Frederikssund',   color: '#fadbd8', specialty: 'food',        x: 3968, y: 3456 },
  { id: 5,  name: 'Bornholm',        color: '#8e44ad', specialty: 'coal',        x: 6700, y: 4600 },

  // Sjælland
  { id: 6,  name: 'Roskilde',        color: '#3498db', specialty: 'electricity', x: 3968, y: 3776 },
  { id: 7,  name: 'Køge',            color: '#5dade2', specialty: 'food',        x: 4096, y: 4096 },
  { id: 8,  name: 'Næstved',         color: '#2980b9', specialty: 'food',        x: 3712, y: 4544 },
  { id: 9,  name: 'Slagelse',        color: '#1abc9c', specialty: 'food',        x: 3264, y: 4224 },
  { id: 10, name: 'Holbæk',          color: '#48c9b0', specialty: 'water',       x: 3648, y: 3648 },
  { id: 11, name: 'Kalundborg',      color: '#16a085', specialty: 'oil',         x: 3008, y: 3712 },
  { id: 12, name: 'Vordingborg',     color: '#76d7c4', specialty: 'food',        x: 3840, y: 4928 },
  { id: 13, name: 'Lolland-Falster', color: '#9b59b6', specialty: 'food',        x: 3456, y: 5312 },

  // Funen
  { id: 14, name: 'Odense',          color: '#e67e22', specialty: 'food',        x: 2304, y: 4224 },
  { id: 15, name: 'Svendborg',       color: '#d35400', specialty: 'food',        x: 2560, y: 4800 },
  { id: 16, name: 'Middelfart',      color: '#dc7633', specialty: 'food',        x: 1856, y: 4100 },
  { id: 17, name: 'Nyborg',          color: '#eb984e', specialty: 'food',        x: 2688, y: 4352 },

  // Southern Jutland
  { id: 18, name: 'Esbjerg',         color: '#f1c40f', specialty: 'oil',         x: 384,  y: 4096 },
  { id: 19, name: 'Sønderborg',      color: '#d4ac0d', specialty: 'wood',        x: 1728, y: 5120 },
  { id: 20, name: 'Tønder',          color: '#b7950b', specialty: 'food',        x: 832,  y: 5056 },
  { id: 21, name: 'Kolding',         color: '#7d6608', specialty: 'wood',        x: 1408, y: 4096 },
  { id: 22, name: 'Vejle',           color: '#a04000', specialty: 'wood',        x: 1472, y: 3712 },

  // Eastern Jutland
  { id: 23, name: 'Horsens',         color: '#cb4335', specialty: 'food',        x: 1792, y: 3392 },
  { id: 24, name: 'Aarhus',          color: '#27ae60', specialty: 'electricity', x: 2112, y: 2880 },
  { id: 25, name: 'Silkeborg',       color: '#229954', specialty: 'wood',        x: 1472, y: 2880 },
  { id: 26, name: 'Skanderborg',     color: '#52be80', specialty: 'wood',        x: 1856, y: 3072 },
  { id: 27, name: 'Randers',         color: '#82e0aa', specialty: 'food',        x: 1984, y: 2368 },
  { id: 28, name: 'Norddjurs',       color: '#a9dfbf', specialty: 'food',        x: 2816, y: 2432 },

  // Western Jutland
  { id: 29, name: 'Herning',         color: '#aab7b8', specialty: 'electricity', x: 896,  y: 2944 },
  { id: 30, name: 'Holstebro',       color: '#85929e', specialty: 'food',        x: 576,  y: 2496 },
  { id: 31, name: 'Ringkøbing',      color: '#5d6d7e', specialty: 'electricity', x: 192,  y: 3008 },

  // Central Jutland
  { id: 32, name: 'Viborg',          color: '#7dcea0', specialty: 'food',        x: 1344, y: 2368 },
  { id: 33, name: 'Skive',           color: '#abebc6', specialty: 'food',        x: 960,  y: 2176 },

  // Northern Jutland
  { id: 34, name: 'Aalborg',         color: '#3498db', specialty: 'electricity', x: 1856, y: 1280 },
  { id: 35, name: 'Hjørring',        color: '#85c1e9', specialty: 'water',       x: 1920, y: 576  },
  { id: 36, name: 'Frederikshavn',   color: '#5499c7', specialty: 'food',        x: 2496, y: 576  },
  { id: 37, name: 'Thisted',         color: '#a9cce3', specialty: 'electricity', x: 640,  y: 1472 },
  { id: 38, name: 'Mariagerfjord',   color: '#7fb3d5', specialty: 'steel',       x: 1728, y: 2048 },
  { id: 39, name: 'Jammerbugt',      color: '#aed6f1', specialty: 'food',        x: 1472, y: 1216 },
  { id: 40, name: 'Rebild',          color: '#5dade2', specialty: 'wood',        x: 1856, y: 1664 },
  { id: 41, name: 'Vesthimmerland',  color: '#85c1e9', specialty: 'food',        x: 1280, y: 1792 },
];

// ── Cluster cells to nearest anchor ────────────────────────────────────────
function nearestMunicipality(x, y) {
  let best = MUNICIPALITIES[0], bd = Infinity;
  for (const m of MUNICIPALITIES) {
    const dx = m.x - x, dy = m.y - y;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

map.cells.forEach(cell => {
  const m = nearestMunicipality(cell.x, cell.y);
  cell.districtId = m.id;
  cell.district   = m.name;
});

// ── Resource conversion rules ──────────────────────────────────────────────
// Each rule: predicate(cell) → new type (+ optional subType). Applied in order;
// first match wins. Only converts cells currently typed as 'property'.

function isCoastalWest(c)   { return c.x < 384;  }                              // North Sea coast
function isCoastalNorth(c)  { return c.y < 576;  }                              // Skagerrak coast
function isBornholm(c)      { return c.x > 6000; }                              // Bornholm island
function isLolland(c)       { return c.y > 5100 && c.x > 2900 && c.x < 4100; }  // Lolland-Falster
function isLimfjord(c)      { return c.y >= 1200 && c.y <= 2000 && c.x < 1600; }
function isSilkeborgLakes(c){ return c.x >= 1300 && c.x <= 1900 && c.y >= 2700 && c.y <= 3100; }
function isHilleroedForest(c){ return c.x >= 4000 && c.x <= 4400 && c.y >= 3100 && c.y <= 3400; }
function isRebildForest(c)  { return c.x >= 1700 && c.x <= 2050 && c.y >= 1500 && c.y <= 1850; }
function isHerningPlains(c) { return c.x >= 700  && c.x <= 1200 && c.y >= 2700 && c.y <= 3300; }
function isMariagerLime(c)  { return c.x >= 1600 && c.x <= 1900 && c.y >= 1900 && c.y <= 2150; }
function isFunenFarms(c)    { return c.x >= 1900 && c.x <= 2400 && c.y >= 4350 && c.y <= 4800; }
function isToenderFarms(c)  { return c.x >= 600  && c.x <= 1100 && c.y >= 4900 && c.y <= 5200; }
function isWestCoastWind(c) { return c.x < 600 && c.y >= 2500 && c.y <= 3500; }

// Deterministic pseudo-random — keyed on cell id so re-runs give same map.
function prand(seed) {
  let h = seed * 2654435761 >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 1597334677); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

let counts = { forest: 0, farm: 0, oil_rig: 0, well: 0, power_plant: 0, mine: 0, market: 0, chance: 0 };

// Pick which property cells become which resource type. Probability gates make
// the conversions feel like "scattered features," not solid bands.
map.cells.forEach(cell => {
  if (cell.type !== 'property') return;
  const r = prand(cell.id);

  // Bornholm: granite + a sprinkle of forest.
  if (isBornholm(cell)) {
    if (r < 0.30) { cell.type = 'mine';   cell.subType = 'iron'; counts.mine++;   return; }
    if (r < 0.55) { cell.type = 'forest'; counts.forest++; return; }
    return;
  }

  // North Sea oil & wind, west Jutland.
  if (isCoastalWest(cell)) {
    if (r < 0.45) { cell.type = 'oil_rig'; counts.oil_rig++; return; }
    if (r < 0.70) { cell.type = 'power_plant'; counts.power_plant++; return; }
    return;
  }

  // West coast wind farms (Ringkøbing-Skjern).
  if (isWestCoastWind(cell)) {
    if (r < 0.45) { cell.type = 'power_plant'; counts.power_plant++; return; }
    return;
  }

  // Skagerrak / north coast — fishing communities (food yield via farm sprite).
  if (isCoastalNorth(cell)) {
    if (r < 0.40) { cell.type = 'farm'; counts.farm++; return; }
    if (r < 0.55) { cell.type = 'well'; counts.well++; return; }
    return;
  }

  // Lolland-Falster — sugar beet / farmland, plus a wind farm.
  if (isLolland(cell)) {
    if (r < 0.55) { cell.type = 'farm'; counts.farm++; return; }
    if (r < 0.70) { cell.type = 'power_plant'; counts.power_plant++; return; }
    return;
  }

  // Tønder — marshland farms.
  if (isToenderFarms(cell)) {
    if (r < 0.55) { cell.type = 'farm'; counts.farm++; return; }
    return;
  }

  // Funen — Denmark's garden.
  if (isFunenFarms(cell)) {
    if (r < 0.40) { cell.type = 'farm'; counts.farm++; return; }
    return;
  }

  // Limfjord — wells & some farms.
  if (isLimfjord(cell)) {
    if (r < 0.30) { cell.type = 'well'; counts.well++; return; }
    if (r < 0.50) { cell.type = 'farm'; counts.farm++; return; }
    return;
  }

  // Silkeborg lake district — the great Danish forests.
  if (isSilkeborgLakes(cell)) {
    if (r < 0.55) { cell.type = 'forest'; counts.forest++; return; }
    if (r < 0.70) { cell.type = 'well';   counts.well++;   return; }
    return;
  }

  // Hillerød — Gribskov forest north of København.
  if (isHilleroedForest(cell)) {
    if (r < 0.45) { cell.type = 'forest'; counts.forest++; return; }
    return;
  }

  // Rebild — Rold Skov, Denmark's largest forest.
  if (isRebildForest(cell)) {
    if (r < 0.55) { cell.type = 'forest'; counts.forest++; return; }
    return;
  }

  // Mariagerfjord — Aalborg Portland limestone (mine for iron/steel proxy).
  if (isMariagerLime(cell)) {
    if (r < 0.35) { cell.type = 'mine'; cell.subType = 'iron'; counts.mine++; return; }
    return;
  }

  // Herning plains — wind farms.
  if (isHerningPlains(cell)) {
    if (r < 0.30) { cell.type = 'power_plant'; counts.power_plant++; return; }
    return;
  }

  // Default: 4% become chance cells distributed across the map.
  if (r > 0.96) { cell.type = 'chance'; cell.subType = undefined; counts.chance++; return; }
});

// ── Add markets in remaining major cities (where label matches) ────────────
const MARKET_CITIES = new Set([
  'Aarhus', 'Århus', 'Aalborg', 'Odense', 'Esbjerg', 'Kolding', 'Vejle',
  'Randers', 'Horsens', 'Helsingør', 'Roskilde', 'Næstved', 'Slagelse',
  'Sønderborg', 'Herning', 'Viborg', 'Holstebro', 'Hjørring', 'Frederikshavn',
  'Rønne', 'Nykøbing F',
]);
map.cells.forEach(cell => {
  if (cell.type === 'bank') return;          // keep capitals
  if (MARKET_CITIES.has(cell.label)) {
    cell.type = 'market';
    cell.subType = undefined;
    counts.market++;
  }
});

// ── Replace districts list ─────────────────────────────────────────────────
const oldDistricts = map.districts;
map.districts = MUNICIPALITIES.map(m => ({
  id              : m.id,
  name            : m.name,
  color           : m.color,
  specialty       : m.specialty,
  basePopulation  : 30,
  defaultTaxRate  : 0.1,
  taxRate         : 0.1,
  cellCount       : map.cells.filter(c => c.districtId === m.id).length,
}));
map.nextDistrictId = MUNICIPALITIES.length;

// ── Save ──────────────────────────────────────────────────────────────────
fs.writeFileSync(DST, JSON.stringify(map, null, 2), 'utf8');
console.log('Done. Conversion counts:', counts);
console.log('Districts:', oldDistricts.length, '→', map.districts.length);
console.log('Sample district populations:',
  map.districts.slice(0, 5).map(d => `${d.name}:${d.cellCount}`).join(', '));
