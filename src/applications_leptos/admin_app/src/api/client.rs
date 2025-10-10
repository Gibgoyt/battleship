use wasm_bindgen::prelude::*;
use serde::de::DeserializeOwned;
use serde::Serialize;
use gloo_net::http::Request;

use super::types::*;

// JS interop to call window.adminApiFetch
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = adminApiFetch)]
    async fn admin_api_fetch(url: &str, options: JsValue) -> JsValue;

    #[wasm_bindgen(js_name = console, js_namespace = console)]
    fn log(s: &str);
}

// Fetch helper that uses window.adminApiFetch for authenticated requests
async fn fetch_api<T: DeserializeOwned>(url: &str) -> Result<ApiResponse<T>, String> {
    let response = Request::get(url)
        .send()
        .await
        .map_err(|e| format!("Network error: {:?}", e))?;

    if !response.ok() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    response
        .json::<ApiResponse<T>>()
        .await
        .map_err(|e| format!("JSON parse error: {:?}", e))
}

// Post helper with JSON body
async fn post_api<T: DeserializeOwned, B: Serialize>(
    url: &str,
    body: &B,
) -> Result<ApiResponse<T>, String> {
    let response = Request::post(url)
        .json(body)
        .map_err(|e| format!("Serialize error: {:?}", e))?
        .send()
        .await
        .map_err(|e| format!("Network error: {:?}", e))?;

    if !response.ok() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    response
        .json::<ApiResponse<T>>()
        .await
        .map_err(|e| format!("JSON parse error: {:?}", e))
}

// Put helper with JSON body
async fn put_api<T: DeserializeOwned, B: Serialize>(
    url: &str,
    body: &B,
) -> Result<ApiResponse<T>, String> {
    let response = Request::put(url)
        .json(body)
        .map_err(|e| format!("Serialize error: {:?}", e))?
        .send()
        .await
        .map_err(|e| format!("Network error: {:?}", e))?;

    if !response.ok() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    response
        .json::<ApiResponse<T>>()
        .await
        .map_err(|e| format!("JSON parse error: {:?}", e))
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
    let response = fetch_api::<InitialData>("/api/admin").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No data returned from API".to_string())
    })
}

// Team Members
pub async fn fetch_team_members() -> Result<Vec<TeamMember>, String> {
    let response = fetch_api::<Vec<TeamMember>>("/api/admin/team-members").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No team members data".to_string())
    })
}

// Project Stages
pub async fn fetch_project_stages() -> Result<Vec<ProjectStage>, String> {
    let response = fetch_api::<Vec<ProjectStage>>("/api/admin/project-stages").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No project stages data".to_string())
    })
}

pub async fn create_project_stage(
    request: CreateProjectStageRequest,
) -> Result<ProjectStage, String> {
    let response = post_api::<ProjectStage, _>("/api/admin/project-stages", &request).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to create project stage".to_string())
    })
}

pub async fn update_project_stage(
    id: i32,
    request: UpdateProjectStageRequest,
) -> Result<ProjectStage, String> {
    let url = format!("/api/admin/project-stages/{}", id);
    let response = put_api::<ProjectStage, _>(&url, &request).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to update project stage".to_string())
    })
}

// Product Issues
pub async fn fetch_product_issues() -> Result<Vec<ProductIssue>, String> {
    let response = fetch_api::<Vec<ProductIssue>>("/api/admin/product-issues").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No product issues data".to_string())
    })
}

pub async fn create_product_issue(
    request: CreateProductIssueRequest,
) -> Result<ProductIssue, String> {
    let response = post_api::<ProductIssue, _>("/api/admin/product-issues", &request).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to create product issue".to_string())
    })
}

pub async fn update_product_issue(
    id: i32,
    request: UpdateProductIssueRequest,
) -> Result<ProductIssue, String> {
    let url = format!("/api/admin/product-issues/{}", id);
    let response = put_api::<ProductIssue, _>(&url, &request).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to update product issue".to_string())
    })
}

// Development Issues
pub async fn fetch_development_issues() -> Result<Vec<DevelopmentIssue>, String> {
    let response = fetch_api::<Vec<DevelopmentIssue>>("/api/admin/development-issues").await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No development issues data".to_string())
    })
}

pub async fn create_development_issue(
    request: CreateDevelopmentIssueRequest,
) -> Result<DevelopmentIssue, String> {
    let response = post_api::<DevelopmentIssue, _>("/api/admin/development-issues", &request).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to create development issue".to_string())
    })
}

pub async fn update_development_issue(
    id: i32,
    request: UpdateDevelopmentIssueRequest,
) -> Result<DevelopmentIssue, String> {
    let url = format!("/api/admin/development-issues/{}", id);
    let response = put_api::<DevelopmentIssue, _>(&url, &request).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to update development issue".to_string())
    })
}
