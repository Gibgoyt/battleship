use leptos::*;
use crate::api::{get_initial_data_from_window, fetch_initial_data, DevelopmentIssue, ProjectStage};

// Mock data for tech stack (can be made dynamic later if needed)
#[derive(Clone)]
struct TechStack {
    name: &'static str,
    category: &'static str,
}

fn get_tech_stack() -> Vec<TechStack> {
    vec![
        TechStack { name: "Astro", category: "Frontend" },
        TechStack { name: "Leptos", category: "WASM" },
        TechStack { name: "Cloudflare", category: "Platform" },
        TechStack { name: "D1", category: "Database" },
        TechStack { name: "Cognito", category: "Auth" },
    ]
}

#[component]
fn StatusBadge(#[prop(into)] status: String) -> impl IntoView {
    let (icon_path, color_class, label) = match status.as_str() {
        "open" => ("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "text-blue-500 bg-blue-50 dark:bg-blue-900/20", "Open"),
        "in-progress" => ("M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20", "In Progress"),
        "closed" => ("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", "text-green-500 bg-green-50 dark:bg-green-900/20", "Closed"),
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
pub fn Development() -> impl IntoView {
    let tech_stack = get_tech_stack();

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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">"Development"</h2>
                    <p class="text-gray-600 dark:text-gray-400">"Technical implementation and developer resources"</p>
                </div>
                <button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    "New Dev Issue"
                </button>
            </div>

            // Tech Stack section (static)
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">"Tech Stack"</h3>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {tech_stack.into_iter().map(|tech| {
                        view! {
                            <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                                <p class="font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{tech.category}</p>
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>
            </div>

            // Development Issues section (dynamic from API)
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
                            <DevelopmentContent
                                development_issues=data.development_issues
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
fn DevelopmentContent(
    development_issues: Vec<DevelopmentIssue>,
    milestones: Vec<ProjectStage>,
) -> impl IntoView {
    view! {
        <div class="grid grid-cols-1 gap-4">
            {if development_issues.is_empty() {
                view! {
                    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-12">
                        <p class="text-gray-500 dark:text-gray-400 text-center">"No development issues found"</p>
                    </div>
                }.into_view()
            } else {
                development_issues.into_iter().map(|issue| {
                    let milestone = milestones.iter().find(|m| m.id == issue.roadmap_stage_id);
                    let milestone_title = milestone.map(|m| m.title.clone()).unwrap_or_else(|| "Unknown milestone".to_string());

                    view! {
                        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
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

                            {issue.description.as_ref().map(|desc| view! {
                                <div class="mt-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded text-sm text-gray-700 dark:text-gray-300 font-mono">
                                    <strong class="text-gray-900 dark:text-white font-sans">"Technical Details: "</strong>
                                    <span class="font-sans">{desc}</span>
                                </div>
                            })}
                        </div>
                    }
                }).collect::<Vec<_>>().into_view()
            }}
        </div>
    }
}
