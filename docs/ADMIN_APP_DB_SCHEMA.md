# Internal Operation Admin App

# CloudFlare D1 Database Schema

## TeamMembers Table

```bash
CREATE TABLE TeamMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_online INTEGER DEFAULT 0, 
    last_seen_at TEXT, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```
- `is_online` 0 = false, 1 = true
- `last_seen_at` ISO8601
- will probably have to add Cognito User ID, we will use AWS Cognito for authentication right now (probably with server-stored secret too)

## ProjectRoadmapStages Table

```bash
CREATE TABLE ProjectRoadmapStages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('upcoming', 'current', 'completed', 'blocked')),
    target_date TEXT, 
    display_order INTEGER NOT NULL, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES TeamMembers(id)
);
```

- `target_date` ISO8601
- `display_order` for vertical ordering

## DevelopmentIssues Table

```bash
CREATE TABLE DevelopmentIssues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_number INTEGER NOT NULL UNIQUE,
    roadmap_stage_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('open', 'closed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (roadmap_stage_id) REFERENCES ProjectRoadmapStages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES TeamMembers(id)
);
```

- `issue_number` auto-increments (i.e. #1, #2, #3, etc...) for easy reference

## ProductIssues Table

```bash
CREATE TABLE ProductIssues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_number INTEGER NOT NULL UNIQUE,
    roadmap_stage_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    user_impact TEXT,
    status TEXT NOT NULL CHECK(status IN ('open', 'closed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (roadmap_stage_id) REFERENCES ProjectRoadmapStages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES TeamMembers(id)
);
```

- `issue_number` auto-increments (i.e. #1, #2, #3, etc...) for easy reference
- `user_impact` how the update affects users of the app

## DevelopmentIssueMessages Table

```bash
CREATE TABLE DevelopmentIssueMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    development_issue_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    message_content TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT,
    deleted_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (development_issue_id) REFERENCES DevelopmentIssues(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES TeamMembers(id),
    FOREIGN KEY (deleted_by) REFERENCES TeamMembers(id)
);
```

- `is_deleted` for soft deletion, never truly delete the message


## ProducttIssueMessages Table

```bash
CREATE TABLE ProductIssueMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_issue_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    message_content TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT,
    deleted_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_issue_id) REFERENCES ProductIssues(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES TeamMembers(id),
    FOREIGN KEY (deleted_by) REFERENCES TeamMembers(id)
);
```

- `is_deleted` for soft deletion, never truly delete the message

# Indexes

## Roadmap and status lookups
CREATE INDEX idx_dev_issues_roadmap ON DevelopmentIssues(roadmap_stage_id);
CREATE INDEX idx_dev_issues_status ON DevelopmentIssues(status);
CREATE INDEX idx_dev_issues_number ON DevelopmentIssues(issue_number);

CREATE INDEX idx_prod_issues_roadmap ON ProductIssues(roadmap_stage_id);
CREATE INDEX idx_prod_issues_status ON ProductIssues(status);
CREATE INDEX idx_prod_issues_number ON ProductIssues(issue_number);

## Message lookups
CREATE INDEX idx_dev_messages_issue ON DevelopmentIssueMessages(development_issue_id);
CREATE INDEX idx_dev_messages_author ON DevelopmentIssueMessages(author_id);

CREATE INDEX idx_prod_messages_issue ON ProductIssueMessages(product_issue_id);
CREATE INDEX idx_prod_messages_author ON ProductIssueMessages(author_id);

# API
-- Get next issue number for Development Issues
/*
SELECT COALESCE(MAX(issue_number), 0) + 1 AS next_issue_number
FROM DevelopmentIssues;
*/

-- Get next issue number for Product Issues
/*
SELECT COALESCE(MAX(issue_number), 0) + 1 AS next_issue_number
FROM ProductIssues;
*/

-- Get roadmap with issue counts (for project view)
/*
SELECT 
    prs.id,
    prs.title,
    prs.description,
    prs.status,
    prs.target_date,
    prs.display_order,
    COUNT(DISTINCT di.id) as dev_issue_count,
    COUNT(DISTINCT pi.id) as product_issue_count
FROM ProjectRoadmapStages prs
LEFT JOIN DevelopmentIssues di ON di.roadmap_stage_id = prs.id AND di.status = 'open'
LEFT JOIN ProductIssues pi ON pi.roadmap_stage_id = prs.id AND pi.status = 'open'
GROUP BY prs.id
ORDER BY prs.display_order;
*/

-- Get all development issues for a roadmap stage
/*
SELECT 
    di.id,
    di.issue_number,
    di.title,
    di.description,
    di.status,
    di.created_at,
    di.closed_at,
    tm.name as creator_name,
    (SELECT COUNT(*) FROM DevelopmentIssueMessages WHERE development_issue_id = di.id AND is_deleted = 0) as comment_count
FROM DevelopmentIssues di
JOIN TeamMembers tm ON di.created_by = tm.id
WHERE di.roadmap_stage_id = ?
ORDER BY di.created_at DESC;
*/

-- Get all product issues for a roadmap stage
/*
SELECT 
    pi.id,
    pi.issue_number,
    pi.title,
    pi.description,
    pi.user_impact,
    pi.status,
    pi.created_at,
    pi.closed_at,
    tm.name as creator_name,
    (SELECT COUNT(*) FROM ProductIssueMessages WHERE product_issue_id = pi.id AND is_deleted = 0) as comment_count
FROM ProductIssues pi
JOIN TeamMembers tm ON pi.created_by = tm.id
WHERE pi.roadmap_stage_id = ?
ORDER BY pi.created_at DESC;
*/

-- Get all messages for a development issue (excluding soft-deleted)
/*
SELECT 
    dim.id,
    dim.message_content,
    dim.created_at,
    dim.is_deleted,
    tm.name as author_name
FROM DevelopmentIssueMessages dim
JOIN TeamMembers tm ON dim.author_id = tm.id
WHERE dim.development_issue_id = ?
ORDER BY dim.created_at ASC;
*/

-- Get all messages for a product issue (excluding soft-deleted)
/*
SELECT 
    pim.id,
    pim.message_content,
    pim.created_at,
    pim.is_deleted,
    tm.name as author_name
FROM ProductIssueMessages pim
JOIN TeamMembers tm ON pim.author_id = tm.id
WHERE pim.product_issue_id = ?
ORDER BY pim.created_at ASC;
*/

-- Get attachments for a message
/*
SELECT 
    id,
    file_url,
    file_name,
    file_size,
    mime_type,
    created_at
FROM DevelopmentIssueAttachments
WHERE message_id = ?;
*/

-- Soft delete a message
/*
UPDATE DevelopmentIssueMessages
SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
*/

-- Close an issue
/*
UPDATE DevelopmentIssues
SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
*/

-- Reopen an issue
/*
UPDATE DevelopmentIssues
SET status = 'open', closed_at = NULL, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
*/


# TO IMPLEMENT LATER
## DevelopmentIssueAttachments Table
-- Development Issue Attachments (Screenshots, files, etc.)
CREATE TABLE DevelopmentIssueAttachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    file_url TEXT NOT NULL, -- Cloudflare R2 URL
    file_name TEXT NOT NULL,
    file_size INTEGER, -- Bytes
    mime_type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES DevelopmentIssueMessages(id) ON DELETE CASCADE
);

-- Product Issue Attachments (Screenshots, files, etc.)
CREATE TABLE ProductIssueAttachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    file_url TEXT NOT NULL, -- Cloudflare R2 URL
    file_name TEXT NOT NULL,
    file_size INTEGER, -- Bytes
    mime_type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES ProductIssueMessages(id) ON DELETE CASCADE
);


## Attachment lookups
CREATE INDEX idx_dev_attachments_message ON DevelopmentIssueAttachments(message_id);
CREATE INDEX idx_prod_attachments_message ON ProductIssueAttachments(message_id);
