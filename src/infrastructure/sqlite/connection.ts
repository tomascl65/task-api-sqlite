import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env.js';

let db: Database.Database | null = null;

export function openDb(): Database.Database {
  if (db) return db;

  const databasePath = env.NODE_ENV === 'test' ? ':memory:' : env.DATABASE_PATH;

  if (databasePath !== ':memory:') {
    const dir = path.dirname(databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(databasePath);

  db.pragma('foreign_keys = ON');
  db.pragma(`journal_mode = ${env.DB_JOURNAL_MODE ?? 'WAL'}`);
  db.pragma('busy_timeout = 5000');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export { db };
