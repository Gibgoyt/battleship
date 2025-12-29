use leptos::*;
use leptos_router::*;

#[derive(Clone, Copy)]
pub struct DarkMode(pub RwSignal<bool>);

#[derive(Clone, Copy)]
pub struct SidebarState(pub RwSignal<bool>);

pub fn use_dark_mode() -> (ReadSignal<bool>, WriteSignal<bool>) {
    let dark_mode = use_context::<DarkMode>()
        .expect("DarkMode context not found")
        .0;
    dark_mode.split()
}

pub fn use_sidebar_state() -> (ReadSignal<bool>, WriteSignal<bool>) {
    let sidebar_state = use_context::<SidebarState>()
        .expect("SidebarState context not found")
        .0;
    sidebar_state.split()
}

pub fn update_theme(is_dark: bool) {
    if let Some(window) = web_sys::window() {
        // Update localStorage
        if let Ok(Some(storage)) = window.local_storage() {
            let _ = storage.set_item("darkMode", &is_dark.to_string());
        }

        // Update document element class
        if let Some(document) = window.document() {
            if let Some(html) = document.document_element() {
                if is_dark {
                    let _ = html.class_list().add_1("dark");
                } else {
                    let _ = html.class_list().remove_1("dark");
                }
            }
        }
    }
}

#[component]
pub fn Sidebar() -> impl IntoView {
    let (is_dark, set_dark) = use_dark_mode();
    let (sidebar_open, set_sidebar_open) = use_sidebar_state();
    let location = use_location();

    // Responsive sidebar classes - overlay on mobile, sidebar on desktop
    let sidebar_classes = move || {
        let base = "fixed md:relative inset-y-0 left-0 z-50 w-64 h-screen bg-[#0f172a] border-r border-[#1e293b] p-6 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0";
        if sidebar_open.get() {
            format!("{} translate-x-0", base)
        } else {
            format!("{} -translate-x-full", base)
        }
    };

    let is_active = move |path: &str| {
        let current = location.pathname.get();
        current == path || (path == "/admin/dashboard" && current == "/admin")
    };

    let link_class = move |path: &str| {
        let base = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 text-sm font-medium";
        if is_active(path) {
            format!("{} bg-blue-600 text-white", base)
        } else {
            format!("{} text-gray-300 hover:bg-[#1e293b]", base)
        }
    };

    let toggle_theme = move |_| {
        let new_dark = !is_dark.get();
        set_dark.set(new_dark);
        update_theme(new_dark);
    };

    let navigate_home = move |_| {
        if let Some(window) = web_sys::window() {
            let _ = window.location().set_href("/");
        }
    };

    // Handler to close sidebar on navigation (for mobile)
    let close_sidebar_on_nav = move |_| {
        set_sidebar_open.set(false);
    };

    let button_class = "w-full p-3 mb-2 rounded-lg transition-colors hover:bg-[#1e293b] flex items-center justify-center gap-2 text-gray-300 text-sm";

    view! {
        // Mobile backdrop overlay
        <div
            class=move || if sidebar_open.get() {
                "fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            } else {
                "hidden"
            }
            on:click=move |_| set_sidebar_open.set(false)
        />

        // Responsive sidebar
        <aside class=sidebar_classes>
            // Branding
            <div class="mb-8">
                <div class="flex items-center gap-2">
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <h1 class="text-xl font-bold text-white">"Pritchard Admin"</h1>
                </div>
            </div>

            // Navigation menu
            <nav class="flex-1">
                <A href="/admin/dashboard" class=move || link_class("/admin/dashboard") on:click=close_sidebar_on_nav>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span>"Dashboard"</span>
                </A>

                <A href="/admin/project" class=move || link_class("/admin/project") on:click=close_sidebar_on_nav>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    <span>"Project"</span>
                </A>

                <A href="/admin/product" class=move || link_class("/admin/product") on:click=close_sidebar_on_nav>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <span>"Product"</span>
                </A>

                <A href="/admin/development" class=move || link_class("/admin/development") on:click=close_sidebar_on_nav>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    <span>"Development"</span>
                </A>

                <A href="/admin/community-support" class=move || link_class("/admin/community-support") on:click=close_sidebar_on_nav>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                    </svg>
                    <span>"Community Support"</span>
                </A>
            </nav>

            // Bottom section: User info + controls
            <div class="mt-auto pt-6 border-t border-[#1e293b]">
                // User info
                <div class="flex items-center gap-3 mb-4 px-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                        "JS"
                    </div>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-white">"User"</div>
                        <div class="text-xs text-gray-400">"Admin"</div>
                    </div>
                </div>

                // Back to Home button
                <button
                    on:click=navigate_home
                    class=button_class
                    title="Back to Home"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span>"Back to Home"</span>
                </button>

                // Theme toggle button
                <button
                    on:click=toggle_theme
                    class=button_class
                    title="Toggle theme"
                >
                    {move || if is_dark.get() {
                        view! {
                            <>
                                <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                                <span>"Light Mode"</span>
                            </>
                        }
                    } else {
                        view! {
                            <>
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                </svg>
                                <span>"Dark Mode"</span>
                            </>
                        }
                    }}
                </button>

                // Copyright
                <div class="text-xs text-gray-500 text-center mt-4">
                    "© 2025 Pritchard"
                </div>
            </div>
        </aside>
    }
}
