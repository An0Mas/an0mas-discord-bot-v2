import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

let db: import("better-sqlite3").Database | null = null;

function getDb() {
  if (!db) {
    const dataDir = path.resolve(process.cwd(), "data");
    const dbPath = path.join(dataDir, "dev.sqlite3");
    fs.mkdirSync(dataDir, { recursive: true });

    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function initDatabase() {
  const database = getDb();

  // メタテーブル
  database.prepare("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
    .run();

  // リマインダーテーブル
  database.prepare(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      notify_at INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  // インデックス作成
  database.prepare("CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)").run();
  database.prepare("CREATE INDEX IF NOT EXISTS idx_reminders_notify_at ON reminders(notify_at)").run();
}

// リマインダー型
export type Reminder = {
  id: number;
  user_id: string;
  notify_at: number;
  content: string;
  created_at: number;
};

// リマインダーを追加
export function addReminder(userId: string, notifyAt: number, content: string): Reminder {
  const database = getDb();
  const now = Math.floor(Date.now() / 1000);
  const result = database.prepare(`
    INSERT INTO reminders (user_id, notify_at, content, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, notifyAt, content, now);

  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    notify_at: notifyAt,
    content,
    created_at: now,
  };
}

// ユーザーのリマインダー一覧を取得
export function getRemindersForUser(userId: string): Reminder[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM reminders WHERE user_id = ? ORDER BY notify_at ASC
  `).all(userId) as Reminder[];
}

// 全リマインダーを取得（スケジューラ用）
export function getAllReminders(): Reminder[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM reminders ORDER BY notify_at ASC
  `).all() as Reminder[];
}

// リマインダーを削除
export function deleteReminder(id: number): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM reminders WHERE id = ?").run(id);
  return result.changes > 0;
}

// ユーザーの特定リマインダーを削除
export function deleteReminderForUser(userId: string, id: number): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?").run(id, userId);
  return result.changes > 0;
}
