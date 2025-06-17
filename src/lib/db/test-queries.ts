import type { D1Database } from '@cloudflare/workers-types';

export interface TestRecord {
  id: number;
  name: string;
  surname: string;
}

export const testQueries = {
  getAll: (db: D1Database) =>
    db.prepare('SELECT * FROM test').all<TestRecord>(),
  
  getById: (db: D1Database, id: number) =>
    db.prepare('SELECT * FROM test WHERE id = ?').bind(id).first<TestRecord>(),
  
  create: (db: D1Database, data: { name: string; surname: string }) =>
    db.prepare(`
      INSERT INTO test (name, surname) 
      VALUES (?, ?) 
      RETURNING id, name, surname
    `).bind(data.name, data.surname).first<TestRecord>(),
  
  update: (db: D1Database, id: number, data: { name?: string; surname?: string }) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    
    if (data.surname !== undefined) {
      updates.push('surname = ?');
      values.push(data.surname);
    }
    
    if (updates.length === 0) return null;
    
    values.push(id);
    
    return db.prepare(`
      UPDATE test 
      SET ${updates.join(', ')} 
      WHERE id = ?
      RETURNING id, name, surname
    `).bind(...values).first<TestRecord>();
  },
  
  delete: (db: D1Database, id: number) =>
    db.prepare('DELETE FROM test WHERE id = ?').bind(id).run()
};