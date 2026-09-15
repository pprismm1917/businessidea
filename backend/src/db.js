import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "boneline.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_slug TEXT NOT NULL,
    contact TEXT NOT NULL,
    name TEXT,
    source TEXT NOT NULL,      -- 'missed_call' | 'chatbot'
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'new',  -- 'new' | 'contacted' | 'booked' | 'closed'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_slug TEXT NOT NULL,
    contact TEXT NOT NULL,
    direction TEXT NOT NULL,   -- 'in' | 'out'
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function saveMessage({ clientSlug, contact, direction, body }) {
  db.prepare(
    `INSERT INTO messages (client_slug, contact, direction, body) VALUES (?, ?, ?, ?)`
  ).run(clientSlug, contact, direction, body);
}

export function getConversation(clientSlug, contact, limit = 20) {
  return db
    .prepare(
      `SELECT direction, body, created_at FROM messages
       WHERE client_slug = ? AND contact = ?
       ORDER BY id ASC LIMIT ?`
    )
    .all(clientSlug, contact, limit);
}

export function createLead({ clientSlug, contact, name, source, reason }) {
  const result = db
    .prepare(
      `INSERT INTO leads (client_slug, contact, name, source, reason) VALUES (?, ?, ?, ?, ?)`
    )
    .run(clientSlug, contact, name || null, source, reason || null);
  return result.lastInsertRowid;
}

export function listLeads(clientSlug) {
  return db
    .prepare(
      `SELECT * FROM leads WHERE client_slug = ? ORDER BY created_at DESC`
    )
    .all(clientSlug);
}

export function updateLeadStatus(id, status) {
  db.prepare(`UPDATE leads SET status = ? WHERE id = ?`).run(status, id);
}

export default db;
