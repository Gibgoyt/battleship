import type { D1Database } from '@cloudflare/workers-types';

export interface DevelopmentIssue {
  id: number;
  issue_number: number;
  roadmap_stage_id: number;
  title: string;
  description: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  created_by: number;
}

export interface DevelopmentIssueMessage {
  id: number;
  development_issue_id: number;
  author_id: number;
  message_content: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentIssueWithDetails extends DevelopmentIssue {
  creator_name: string;
  stage_title: string;
  message_count: number;
}

export interface DevelopmentIssueMessageWithAuthor extends DevelopmentIssueMessage {
  author_name: string;
}

export const developmentIssueQueries = {
  // Issues
  getAll: (db: D1Database) =>
    db.prepare(`
      SELECT
        di.*,
        tm.name as creator_name,
        prs.title as stage_title,
        COUNT(dim.id) as message_count
      FROM DevelopmentIssues di
      LEFT JOIN TeamMembers tm ON di.created_by = tm.id
      LEFT JOIN ProjectRoadmapStages prs ON di.roadmap_stage_id = prs.id
      LEFT JOIN DevelopmentIssueMessages dim ON dim.development_issue_id = di.id AND dim.is_deleted = 0
      GROUP BY di.id
      ORDER BY di.created_at DESC
    `).all<DevelopmentIssueWithDetails>(),

  getById: (db: D1Database, id: number) =>
    db.prepare(`
      SELECT
        di.*,
        tm.name as creator_name,
        prs.title as stage_title
      FROM DevelopmentIssues di
      LEFT JOIN TeamMembers tm ON di.created_by = tm.id
      LEFT JOIN ProjectRoadmapStages prs ON di.roadmap_stage_id = prs.id
      WHERE di.id = ?
    `).bind(id).first<DevelopmentIssueWithDetails>(),

  getByIssueNumber: (db: D1Database, issue_number: number) =>
    db.prepare('SELECT * FROM DevelopmentIssues WHERE issue_number = ?')
      .bind(issue_number)
      .first<DevelopmentIssue>(),

  create: (db: D1Database, data: {
    roadmap_stage_id: number;
    title: string;
    description?: string;
    created_by: number;
  }) =>
    db.prepare(`
      INSERT INTO DevelopmentIssues (
        issue_number, roadmap_stage_id, title, description,
        status, created_by
      )
      VALUES (
        (SELECT COALESCE(MAX(issue_number), 0) + 1 FROM DevelopmentIssues),
        ?, ?, ?, 'open', ?
      )
      RETURNING *
    `).bind(
      data.roadmap_stage_id,
      data.title,
      data.description || null,
      data.created_by
    ).first<DevelopmentIssue>(),

  update: (db: D1Database, id: number, data: {
    title?: string;
    description?: string;
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
      UPDATE DevelopmentIssues
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).bind(...values).first<DevelopmentIssue>();
  },

  // Messages
  getAllMessages: (db: D1Database, issue_id: number) =>
    db.prepare(`
      SELECT
        dim.*,
        tm.name as author_name
      FROM DevelopmentIssueMessages dim
      LEFT JOIN TeamMembers tm ON dim.author_id = tm.id
      WHERE dim.development_issue_id = ?
      ORDER BY dim.created_at ASC
    `).bind(issue_id).all<DevelopmentIssueMessageWithAuthor>(),

  getMessageById: (db: D1Database, message_id: number) =>
    db.prepare(`
      SELECT
        dim.*,
        tm.name as author_name
      FROM DevelopmentIssueMessages dim
      LEFT JOIN TeamMembers tm ON dim.author_id = tm.id
      WHERE dim.id = ?
    `).bind(message_id).first<DevelopmentIssueMessageWithAuthor>(),

  createMessage: (db: D1Database, data: {
    development_issue_id: number;
    author_id: number;
    message_content: string;
  }) =>
    db.prepare(`
      INSERT INTO DevelopmentIssueMessages (
        development_issue_id, author_id, message_content
      )
      VALUES (?, ?, ?)
      RETURNING *
    `).bind(
      data.development_issue_id,
      data.author_id,
      data.message_content
    ).first<DevelopmentIssueMessage>(),

  updateMessage: (db: D1Database, message_id: number, message_content: string) =>
    db.prepare(`
      UPDATE DevelopmentIssueMessages
      SET message_content = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(message_content, message_id).first<DevelopmentIssueMessage>(),

  softDeleteMessage: (db: D1Database, message_id: number, deleted_by: number) =>
    db.prepare(`
      UPDATE DevelopmentIssueMessages
      SET is_deleted = 1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(deleted_by, message_id).first<DevelopmentIssueMessage>(),
};
