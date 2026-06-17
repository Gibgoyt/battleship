use leptos::*;
use leptos_router::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

mod chapters;
mod chapters_content;
mod components;
mod leetgpu;

use chapters::{chapter_by_slug, chapter_index, CHAPTERS, ROOT};
use chapters_content::{render_chapter, render_leetgpu_problem, LeetGpuIndex};
use components::{ChapterFooter, Header, ProgressBar, Sidebar};

/// Shared mobile-drawer toggle. Header opens it; the drawer closes itself.
#[derive(Clone, Copy)]
pub struct NavOpen(pub RwSignal<bool>);

/// Tracks where in the guide the user is so the sidebar can highlight the
/// right entry. Walkthrough chapters get their slug; everything under
/// /cuda/leetgpu/... reports `Section::LeetGpu` so the "LeetGPU" link in
/// the sidebar stays active across the whole sub-app.
#[derive(Clone, PartialEq, Eq)]
pub enum Section {
    /// On a walkthrough chapter. String is the chapter slug.
    Chapter(String),
    /// Anywhere under /cuda/leetgpu (index or a specific problem).
    LeetGpu,
}

/// Derive the current section from `window.location.pathname` reactively.
/// Components outside `<Routes>` cannot use `use_params_map()`, so we read
/// the Location signal directly.
pub fn current_section() -> Signal<Section> {
    let loc = use_location();
    let first = CHAPTERS[0].slug.to_string();
    Signal::derive(move || {
        loc.pathname.with(|p| {
            let parts: Vec<&str> = p.trim_matches('/').split('/').collect();
            if parts.first().copied() != Some(ROOT) {
                return Section::Chapter(first.clone());
            }
            match parts.get(1) {
                None | Some(&"") => Section::Chapter(first.clone()),
                Some(&"leetgpu") => Section::LeetGpu,
                Some(s) => Section::Chapter(s.to_string()),
            }
        })
    })
}

/// Convenience: slug-only view, used by sub-components that only care about
/// which walkthrough chapter is active (sidebar highlight, header counter).
pub fn current_slug() -> Signal<String> {
    let section = current_section();
    let first = CHAPTERS[0].slug.to_string();
    Signal::derive(move || match section.get() {
        Section::Chapter(s) => s,
        Section::LeetGpu => first.clone(),
    })
}

#[component]
fn ChapterPage() -> impl IntoView {
    let params = use_params_map();
    view! {
        <article class="prose-invert">
            {move || {
                let slug = params.with(|p| p.get("slug").cloned().unwrap_or_default());
                render_chapter(&slug)
            }}
        </article>
    }
}

#[component]
fn DefaultChapterPage() -> impl IntoView {
    view! {
        <article class="prose-invert">
            {render_chapter(CHAPTERS[0].slug)}
        </article>
    }
}

#[component]
fn LeetGpuIndexPage() -> impl IntoView {
    view! {
        <article class="prose-invert">
            <LeetGpuIndex/>
        </article>
    }
}

#[component]
fn LeetGpuProblemPage() -> impl IntoView {
    let params = use_params_map();
    view! {
        <article class="prose-invert">
            {move || {
                let slug = params.with(|p| p.get("slug").cloned().unwrap_or_default());
                render_leetgpu_problem(&slug)
            }}
        </article>
    }
}

/// After every navigation, re-run highlight.js on whatever code blocks the
/// newly-mounted view rendered. The Astro page exposes `window.__rehighlight`
/// for exactly this; we no-op if it is not present (e.g. in dev without the
/// CDN scripts loaded yet).
fn rehighlight_after_nav() {
    let loc = use_location();
    create_effect(move |_| {
        let _ = loc.pathname.get(); // subscribe
        let win = match web_sys::window() {
            Some(w) => w,
            None => return,
        };
        // requestAnimationFrame so we run AFTER Leptos has flushed the DOM.
        let cb = Closure::once_into_js(move || {
            if let Ok(f) = js_sys::Reflect::get(&win, &JsValue::from_str("__rehighlight")) {
                if let Ok(f) = f.dyn_into::<js_sys::Function>() {
                    let _ = f.call0(&JsValue::NULL);
                }
            }
        });
        if let Some(w) = web_sys::window() {
            let _ = w.request_animation_frame(cb.as_ref().unchecked_ref());
        }
    });
}

#[component]
fn App() -> impl IntoView {
    provide_context(NavOpen(create_rw_signal(false)));

    view! {
        <Router>
            <RouterInner/>
        </Router>
    }
}

#[component]
fn RouterInner() -> impl IntoView {
    rehighlight_after_nav();

    view! {
        <div class="min-h-screen bg-zinc-950 text-white">
            <ProgressBar/>
            <Header/>
            <div class="flex">
                <Sidebar/>
                <main class="flex-1 min-w-0">
                    <div class="max-w-3xl mx-auto px-4 sm:px-8 py-10">
                        <Routes>
                            <Route path="/cuda" view=DefaultChapterPage/>
                            <Route path="/cuda/leetgpu" view=LeetGpuIndexPage/>
                            <Route path="/cuda/leetgpu/:slug" view=LeetGpuProblemPage/>
                            <Route path="/cuda/:slug" view=ChapterPage/>
                        </Routes>
                        <ChapterFooter/>
                        <footer class="mt-16 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-600">
                            <p>"A practical CUDA walkthrough — concepts in the sidebar, problem solutions under LeetGPU."</p>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    }
}

#[wasm_bindgen]
pub fn mount_cuda_app() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();

    let container = web_sys::window()
        .ok_or_else(|| JsValue::from_str("no window"))?
        .document()
        .ok_or_else(|| JsValue::from_str("no document"))?
        .get_element_by_id("wasm-root")
        .ok_or_else(|| JsValue::from_str("no #wasm-root element"))?
        .dyn_into::<web_sys::HtmlElement>()?;

    mount_to(container, || view! { <App/> });
    Ok(())
}

// Suppress unused-import warning while keeping the imports addressable.
#[allow(dead_code)]
fn _silence_unused() {
    let _ = chapter_by_slug("");
    let _ = chapter_index("");
}
