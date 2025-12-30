use leptos::*;
use wasm_bindgen_futures::spawn_local;
use crate::api::whatsapp_client;
use crate::components::modals::Modal;

#[component]
pub fn ConnectWhatsAppModal(
    #[prop(into)] show: Signal<bool>,
    on_close: Callback<()>,
    on_success: Callback<()>,
) -> impl IntoView {
    // Form state
    let (device_name, set_device_name) = create_signal(String::new());
    let (loading, set_loading) = create_signal(false);
    let (error_message, set_error_message) = create_signal(Option::<String>::None);

    // QR code state
    let (qr_code_data, set_qr_code_data) = create_signal(Option::<String>::None);
    let (session_id, set_session_id) = create_signal(Option::<String>::None);

    // Reset state when modal closes
    create_effect(move |_| {
        if !show.get() {
            set_device_name.set(String::new());
            set_loading.set(false);
            set_error_message.set(None);
            set_qr_code_data.set(None);
            set_session_id.set(None);
        }
    });

    // Handle form submission
    let handle_submit = move |ev: leptos::ev::SubmitEvent| {
        ev.prevent_default();

        let device_name_val = device_name.get();
        if device_name_val.trim().is_empty() {
            set_error_message.set(Some("Device name is required".to_string()));
            return;
        }

        set_loading.set(true);
        set_error_message.set(None);

        spawn_local(async move {
            match whatsapp_client::create_whatsapp_account(device_name_val).await {
                Ok(response) => {
                    web_sys::console::log_1(&"QR code received successfully".into());

                    // Set QR code data
                    set_qr_code_data.set(Some(response.qr_code));
                    set_session_id.set(Some(response.session_id));

                    // Start polling for connection status
                    start_connection_polling(on_success);
                }
                Err(error) => {
                    web_sys::console::error_1(&format!("Failed to create account: {}", error).into());
                    set_error_message.set(Some(format!("Failed to create account: {}", error)));
                }
            }
            set_loading.set(false);
        });
    };

    // Handle close
    let handle_close = move || {
        on_close.call(());
    };

    let modal_content = move || {
        if let Some(qr_code) = qr_code_data.get() {
            // QR Code Display State
            view! {
                <div class="flex flex-col items-center justify-center py-6">
                    <div class="flex flex-col items-center">
                        // QR Code with white background for better scanning
                        <div class="bg-white p-4 rounded-lg shadow-sm border">
                            <QRCodeDisplay qr_data=qr_code />
                        </div>

                        // Instructions
                        <div class="mt-6 text-center">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                "Scan this QR code with your WhatsApp mobile app"
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">
                                "Open WhatsApp > Settings > Linked Devices > Link a Device"
                            </p>
                        </div>

                        // Session info
                        {move || if let Some(session) = session_id.get() {
                            view! {
                                <div class="mt-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p class="text-xs text-blue-700 dark:text-blue-300 text-center">
                                        {"Session: "} {session}
                                    </p>
                                </div>
                            }.into_view()
                        } else {
                            view! {}.into_view()
                        }}

                        // Polling indicator
                        <div class="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            "Waiting for connection..."
                        </div>
                    </div>
                </div>
            }.into_view()
        } else if loading.get() {
            // Loading State
            view! {
                <div class="flex flex-col items-center justify-center py-8">
                    <div class="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">"Generating QR code..."</p>
                </div>
            }.into_view()
        } else {
            // Form Input State
            view! {
                <div class="py-4">
                    // Error display
                    {move || if let Some(error) = error_message.get() {
                        view! {
                            <div class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p class="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        }.into_view()
                    } else {
                        view! {}.into_view()
                    }}

                    // Form
                    <form on:submit=handle_submit>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                "Device Name"
                            </label>
                            <input
                                type="text"
                                prop:value=device_name
                                on:input=move |ev| set_device_name.set(event_target_value(&ev))
                                placeholder="e.g., SplitDo Support Bot"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                                autofocus
                            />
                            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                "This name will appear in your WhatsApp linked devices list"
                            </p>
                        </div>

                        <div class="flex gap-3">
                            <button
                                type="button"
                                on:click=move |_| handle_close()
                                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                "Cancel"
                            </button>
                            <button
                                type="submit"
                                disabled=move || loading.get()
                                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {move || if loading.get() {
                                    view! {
                                        <>
                                            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            "Generating..."
                                        </>
                                    }.into_view()
                                } else {
                                    view! {
                                        "Generate QR Code"
                                    }.into_view()
                                }}
                            </button>
                        </div>
                    </form>
                </div>
            }.into_view()
        }
    };

    view! {
        <Show when=move || show.get() fallback=|| view! {}>
            <Modal
                show=show
                on_close=move || handle_close()
                title="Connect WhatsApp Account".to_string()
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

// Start polling for connection status
fn start_connection_polling(on_success: Callback<()>) {
    // For now, we'll simulate connection success after a few seconds
    // In a real implementation, you would poll the accounts endpoint
    spawn_local(async move {
        // Simulate scanning time - in real implementation, poll the accounts endpoint
        gloo_timers::future::TimeoutFuture::new(5000).await;

        web_sys::console::log_1(&"Simulating successful WhatsApp connection".into());

        // Call success callback
        on_success.call(());
    });
}