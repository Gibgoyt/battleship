// Client-side mirror of workers/monopoly/monopoly-game/src/board.js. The
// worker is authoritative for prices/rents and ownership rules; this exists
// so the UI can render tile names, prices and colors without round-tripping.

pub const N_TILES: u32 = 72;
pub const N_SIDES: u32 = 6;
pub const TILES_PER_SIDE: u32 = 12;

#[derive(Clone, Debug, PartialEq)]
pub enum TileKind {
    Corner,
    Commodity,
    Property,
    Chance,
    Chest,
}

#[derive(Clone, Debug)]
pub struct Tile {
    pub kind: TileKind,
    pub name: &'static str,
    pub sub: &'static str,
    pub country: &'static str,
    pub color: &'static str,
    pub price: i64,
    pub base_rent: i64,
}

impl Tile {
    pub const fn corner(name: &'static str, sub: &'static str) -> Self {
        Self { kind: TileKind::Corner, name, sub, country: "", color: "#52525b", price: 0, base_rent: 0 }
    }
    pub const fn commodity(name: &'static str) -> Self {
        Self { kind: TileKind::Commodity, name, sub: "Commodity", country: "Commodities", color: "#0ea5e9", price: 200, base_rent: 25 }
    }
    pub const fn property(name: &'static str, country: &'static str, color: &'static str, price: i64) -> Self {
        // base_rent computed at run time below (const fn can't do that easily across this many entries).
        Self { kind: TileKind::Property, name, sub: "", country, color, price, base_rent: 0 }
    }
    pub const fn chance() -> Self { Self { kind: TileKind::Chance, name: "Chance", sub: "(coming soon)", country: "", color: "#7c3aed", price: 0, base_rent: 0 } }
    pub const fn chest()  -> Self { Self { kind: TileKind::Chest,  name: "Community", sub: "(coming soon)", country: "", color: "#f59e0b", price: 0, base_rent: 0 } }
}

// Country tiers (same as the worker). Per-side tier multiplier; ladder is per-city.
const CITY_PRICE_LADDER: [i64; 5] = [60, 80, 100, 120, 160];
const COUNTRY_TIER:      [f32; 6] = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5];

fn property_price(side: usize, slot: usize) -> i64 {
    (CITY_PRICE_LADDER[slot] as f32 * COUNTRY_TIER[side]).round() as i64
}
fn property_base_rent(price: i64) -> i64 {
    let r = (price as f32 * 0.10).round() as i64;
    if r < 2 { 2 } else { r }
}

// Country & city catalog — matches workers/monopoly/monopoly-game/src/board.js.
struct CountryDef {
    country: &'static str,
    color: &'static str,
    cities: [&'static str; 5],
}
const COUNTRIES: [CountryDef; 6] = [
    CountryDef { country: "South Africa", color: "#8B5CF6", cities: ["Joburg",    "Cape Town",  "Durban",   "Pretoria", "Port Elizabeth"] },
    CountryDef { country: "Japan",        color: "#EC4899", cities: ["Tokyo",     "Osaka",      "Kyoto",    "Nagoya",   "Fukuoka"]        },
    CountryDef { country: "Brazil",       color: "#10B981", cities: ["São Paulo", "Rio",        "Brasília", "Salvador", "Belo Horizonte"] },
    CountryDef { country: "Germany",      color: "#F59E0B", cities: ["Berlin",    "Hamburg",    "Munich",   "Frankfurt","Cologne"]        },
    CountryDef { country: "India",        color: "#EF4444", cities: ["Mumbai",    "Delhi",      "Bengaluru","Chennai",  "Hyderabad"]      },
    CountryDef { country: "Egypt",        color: "#06B6D4", cities: ["Cairo",     "Alexandria", "Giza",     "Luxor",    "Aswan"]          },
];

const CORNERS: [Tile; 6] = [
    Tile::corner("GO",           "collect $200"),
    Tile::corner("Jail",         "Just Visiting"),
    Tile::corner("Free Parking", "—"),
    Tile::corner("Go To Jail",   "move directly"),
    Tile::corner("Income Tax",   "pay $200"),
    Tile::corner("Luxury Tax",   "pay $75"),
];

const COMMODITIES: [Tile; 6] = [
    Tile::commodity("Suez Canal Toll"),
    Tile::commodity("Venezuelan Oil Reserve"),
    Tile::commodity("ASML EUV Patent"),
    Tile::commodity("Spice Route"),
    Tile::commodity("Lithium Triangle"),
    Tile::commodity("TSMC Foundry Node"),
];

// Build the 72-tile board on first access (thread-safe in WASM single-thread).
fn build_board() -> Vec<Tile> {
    let mut board: Vec<Tile> = Vec::with_capacity(N_TILES as usize);
    for side in 0..6usize {
        // slot 0 corner, slot 6 commodity, slots 1,3,5,7,9 properties, others cards.
        // Order matters; matches workers' buildSide().
        let mut slots: Vec<Tile> = Vec::with_capacity(12);
        slots.resize(12, Tile::chance()); // placeholder; overwritten below

        slots[0]  = CORNERS[side].clone();
        slots[6]  = COMMODITIES[side].clone();

        // 5 property slots in order: 1, 3, 5, 7, 9 — one per city.
        let prop_slots = [1usize, 3, 5, 7, 9];
        for (i, &slot) in prop_slots.iter().enumerate() {
            let country = &COUNTRIES[side];
            let price = property_price(side, i);
            let mut t = Tile::property(country.cities[i], country.country, country.color, price);
            t.base_rent = property_base_rent(price);
            slots[slot] = t;
        }

        // Card tiles: slot 2 Chance, slot 4 Chest, slot 8 Chest, slot 10 Chance, slot 11 Chest.
        slots[2]  = Tile::chance();
        slots[4]  = Tile::chest();
        slots[8]  = Tile::chest();
        slots[10] = Tile::chance();
        slots[11] = Tile::chest();

        for t in slots { board.push(t); }
    }
    board
}

thread_local! {
    static BOARD_CELL: std::cell::OnceCell<Vec<Tile>> = std::cell::OnceCell::new();
}

pub fn board() -> &'static [Tile] {
    // SAFETY: WASM is single-threaded; we leak the Vec once for a 'static slice.
    static mut BOARD_STATIC: Option<&'static [Tile]> = None;
    unsafe {
        if BOARD_STATIC.is_none() {
            let leaked: &'static [Tile] = Box::leak(build_board().into_boxed_slice());
            BOARD_STATIC = Some(leaked);
        }
        BOARD_STATIC.unwrap()
    }
}

pub fn tile_at(index: u32) -> &'static Tile {
    let i = (index % N_TILES) as usize;
    &board()[i]
}
