use leptos::*;
use crate::api::{get_initial_data_from_window, fetch_initial_data, InitialData};

#[component]
pub fn Dashboard() -> impl IntoView {
    // Try to load from window first (server-side rendered data), fallback to API call
    let initial_data = create_resource(
        || (),
        |_| async move {
            // First try to get server-side rendered data
            if let Some(data) = get_initial_data_from_window() {
                return Ok(data);
            }

            // Fallback to API call
            fetch_initial_data().await
        },
    );

    view! {
        <div class="p-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">"Dashboard"</h2>
                <p class="text-gray-600 dark:text-gray-400">"Overview of team activity and project status"</p>
            </div>

            <Suspense fallback=move || view! {
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 animate-pulse">
                        <div class="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-24 mb-2"></div>
                        <div class="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-16"></div>
                    </div>
                    <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 animate-pulse">
                        <div class="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-24 mb-2"></div>
                        <div class="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-16"></div>
                    </div>
                    <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 animate-pulse">
                        <div class="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-32 mb-2"></div>
                        <div class="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-40"></div>
                    </div>
                </div>
            }>
                {move || {
                    initial_data.get().map(|data| match data {
                        Ok(data) => view! {
                            <DashboardContent data=data />
                        }.into_view(),
                        Err(err) => view! {
                            <div class="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                                <h3 class="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">"Error Loading Data"</h3>
                                <p class="text-red-700 dark:text-red-300">{err}</p>
                            </div>
                        }.into_view(),
                    })
                }}
            </Suspense>
        </div>
    }
}

#[component]
fn DashboardContent(data: InitialData) -> impl IntoView {
    let stats = data.stats;
    let team_members = data.team_members;

    // Calculate active issues (open dev + open product)
    let active_issues = stats.open_development_issues + stats.open_product_issues;

    view! {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            // Active Issues card
            <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Active Issues"</h3>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">{active_issues}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format!("{} dev, {} product", stats.open_development_issues, stats.open_product_issues)}
                </p>
            </div>

            // Team Online card
            <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Team Online"</h3>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">
                    {format!("{}/{}", stats.online_team_members, stats.total_team_members)}
                </p>
            </div>

            // Current Milestone card
            <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Current Milestone"</h3>
                <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.current_stage.unwrap_or_else(|| "No current stage".to_string())}
                </p>
            </div>
        </div>

        // Team Members section
        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 mt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">"Team Members"</h3>
            {if team_members.is_empty() {
                view! {
                    <p class="text-gray-500 dark:text-gray-400 text-center py-8">"No team members found"</p>
                }.into_view()
            } else {
                view! {
                    <div class="space-y-3">
                        {team_members.into_iter().map(|member| {
                            let initials = member.name.split(' ')
                                .filter_map(|n| n.chars().next())
                                .take(2)
                                .collect::<String>()
                                .to_uppercase();

                            let is_online = member.is_online == 1;

                            view! {
                                <div key={member.id} class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                            {initials}
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900 dark:text-white">{member.name.clone()}</p>
                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                {if let Some(last_seen) = member.last_seen_at {
                                                    format!("Last seen: {}", last_seen.split('T').next().unwrap_or(&last_seen))
                                                } else {
                                                    "Never seen".to_string()
                                                }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class={if is_online { "w-3 h-3 rounded-full bg-green-500" } else { "w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" }} />
                                </div>
                            }
                        }).collect::<Vec<_>>()}
                    </div>
                }.into_view()
            }}
        </div>
    }
}
