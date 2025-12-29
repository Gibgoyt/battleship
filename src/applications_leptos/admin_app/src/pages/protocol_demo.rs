use leptos::*;
use crate::api::fetch_hello_world;

#[component]
pub fn ProtocolDemo() -> impl IntoView {
    let (loading, set_loading) = create_signal(false);
    let (response, set_response) = create_signal::<Option<String>>(None);
    let (error, set_error) = create_signal::<Option<String>>(None);
    let (header_info, set_header_info) = create_signal::<Option<String>>(None);

    let fetch_data = move |_| {
        set_loading.set(true);
        set_error.set(None);
        set_response.set(None);
        set_header_info.set(None);

        spawn_local(async move {
            match fetch_hello_world().await {
                Ok(resp) => {
                    // Format header info
                    let header_text = format!(
                        "Method: {} ({})\nVersion: {}\nContent Type: {}\nEndpoint ID: {}\nTotal Length: {} bytes\nBody Length: {} bytes",
                        resp.header.method_name(),
                        resp.header.method,
                        resp.header.version,
                        resp.header.content_type,
                        resp.header.endpoint_id,
                        resp.header.total_length,
                        resp.header.body_length
                    );

                    set_header_info.set(Some(header_text));
                    set_response.set(Some(resp.message));
                },
                Err(e) => {
                    set_error.set(Some(e));
                }
            }
            set_loading.set(false);
        });
    };

    view! {
        <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div class="max-w-4xl mx-auto">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    "Binary Protocol Demo"
                </h1>

                <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        "Test Endpoint"
                    </h2>

                    <div class="mb-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            "Endpoint: "
                            <code class="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-xs">
                                "GET https://devbackend.splitdo.app:8443/hello"
                            </code>
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            "Response Format: HTTP with Binary Body (12-byte header + length-prefixed string)"
                        </p>
                    </div>

                    <button
                        on:click=fetch_data
                        disabled=move || loading.get()
                        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {move || if loading.get() { "Loading..." } else { "Fetch Hello World" }}
                    </button>
                </div>

                // Error display
                {move || error.get().map(|err| view! {
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                        <h3 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                            "Error"
                        </h3>
                        <pre class="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                            {err}
                        </pre>
                    </div>
                })}

                // Header info display
                {move || header_info.get().map(|info| view! {
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                        <h3 class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            "Message Header (12 bytes)"
                        </h3>
                        <pre class="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap font-mono">
                            {info}
                        </pre>
                    </div>
                })}

                // Response display
                {move || response.get().map(|msg| view! {
                    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                            "Hello World Message"
                        </h3>
                        <p class="text-2xl text-green-700 dark:text-green-300 font-mono">
                            {msg}
                        </p>
                    </div>
                })}
            </div>
        </div>
    }
}
