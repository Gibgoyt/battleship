use leptos::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use web_sys::HtmlInputElement;

/// Login screen — password field + sha256 hash → on_pass_hash(hex).
#[component]
pub fn Login<F>(configured: Signal<bool>, on_pass_hash: F) -> impl IntoView
where
    F: Fn(String) + Clone + 'static,
{
    let pw = create_rw_signal(String::new());
    let busy = create_rw_signal(false);
    let err = create_rw_signal::<Option<String>>(None);

    let submit = {
        let on_pass_hash = on_pass_hash.clone();
        move |ev: ev::SubmitEvent| {
            ev.prevent_default();
            if busy.get() { return; }
            err.set(None);
            busy.set(true);
            let value = pw.get();
            let cb = on_pass_hash.clone();
            spawn_local(async move {
                match sha256_hex(&value).await {
                    Ok(h) => cb(h),
                    Err(_) => err.set(Some("Failed to hash password".into())),
                }
                busy.set(false);
            });
        }
    };

    view! {
        <div class="min-h-screen flex items-center justify-center p-6">
            <form on:submit=submit class="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-4 shadow-xl">
                <h1 class="text-2xl font-semibold">"Monopoly · Hex"</h1>
                <Show when=move || !configured.get()>
                    <p class="text-xs text-amber-400 border border-amber-700 rounded p-2">
                        "Worker URL is not configured. Edit "
                        <code>"src/lib/monopoly/config.ts"</code>
                        " and rebuild."
                    </p>
                </Show>
                <p class="text-sm text-zinc-400">"Enter the game password to join."</p>
                <input
                    type="password"
                    autocomplete="current-password"
                    placeholder="Password"
                    on:input=move |e| pw.set(event_target_value(&e))
                    prop:value=move || pw.get()
                    class="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                    disabled=move || busy.get()
                />
                <Show when=move || err.get().is_some()>
                    <p class="text-sm text-red-400">{move || err.get().unwrap_or_default()}</p>
                </Show>
                <button
                    type="submit"
                    disabled=move || busy.get() || pw.with(|p| p.is_empty()) || !configured.get()
                    class="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
                >
                    {move || if busy.get() { "Joining…" } else { "Join" }}
                </button>
            </form>
        </div>
    }
}

async fn sha256_hex(input: &str) -> Result<String, wasm_bindgen::JsValue> {
    let subtle = web_sys::window()
        .ok_or_else(|| wasm_bindgen::JsValue::from_str("no window"))?
        .crypto()
        .map_err(|_| wasm_bindgen::JsValue::from_str("no crypto"))?
        .subtle();
    let arr = js_sys::Uint8Array::from(input.as_bytes());
    let promise = subtle.digest_with_str_and_buffer_source("SHA-256", &arr)?;
    let buf = JsFuture::from(promise).await?;
    let ab: js_sys::ArrayBuffer = buf.dyn_into()?;
    let view = js_sys::Uint8Array::new(&ab);
    let mut out = String::with_capacity(view.length() as usize * 2);
    let mut bytes = vec![0u8; view.length() as usize];
    view.copy_to(&mut bytes);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(&mut out, "{:02x}", b);
    }
    Ok(out)
}

fn event_target_value(e: &ev::Event) -> String {
    e.target()
        .and_then(|t| t.dyn_into::<HtmlInputElement>().ok())
        .map(|el| el.value())
        .unwrap_or_default()
}
