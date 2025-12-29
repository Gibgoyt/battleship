use leptos::*;
use crate::store::AdminStore;
use crate::api::refresh_all_data;
use crate::components::sidebar::SidebarState;

#[component]
pub fn Header() -> impl IntoView {
    // Get store and sidebar state from context
    let store = use_context::<AdminStore>()
        .expect("AdminStore should be provided");

    let sidebar_state = use_context::<SidebarState>()
        .expect("SidebarState should be provided")
        .0;
    let (sidebar_open, set_sidebar_open) = sidebar_state.split();

    // Global app refresh handler
    let global_refresh = {
        let store = store.clone();
        move |_| {
            let store = store.clone();
            store.set_loading(true);
            store.set_error(None);

            spawn_local(async move {
                match refresh_all_data().await {
                    Ok(data) => {
                        store.update(data);
                        logging::log!("✅ Global app data refreshed");
                    }
                    Err(err) => {
                        logging::error!("❌ Failed to refresh app data: {}", err);
                        store.set_error(Some(err));
                    }
                }
                store.set_loading(false);
            });
        }
    };

    view! {
        <header class="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4">
            <div class="flex items-center justify-between">
                // Mobile menu button (hamburger)
                <button
                    on:click=move |_| set_sidebar_open.set(!sidebar_open.get())
                    class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                    <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>

                // Search bar (hidden on mobile)
                <div class="hidden sm:block flex-1 max-w-md">
                    <div class="relative">
                        <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search anything..."
                            class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                // Right side: Global Refresh, Notifications, Mail, User dropdown
                <div class="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-6">
                    // Global Refresh Button (circular arrows)
                    <button
                        on:click=global_refresh
                        disabled=move || store.loading.get()
                        class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh application data"
                    >
                        <svg
                            class=move || if store.loading.get() {
                                "w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin"
                            } else {
                                "w-5 h-5 text-gray-600 dark:text-gray-300"
                            }
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>

                    // Notification bell with badge
                    <button class="relative p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                        </svg>
                        <span class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                            "3"
                        </span>
                    </button>

                    // Mail icon
                    <button class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                    </button>

                    // User dropdown
                    <div class="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-zinc-600">
                        <div class="text-right hidden sm:block">
                            <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">"Josh Sack"</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">"Administrator"</div>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            "JS"
                        </div>
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </header>
    }
}
