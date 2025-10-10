import type { D1Database } from '@cloudflare/workers-types';

export interface TeamMember {
  id: number;
  name: string;
  cognito_sub: string | null; // Cognito user sub (unique identifier)
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

  getByCognitoSub: (db: D1Database, cognito_sub: string) =>
    db.prepare('SELECT * FROM TeamMembers WHERE cognito_sub = ?')
      .bind(cognito_sub)
      .first<TeamMember>(),

  getByEmail: (db: D1Database, email: string) =>
    db.prepare('SELECT * FROM TeamMembers WHERE name = ?')
      .bind(email)
      .first<TeamMember>(),

  /**
   * Upsert user by Cognito Sub
   * - If user exists (by cognito_sub), update last_seen_at and set is_online = 1
   * - If user doesn't exist, create new user
   * - Returns the TeamMember record
   */
  upsertByCognitoSub: async (db: D1Database, data: {
    cognito_sub: string;
    email: string;
    name?: string;
  }): Promise<TeamMember | null> => {
    // Try to find existing user by cognito_sub
    const existing = await teamMemberQueries.getByCognitoSub(db, data.cognito_sub);

    if (existing) {
      // User exists, update last_seen_at and set online
      return teamMemberQueries.updateOnlineStatus(db, existing.id, 1);
    }

    // User doesn't exist, create new
    const result = await db.prepare(`
      INSERT INTO TeamMembers (name, cognito_sub, is_online, last_seen_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      RETURNING *
    `).bind(
      data.email,
      data.cognito_sub
    ).first<TeamMember>();

    return result;
  },
};
