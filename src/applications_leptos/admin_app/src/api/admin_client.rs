use gloo_net::http::Request;
use serde::de::DeserializeOwned;
use serde::Serialize;

use super::types::*;

/// Get API origin from window.location.origin or dataset
pub fn get_api_origin() -> String {
    // Try to get from data attribute first
    if let Some(window) = web_sys::window() {
        if let Some(document) = window.document() {
            if let Some(root) = document.get_element_by_id("wasm-root") {
                if let Some(origin) = root.get_attribute("data-api-origin") {
                    return origin;
                }
            }
        }

        // Fallback to window.location.origin
        if let Ok(location) = window.location().origin() {
            return location;
        }
    }

    // Last resort fallback
    "".to_string()
}

/// Get auth token from cookies
fn get_auth_token() -> Option<String> {
    let window = web_sys::window()?;
    let document = window.document()?;

    // Use js_sys to get cookie string
    let cookie = js_sys::Reflect::get(&document, &wasm_bindgen::JsValue::from_str("cookie"))
        .ok()?
        .as_string()?;

    // Parse cookies
    for cookie_str in cookie.split(';') {
        let parts: Vec<&str> = cookie_str.trim().split('=').collect();
        if parts.len() == 2 && parts[0] == "cognito-admin-auth-token" {
            return Some(urlencoding::decode(parts[1]).ok()?.to_string());
        }
    }

    None
}

/// Generic JSON fetch with auth
async fn fetch_json<T: DeserializeOwned>(
    method: &str,
    url: &str,
) -> Result<ApiResponse<T>, String> {
    let token = get_auth_token().ok_or("No auth token found")?;

    let mut request = Request::get(url);

    // Override method if not GET
    if method != "GET" {
        request = match method {
            "POST" => Request::post(url),
            "PUT" => Request::put(url),
            "DELETE" => Request::delete(url),
            _ => Request::get(url),
        };
    }

    let response = request
        .header("Authorization", &format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.ok() {
        return Err(format!("HTTP error: {} {}", response.status(), response.status_text()));
    }

    response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))
}

/// Generic JSON fetch with body
async fn fetch_json_with_body<T: DeserializeOwned, B: Serialize>(
    method: &str,
    url: &str,
    body: &B,
) -> Result<ApiResponse<T>, String> {
    let token = get_auth_token().ok_or("No auth token found")?;
    let body_str = serde_json::to_string(body)
        .map_err(|e| format!("JSON serialize error: {}", e))?;

    let request = match method {
        "POST" => Request::post(url),
        "PUT" => Request::put(url),
        "DELETE" => Request::delete(url),
        _ => Request::post(url),
    };

    let response = request
        .header("Authorization", &format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .body(body_str)
        .map_err(|e| format!("Failed to set body: {}", e))?
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.ok() {
        return Err(format!("HTTP error: {} {}", response.status(), response.status_text()));
    }

    response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))
}

// ==== ALL DATA ====

/// Refresh all data from /api/admin
pub async fn refresh_all_data() -> Result<InitialData, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin", origin);

    let response: ApiResponse<InitialData> = fetch_json("GET", &url).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No data returned from API".to_string())
    })
}

// ==== PAGE-SPECIFIC REFRESH FUNCTIONS ====

/// Refresh Project page data (all roadmap data needed for timeline view)
pub async fn refresh_project_data() -> Result<(Vec<ProjectStage>, Vec<ProductIssue>, Vec<DevelopmentIssue>), String> {
    let project_stages = fetch_project_stages().await?;
    let product_issues = fetch_product_issues().await?;
    let development_issues = fetch_development_issues().await?;

    Ok((project_stages, product_issues, development_issues))
}

/// Refresh Product page data (product issues + milestones for context)
pub async fn refresh_product_data() -> Result<(Vec<ProductIssue>, Vec<ProjectStage>), String> {
    let product_issues = fetch_product_issues().await?;
    let project_stages = fetch_project_stages().await?;

    Ok((product_issues, project_stages))
}

/// Refresh Development page data (development issues + milestones for context)
pub async fn refresh_development_data() -> Result<(Vec<DevelopmentIssue>, Vec<ProjectStage>), String> {
    let development_issues = fetch_development_issues().await?;
    let project_stages = fetch_project_stages().await?;

    Ok((development_issues, project_stages))
}

// ==== PROJECT STAGES ====

/// Fetch all project stages
pub async fn fetch_project_stages() -> Result<Vec<ProjectStage>, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/project-stages", origin);

    let response: ApiResponse<Vec<ProjectStage>> = fetch_json("GET", &url).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No project stages data".to_string())
    })
}

/// Create a new project stage
pub async fn create_project_stage(data: CreateProjectStageRequest) -> Result<ProjectStage, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/project-stages", origin);

    let response: ApiResponse<ProjectStage> = fetch_json_with_body("POST", &url, &data).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to create project stage".to_string())
    })
}

/// Update a project stage
pub async fn update_project_stage(id: i32, data: UpdateProjectStageRequest) -> Result<ProjectStage, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/project-stages/{}", origin, id);

    let response: ApiResponse<ProjectStage> = fetch_json_with_body("PUT", &url, &data).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to update project stage".to_string())
    })
}

// ==== PRODUCT ISSUES ====

/// Fetch all product issues
pub async fn fetch_product_issues() -> Result<Vec<ProductIssue>, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/product-issues", origin);

    let response: ApiResponse<Vec<ProductIssue>> = fetch_json("GET", &url).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No product issues data".to_string())
    })
}

/// Create a new product issue
pub async fn create_product_issue(data: CreateProductIssueRequest) -> Result<ProductIssue, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/product-issues", origin);

    let response: ApiResponse<ProductIssue> = fetch_json_with_body("POST", &url, &data).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to create product issue".to_string())
    })
}

/// Update a product issue
pub async fn update_product_issue(id: i32, data: UpdateProductIssueRequest) -> Result<ProductIssue, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/product-issues/{}", origin, id);

    let response: ApiResponse<ProductIssue> = fetch_json_with_body("PUT", &url, &data).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to update product issue".to_string())
    })
}

// ==== DEVELOPMENT ISSUES ====

/// Fetch all development issues
pub async fn fetch_development_issues() -> Result<Vec<DevelopmentIssue>, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/development-issues", origin);

    let response: ApiResponse<Vec<DevelopmentIssue>> = fetch_json("GET", &url).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "No development issues data".to_string())
    })
}

/// Create a new development issue
pub async fn create_development_issue(data: CreateDevelopmentIssueRequest) -> Result<DevelopmentIssue, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/development-issues", origin);

    let response: ApiResponse<DevelopmentIssue> = fetch_json_with_body("POST", &url, &data).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to create development issue".to_string())
    })
}

/// Update a development issue
pub async fn update_development_issue(id: i32, data: UpdateDevelopmentIssueRequest) -> Result<DevelopmentIssue, String> {
    let origin = get_api_origin();
    let url = format!("{}/api/admin/development-issues/{}", origin, id);

    let response: ApiResponse<DevelopmentIssue> = fetch_json_with_body("PUT", &url, &data).await?;

    response.data.ok_or_else(|| {
        response
            .error
            .unwrap_or_else(|| "Failed to update development issue".to_string())
    })
}
