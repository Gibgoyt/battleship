use leptos::*;
use wasm_bindgen::JsCast;

use crate::components::app::AppCtx;
use crate::state::ToastKind;

#[component]
pub fn Toaster() -> impl IntoView {
    let ctx = use_context::<AppCtx>().expect("app ctx");

    // Auto-dismiss after 4s any time the toast is set.
    create_effect(move |_| {
        let _ = ctx.toast.get();
        if ctx.toast.with(|t| t.is_none()) { return; }
        let win = match web_sys::window() { Some(w) => w, None => return };
        let toast = ctx.toast;
        let cb = wasm_bindgen::closure::Closure::once_into_js(move || {
            toast.set(None);
        });
        let _ = win.set_timeout_with_callback_and_timeout_and_arguments_0(
            cb.as_ref().unchecked_ref(), 4000,
        );
    });

    view! {
        <Show when=move || ctx.toast.with(|t| t.is_some())>
            {move || {
                let t = ctx.toast.get().unwrap();
                let cls = match t.kind {
                    ToastKind::Info    => "bg-blue-500 text-blue-950 border-blue-600",
                    ToastKind::Warning => "bg-amber-500 text-amber-950 border-amber-600",
                    ToastKind::Error   => "bg-red-500 text-red-50 border-red-700",
                };
                view! {
                    <div
                        role="status"
                        aria-live="polite"
                        class=format!("fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-xl border font-semibold max-w-[90vw] text-center {cls}")
                    >
                        {t.message.clone()}
                    </div>
                }
            }}
        </Show>
    }
}
