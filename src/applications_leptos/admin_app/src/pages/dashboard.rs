use leptos::*;
use crate::store::AdminStore;

#[component]
pub fn Dashboard() -> impl IntoView {
    // Get store from context
    let store = use_context::<AdminStore>()
        .expect("AdminStore should be provided");

    view! {
        <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">"Dashboard"</h2>
                <p class="text-gray-600 dark:text-gray-400">"Overview of team activity and project status"</p>
            </div>

            {move || store.error.get().map(|err| view! {
                <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">"Error"</h3>
                    <p class="text-red-700 dark:text-red-300">{err}</p>
                </div>
            })}

            <DashboardContent store=store />
        </div>
    }
}

#[component]
fn DashboardContent(store: AdminStore) -> impl IntoView {
    let stats = store.stats;
    let team_members = store.team_members;

    view! {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            // Active Issues card
            <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Active Issues"</h3>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">
                    {move || stats.get().open_development_issues + stats.get().open_product_issues}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {move || format!("{} dev, {} product", stats.get().open_development_issues, stats.get().open_product_issues)}
                </p>
            </div>

            // Team Online card
            <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Team Online"</h3>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">
                    {move || format!("{}/{}", stats.get().online_team_members, stats.get().total_team_members)}
                </p>
            </div>

            // Current Milestone card
            <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Current Milestone"</h3>
                <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {move || stats.get().current_stage.clone().unwrap_or_else(|| "No current stage".to_string())}
                </p>
            </div>
        </div>

        // Team Members section
        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 mt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">"Team Members"</h3>
            {move || {
                let members = team_members.get();
                if members.is_empty() {
                    view! {
                        <p class="text-gray-500 dark:text-gray-400 text-center py-8">"No team members found"</p>
                    }.into_view()
                } else {
                    view! {
                        <div class="space-y-3">
                            {members.into_iter().map(|member| {
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
                }
            }}
        </div>
    }
}
