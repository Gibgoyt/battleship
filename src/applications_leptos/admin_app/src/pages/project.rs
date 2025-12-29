use leptos::*;
use crate::store::AdminStore;
use crate::api::refresh_project_data;
use crate::components::CreateProjectStageModal;

#[component]
fn StatusBadge(#[prop(into)] status: String) -> impl IntoView {
    let (icon_path, color_class, label) = match status.as_str() {
        "open" => ("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "text-blue-500 bg-blue-50 dark:bg-blue-900/20", "Open"),
        "in-progress" => ("M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20", "In Progress"),
        "closed" => ("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", "text-green-500 bg-green-50 dark:bg-green-900/20", "Closed"),
        "delayed" => ("M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "text-red-500 bg-red-50 dark:bg-red-900/20", "Delayed"),
        "completed" => ("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", "text-green-500 bg-green-50 dark:bg-green-900/20", "Completed"),
        "current" => ("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "text-purple-500 bg-purple-50 dark:bg-purple-900/20", "Current"),
        "upcoming" => ("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "text-gray-400 bg-gray-50 dark:bg-gray-700/20", "Upcoming"),
        "blocked" => ("M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", "text-red-500 bg-red-50 dark:bg-red-900/20", "Blocked"),
        _ => ("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "text-blue-500 bg-blue-50 dark:bg-blue-900/20", "Open"),
    };

    view! {
        <span class={format!("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium {}", color_class)}>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon_path}></path>
            </svg>
            {label}
        </span>
    }
}

#[component]
pub fn Project() -> impl IntoView {
    // Get store from context
    let store = use_context::<AdminStore>()
        .expect("AdminStore should be provided");

    // Refresh handler
    let refresh_data = {
        let store = store.clone();
        move |_| {
            let store = store.clone();
            store.set_loading(true);
            store.set_error(None);

            spawn_local(async move {
                match refresh_project_data().await {
                    Ok((stages, product, dev)) => {
                        store.project_stages.set(stages);
                        store.product_issues.set(product);
                        store.development_issues.set(dev);
                        logging::log!("✅ Project data refreshed (3 endpoints)");
                    }
                    Err(err) => {
                        logging::error!("❌ Failed to refresh data: {}", err);
                        store.set_error(Some(err));
                    }
                }
                store.set_loading(false);
            });
        }
    };

    // Modal visibility
    let (show_modal, set_show_modal) = create_signal(false);

    // Add milestone handler
    let add_milestone = move |_| {
        set_show_modal.set(true);
    };

    // Success callback - refresh project data after creating milestone
    let on_modal_success = {
        let store = store.clone();
        move || {
            let store = store.clone();
            store.set_loading(true);

            spawn_local(async move {
                match refresh_project_data().await {
                    Ok((stages, product, dev)) => {
                        store.project_stages.set(stages);
                        store.product_issues.set(product);
                        store.development_issues.set(dev);
                        logging::log!("✅ Data refreshed after milestone creation");
                    }
                    Err(err) => {
                        logging::error!("❌ Failed to refresh after creation: {}", err);
                    }
                }
                store.set_loading(false);
            });
        }
    };

    view! {
        <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">"Project Roadmap"</h2>
                    <p class="text-gray-600 dark:text-gray-400">"Main timeline with development and product issues"</p>
                </div>
                <div class="flex gap-2">
                    <button
                        on:click=refresh_data
                        disabled=move || store.loading.get()
                        class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        {move || if store.loading.get() { "Refreshing..." } else { "Refresh" }}
                    </button>
                    <button
                        on:click=add_milestone
                        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        "Add Milestone"
                    </button>
                </div>
            </div>

            {move || store.error.get().map(|err| view! {
                <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">"Error"</h3>
                    <p class="text-red-700 dark:text-red-300">{err}</p>
                </div>
            })}

            <ProjectContent store=store />

            // Create Project Stage Modal
            <CreateProjectStageModal
                show=show_modal
                on_close=move || set_show_modal.set(false)
                on_success=on_modal_success
            />
        </div>
    }
}

#[component]
fn ProjectContent(store: AdminStore) -> impl IntoView {
    let roadmap_stages = store.project_stages;
    let development_issues = store.development_issues;
    let product_issues = store.product_issues;

    view! {
        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-8 overflow-x-auto">
            <div class="flex gap-8 min-w-max">
                // Development Issues Column (Left)
                <div class="w-80 space-y-4">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-200 dark:border-zinc-600">"Development Issues"</h3>
                    {move || {
                        let issues = development_issues.get();
                        let stages = roadmap_stages.get();

                        if issues.is_empty() {
                            view! {
                                <p class="text-gray-500 dark:text-gray-400 text-center py-4">"No development issues"</p>
                            }.into_view()
                        } else {
                            issues.into_iter().map(|issue| {
                                let milestone = stages.iter().find(|m| m.id == issue.roadmap_stage_id);
                                let milestone_title = milestone.map(|m| m.title.clone()).unwrap_or_else(|| "Unknown".to_string());

                                view! {
                                    <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
                                        <div class="flex items-start justify-between mb-2">
                                            <span class="text-xs font-medium text-blue-700 dark:text-blue-400">
                                                {"#"}{issue.issue_number}
                                            </span>
                                            <StatusBadge status={issue.status.clone()} />
                                        </div>
                                        <h4 class="font-medium text-gray-900 dark:text-white mb-1">{issue.title}</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">"→ " {milestone_title}</p>
                                        <div class="text-xs text-gray-600 dark:text-gray-400">{issue.message_count} " comments"</div>
                                    </div>
                                }
                            }).collect::<Vec<_>>().into_view()
                        }
                    }}
                </div>

                // Main Roadmap Timeline (Center)
                <div class="w-80 relative">
                    <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-300 transform -translate-x-1/2" />
                    {move || {
                        let stages = roadmap_stages.get();

                        if stages.is_empty() {
                            view! {
                                <p class="text-gray-500 dark:text-gray-400 text-center py-8 relative">"No project stages"</p>
                            }.into_view()
                        } else {
                            view! {
                                <div class="space-y-8 relative">
                                    {stages.into_iter().map(|milestone| {
                                        view! {
                                            <div class="relative">
                                                <div class="absolute left-1/2 w-6 h-6 bg-white dark:bg-zinc-800 border-4 border-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1" />
                                                <div class="bg-white dark:bg-zinc-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 shadow-lg mt-4">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <StatusBadge status={milestone.status.clone()} />
                                                        <span class="text-xs text-gray-500 dark:text-gray-400">
                                                            {milestone.target_date.as_ref().map(|d| d.split('T').next().unwrap_or(d).to_string()).unwrap_or_else(|| "No date".to_string())}
                                                        </span>
                                                    </div>
                                                    <h4 class="font-semibold text-gray-900 dark:text-white mb-1">{milestone.title}</h4>
                                                    {milestone.description.as_ref().map(|desc| view! {
                                                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{desc}</p>
                                                    })}
                                                    <div class="flex gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>{milestone.dev_issue_count} " dev"</span>
                                                        <span>"•"</span>
                                                        <span>{milestone.product_issue_count} " product"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    }).collect::<Vec<_>>()}
                                </div>
                            }.into_view()
                        }
                    }}
                </div>

                // Product Issues Column (Right)
                <div class="w-80 space-y-4">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-200 dark:border-zinc-600">"Product Issues"</h3>
                    {move || {
                        let issues = product_issues.get();
                        let stages = roadmap_stages.get();

                        if issues.is_empty() {
                            view! {
                                <p class="text-gray-500 dark:text-gray-400 text-center py-4">"No product issues"</p>
                            }.into_view()
                        } else {
                            issues.into_iter().map(|issue| {
                                let milestone = stages.iter().find(|m| m.id == issue.roadmap_stage_id);
                                let milestone_title = milestone.map(|m| m.title.clone()).unwrap_or_else(|| "Unknown".to_string());

                                view! {
                                    <div class="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
                                        <div class="flex items-start justify-between mb-2">
                                            <span class="text-xs font-medium text-green-700 dark:text-green-400">
                                                {"#"}{issue.issue_number}
                                            </span>
                                            <StatusBadge status={issue.status.clone()} />
                                        </div>
                                        <h4 class="font-medium text-gray-900 dark:text-white mb-1">{issue.title}</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">"← " {milestone_title}</p>
                                        <div class="text-xs text-gray-600 dark:text-gray-400">{issue.message_count} " comments"</div>
                                    </div>
                                }
                            }).collect::<Vec<_>>().into_view()
                        }
                    }}
                </div>
            </div>
        </div>
    }
}
