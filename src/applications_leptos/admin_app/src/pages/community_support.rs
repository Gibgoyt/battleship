use leptos::*;
use wasm_bindgen_futures::spawn_local;
use crate::api::whatsapp_client::{self, WhatsAppAccount};
use crate::components::modals::{ConnectWhatsAppModal, AuthenticateWhatsAppModal};

#[derive(Clone, Debug)]
pub struct MockMessage {
    pub sender: String,
    pub content: String,
    pub timestamp: String,
    pub platform: String,
}

#[derive(Clone, Debug)]
pub struct MockBot {
    pub name: String,
    pub platform: String,
    pub status: String,
    pub id: String,
}

#[component]
pub fn CommunitySupport() -> impl IntoView {
    let (selected_tab, set_selected_tab) = create_signal("whatsapp".to_string());
    let (whatsapp_accounts, set_whatsapp_accounts) = create_signal::<Vec<WhatsAppAccount>>(vec![]);
    let (loading_whatsapp, set_loading_whatsapp) = create_signal(false);

    // Modal state for connecting WhatsApp accounts
    let (show_connect_modal, set_show_connect_modal) = create_signal(false);

    // Modal state for authenticating WhatsApp accounts
    let (show_auth_modal, set_show_auth_modal) = create_signal(false);
    let (auth_account_jid, set_auth_account_jid) = create_signal::<Option<String>>(None);

    // Mock messages for each platform
    let mock_messages = vec![
        MockMessage {
            sender: "+27639019917".to_string(),
            content: "Hi, I need help with my SplitDo account setup".to_string(),
            timestamp: "2025-01-01 10:30 AM".to_string(),
            platform: "whatsapp".to_string(),
        },
        MockMessage {
            sender: "+27123456789".to_string(),
            content: "How do I create a new project?".to_string(),
            timestamp: "2025-01-01 09:15 AM".to_string(),
            platform: "whatsapp".to_string(),
        },
        MockMessage {
            sender: "@splitdo_user1".to_string(),
            content: "Is there a mobile app available?".to_string(),
            timestamp: "2025-01-01 08:45 AM".to_string(),
            platform: "telegram".to_string(),
        },
        MockMessage {
            sender: "@customer_support".to_string(),
            content: "Welcome to SplitDo support channel!".to_string(),
            timestamp: "2025-01-01 08:00 AM".to_string(),
            platform: "telegram".to_string(),
        },
        MockMessage {
            sender: "User#1234".to_string(),
            content: "Bug report: Unable to save project settings".to_string(),
            timestamp: "2025-01-01 11:00 AM".to_string(),
            platform: "discord".to_string(),
        },
        MockMessage {
            sender: "DevTeam#5678".to_string(),
            content: "Thanks for the report, we'll investigate".to_string(),
            timestamp: "2025-01-01 11:15 AM".to_string(),
            platform: "discord".to_string(),
        },
    ];

    // Mock bots for Telegram and Discord
    let mock_telegram_bots = vec![
        MockBot {
            name: "SplitDo Support Bot".to_string(),
            platform: "telegram".to_string(),
            status: "ready".to_string(),
            id: "@splitdo_support_bot".to_string(),
        },
        MockBot {
            name: "Notification Bot".to_string(),
            platform: "telegram".to_string(),
            status: "connecting".to_string(),
            id: "@splitdo_notifications".to_string(),
        },
    ];

    let mock_discord_bots = vec![
        MockBot {
            name: "SplitDo Assistant".to_string(),
            platform: "discord".to_string(),
            status: "ready".to_string(),
            id: "Bot#1454448844149358734".to_string(),
        },
        MockBot {
            name: "Moderation Bot".to_string(),
            platform: "discord".to_string(),
            status: "disconnected".to_string(),
            id: "ModBot#9876543210".to_string(),
        },
    ];

    // Load WhatsApp accounts on component mount
    create_effect(move |_| {
        spawn_local(async move {
            set_loading_whatsapp.set(true);
            match whatsapp_client::fetch_whatsapp_accounts().await {
                Ok(accounts) => {
                    set_whatsapp_accounts.set(accounts);
                }
                Err(e) => {
                    web_sys::console::error_1(&format!("Failed to fetch WhatsApp accounts: {:?}", e).into());
                    // Set empty accounts on error
                    set_whatsapp_accounts.set(vec![]);
                }
            }
            set_loading_whatsapp.set(false);
        });
    });

    // Refresh callback to reload accounts after successful connection
    let refresh_whatsapp_accounts = move || {
        spawn_local(async move {
            set_loading_whatsapp.set(true);
            match whatsapp_client::fetch_whatsapp_accounts().await {
                Ok(accounts) => {
                    set_whatsapp_accounts.set(accounts);
                    web_sys::console::log_1(&"WhatsApp accounts refreshed".into());
                },
                Err(e) => web_sys::console::error_1(&format!("Failed to refresh accounts: {:?}", e).into()),
            }
            set_loading_whatsapp.set(false);
        });
    };

    // Filter messages by platform
    let filtered_messages = move || {
        mock_messages
            .iter()
            .filter(|msg| msg.platform == selected_tab.get())
            .cloned()
            .collect::<Vec<_>>()
    };

    // Tab button style
    let tab_button_class = move |tab: &str| {
        let base = "px-4 py-2 rounded-lg font-medium transition-colors";
        if selected_tab.get() == tab {
            format!("{} bg-blue-600 text-white", base)
        } else {
            format!("{} bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600", base)
        }
    };

    // Status badge component
    let status_badge = |status: &str| {
        let (class, text) = match status {
            "ready" => ("bg-green-500", "Ready"),
            "connecting" => ("bg-yellow-500", "Connecting"),
            "disconnected" => ("bg-red-500", "Disconnected"),
            _ => ("bg-gray-500", "Unknown"),
        };
        view! {
            <span class=format!("px-2 py-1 rounded-full text-xs font-medium text-white {}", class)>
                {text}
            </span>
        }
    };

    view! {
        <div class="p-6">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                    "Community Support"
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    "Multi-channel customer support inbox and integrations"
                </p>
            </div>

            // Infobar with two sections
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                // Inbox Section
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            "Inbox"
                        </h2>

                        // Platform tabs
                        <div class="flex gap-2">
                            <button
                                class=move || tab_button_class("whatsapp")
                                on:click=move |_| set_selected_tab.set("whatsapp".to_string())
                            >
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                                    </svg>
                                    "WhatsApp"
                                </div>
                            </button>

                            <button
                                class=move || tab_button_class("telegram")
                                on:click=move |_| set_selected_tab.set("telegram".to_string())
                            >
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                    </svg>
                                    "Telegram"
                                </div>
                            </button>

                            <button
                                class=move || tab_button_class("discord")
                                on:click=move |_| set_selected_tab.set("discord".to_string())
                            >
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                                    </svg>
                                    "Discord"
                                </div>
                            </button>
                        </div>
                    </div>

                    // Messages list
                    <div class="p-4 max-h-96 overflow-y-auto">
                        <div class="space-y-3">
                            {move || filtered_messages().into_iter().map(|msg| {
                                view! {
                                    <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="font-medium text-gray-900 dark:text-white text-sm">
                                                {msg.sender}
                                            </span>
                                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                        <p class="text-gray-700 dark:text-gray-300 text-sm">
                                            {msg.content}
                                        </p>
                                    </div>
                                }
                            }).collect::<Vec<_>>()}
                        </div>

                        // Mock input area
                        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div class="flex gap-2">
                                <input
                                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    placeholder="Type your message..."
                                    disabled
                                />
                                <button
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    disabled
                                >
                                    "Send"
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                // Integrations Section
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                            "Integrations"
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            "Connected chat platforms and bots"
                        </p>
                    </div>

                    <div class="p-4 max-h-96 overflow-y-auto">
                        // WhatsApp Bots (Real Data)
                        <div class="mb-6">
                            <h3 class="flex items-center justify-between font-medium text-gray-900 dark:text-white mb-3">
                                <div class="flex items-center gap-2">
                                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                                    </svg>
                                    "WhatsApp Bots"
                                </div>

                                // Connect button
                                <button
                                    on:click=move |_| set_show_connect_modal.set(true)
                                    class="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                                    title="Connect WhatsApp Account"
                                >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                    "Connect"
                                </button>
                            </h3>

                            {move || if loading_whatsapp.get() {
                                view! {
                                    <div class="flex items-center justify-center py-8">
                                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span class="ml-2 text-gray-600 dark:text-gray-400">"Loading..."</span>
                                    </div>
                                }
                            } else if whatsapp_accounts.get().is_empty() {
                                view! {
                                    <div class="text-center py-8">
                                        <p class="text-gray-500 dark:text-gray-400 text-sm">"No WhatsApp accounts connected"</p>
                                    </div>
                                }
                            } else {
                                view! {
                                    <div class="space-y-3">
                                        {whatsapp_accounts.get().into_iter().map(|account| {
                                            let status = if account.connected && account.authenticated {
                                                "ready"
                                            } else if account.connected {
                                                "connecting"
                                            } else {
                                                "disconnected"
                                            };

                                            let account_jid = account.jid.clone();
                                            let is_authenticated = account.authenticated;

                                            view! {
                                                <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <div class="flex-1">
                                                            <div class="font-medium text-gray-900 dark:text-white text-sm">
                                                                {account.device_name.clone()}
                                                            </div>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                                                {if let Some(phone) = &account.phone_number {
                                                                    format!("{} ({})", phone, account.jid)
                                                                } else {
                                                                    account.jid.clone()
                                                                }}
                                                            </div>
                                                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {"Platform: "} {account.platform.clone()}
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            {if !is_authenticated {
                                                                view! {
                                                                    <button
                                                                        on:click=move |_| {
                                                                            set_auth_account_jid.set(Some(account_jid.clone()));
                                                                            set_show_auth_modal.set(true);
                                                                        }
                                                                        class="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                                        title="Authenticate Account"
                                                                    >
                                                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                                                        </svg>
                                                                        "Authenticate"
                                                                    </button>
                                                                }.into_view()
                                                            } else {
                                                                view! {}.into_view()
                                                            }}
                                                            {status_badge(&status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                        }).collect::<Vec<_>>()}
                                    </div>
                                }
                            }}
                        </div>

                        // Telegram Bots (Mock Data)
                        <div class="mb-6">
                            <h3 class="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3">
                                <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                </svg>
                                "Telegram Bots"
                            </h3>

                            <div class="space-y-3">
                                {mock_telegram_bots.into_iter().map(|bot| {
                                    view! {
                                        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                            <div class="flex justify-between items-start mb-2">
                                                <div>
                                                    <div class="font-medium text-gray-900 dark:text-white text-sm">
                                                        {bot.name}
                                                    </div>
                                                    <div class="text-xs text-gray-500 dark:text-gray-400">
                                                        {bot.id}
                                                    </div>
                                                </div>
                                                {status_badge(&bot.status)}
                                            </div>
                                        </div>
                                    }
                                }).collect::<Vec<_>>()}
                            </div>
                        </div>

                        // Discord Bots (Mock Data)
                        <div>
                            <h3 class="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3">
                                <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                                </svg>
                                "Discord Bots"
                            </h3>

                            <div class="space-y-3">
                                {mock_discord_bots.into_iter().map(|bot| {
                                    view! {
                                        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                            <div class="flex justify-between items-start mb-2">
                                                <div>
                                                    <div class="font-medium text-gray-900 dark:text-white text-sm">
                                                        {bot.name}
                                                    </div>
                                                    <div class="text-xs text-gray-500 dark:text-gray-400">
                                                        {bot.id}
                                                    </div>
                                                </div>
                                                {status_badge(&bot.status)}
                                            </div>
                                        </div>
                                    }
                                }).collect::<Vec<_>>()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        // Modal for connecting WhatsApp accounts
        <ConnectWhatsAppModal
            show=show_connect_modal
            on_close=Callback::new(move |_| set_show_connect_modal.set(false))
            on_success=Callback::new(move |_| {
                set_show_connect_modal.set(false);
                refresh_whatsapp_accounts();
            })
        />

        // Modal for authenticating WhatsApp accounts
        <AuthenticateWhatsAppModal
            show=show_auth_modal
            account_jid=auth_account_jid
            on_close=Callback::new(move |_| {
                set_show_auth_modal.set(false);
                set_auth_account_jid.set(None);
            })
            on_success=Callback::new(move |_| {
                set_show_auth_modal.set(false);
                set_auth_account_jid.set(None);
                refresh_whatsapp_accounts();
            })
        />
    }
}