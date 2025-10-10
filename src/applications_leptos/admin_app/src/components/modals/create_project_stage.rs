use leptos::*;
use crate::api::{create_project_stage, CreateProjectStageRequest};
use super::Modal;

#[component]
pub fn CreateProjectStageModal(
    /// Whether the modal is visible
    #[prop(into)]
    show: Signal<bool>,
    /// Callback to close the modal
    on_close: impl Fn() + 'static + Copy + Clone,
    /// Callback after successful creation
    on_success: impl Fn() + 'static + Clone,
) -> impl IntoView {
    // Form state
    let (title, set_title) = create_signal(String::new());
    let (description, set_description) = create_signal(String::new());
    let (status, set_status) = create_signal(String::from("upcoming"));
    let (target_date, set_target_date) = create_signal(String::new());

    // UI state
    let (loading, set_loading) = create_signal(false);
    let (error, set_error) = create_signal(Option::<String>::None);

    // Reset form when modal closes
    create_effect(move |_| {
        if !show.get() {
            set_title.set(String::new());
            set_description.set(String::new());
            set_status.set(String::from("upcoming"));
            set_target_date.set(String::new());
            set_error.set(None);
        }
    });

    let handle_submit = move |ev: ev::SubmitEvent| {
        ev.prevent_default();

        // Validation
        if title.get().trim().is_empty() {
            set_error.set(Some("Title is required".to_string()));
            return;
        }

        set_loading.set(true);
        set_error.set(None);

        // Clone callbacks for async block
        let on_close_clone = on_close.clone();
        let on_success_clone = on_success.clone();

        let request = CreateProjectStageRequest {
            title: title.get().trim().to_string(),
            description: if description.get().trim().is_empty() {
                None
            } else {
                Some(description.get().trim().to_string())
            },
            status: status.get(),
            target_date: if target_date.get().trim().is_empty() {
                None
            } else {
                Some(target_date.get().trim().to_string())
            },
            display_order: None, // Auto-calculated by backend
            created_by: None,     // Optional
        };

        spawn_local(async move {
            match create_project_stage(request).await {
                Ok(stage) => {
                    logging::log!("✅ Project stage created: {}", stage.title);
                    set_loading.set(false);
                    on_close_clone();
                    on_success_clone();
                }
                Err(err) => {
                    logging::error!("❌ Failed to create project stage: {}", err.clone());
                    set_error.set(Some(err));
                    set_loading.set(false);
                }
            }
        });
    };

    view! {
        <Modal show=show on_close=on_close title="Add Milestone".to_string()>
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
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                        placeholder="e.g., MVP Launch"
                        prop:value=move || title.get()
                        on:input=move |ev| set_title.set(event_target_value(&ev))
                        required
                    />
                </div>

                // Description field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "Description"
                    </label>
                    <textarea
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                        rows="3"
                        placeholder="Brief description of this milestone..."
                        prop:value=move || description.get()
                        on:input=move |ev| set_description.set(event_target_value(&ev))
                    />
                </div>

                // Status field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "Status" <span class="text-red-500">"*"</span>
                    </label>
                    <select
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                        on:change=move |ev| set_status.set(event_target_value(&ev))
                        prop:value=move || status.get()
                    >
                        <option value="upcoming">"Upcoming"</option>
                        <option value="current">"Current"</option>
                        <option value="completed">"Completed"</option>
                        <option value="blocked">"Blocked"</option>
                    </select>
                </div>

                // Target Date field
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        "Target Date"
                    </label>
                    <input
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                        prop:value=move || target_date.get()
                        on:input=move |ev| set_target_date.set(event_target_value(&ev))
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
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        disabled=move || loading.get()
                    >
                        {move || if loading.get() { "Creating..." } else { "Create Milestone" }}
                    </button>
                </div>
            </form>
        </Modal>
    }
}
