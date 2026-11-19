import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { FINISHES, SETTINGS } from './seed.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS finishes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    tagline     TEXT    NOT NULL,
    description TEXT    NOT NULL,
    best_for    TEXT    NOT NULL,          -- JSON array of strings
    price_min   REAL    NOT NULL CHECK (price_min > 0),
    price_max   REAL    NOT NULL CHECK (price_max >= price_min),
    image       TEXT,
    sort        INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    phone        TEXT,
    finish_id    INTEGER NOT NULL REFERENCES finishes(id),
    area         REAL    NOT NULL,
    surface      TEXT    NOT NULL,
    condition    TEXT    NOT NULL,
    estimate_min REAL    NOT NULL,
    estimate_max REAL    NOT NULL,
    message      TEXT,
    status       TEXT    NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
`;

/**
 * Opens (or creates) the SQLite database, applies the schema and seeds
 * default data. Use ':memory:' for tests.
 */
export function openDb(file = ':memory:', { adminEmail, adminPassword } = {}) {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  const count = db.prepare('SELECT COUNT(*) AS n FROM finishes').get().n;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO finishes (slug, name, tagline, description, best_for, price_min, price_max, image, sort)
      VALUES (@slug, @name, @tagline, @description, @best_for, @price_min, @price_max, @image, @sort)
    `);
    const seedAll = db.transaction((rows) => rows.forEach((r, i) => insert.run({ ...r, best_for: JSON.stringify(r.best_for), sort: i })));
    seedAll(FINISHES);
  }

  const setSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(SETTINGS)) setSetting.run(k, v);

  if (adminEmail && adminPassword) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO admins (email, password_hash) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
    `).run(adminEmail.toLowerCase(), hash);
  }

  return db;
}

export function rowToFinish(r) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    bestFor: JSON.parse(r.best_for),
    priceMin: r.price_min,
    priceMax: r.price_max,
    image: r.image,
  };
}

export function getSettings(db) {
  return Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((s) => [s.key, s.value]));
}
