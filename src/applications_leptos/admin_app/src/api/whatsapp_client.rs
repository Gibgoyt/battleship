use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use serde::{Deserialize, Serialize};
use web_sys::Response;

// WhatsApp API response structures matching the backend
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct WhatsAppAccountsResponse {
    pub accounts: Vec<WhatsAppAccount>,
    pub count: usize,
    pub user_id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct WhatsAppAccount {
    pub jid: String,
    pub device_name: Option<String>,
    pub device_id: Option<u64>,
    pub user_id: Option<String>,
    pub platform: Option<String>,
    pub account_type: Option<String>,
    pub session_dir: Option<String>,
    pub registered_at: Option<u64>,
    pub connection_state: Option<ConnectionState>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ConnectionState {
    pub status: String,
    pub connected: Option<bool>,
    pub authenticated: Option<bool>,
    pub ready: Option<bool>,
    pub app_state_synced: Option<bool>,
}

// JS interop - call window.adminApiFetch which automatically adds auth headers
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = adminApiFetch, catch)]
    async fn admin_api_fetch_js(url: &str, options: JsValue) -> Result<JsValue, JsValue>;
}

// Helper to call window.adminApiFetch and parse JSON response
async fn whatsapp_api_fetch<T: serde::de::DeserializeOwned>(url: &str, method: &str) -> Result<T, String> {
    // Create fetch options
    let opts = js_sys::Object::new();
    js_sys::Reflect::set(&opts, &"method".into(), &method.into())
        .map_err(|_| "Failed to set method".to_string())?;

    // Call window.adminApiFetch (which adds Authorization header automatically)
    let response_value = admin_api_fetch_js(url, opts.into())
        .await
        .map_err(|e| format!("Fetch error: {:?}", e))?;

    // Convert JsValue to web_sys::Response
    let response: Response = response_value
        .dyn_into()
        .map_err(|_| "Failed to convert to Response".to_string())?;

    // Check if response is ok
    if !response.ok() {
        return Err(format!("HTTP error: {} - {}", response.status(), response.status_text()));
    }

    // Get JSON from response
    let json_promise = response
        .json()
        .map_err(|_| "Failed to call .json()".to_string())?;

    let json_value = JsFuture::from(json_promise)
        .await
        .map_err(|e| format!("JSON parse error: {:?}", e))?;

    // Convert to Rust type
    serde_wasm_bindgen::from_value(json_value)
        .map_err(|e| format!("Deserialization error: {:?}", e))
}

// Fetch WhatsApp accounts from the backend
pub async fn fetch_whatsapp_accounts() -> Result<Vec<WhatsAppAccount>, String> {
    web_sys::console::log_1(&"Fetching WhatsApp accounts...".into());

    let response: WhatsAppAccountsResponse = whatsapp_api_fetch("https://socials.splitdo.app:2087/api/v1/whatsapp/accounts", "GET").await?;

    web_sys::console::log_1(&format!("Fetched {} WhatsApp accounts for user {}", response.count, response.user_id).into());

    Ok(response.accounts)
}

// Alternative fetch function that can be used for development/testing
#[allow(dead_code)]
pub async fn fetch_whatsapp_accounts_dev() -> Result<Vec<WhatsAppAccount>, String> {
    // Use localhost for development if needed
    let response: WhatsAppAccountsResponse = whatsapp_api_fetch("http://localhost:2087/api/v1/whatsapp/accounts", "GET").await?;
    Ok(response.accounts)
}