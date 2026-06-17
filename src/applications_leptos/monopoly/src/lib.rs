use leptos::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

mod board;
mod components;
mod state;
mod tiles;
mod ws;

use components::app::AppShell;

/// Entrypoint called by the Astro page after the WASM module loads.
#[wasm_bindgen]
pub fn mount_monopoly_app() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();

    let container = web_sys::window()
        .ok_or_else(|| JsValue::from_str("no window"))?
        .document()
        .ok_or_else(|| JsValue::from_str("no document"))?
        .get_element_by_id("wasm-root")
        .ok_or_else(|| JsValue::from_str("no #wasm-root element"))?
        .dyn_into::<web_sys::HtmlElement>()?;

    mount_to(container, || view! { <AppShell/> });
    Ok(())
}
