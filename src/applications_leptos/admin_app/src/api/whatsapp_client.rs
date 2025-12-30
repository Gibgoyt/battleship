use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use serde::{Deserialize, Serialize};
use web_sys::Response;

// WhatsApp API response structures matching the backend
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct WhatsAppAccountsResponse {
    pub success: bool,
    pub message: String,
    pub accounts: Vec<WhatsAppAccount>,
    pub count: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct WhatsAppAccount {
    pub jid: String,
    pub phone_number: Option<String>,
    pub device_name: String,
    pub platform: String,
    pub connected: bool,
    pub authenticated: bool,
    pub created_at: String,
    pub last_seen: String,
}

// Request/Response types for creating WhatsApp accounts
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CreateWhatsAppAccountRequest {
    pub device_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct QrCodeResponse {
    pub success: bool,
    pub message: String,
    pub session_id: String,
    pub qr_code: String,
    pub authenticated: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct QrCodeGetResponse {
    pub success: bool,
    pub message: String,
    pub qr_code: Option<String>,
    pub authenticated: bool,
    pub connected: bool,
    pub expires_at: Option<String>,
    pub generated_at: Option<String>,
    pub can_regenerate: bool,
    pub status: String,
    pub jid: String,
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

    web_sys::console::log_1(&format!("Fetched {} WhatsApp accounts. {}", response.count, response.message).into());

    Ok(response.accounts)
}

// Alternative fetch function that can be used for development/testing
#[allow(dead_code)]
pub async fn fetch_whatsapp_accounts_dev() -> Result<Vec<WhatsAppAccount>, String> {
    // Use localhost for development if needed
    let response: WhatsAppAccountsResponse = whatsapp_api_fetch("http://localhost:2087/api/v1/whatsapp/accounts", "GET").await?;
    Ok(response.accounts)
}

// Create a new WhatsApp account and get QR code for connection
pub async fn create_whatsapp_account(device_name: String) -> Result<QrCodeResponse, String> {
    web_sys::console::log_1(&"Creating WhatsApp account...".into());

    // Create request body
    let request = CreateWhatsAppAccountRequest { device_name };

    // Create fetch options for POST with JSON body
    let opts = js_sys::Object::new();
    js_sys::Reflect::set(&opts, &"method".into(), &"POST".into())
        .map_err(|_| "Failed to set method".to_string())?;

    // Set headers
    let headers = js_sys::Object::new();
    js_sys::Reflect::set(&headers, &"Content-Type".into(), &"application/json".into())
        .map_err(|_| "Failed to set content type".to_string())?;
    js_sys::Reflect::set(&opts, &"headers".into(), &headers)
        .map_err(|_| "Failed to set headers".to_string())?;

    // Serialize request body
    let body = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {:?}", e))?;
    js_sys::Reflect::set(&opts, &"body".into(), &body.into())
        .map_err(|_| "Failed to set body".to_string())?;

    // Call the endpoint using existing whatsapp_api_fetch helper
    let response_value = admin_api_fetch_js("https://socials.splitdo.app:2087/api/v1/whatsapp/accounts/new", opts.into())
        .await
        .map_err(|e| format!("Fetch error: {:?}", e))?;

    // Convert JsValue to web_sys::Response
    let response: web_sys::Response = response_value
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

    let json_value = wasm_bindgen_futures::JsFuture::from(json_promise)
        .await
        .map_err(|e| format!("JSON parse error: {:?}", e))?;

    // Convert to Rust type
    let qr_response: QrCodeResponse = serde_wasm_bindgen::from_value(json_value)
        .map_err(|e| format!("Deserialization error: {:?}", e))?;

    web_sys::console::log_1(&format!("Created WhatsApp account with session: {}", qr_response.session_id).into());

    Ok(qr_response)
}

// Get QR code for existing WhatsApp account
pub async fn get_whatsapp_account_qr(jid: &str) -> Result<QrCodeGetResponse, String> {
    web_sys::console::log_1(&format!("Getting QR code for account: {}", jid).into());

    let url = format!("https://socials.splitdo.app:2087/api/v1/whatsapp/accounts/{}/qr", urlencoding::encode(jid));
    let response: QrCodeGetResponse = whatsapp_api_fetch(&url, "GET").await?;

    web_sys::console::log_1(&format!("QR code status: {}", response.status).into());

    Ok(response)
}