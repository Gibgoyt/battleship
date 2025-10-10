import type { D1Database } from '@cloudflare/workers-types';

export interface ProjectRoadmapStage {
  id: number;
  title: string;
  description: string | null;
  status: 'upcoming' | 'current' | 'completed' | 'blocked';
  target_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

export interface ProjectStageWithIssues extends ProjectRoadmapStage {
  dev_issue_count: number;
  product_issue_count: number;
}

export const projectStageQueries = {
  getAll: (db: D1Database) =>
    db.prepare(`
      SELECT * FROM ProjectRoadmapStages
      ORDER BY display_order ASC
    `).all<ProjectRoadmapStage>(),

  getAllWithIssueCounts: (db: D1Database) =>
    db.prepare(`
      SELECT
        prs.*,
        COUNT(DISTINCT di.id) as dev_issue_count,
        COUNT(DISTINCT pi.id) as product_issue_count
      FROM ProjectRoadmapStages prs
      LEFT JOIN DevelopmentIssues di ON di.roadmap_stage_id = prs.id
      LEFT JOIN ProductIssues pi ON pi.roadmap_stage_id = prs.id
      GROUP BY prs.id
      ORDER BY prs.display_order ASC
    `).all<ProjectStageWithIssues>(),

  getById: (db: D1Database, id: number) =>
    db.prepare('SELECT * FROM ProjectRoadmapStages WHERE id = ?')
      .bind(id)
      .first<ProjectRoadmapStage>(),

  create: (db: D1Database, data: {
    title: string;
    description?: string;
    status: string;
    target_date?: string;
    display_order: number;
    created_by?: number;
  }) =>
    db.prepare(`
      INSERT INTO ProjectRoadmapStages (
        title, description, status, target_date, display_order, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      data.title,
      data.description || null,
      data.status,
      data.target_date || null,
      data.display_order,
      data.created_by || null
    ).first<ProjectRoadmapStage>(),

  update: (db: D1Database, id: number, data: {
    title?: string;
    description?: string;
    status?: string;
    target_date?: string;
    display_order?: number;
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
    }

    if (data.target_date !== undefined) {
      updates.push('target_date = ?');
      values.push(data.target_date);
    }

    if (data.display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(data.display_order);
    }

    if (updates.length === 1) return null;

    values.push(id);

    return db.prepare(`
      UPDATE ProjectRoadmapStages
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).bind(...values).first<ProjectRoadmapStage>();
  },

  delete: (db: D1Database, id: number) =>
    db.prepare('DELETE FROM ProjectRoadmapStages WHERE id = ?').bind(id).run(),

  getNextDisplayOrder: (db: D1Database) =>
    db.prepare('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM ProjectRoadmapStages')
      .first<{ next_order: number }>(),
};
