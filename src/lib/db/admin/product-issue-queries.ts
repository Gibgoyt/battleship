import type { D1Database } from '@cloudflare/workers-types';

export interface ProductIssue {
  id: number;
  issue_number: number;
  roadmap_stage_id: number;
  title: string;
  description: string | null;
  user_impact: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  created_by: number;
}

export interface ProductIssueMessage {
  id: number;
  product_issue_id: number;
  author_id: number;
  message_content: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductIssueWithDetails extends ProductIssue {
  creator_name: string;
  stage_title: string;
  message_count: number;
}

export interface ProductIssueMessageWithAuthor extends ProductIssueMessage {
  author_name: string;
}

export const productIssueQueries = {
  // Issues
  getAll: (db: D1Database) =>
    db.prepare(`
      SELECT
        pi.*,
        tm.name as creator_name,
        prs.title as stage_title,
        COUNT(pim.id) as message_count
      FROM ProductIssues pi
      LEFT JOIN TeamMembers tm ON pi.created_by = tm.id
      LEFT JOIN ProjectRoadmapStages prs ON pi.roadmap_stage_id = prs.id
      LEFT JOIN ProductIssueMessages pim ON pim.product_issue_id = pi.id AND pim.is_deleted = 0
      GROUP BY pi.id
      ORDER BY pi.created_at DESC
    `).all<ProductIssueWithDetails>(),

  getById: (db: D1Database, id: number) =>
    db.prepare(`
      SELECT
        pi.*,
        tm.name as creator_name,
        prs.title as stage_title
      FROM ProductIssues pi
      LEFT JOIN TeamMembers tm ON pi.created_by = tm.id
      LEFT JOIN ProjectRoadmapStages prs ON pi.roadmap_stage_id = prs.id
      WHERE pi.id = ?
    `).bind(id).first<ProductIssueWithDetails>(),

  getByIssueNumber: (db: D1Database, issue_number: number) =>
    db.prepare('SELECT * FROM ProductIssues WHERE issue_number = ?')
      .bind(issue_number)
      .first<ProductIssue>(),

  create: (db: D1Database, data: {
    roadmap_stage_id: number;
    title: string;
    description?: string;
    user_impact?: string;
    created_by: number;
  }) =>
    db.prepare(`
      INSERT INTO ProductIssues (
        issue_number, roadmap_stage_id, title, description,
        user_impact, status, created_by
      )
      VALUES (
        (SELECT COALESCE(MAX(issue_number), 0) + 1 FROM ProductIssues),
        ?, ?, ?, ?, 'open', ?
      )
      RETURNING *
    `).bind(
      data.roadmap_stage_id,
      data.title,
      data.description || null,
      data.user_impact || null,
      data.created_by
    ).first<ProductIssue>(),

  update: (db: D1Database, id: number, data: {
    title?: string;
    description?: string;
    user_impact?: string;
    status?: string;
    roadmap_stage_id?: number;
  }) => {
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (data.user_impact !== undefined) {
      updates.push('user_impact = ?');
      values.push(data.user_impact);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
      if (data.status === 'closed') {
        updates.push('closed_at = CURRENT_TIMESTAMP');
      }
    }

    if (data.roadmap_stage_id !== undefined) {
      updates.push('roadmap_stage_id = ?');
      values.push(data.roadmap_stage_id);
    }

    if (updates.length === 1) return null;

    values.push(id);

    return db.prepare(`
      UPDATE ProductIssues
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).bind(...values).first<ProductIssue>();
  },

  // Messages
  getAllMessages: (db: D1Database, issue_id: number) =>
    db.prepare(`
      SELECT
        pim.*,
        tm.name as author_name
      FROM ProductIssueMessages pim
      LEFT JOIN TeamMembers tm ON pim.author_id = tm.id
      WHERE pim.product_issue_id = ?
      ORDER BY pim.created_at ASC
    `).bind(issue_id).all<ProductIssueMessageWithAuthor>(),

  getMessageById: (db: D1Database, message_id: number) =>
    db.prepare(`
      SELECT
        pim.*,
        tm.name as author_name
      FROM ProductIssueMessages pim
      LEFT JOIN TeamMembers tm ON pim.author_id = tm.id
      WHERE pim.id = ?
    `).bind(message_id).first<ProductIssueMessageWithAuthor>(),

  createMessage: (db: D1Database, data: {
    product_issue_id: number;
    author_id: number;
    message_content: string;
  }) =>
    db.prepare(`
      INSERT INTO ProductIssueMessages (
        product_issue_id, author_id, message_content
      )
      VALUES (?, ?, ?)
      RETURNING *
    `).bind(
      data.product_issue_id,
      data.author_id,
      data.message_content
    ).first<ProductIssueMessage>(),

  updateMessage: (db: D1Database, message_id: number, message_content: string) =>
    db.prepare(`
      UPDATE ProductIssueMessages
      SET message_content = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(message_content, message_id).first<ProductIssueMessage>(),

  softDeleteMessage: (db: D1Database, message_id: number, deleted_by: number) =>
    db.prepare(`
      UPDATE ProductIssueMessages
      SET is_deleted = 1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(deleted_by, message_id).first<ProductIssueMessage>(),
};
