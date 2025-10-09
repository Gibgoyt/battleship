use leptos::*;

// Mock data structures
#[derive(Clone)]
struct RoadmapMilestone {
    id: u32,
    title: &'static str,
    status: &'static str,
    date: &'static str,
}

#[derive(Clone)]
struct Issue {
    id: &'static str,
    milestone_id: u32,
    title: &'static str,
    status: &'static str,
    priority: &'static str,
    comments: u32,
}

fn get_roadmap_milestones() -> Vec<RoadmapMilestone> {
    vec![
        RoadmapMilestone { id: 1, title: "User Authentication System", status: "completed", date: "Jan 2025" },
        RoadmapMilestone { id: 2, title: "Core Dashboard Features", status: "current", date: "Feb 2025" },
        RoadmapMilestone { id: 3, title: "Analytics Integration", status: "upcoming", date: "Mar 2025" },
        RoadmapMilestone { id: 4, title: "Mobile Responsiveness", status: "upcoming", date: "Apr 2025" },
        RoadmapMilestone { id: 5, title: "Performance Optimization", status: "upcoming", date: "May 2025" },
    ]
}

fn get_development_issues() -> Vec<Issue> {
    vec![
        Issue { id: "d1", milestone_id: 2, title: "API rate limiting", status: "open", priority: "high", comments: 5 },
        Issue { id: "d2", milestone_id: 2, title: "Database query optimization", status: "in-progress", priority: "medium", comments: 12 },
        Issue { id: "d3", milestone_id: 3, title: "Firebase SDK integration", status: "open", priority: "high", comments: 3 },
    ]
}

fn get_product_issues() -> Vec<Issue> {
    vec![
        Issue { id: "p1", milestone_id: 2, title: "User onboarding flow confusion", status: "open", priority: "high", comments: 8 },
        Issue { id: "p2", milestone_id: 2, title: "Dashboard layout improvements", status: "delayed", priority: "medium", comments: 15 },
        Issue { id: "p3", milestone_id: 3, title: "Analytics dashboard UX review", status: "open", priority: "low", comments: 2 },
    ]
}

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
fn PriorityBadge(#[prop(into)] priority: String) -> impl IntoView {
    let color_class = match priority.as_str() {
        "high" => "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        "medium" => "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        "low" => "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
        _ => "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
    };

    view! {
        <span class={format!("px-2 py-1 rounded text-xs font-medium {}", color_class)}>
            {priority}
        </span>
    }
}

#[component]
pub fn Project() -> impl IntoView {
    let roadmap_milestones = get_roadmap_milestones();
    let development_issues = get_development_issues();
    let product_issues = get_product_issues();

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

            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-8 overflow-x-auto">
                <div class="flex gap-8 min-w-max">
                    // Development Issues Column (Left)
                    <div class="w-80 space-y-4">
                        <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-200 dark:border-zinc-600">"Development Issues"</h3>
                        {development_issues.into_iter().map(|issue| {
                            let milestone = roadmap_milestones.iter().find(|m| m.id == issue.milestone_id);
                            let milestone_title = milestone.map(|m| m.title).unwrap_or("");

                            view! {
                                <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
                                    <div class="flex items-start justify-between mb-2">
                                        <PriorityBadge priority={issue.priority.to_string()} />
                                        <StatusBadge status={issue.status.to_string()} />
                                    </div>
                                    <h4 class="font-medium text-gray-900 dark:text-white mb-1">{issue.title}</h4>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">"→ " {milestone_title}</p>
                                    <div class="text-xs text-gray-600 dark:text-gray-400">{issue.comments} " comments"</div>
                                </div>
                            }
                        }).collect::<Vec<_>>()}
                    </div>

                    // Main Roadmap Timeline (Center)
                    <div class="w-80 relative">
                        <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-300 transform -translate-x-1/2" />
                        <div class="space-y-8 relative">
                            {roadmap_milestones.into_iter().map(|milestone| {
                                view! {
                                    <div class="relative">
                                        <div class="absolute left-1/2 w-6 h-6 bg-white dark:bg-zinc-800 border-4 border-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1" />
                                        <div class="bg-white dark:bg-zinc-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 shadow-lg mt-4">
                                            <div class="flex items-center justify-between mb-2">
                                                <StatusBadge status={milestone.status.to_string()} />
                                                <span class="text-xs text-gray-500 dark:text-gray-400">{milestone.date}</span>
                                            </div>
                                            <h4 class="font-semibold text-gray-900 dark:text-white">{milestone.title}</h4>
                                        </div>
                                    </div>
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>

                    // Product Issues Column (Right)
                    <div class="w-80 space-y-4">
                        <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-200 dark:border-zinc-600">"Product Issues"</h3>
                        {product_issues.into_iter().map(|issue| {
                            let milestone = get_roadmap_milestones().iter().find(|m| m.id == issue.milestone_id).cloned();
                            let milestone_title = milestone.map(|m| m.title).unwrap_or("");

                            view! {
                                <div class="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
                                    <div class="flex items-start justify-between mb-2">
                                        <PriorityBadge priority={issue.priority.to_string()} />
                                        <StatusBadge status={issue.status.to_string()} />
                                    </div>
                                    <h4 class="font-medium text-gray-900 dark:text-white mb-1">{issue.title}</h4>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">"← " {milestone_title}</p>
                                    <div class="text-xs text-gray-600 dark:text-gray-400">{issue.comments} " comments"</div>
                                </div>
                            }
                        }).collect::<Vec<_>>()}
                    </div>
                </div>
            </div>
        </div>
    }
}
