use leptos::*;

// Mock data structures
#[derive(Clone)]
struct TechStack {
    name: &'static str,
    category: &'static str,
}

#[derive(Clone)]
struct RoadmapMilestone {
    id: u32,
    title: &'static str,
}

#[derive(Clone)]
struct DevelopmentIssue {
    id: &'static str,
    milestone_id: u32,
    title: &'static str,
    status: &'static str,
    priority: &'static str,
    comments: u32,
}

fn get_tech_stack() -> Vec<TechStack> {
    vec![
        TechStack { name: "React", category: "Frontend" },
        TechStack { name: "Node.js", category: "Backend" },
        TechStack { name: "PostgreSQL", category: "Database" },
        TechStack { name: "Firebase", category: "Services" },
        TechStack { name: "Sentry", category: "Monitoring" },
    ]
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

fn get_development_issues() -> Vec<DevelopmentIssue> {
    vec![
        DevelopmentIssue { id: "d1", milestone_id: 2, title: "API rate limiting", status: "open", priority: "high", comments: 5 },
        DevelopmentIssue { id: "d2", milestone_id: 2, title: "Database query optimization", status: "in-progress", priority: "medium", comments: 12 },
        DevelopmentIssue { id: "d3", milestone_id: 3, title: "Firebase SDK integration", status: "open", priority: "high", comments: 3 },
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
pub fn Development() -> impl IntoView {
    let tech_stack = get_tech_stack();
    let development_issues = get_development_issues();
    let milestones = get_roadmap_milestones();

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

            // Tech Stack section
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

            // Development Issues section
            <div class="grid grid-cols-1 gap-4">
                {development_issues.into_iter().map(|issue| {
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
                            <div class="mt-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded text-sm text-gray-700 dark:text-gray-300 font-mono">
                                <strong>"Technical Details: "</strong>
                                "Need to implement rate limiting middleware to prevent API abuse and ensure system stability."
                            </div>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
