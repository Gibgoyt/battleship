mod create_project_stage;
mod create_product_issue;
mod create_development_issue;
mod connect_whatsapp_modal;
mod authenticate_whatsapp_modal;

pub use create_project_stage::CreateProjectStageModal;
pub use create_product_issue::CreateProductIssueModal;
pub use create_development_issue::CreateDevelopmentIssueModal;
pub use connect_whatsapp_modal::ConnectWhatsAppModal;
pub use authenticate_whatsapp_modal::AuthenticateWhatsAppModal;

use leptos::*;

/// Base modal wrapper component with backdrop, close button, ESC handling
#[component]
pub fn Modal(
    /// Whether the modal is visible
    #[prop(into)]
    show: Signal<bool>,
    /// Callback to close the modal
    on_close: impl Fn() + 'static + Copy,
    /// Modal title
    title: String,
    /// Modal content
    children: Children,
) -> impl IntoView {
    // Handle ESC key to close modal
    let handle_keydown = move |ev: web_sys::KeyboardEvent| {
        if ev.key() == "Escape" {
            on_close();
        }
    };

    // Add event listener when modal is shown
    create_effect(move |_| {
        if show.get() {
            if let Some(window) = web_sys::window() {
                if let Some(document) = window.document() {
                    if let Some(body) = document.body() {
                        // Prevent body scroll when modal is open
                        let _ = body.style().set_property("overflow", "hidden");
                    }
                }
            }
        } else {
            if let Some(window) = web_sys::window() {
                if let Some(document) = window.document() {
                    if let Some(body) = document.body() {
                        let _ = body.style().set_property("overflow", "auto");
                    }
                }
            }
        }
    });

    let content = children();

    view! {
        <Show when=move || show.get()>
            // Backdrop
            <div
                class="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
                on:click=move |_| on_close()
            />

            // Modal container
            <div
                class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
                on:keydown=handle_keydown
            >
                // Modal card
                <div
                    class="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-zinc-700"
                    on:click=|ev| ev.stop_propagation() // Prevent click from closing
                >
                    // Header
                    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                            {title.clone()}
                        </h2>
                        <button
                            on:click=move |_| on_close()
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    // Content
                    <div class="p-6">
                        {content.clone()}
                    </div>
                </div>
            </div>
        </Show>
    }
}
