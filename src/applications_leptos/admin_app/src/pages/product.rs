use leptos::*;
use crate::api::{get_initial_data_from_window, fetch_initial_data, ProductIssue, ProjectStage};

#[component]
fn StatusBadge(#[prop(into)] status: String) -> impl IntoView {
    let (icon_path, color_class, label) = match status.as_str() {
        "open" => ("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "text-blue-500 bg-blue-50 dark:bg-blue-900/20", "Open"),
        "in-progress" => ("M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20", "In Progress"),
        "closed" => ("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", "text-green-500 bg-green-50 dark:bg-green-900/20", "Closed"),
        "delayed" => ("M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", "text-red-500 bg-red-50 dark:bg-red-900/20", "Delayed"),
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
pub fn Product() -> impl IntoView {
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">"Product"</h2>
                    <p class="text-gray-600 dark:text-gray-400">"UI/UX perspective and user value focus"</p>
                </div>
                <button class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    "New Product Issue"
                </button>
            </div>

            <Suspense fallback=move || view! {
                <div class="grid grid-cols-1 gap-4">
                    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 animate-pulse">
                        <div class="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-4"></div>
                        <div class="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                    </div>
                    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 animate-pulse">
                        <div class="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-4"></div>
                        <div class="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                    </div>
                </div>
            }>
                {move || {
                    initial_data.get().map(|data| match data {
                        Ok(data) => view! {
                            <ProductContent
                                product_issues=data.product_issues
                                milestones=data.project_stages
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
fn ProductContent(
    product_issues: Vec<ProductIssue>,
    milestones: Vec<ProjectStage>,
) -> impl IntoView {
    view! {
        <div class="grid grid-cols-1 gap-4">
            {if product_issues.is_empty() {
                view! {
                    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-12">
                        <p class="text-gray-500 dark:text-gray-400 text-center">"No product issues found"</p>
                    </div>
                }.into_view()
            } else {
                product_issues.into_iter().map(|issue| {
                    let milestone = milestones.iter().find(|m| m.id == issue.roadmap_stage_id);
                    let milestone_title = milestone.map(|m| m.title.clone()).unwrap_or_else(|| "Unknown milestone".to_string());

                    view! {
                        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <span class="text-sm font-medium text-green-600 dark:text-green-400">
                                        {"#"}{issue.issue_number}
                                    </span>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{issue.title}</h3>
                                    <StatusBadge status={issue.status.clone()} />
                                </div>
                                <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>

                            {issue.description.as_ref().map(|desc| view! {
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{desc}</p>
                            })}

                            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <span>"Related to: " {milestone_title}</span>
                                <span>"•"</span>
                                <span>{issue.message_count} " comments"</span>
                                <span>"•"</span>
                                <span>"By " {issue.creator_name.clone()}</span>
                            </div>

                            {issue.user_impact.as_ref().map(|impact| view! {
                                <div class="mt-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded text-sm text-gray-700 dark:text-gray-300">
                                    <strong class="text-gray-900 dark:text-white">"User Impact: "</strong>
                                    {impact}
                                </div>
                            })}
                        </div>
                    }
                }).collect::<Vec<_>>().into_view()
            }}
        </div>
    }
}
