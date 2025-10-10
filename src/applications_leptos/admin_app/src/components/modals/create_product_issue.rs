use leptos::*;
use crate::api::{create_product_issue, CreateProductIssueRequest, ProjectStage};
use super::Modal;

#[component]
pub fn CreateProductIssueModal(
    /// Whether the modal is visible
    #[prop(into)]
    show: Signal<bool>,
    /// Callback to close the modal
    on_close: impl Fn() + 'static + Copy + Clone,
    /// Callback after successful creation
    on_success: impl Fn() + 'static + Clone,
    /// Available project stages for dropdown
    #[prop(into)]
    project_stages: Signal<Vec<ProjectStage>>,
    /// Current user's team member ID
    #[prop(into)]
    current_user_id: Signal<i32>,
) -> impl IntoView {
    // Form state
    let (title, set_title) = create_signal(String::new());
    let (description, set_description) = create_signal(String::new());
    let (user_impact, set_user_impact) = create_signal(String::new());
    let (roadmap_stage_id, set_roadmap_stage_id) = create_signal(0);

    // UI state
    let (loading, set_loading) = create_signal(false);
    let (error, set_error) = create_signal(Option::<String>::None);

    // Initialize roadmap_stage_id with first stage when stages load
    create_effect(move |_| {
        let stages = project_stages.get();
        if !stages.is_empty() && roadmap_stage_id.get() == 0 {
            set_roadmap_stage_id.set(stages[0].id);
        }
    });

    // Reset form when modal closes
    create_effect(move |_| {
        if !show.get() {
            set_title.set(String::new());
            set_description.set(String::new());
            set_user_impact.set(String::new());
            set_error.set(None);
            // Reset to first stage
            let stages = project_stages.get();
            if !stages.is_empty() {
                set_roadmap_stage_id.set(stages[0].id);
            }
        }
    });

    let handle_submit = move |ev: ev::SubmitEvent| {
        ev.prevent_default();

        // Validation
        if title.get().trim().is_empty() {
            set_error.set(Some("Title is required".to_string()));
            return;
        }

        if roadmap_stage_id.get() == 0 {
            set_error.set(Some("Please select a milestone".to_string()));
            return;
        }

        set_loading.set(true);
        set_error.set(None);

        // Clone callbacks for async block
        let on_close_clone = on_close.clone();
        let on_success_clone = on_success.clone();

        let request = CreateProductIssueRequest {
            roadmap_stage_id: roadmap_stage_id.get(),
            title: title.get().trim().to_string(),
            description: if description.get().trim().is_empty() {
                None
            } else {
                Some(description.get().trim().to_string())
            },
            user_impact: if user_impact.get().trim().is_empty() {
                None
            } else {
                Some(user_impact.get().trim().to_string())
            },
            created_by: current_user_id.get(),
        };

        spawn_local(async move {
            match create_product_issue(request).await {
                Ok(issue) => {
                    logging::log!("✅ Product issue created: {}", issue.title);
                    set_loading.set(false);
                    on_close_clone();
                    on_success_clone();
                }
                Err(err) => {
                    logging::error!("❌ Failed to create product issue: {}", err.clone());
                    set_error.set(Some(err));
                    set_loading.set(false);
                }
            }
        });
    };

    view! {
        <Modal show=show on_close=on_close title="New Product Issue".to_string()>
            <form on:submit=handle_submit class="space-y-4">
                // Error display
                {move || error.get().map(|err| view! {
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p class="text-sm text-red-700 dark:text-red-300">{err}</p>
                    </div>
                })}

                // Title field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "Title" <span class="text-red-500">"*"</span>
                    </label>
                    <input
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-zinc-700 dark:text-white"
                        placeholder="e.g., Add user profile page"
                        prop:value=move || title.get()
                        on:input=move |ev| set_title.set(event_target_value(&ev))
                        required
                    />
                </div>

                // Roadmap Stage field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "Related Milestone" <span class="text-red-500">"*"</span>
                    </label>
                    <select
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-zinc-700 dark:text-white"
                        on:change=move |ev| {
                            if let Ok(id) = event_target_value(&ev).parse::<i32>() {
                                set_roadmap_stage_id.set(id);
                            }
                        }
                        prop:value=move || roadmap_stage_id.get().to_string()
                    >
                        {move || project_stages.get().into_iter().map(|stage| {
                            view! {
                                <option value={stage.id.to_string()}>{stage.title}</option>
                            }
                        }).collect::<Vec<_>>()}
                    </select>
                </div>

                // Description field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "Description"
                    </label>
                    <textarea
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-zinc-700 dark:text-white"
                        rows="3"
                        placeholder="Describe the product issue..."
                        prop:value=move || description.get()
                        on:input=move |ev| set_description.set(event_target_value(&ev))
                    />
                </div>

                // User Impact field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "User Impact"
                    </label>
                    <textarea
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-zinc-700 dark:text-white"
                        rows="2"
                        placeholder="How does this affect users?"
                        prop:value=move || user_impact.get()
                        on:input=move |ev| set_user_impact.set(event_target_value(&ev))
                    />
                </div>

                // Actions
                <div class="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        on:click=move |_| on_close()
                        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        disabled=move || loading.get()
                    >
                        "Cancel"
                    </button>
                    <button
                        type="submit"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        disabled=move || loading.get()
                    >
                        {move || if loading.get() { "Creating..." } else { "Create Issue" }}
                    </button>
                </div>
            </form>
        </Modal>
    }
}
