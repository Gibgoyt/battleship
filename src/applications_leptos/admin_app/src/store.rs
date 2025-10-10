use leptos::*;
use crate::api::types::*;

/// Global app state shared across all pages
#[derive(Clone, Debug)]
pub struct AdminStore {
    pub team_members: RwSignal<Vec<TeamMember>>,
    pub project_stages: RwSignal<Vec<ProjectStage>>,
    pub product_issues: RwSignal<Vec<ProductIssue>>,
    pub development_issues: RwSignal<Vec<DevelopmentIssue>>,
    pub stats: RwSignal<DashboardStats>,
    pub loading: RwSignal<bool>,
    pub error: RwSignal<Option<String>>,
    pub current_user_id: RwSignal<i32>, // Current logged-in user's team_member ID
}

impl AdminStore {
    /// Create a new store with empty data
    pub fn new() -> Self {
        Self {
            team_members: create_rw_signal(Vec::new()),
            project_stages: create_rw_signal(Vec::new()),
            product_issues: create_rw_signal(Vec::new()),
            development_issues: create_rw_signal(Vec::new()),
            stats: create_rw_signal(DashboardStats::default()),
            loading: create_rw_signal(false),
            error: create_rw_signal(None),
            current_user_id: create_rw_signal(1), // Default to 1, will be set from initial data
        }
    }

    /// Initialize store from window.adminInitialData
    pub fn init_from_window(&self) {
        if let Some(initial_data) = get_initial_data_from_window() {
            self.team_members.set(initial_data.team_members.clone());
            self.project_stages.set(initial_data.project_stages);
            self.product_issues.set(initial_data.product_issues);
            self.development_issues.set(initial_data.development_issues);
            self.stats.set(initial_data.stats);

            // Set current_user_id from team_members (first member is usually the logged-in user)
            if let Some(first_member) = initial_data.team_members.first() {
                self.current_user_id.set(first_member.id);
                logging::log!("✅ Current user ID set to: {}", first_member.id);
            }

            logging::log!("✅ Store initialized from window.adminInitialData");
        } else {
            logging::warn!("⚠️ No initial data found in window");
        }
    }

    /// Update store with new data from API
    pub fn update(&self, data: InitialData) {
        self.team_members.set(data.team_members);
        self.project_stages.set(data.project_stages);
        self.product_issues.set(data.product_issues);
        self.development_issues.set(data.development_issues);
        self.stats.set(data.stats);
    }

    /// Set loading state
    pub fn set_loading(&self, loading: bool) {
        self.loading.set(loading);
    }

    /// Set error state
    pub fn set_error(&self, error: Option<String>) {
        self.error.set(error);
    }
}

impl Default for DashboardStats {
    fn default() -> Self {
        Self {
            total_team_members: 0,
            online_team_members: 0,
            total_product_issues: 0,
            total_development_issues: 0,
            open_product_issues: 0,
            open_development_issues: 0,
            total_project_stages: 0,
            current_stage: None,
        }
    }
}

/// Get initial data from window.adminInitialData (set by server-side render)
fn get_initial_data_from_window() -> Option<InitialData> {
    use wasm_bindgen::JsValue;

    let window = web_sys::window()?;
    let admin_initial_data = js_sys::Reflect::get(&window, &JsValue::from_str("adminInitialData"))
        .ok()?;

    if admin_initial_data.is_undefined() || admin_initial_data.is_null() {
        return None;
    }

    serde_wasm_bindgen::from_value(admin_initial_data).ok()
}
