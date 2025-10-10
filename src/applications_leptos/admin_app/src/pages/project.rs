use leptos::*;
use crate::api::{get_initial_data_from_window, fetch_initial_data, ProjectStage, DevelopmentIssue, ProductIssue};

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
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">"Project Roadmap"</h2>
                    <p class="text-gray-600 dark:text-gray-400">"Main timeline with development and product issues"</p>
                </div>
                <button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    "Add Milestone"
                </button>
            </div>

            <Suspense fallback=move || view! {
                <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-8">
                    <div class="animate-pulse space-y-4">
                        <div class="h-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                        <div class="h-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                        <div class="h-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                    </div>
                </div>
            }>
                {move || {
                    initial_data.get().map(|data| match data {
                        Ok(data) => view! {
                            <ProjectContent
                                roadmap_stages=data.project_stages
                                development_issues=data.development_issues
                                product_issues=data.product_issues
                            />
                        }.into_view(),
                        Err(err) => view! {
                            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
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
fn ProjectContent(
    roadmap_stages: Vec<ProjectStage>,
    development_issues: Vec<DevelopmentIssue>,
    product_issues: Vec<ProductIssue>,
) -> impl IntoView {
    view! {
        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-8 overflow-x-auto">
            <div class="flex gap-8 min-w-max">
                // Development Issues Column (Left)
                <div class="w-80 space-y-4">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-200 dark:border-zinc-600">"Development Issues"</h3>
                    {if development_issues.is_empty() {
                        view! {
                            <p class="text-gray-500 dark:text-gray-400 text-center py-4">"No development issues"</p>
                        }.into_view()
                    } else {
                        development_issues.into_iter().map(|issue| {
                            let milestone = roadmap_stages.iter().find(|m| m.id == issue.roadmap_stage_id);
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
                    }}
                </div>

                // Main Roadmap Timeline (Center)
                <div class="w-80 relative">
                    <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-300 transform -translate-x-1/2" />
                    {if roadmap_stages.is_empty() {
                        view! {
                            <p class="text-gray-500 dark:text-gray-400 text-center py-8 relative">"No project stages"</p>
                        }.into_view()
                    } else {
                        view! {
                            <div class="space-y-8 relative">
                                {roadmap_stages.clone().into_iter().map(|milestone| {
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
                    }}
                </div>

                // Product Issues Column (Right)
                <div class="w-80 space-y-4">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-200 dark:border-zinc-600">"Product Issues"</h3>
                    {if product_issues.is_empty() {
                        view! {
                            <p class="text-gray-500 dark:text-gray-400 text-center py-4">"No product issues"</p>
                        }.into_view()
                    } else {
                        product_issues.into_iter().map(|issue| {
                            let milestone = roadmap_stages.iter().find(|m| m.id == issue.roadmap_stage_id);
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
                    }}
                </div>
            </div>
        </div>
    }
}
