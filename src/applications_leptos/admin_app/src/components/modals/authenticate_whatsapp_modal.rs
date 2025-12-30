use leptos::*;
use wasm_bindgen_futures::spawn_local;
use crate::api::whatsapp_client::{self, QrCodeGetResponse};
use crate::components::modals::Modal;

#[component]
pub fn AuthenticateWhatsAppModal(
    #[prop(into)] show: Signal<bool>,
    #[prop(into)] account_jid: Signal<Option<String>>,
    on_close: Callback<()>,
    on_success: Callback<()>,
) -> impl IntoView {
    // State
    let (loading, set_loading) = create_signal(false);
    let (error_message, set_error_message) = create_signal(Option::<String>::None);
    let (qr_response, set_qr_response) = create_signal(Option::<QrCodeGetResponse>::None);

    // Reset state when modal closes or account changes
    create_effect(move |_| {
        if !show.get() || account_jid.get().is_none() {
            set_loading.set(false);
            set_error_message.set(None);
            set_qr_response.set(None);
        }
    });

    // Load QR code when modal opens and account is set
    create_effect(move |_| {
        if show.get() {
            if let Some(jid) = account_jid.get() {
                set_loading.set(true);
                set_error_message.set(None);

                let jid_clone = jid.clone();
                spawn_local(async move {
                    match whatsapp_client::get_whatsapp_account_qr(&jid_clone).await {
                        Ok(response) => {
                            web_sys::console::log_1(&format!("QR response: {:?}", response).into());

                            if response.authenticated {
                                set_error_message.set(Some("Account is already authenticated".to_string()));
                            } else if let Some(_qr_code) = &response.qr_code {
                                set_qr_response.set(Some(response));
                                // Start polling for authentication status
                                start_auth_polling(jid_clone, on_success);
                            } else {
                                set_error_message.set(Some("No QR code available. Please try again.".to_string()));
                            }
                        }
                        Err(error) => {
                            web_sys::console::error_1(&format!("Failed to get QR code: {}", error).into());
                            set_error_message.set(Some(format!("Failed to get QR code: {}", error)));
                        }
                    }
                    set_loading.set(false);
                });
            }
        }
    });

    // Handle close
    let handle_close = move || {
        on_close.call(());
    };

    let modal_content = move || {
        if loading.get() {
            // Loading State
            view! {
                <div class="flex flex-col items-center justify-center py-8">
                    <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">"Loading QR code..."</p>
                </div>
            }.into_view()
        } else if let Some(error) = error_message.get() {
            // Error State
            view! {
                <div class="py-6">
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <button
                            on:click=move |_| handle_close()
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            "Close"
                        </button>
                    </div>
                </div>
            }.into_view()
        } else if let Some(qr_resp) = qr_response.get() {
            // QR Code Display State
            view! {
                <div class="flex flex-col items-center justify-center py-6">
                    <div class="flex flex-col items-center">
                        // QR Code with white background for better scanning
                        <div class="bg-white p-4 rounded-lg shadow-sm border">
                            <QRCodeDisplay qr_data=qr_resp.qr_code.unwrap_or_default() />
                        </div>

                        // Instructions
                        <div class="mt-6 text-center">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                "Authenticate WhatsApp Account"
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                "Scan this QR code with your WhatsApp mobile app"
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">
                                "Open WhatsApp > Settings > Linked Devices > Link a Device"
                            </p>
                        </div>

                        // Status and expiry info
                        <div class="mt-4 space-y-2">
                            <div class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p class="text-xs text-blue-700 dark:text-blue-300 text-center">
                                    {"Status: "} {qr_resp.status.clone()}
                                </p>
                            </div>

                            {move || if let Some(expires_at) = &qr_resp.expires_at {
                                view! {
                                    <div class="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p class="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                                            {"Expires at: "} {expires_at.clone()}
                                        </p>
                                    </div>
                                }.into_view()
                            } else {
                                view! {}.into_view()
                            }}
                        </div>

                        // Polling indicator
                        <div class="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            "Waiting for authentication..."
                        </div>

                        // Close button
                        <div class="mt-6">
                            <button
                                on:click=move |_| handle_close()
                                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                "Cancel"
                            </button>
                        </div>
                    </div>
                </div>
            }.into_view()
        } else {
            // Default/Empty State
            view! {
                <div class="py-6 text-center">
                    <p class="text-gray-500 dark:text-gray-400">"No account selected"</p>
                </div>
            }.into_view()
        }
    };

    view! {
        <Show when=move || show.get() fallback=|| view! {}>
            <Modal
                show=show
                on_close=move || handle_close()
                title="Authenticate WhatsApp Account".to_string()
            >
                {modal_content}
            </Modal>
        </Show>
    }
}

// QR Code Display Component using qrcode crate
#[component]
fn QRCodeDisplay(qr_data: String) -> impl IntoView {
    use qrcode::QrCode;
    use qrcode::render::svg;

    // Generate QR code SVG
    let svg_string = match QrCode::new(qr_data.as_bytes()) {
        Ok(code) => {
            code.render::<svg::Color>()
                .min_dimensions(256, 256)        // 256x256 pixel minimum size
                .dark_color(svg::Color("#000000"))  // Black squares
                .light_color(svg::Color("#ffffff")) // White background
                .build()
        }
        Err(_) => {
            web_sys::console::error_1(&"Failed to generate QR code".into());
            return view! {
                <div class="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-zinc-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div class="text-center">
                        <svg class="w-8 h-8 mx-auto text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-sm text-red-600 dark:text-red-400">"Failed to generate QR code"</p>
                    </div>
                </div>
            }.into_view()
        }
    };

    view! {
        <div inner_html=svg_string class="w-64 h-64"></div>
    }.into_view()
}

// Start polling for authentication status
fn start_auth_polling(jid: String, on_success: Callback<()>) {
    spawn_local(async move {
        let poll_interval = 2000; // Poll every 2 seconds
        let max_attempts = 60; // Poll for up to 2 minutes

        for attempt in 1..=max_attempts {
            web_sys::console::log_1(&format!("Polling attempt {} for account {}", attempt, jid).into());

            // Wait before checking
            gloo_timers::future::TimeoutFuture::new(poll_interval).await;

            // Check authentication status by fetching accounts
            match whatsapp_client::fetch_whatsapp_accounts().await {
                Ok(accounts) => {
                    // Find the account we're authenticating
                    if let Some(account) = accounts.iter().find(|a| a.jid == jid) {
                        if account.authenticated {
                            web_sys::console::log_1(&format!("Account {} authenticated successfully", jid).into());
                            on_success.call(());
                            return;
                        }
                    }
                }
                Err(e) => {
                    web_sys::console::error_1(&format!("Error polling accounts: {}", e).into());
                }
            }
        }

        web_sys::console::log_1(&format!("Polling timeout for account {}", jid).into());
    });
}