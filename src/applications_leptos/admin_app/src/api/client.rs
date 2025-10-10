use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use serde::de::DeserializeOwned;
use web_sys::Response;

use super::types::*;

// JS interop - call window.adminApiFetch which automatically adds auth headers
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = adminApiFetch, catch)]
    async fn admin_api_fetch_js(url: &str, options: JsValue) -> Result<JsValue, JsValue>;
}

// Helper to call window.adminApiFetch and parse JSON response
async fn admin_api_fetch<T: DeserializeOwned>(url: &str, method: &str) -> Result<T, String> {
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
        return Err(format!("HTTP error: {}", response.status()));
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

// Load initial data from window.adminInitialData (server-side rendered)
// Falls back to API call if not available
pub fn get_initial_data_from_window() -> Option<InitialData> {
    let window = web_sys::window()?;
    let admin_initial_data = js_sys::Reflect::get(&window, &JsValue::from_str("adminInitialData"))
        .ok()?;

    if admin_initial_data.is_undefined() || admin_initial_data.is_null() {
        return None;
    }

    serde_wasm_bindgen::from_value(admin_initial_data).ok()
}

// Fetch all initial data from API
pub async fn fetch_initial_data() -> Result<InitialData, String> {
    let response: ApiResponse<InitialData> = admin_api_fetch("/api/admin", "GET").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No data returned from API".to_string())
    })
}

// The functions below are kept for future use when we need to:
// - Refresh specific data sets
// - Create new records
// - Update existing records

// Team Members (kept for future use when we need to refresh specific data)
#[allow(dead_code)]
pub async fn fetch_team_members() -> Result<Vec<TeamMember>, String> {
    let response: ApiResponse<Vec<TeamMember>> = admin_api_fetch("/api/admin/team-members", "GET").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No team members data".to_string())
    })
}

// Project Stages (kept for future use - mutations and selective refreshes)
#[allow(dead_code)]
pub async fn fetch_project_stages() -> Result<Vec<ProjectStage>, String> {
    let response: ApiResponse<Vec<ProjectStage>> = admin_api_fetch("/api/admin/project-stages", "GET").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No project stages data".to_string())
    })
}

// Note: POST/PUT operations would require sending JSON body
// For now, we're only implementing GET since the app loads all data initially
// Create/Update functions can be implemented when needed using FormData or JSON body

#[allow(dead_code)]
pub async fn fetch_product_issues() -> Result<Vec<ProductIssue>, String> {
    let response: ApiResponse<Vec<ProductIssue>> = admin_api_fetch("/api/admin/product-issues", "GET").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No product issues data".to_string())
    })
}

#[allow(dead_code)]
pub async fn fetch_development_issues() -> Result<Vec<DevelopmentIssue>, String> {
    let response: ApiResponse<Vec<DevelopmentIssue>> = admin_api_fetch("/api/admin/development-issues", "GET").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No development issues data".to_string())
    })
}
