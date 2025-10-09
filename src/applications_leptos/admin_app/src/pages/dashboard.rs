use leptos::*;

// Mock data structures
#[derive(Clone)]
struct TeamMember {
    id: u32,
    name: &'static str,
    role: &'static str,
    online: bool,
}

fn get_team_members() -> Vec<TeamMember> {
    vec![
        TeamMember { id: 1, name: "Sarah Chen", role: "Project Manager", online: true },
        TeamMember { id: 2, name: "Mike Rodriguez", role: "Product Manager", online: true },
        TeamMember { id: 3, name: "Emma Thompson", role: "UI Designer", online: false },
        TeamMember { id: 4, name: "Alex Kumar", role: "Lead Developer", online: true },
        TeamMember { id: 5, name: "Jordan Lee", role: "Frontend Dev", online: true },
    ]
}

#[component]
pub fn Dashboard() -> impl IntoView {
    let team_members = get_team_members();
    let online_count = team_members.iter().filter(|m| m.online).count();
    let total_count = team_members.len();

    // Mock counts
    let active_issues = 6; // 3 dev + 3 product issues

    view! {
        <div class="p-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">"Dashboard"</h2>
                <p class="text-gray-600 dark:text-gray-400">"Overview of team activity and project status"</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                // Active Issues card
                <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Active Issues"</h3>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{active_issues}</p>
                </div>

                // Team Online card
                <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Team Online"</h3>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{format!("{}/{}", online_count, total_count)}</p>
                </div>

                // Current Milestone card
                <div class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">"Current Milestone"</h3>
                    <p class="text-lg font-bold text-gray-900 dark:text-white">"Core Dashboard Features"</p>
                </div>
            </div>

            // Team Members section
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 mt-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">"Team Members"</h3>
                <div class="space-y-3">
                    {team_members.into_iter().map(|member| {
                        let initials = member.name.split(' ')
                            .filter_map(|n| n.chars().next())
                            .collect::<String>();

                        view! {
                            <div key={member.id} class="flex items-center justify-between py-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                        {initials}
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">{member.name}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                                    </div>
                                </div>
                                <div class={if member.online { "w-3 h-3 rounded-full bg-green-500" } else { "w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" }} />
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>
            </div>
        </div>
    }
}
