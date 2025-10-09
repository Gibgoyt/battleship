use leptos::*;

// Mock data structures
#[derive(Clone)]
struct RoadmapMilestone {
    id: u32,
    title: &'static str,
}

#[derive(Clone)]
struct ProductIssue {
    id: &'static str,
    milestone_id: u32,
    title: &'static str,
    status: &'static str,
    priority: &'static str,
    comments: u32,
}

fn get_roadmap_milestones() -> Vec<RoadmapMilestone> {
    vec![
        RoadmapMilestone { id: 1, title: "User Authentication System" },
        RoadmapMilestone { id: 2, title: "Core Dashboard Features" },
        RoadmapMilestone { id: 3, title: "Analytics Integration" },
        RoadmapMilestone { id: 4, title: "Mobile Responsiveness" },
        RoadmapMilestone { id: 5, title: "Performance Optimization" },
    ]
}

fn get_product_issues() -> Vec<ProductIssue> {
    vec![
        ProductIssue { id: "p1", milestone_id: 2, title: "User onboarding flow confusion", status: "open", priority: "high", comments: 8 },
        ProductIssue { id: "p2", milestone_id: 2, title: "Dashboard layout improvements", status: "delayed", priority: "medium", comments: 15 },
        ProductIssue { id: "p3", milestone_id: 3, title: "Analytics dashboard UX review", status: "open", priority: "low", comments: 2 },
    ]
}

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
pub fn Product() -> impl IntoView {
    let product_issues = get_product_issues();
    let milestones = get_roadmap_milestones();

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

            <div class="grid grid-cols-1 gap-4">
                {product_issues.into_iter().map(|issue| {
                    let milestone = milestones.iter().find(|m| m.id == issue.milestone_id);
                    let milestone_title = milestone.map(|m| m.title).unwrap_or("");

                    view! {
                        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{issue.title}</h3>
                                    <PriorityBadge priority={issue.priority.to_string()} />
                                    <StatusBadge status={issue.status.to_string()} />
                                </div>
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>"Related to: " {milestone_title}</span>
                                <span>"•"</span>
                                <span>{issue.comments} " comments"</span>
                            </div>
                            <div class="mt-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded text-sm text-gray-700 dark:text-gray-300">
                                <strong>"User Impact: "</strong>
                                "This issue affects the user onboarding experience and may lead to confusion during first-time setup."
                            </div>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
