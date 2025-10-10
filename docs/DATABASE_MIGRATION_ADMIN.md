# Admin Database Migration Guide

## Required Schema Update: Add `cognito_sub` Column

To enable proper user sync with AWS Cognito, you need to add a `cognito_sub` column to the `TeamMembers` table.

### Migration SQL

Run this SQL against your CloudFlare D1 database `INTERNAL_OPS_ADMIN_DB`:

```sql
-- Add cognito_sub column to TeamMembers table
ALTER TABLE TeamMembers ADD COLUMN cognito_sub TEXT UNIQUE;
```

### Why This Change?

- **Immutable Identifier**: `cognito_sub` is a permanent unique identifier from AWS Cognito that never changes
- **Email Can Change**: Users can update their email in Cognito, but `cognito_sub` stays the same
- **Better User Matching**: Allows the sync endpoint to reliably match existing users

### How to Run Migration

#### Option 1: CloudFlare Dashboard (Recommended)
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages → D1 Databases
3. Select your `INTERNAL_OPS_ADMIN_DB` database
4. Click "Console" tab
5. Paste the SQL above and execute

#### Option 2: Wrangler CLI
```bash
# From project root
npx wrangler d1 execute INTERNAL_OPS_ADMIN_DB --command "ALTER TABLE TeamMembers ADD COLUMN cognito_sub TEXT UNIQUE;"
```

### Verification

After running the migration, verify with:

```sql
-- Check schema
PRAGMA table_info(TeamMembers);

-- Should show new column:
-- | cid | name        | type    | notnull | dflt_value | pk |
-- |-----|-------------|---------|---------| -----------|----|
-- | ... | cognito_sub | TEXT    | 0       | NULL       | 0  |
```

### Backfill Existing Users (Optional)

If you have existing users without `cognito_sub`, they will be auto-synced on their next login. No manual backfill needed!

The `/api/admin/team-members/sync` endpoint will:
1. Look for user by `cognito_sub`
2. If not found, create new user with `cognito_sub`
3. Update `last_seen_at` and set `is_online = 1`

---

## API Client Usage (For WASM App)

The admin API client is now available globally in the WASM app:

### Available Functions

```javascript
// Injected automatically by [... all].astro
window.adminApiFetch(url, options)     // Fetch with Authorization header
window.syncCurrentUser(email, sub, name) // Sync user to TeamMembers
window.loadInitialData()                 // Load all admin data
window.adminUserInfo                     // Current user { email, username, sub }
```

### Example: Load Data on WASM Mount

```rust
// In your Leptos component
use leptos::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = window)]
    async fn syncCurrentUser(email: &str, sub: &str, name: &str) -> JsValue;

    #[wasm_bindgen(js_namespace = window)]
    async fn loadInitialData() -> JsValue;

    #[wasm_bindgen(js_namespace = window, js_name = adminUserInfo)]
    static ADMIN_USER_INFO: JsValue;
}

#[component]
pub fn App() -> impl IntoView {
    // On mount: Sync user and load data
    create_effect(move |_| {
        spawn_local(async {
            // Get user info from window
            let user_info = ADMIN_USER_INFO;
            let email = /* extract from user_info */;
            let sub = /* extract from user_info */;

            // Sync user
            let result = syncCurrentUser(email, sub, email).await;
            log!("User synced: {:?}", result);

            // Load all data
            let data = loadInitialData().await;
            log!("Data loaded: {:?}", data);
        });
    });

    view! {
        <div>
            // Your app
        </div>
    }
}
```

### Example: Create New Issue

```javascript
// From JavaScript (or via wasm_bindgen)
const response = await window.adminApiFetch('/api/admin/product-issues', {
  method: 'POST',
  body: JSON.stringify({
    title: 'New Bug Report',
    roadmap_stage_id: 2,
    created_by: 1, // Use team_member_id from sync result
    description: 'Users are experiencing...',
    user_impact: 'Blocks core functionality'
  })
});

const result = await response.json();
console.log('Issue created:', result.data);
```

---

## Current Schema (Updated)

```sql
CREATE TABLE TeamMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cognito_sub TEXT UNIQUE, -- ✅ NEW COLUMN
    is_online INTEGER DEFAULT 0,
    last_seen_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## Troubleshooting

### Error: "column cognito_sub does not exist"
**Solution**: Run the migration SQL above

### Error: "UNIQUE constraint failed"
**Cause**: Trying to create duplicate user with same `cognito_sub`
**Solution**: This is normal behavior - the sync endpoint will update existing user instead

### Users not appearing online
**Check**:
1. Is user calling `/api/admin/team-members/sync` on mount?
2. Is `is_online` being set to 1?
3. Check browser console for errors

---

## Next Steps

1. ✅ Run migration SQL
2. ✅ Rebuild WASM app: `cd src/applications_leptos/admin_app && ./build.sh`
3. ✅ Test user sync by signing in to `/admin`
4. ✅ Check browser console for "User synced" message
5. ✅ Verify user appears in TeamMembers table with `cognito_sub`
