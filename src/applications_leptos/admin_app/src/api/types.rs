use serde::{Deserialize, Serialize};

// Team Member types
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct TeamMember {
    pub id: i32,
    pub name: String,
    pub cognito_sub: Option<String>,
    pub is_online: i32,
    pub last_seen_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Project Stage types
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ProjectStage {
    pub id: i32,
    pub title: String,
    pub description: Option<String>,
    pub status: String, // 'upcoming' | 'current' | 'completed' | 'blocked'
    pub target_date: Option<String>,
    pub display_order: i32,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: Option<i32>,
    #[serde(default)]
    pub dev_issue_count: i32,
    #[serde(default)]
    pub product_issue_count: i32,
}

// Product Issue types
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ProductIssue {
    pub id: i32,
    pub issue_number: i32,
    pub roadmap_stage_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub user_impact: Option<String>,
    pub status: String, // 'open' | 'closed'
    pub created_at: String,
    pub updated_at: String,
    pub closed_at: Option<String>,
    pub created_by: i32,
    #[serde(default)]
    pub creator_name: String,
    #[serde(default)]
    pub stage_title: String,
    #[serde(default)]
    pub message_count: i32,
}

// Development Issue types
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct DevelopmentIssue {
    pub id: i32,
    pub issue_number: i32,
    pub roadmap_stage_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub status: String, // 'open' | 'closed'
    pub created_at: String,
    pub updated_at: String,
    pub closed_at: Option<String>,
    pub created_by: i32,
    #[serde(default)]
    pub creator_name: String,
    #[serde(default)]
    pub stage_title: String,
    #[serde(default)]
    pub message_count: i32,
}

// Dashboard stats
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct DashboardStats {
    pub total_team_members: i32,
    pub online_team_members: i32,
    pub total_product_issues: i32,
    pub total_development_issues: i32,
    pub open_product_issues: i32,
    pub open_development_issues: i32,
    pub total_project_stages: i32,
    pub current_stage: Option<String>,
}

// Initial data response from /api/admin
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct InitialData {
    pub team_members: Vec<TeamMember>,
    pub project_stages: Vec<ProjectStage>,
    pub product_issues: Vec<ProductIssue>,
    pub development_issues: Vec<DevelopmentIssue>,
    pub stats: DashboardStats,
}

// API Response wrapper
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: Option<String>,
}

// Create/Update request types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateProjectStageRequest {
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub target_date: Option<String>,
    pub display_order: Option<i32>,
    pub created_by: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UpdateProjectStageRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub target_date: Option<String>,
    pub display_order: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateProductIssueRequest {
    pub roadmap_stage_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub user_impact: Option<String>,
    pub created_by: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UpdateProductIssueRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub user_impact: Option<String>,
    pub status: Option<String>,
    pub roadmap_stage_id: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateDevelopmentIssueRequest {
    pub roadmap_stage_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub created_by: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UpdateDevelopmentIssueRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub roadmap_stage_id: Option<i32>,
}
