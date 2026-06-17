// SVG geometry for the 72-tile hexagonal perimeter.
//
// A regular hexagon has 6 sides; we want 12 tiles per side (= 72 total).
// The corner tiles are larger squares; the in-between tiles are slim
// rectangles oriented along their side.

use crate::tiles::{N_SIDES, TILES_PER_SIDE};

/// Layout configuration. ViewBox is (0,0)-(SIZE,SIZE). Hexagon is "pointy-top"
/// (a vertex at the top), centered, with the perimeter tiles laid around it.
pub const SIZE: f32 = 1000.0;
pub const CENTER: f32 = SIZE / 2.0;

/// Outer "perimeter radius" of the hex (vertex distance from center).
pub const R_OUTER: f32 = 460.0;
/// Inner radius (where the side-edge rectangles' inner edge sits).
pub const R_INNER: f32 = 360.0;
/// Half-width of a corner tile along the perpendicular bisector — used so
/// the corner sits comfortably inside the vertex.
pub const CORNER_HALF: f32 = 55.0;

/// Returns the 6 hexagon vertices in order (pointy-top, starting from the top vertex).
pub fn hex_vertices() -> [(f32, f32); 6] {
    let mut v = [(0.0f32, 0.0f32); 6];
    for i in 0..6 {
        // pointy-top: angle = -90° + 60° * i
        let theta = ((-90.0 + 60.0 * i as f32) as f32).to_radians();
        v[i] = (CENTER + R_OUTER * theta.cos(), CENTER + R_OUTER * theta.sin());
    }
    v
}

/// Position + rotation (in degrees) for tile `tile_index` (0..72).
/// Returns ((cx, cy), rotation_deg, kind_corner).
///
/// Side k is traversed from vertex k to vertex (k+1). Slot 0 of the side is
/// the corner at vertex k; slots 1..11 are evenly spaced along the side.
pub fn tile_position(tile_index: u32) -> ((f32, f32), f32, bool) {
    let side = (tile_index / TILES_PER_SIDE) as usize % N_SIDES as usize;
    let slot = (tile_index % TILES_PER_SIDE) as usize;
    let vs = hex_vertices();
    let v_a = vs[side];
    let v_b = vs[(side + 1) % 6];
    let dx = v_b.0 - v_a.0;
    let dy = v_b.1 - v_a.1;
    let rot = dy.atan2(dx).to_degrees();

    if slot == 0 {
        // Corner: sit at vertex itself.
        (v_a, rot, true)
    } else {
        // Distribute the 11 non-corner slots evenly along the segment from
        // v_a (skipping the corner space) to v_b. We map slot index 1..=11
        // to fractions (slot-0.5)/12 along the side; this leaves a half-gap
        // at each end so corners don't collide with their neighbors.
        let f = (slot as f32 + 0.5) / 12.0;
        let cx = v_a.0 + dx * f;
        let cy = v_a.1 + dy * f;
        (( cx, cy), rot, false)
    }
}

/// Width and height of a non-corner tile rectangle.
pub fn side_tile_size() -> (f32, f32) {
    // 11 non-corner tiles span ~10/12 of the side length (1/24 from each end gap).
    let side_len = (R_OUTER) * 2.0 * (60.0_f32 / 2.0).to_radians().sin();
    let tile_w = (side_len * (10.0 / 12.0)) / 11.0 * 1.05;
    let tile_h = (R_OUTER - R_INNER).max(70.0);
    (tile_w, tile_h)
}

pub fn corner_tile_size() -> (f32, f32) {
    let s = CORNER_HALF * 2.0;
    (s, s)
}
