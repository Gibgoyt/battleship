import type { D1Database } from '@cloudflare/workers-types';

export interface TeamMember {
  id: number;
  name: string;
  is_online: number; // 0 or 1
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export const teamMemberQueries = {
  getAll: (db: D1Database) =>
    db.prepare('SELECT * FROM TeamMembers').all<TeamMember>(),

  getById: (db: D1Database, id: number) =>
    db.prepare('SELECT * FROM TeamMembers WHERE id = ?').bind(id).first<TeamMember>(),

  getOnline: (db: D1Database) =>
    db.prepare('SELECT * FROM TeamMembers WHERE is_online = 1').all<TeamMember>(),

  create: (db: D1Database, data: { name: string }) =>
    db.prepare(`
      INSERT INTO TeamMembers (name, is_online, last_seen_at)
      VALUES (?, 0, CURRENT_TIMESTAMP)
      RETURNING *
    `).bind(data.name).first<TeamMember>(),

  update: (db: D1Database, id: number, data: { name?: string; is_online?: number }) => {
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }

    if (data.is_online !== undefined) {
      updates.push('is_online = ?');
      values.push(data.is_online);
      if (data.is_online === 1) {
        updates.push('last_seen_at = CURRENT_TIMESTAMP');
      }
    }

    if (updates.length === 1) return null; // Only updated_at, no actual changes

    values.push(id);

    return db.prepare(`
      UPDATE TeamMembers
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).bind(...values).first<TeamMember>();
  },

  updateOnlineStatus: (db: D1Database, id: number, is_online: number) =>
    db.prepare(`
      UPDATE TeamMembers
      SET is_online = ?,
          last_seen_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(is_online, id).first<TeamMember>(),
};
