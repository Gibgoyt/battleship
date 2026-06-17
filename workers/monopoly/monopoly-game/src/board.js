// Authoritative tile catalog for the 72-tile hexagonal Monopoly board.
//
// Layout: 6 sides x 12 tiles = 72. Tile 0 of each side is its corner.
// Side index k (0..5) -> tile indices [k*12 .. k*12+11].
//
// Tile shape:
//   { kind: 'corner'    , name, payload }
//   { kind: 'commodity' , name, price, baseRent }       (commodity-group, scales x2 per extra owned)
//   { kind: 'property'  , name, country, price, baseRent }
//   { kind: 'chance' | 'chest' }                         (no-op tile in v1)
//
// This file is mirrored byte-for-byte in semantics by
// src/applications_leptos/monopoly/src/tiles.rs on the client. Keep them in
// sync when adjusting prices / rents / names.

export const N_TILES = 72;
export const N_SIDES = 6;
export const TILES_PER_SIDE = 12;

// Corner tiles (one per side, at side-start index 0/12/24/36/48/60).
export const CORNERS = [
  { kind: 'corner', name: 'GO',           sub: 'collect $200'   },
  { kind: 'corner', name: 'Jail',         sub: 'Just Visiting'  },
  { kind: 'corner', name: 'Free Parking', sub: '—'              },
  { kind: 'corner', name: 'Go To Jail',   sub: 'move directly'  },
  { kind: 'corner', name: 'Income Tax',   sub: 'pay $200'       },
  { kind: 'corner', name: 'Luxury Tax',   sub: 'pay $75'        },
];

// The 6 commodity tiles, one per side at side-local index 6 (the midpoint).
export const COMMODITIES = [
  { kind: 'commodity', name: 'Suez Canal Toll',         price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'Venezuelan Oil Reserve',  price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'ASML EUV Patent',         price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'Spice Route',             price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'Lithium Triangle',        price: 200, baseRent: 25 },
  { kind: 'commodity', name: 'TSMC Foundry Node',       price: 200, baseRent: 25 },
];

// 6 countries x 5 cities = 30 properties. Each side gets one country's cities
// interleaved with Chance/Community-Chest tiles around the corner+commodity.
// Color is mostly decorative; ownership of all 5 in a country doubles rent.
export const COUNTRIES = [
  { country: 'South Africa', color: '#8B5CF6', cities: ['Joburg',       'Cape Town', 'Durban',       'Pretoria', 'Port Elizabeth'] },
  { country: 'Japan',        color: '#EC4899', cities: ['Tokyo',        'Osaka',     'Kyoto',        'Nagoya',   'Fukuoka']        },
  { country: 'Brazil',       color: '#10B981', cities: ['São Paulo',    'Rio',       'Brasília',     'Salvador', 'Belo Horizonte'] },
  { country: 'Germany',      color: '#F59E0B', cities: ['Berlin',       'Hamburg',   'Munich',       'Frankfurt','Cologne']        },
  { country: 'India',        color: '#EF4444', cities: ['Mumbai',       'Delhi',     'Bengaluru',    'Chennai',  'Hyderabad']      },
  { country: 'Egypt',        color: '#06B6D4', cities: ['Cairo',        'Alexandria','Giza',         'Luxor',    'Aswan']          },
];

// Per-city price ladder (low -> high within a country). Multiplied by a
// country-tier later so each side gets steeper rents than the last.
const CITY_PRICE_LADDER = [60, 80, 100, 120, 160];
// Per-country tier multiplier. South Africa cheapest, Egypt priciest.
const COUNTRY_TIER       = [ 1, 1.5,    2,    2.5,    3,    3.5 ];

function propertyForSlot(sideIdx, slotIdx) {
  // slotIdx is 0..4 within a country's 5 cities.
  const c = COUNTRIES[sideIdx];
  const tier = COUNTRY_TIER[sideIdx];
  const ladder = CITY_PRICE_LADDER[slotIdx];
  const price = Math.round(ladder * tier);
  // Base rent = 10% of price (rounded), doubled when monopoly owned.
  const baseRent = Math.max(2, Math.round(price * 0.10));
  return {
    kind: 'property',
    name: c.cities[slotIdx],
    country: c.country,
    color: c.color,
    price,
    baseRent,
  };
}

// Lay out one side: 12 tiles, slot 0 = corner, slot 6 = commodity, the
// remaining 10 slots interleave 5 properties with 5 card tiles. Pattern
// chosen to spread properties evenly and avoid two card tiles back-to-back.
//
// Slot:   0    1    2    3    4    5    6    7    8    9    10   11
// Kind: corner P    C    P    H    P    comm P    H    P    C    H
//   where P = property, C = Chance, H = Community-Chest (chest).
// Property indices within country: 0,1,2,3,4 in order they appear.
function buildSide(sideIdx) {
  const tiles = new Array(TILES_PER_SIDE);
  tiles[0] = CORNERS[sideIdx];
  tiles[6] = COMMODITIES[sideIdx];

  // Slots receiving properties (in order) and card tiles (Chance/Chest).
  const propSlots = [1, 3, 5, 7, 9];
  const cardSlots = [
    { slot: 2,  kind: 'chance' },
    { slot: 4,  kind: 'chest'  },
    { slot: 8,  kind: 'chest'  },
    { slot: 10, kind: 'chance' },
    { slot: 11, kind: 'chest'  },
  ];

  propSlots.forEach((slot, i) => {
    tiles[slot] = propertyForSlot(sideIdx, i);
  });
  cardSlots.forEach(({ slot, kind }) => {
    tiles[slot] = { kind };
  });
  return tiles;
}

// Final 72-tile board, indexed 0..71.
export const BOARD = (() => {
  const out = [];
  for (let s = 0; s < N_SIDES; s++) {
    for (const t of buildSide(s)) out.push(t);
  }
  return out;
})();

// Helpers -----------------------------------------------------------------

export function tileAt(i) { return BOARD[((i % N_TILES) + N_TILES) % N_TILES]; }
export function isOwnable(t) { return t.kind === 'property' || t.kind === 'commodity'; }

// All commodity tile indices (used to compute scaled commodity rent).
export const COMMODITY_INDICES = BOARD
  .map((t, i) => (t.kind === 'commodity' ? i : -1))
  .filter((i) => i >= 0);

// Map property tile index -> country name (for monopoly-bonus check).
export const PROPERTY_COUNTRY = (() => {
  const m = new Map();
  BOARD.forEach((t, i) => {
    if (t.kind === 'property') m.set(i, t.country);
  });
  return m;
})();

// All tile indices belonging to a given country.
export const COUNTRY_INDICES = (() => {
  const m = new Map();
  for (const c of COUNTRIES) m.set(c.country, []);
  BOARD.forEach((t, i) => {
    if (t.kind === 'property') m.get(t.country).push(i);
  });
  return m;
})();

// Corner tile indices by name (for fast lookup in rules).
export const CORNER_GO          = 0;
export const CORNER_JAIL        = TILES_PER_SIDE * 1;
export const CORNER_PARK        = TILES_PER_SIDE * 2;
export const CORNER_GO_TO_JAIL  = TILES_PER_SIDE * 3;
export const CORNER_INCOME_TAX  = TILES_PER_SIDE * 4;
export const CORNER_LUXURY_TAX  = TILES_PER_SIDE * 5;
