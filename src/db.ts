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
    db.pragma("busy_timeout = 5000"); // ロック競合時に5秒リトライ
  }
  return db;
}

export function initDatabase() {
  const database = getDb();

  // メタテーブル
  database.prepare("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
    .run();

  // Guild設定テーブル（権限管理用）
  database.prepare(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id   TEXT PRIMARY KEY,
      enabled    INTEGER NOT NULL DEFAULT 0,
      admin_role TEXT,
      config_json TEXT
    )
  `).run();

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

  // コマンド別許可ユーザーテーブル
  database.prepare(`
    CREATE TABLE IF NOT EXISTS allowed_users (
      guild_id   TEXT NOT NULL,
      command    TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      PRIMARY KEY (guild_id, command, user_id)
    )
  `).run();

  // コマンド別許可ロールテーブル
  database.prepare(`
    CREATE TABLE IF NOT EXISTS allowed_roles (
      guild_id   TEXT NOT NULL,
      command    TEXT NOT NULL,
      role_id    TEXT NOT NULL,
      PRIMARY KEY (guild_id, command, role_id)
    )
  `).run();

  // 認証設定テーブル
  database.prepare(`
    CREATE TABLE IF NOT EXISTS verify_settings (
      message_id   TEXT PRIMARY KEY,
      channel_id   TEXT NOT NULL,
      guild_id     TEXT NOT NULL,
      keyword      TEXT NOT NULL,
      role_id      TEXT NOT NULL,
      owner_id     TEXT NOT NULL,
      title        TEXT,
      description  TEXT,
      created_at   INTEGER NOT NULL
    )
  `).run();

  // インデックス作成
  database.prepare("CREATE INDEX IF NOT EXISTS idx_verify_settings_guild ON verify_settings(guild_id)").run();
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

// ========================
// Guild設定関連
// ========================

// GuildConfig型
export type GuildConfig = {
  guild_id: string;
  enabled: number;
  admin_role: string | null;
  config_json: string | null;
};

// Guildが許可されているか確認
export function isGuildEnabled(guildId: string): boolean {
  const database = getDb();
  const row = database.prepare(
    "SELECT enabled FROM guild_config WHERE guild_id = ?"
  ).get(guildId) as { enabled: number } | undefined;
  return row?.enabled === 1;
}

// Guildを許可する
export function enableGuild(guildId: string): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO guild_config (guild_id, enabled)
    VALUES (?, 1)
    ON CONFLICT(guild_id) DO UPDATE SET enabled = 1
  `).run(guildId);
}

// Guildを不許可にする
export function disableGuild(guildId: string): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO guild_config (guild_id, enabled)
    VALUES (?, 0)
    ON CONFLICT(guild_id) DO UPDATE SET enabled = 0
  `).run(guildId);
}

// Guild設定を取得
export function getGuildConfig(guildId: string): GuildConfig | null {
  const database = getDb();
  const row = database.prepare(
    "SELECT * FROM guild_config WHERE guild_id = ?"
  ).get(guildId) as GuildConfig | undefined;
  return row ?? null;
}

// 全許可済みGuildを取得
export function getAllEnabledGuilds(): GuildConfig[] {
  const database = getDb();
  return database.prepare(
    "SELECT * FROM guild_config WHERE enabled = 1"
  ).all() as GuildConfig[];
}

// ========================
// コマンド別許可ユーザー/ロール関連
// ========================

// 許可ユーザーを追加
export function addAllowedUser(guildId: string, command: string, userId: string): boolean {
  const database = getDb();
  try {
    database.prepare(`
      INSERT INTO allowed_users (guild_id, command, user_id)
      VALUES (?, ?, ?)
    `).run(guildId, command, userId);
    return true;
  } catch {
    // 既に存在する場合はfalse
    return false;
  }
}

// 許可ユーザーを削除
export function removeAllowedUser(guildId: string, command: string, userId: string): boolean {
  const database = getDb();
  const result = database.prepare(
    "DELETE FROM allowed_users WHERE guild_id = ? AND command = ? AND user_id = ?"
  ).run(guildId, command, userId);
  return result.changes > 0;
}

// 許可ユーザー一覧を取得
export function getAllowedUsers(guildId: string, command: string): string[] {
  const database = getDb();
  const rows = database.prepare(
    "SELECT user_id FROM allowed_users WHERE guild_id = ? AND command = ?"
  ).all(guildId, command) as { user_id: string }[];
  return rows.map(r => r.user_id);
}

// 許可ロールを追加
export function addAllowedRole(guildId: string, command: string, roleId: string): boolean {
  const database = getDb();
  try {
    database.prepare(`
      INSERT INTO allowed_roles (guild_id, command, role_id)
      VALUES (?, ?, ?)
    `).run(guildId, command, roleId);
    return true;
  } catch {
    // 既に存在する場合はfalse
    return false;
  }
}

// 許可ロールを削除
export function removeAllowedRole(guildId: string, command: string, roleId: string): boolean {
  const database = getDb();
  const result = database.prepare(
    "DELETE FROM allowed_roles WHERE guild_id = ? AND command = ? AND role_id = ?"
  ).run(guildId, command, roleId);
  return result.changes > 0;
}

// 許可ロール一覧を取得
export function getAllowedRoles(guildId: string, command: string): string[] {
  const database = getDb();
  const rows = database.prepare(
    "SELECT role_id FROM allowed_roles WHERE guild_id = ? AND command = ?"
  ).all(guildId, command) as { role_id: string }[];
  return rows.map(r => r.role_id);
}

// ユーザーが特定コマンドの実行権限を持っているかチェック
export function isUserAllowedForCommand(
  guildId: string,
  command: string,
  userId: string,
  userRoleIds: string[]
): boolean {
  const database = getDb();

  // 許可ユーザーに含まれているかチェック
  const userAllowed = database.prepare(
    "SELECT 1 FROM allowed_users WHERE guild_id = ? AND command = ? AND user_id = ?"
  ).get(guildId, command, userId);
  if (userAllowed) return true;

  // 許可ロールに含まれているかチェック
  if (userRoleIds.length > 0) {
    const placeholders = userRoleIds.map(() => '?').join(',');
    const roleAllowed = database.prepare(
      `SELECT 1 FROM allowed_roles WHERE guild_id = ? AND command = ? AND role_id IN (${placeholders})`
    ).get(guildId, command, ...userRoleIds);
    if (roleAllowed) return true;
  }

  return false;
}

// 許可設定が存在するかチェック（空の場合はEveryoneとして扱う）
export function hasAnyPermissionSettings(guildId: string, command: string): boolean {
  const database = getDb();
  const userCount = database.prepare(
    "SELECT COUNT(*) as count FROM allowed_users WHERE guild_id = ? AND command = ?"
  ).get(guildId, command) as { count: number };
  const roleCount = database.prepare(
    "SELECT COUNT(*) as count FROM allowed_roles WHERE guild_id = ? AND command = ?"
  ).get(guildId, command) as { count: number };
  return userCount.count > 0 || roleCount.count > 0;
}

// ========================
// 認証設定関連
// ========================

// VerifySetting型
export type VerifySetting = {
  message_id: string;
  channel_id: string;
  guild_id: string;
  keyword: string;
  role_id: string;
  owner_id: string;
  title: string | null;
  description: string | null;
  created_at: number;
};

// 認証設定を保存
export function saveVerifySetting(setting: Omit<VerifySetting, 'created_at'>): VerifySetting {
  const database = getDb();
  const now = Math.floor(Date.now() / 1000);
  database.prepare(`
    INSERT INTO verify_settings (message_id, channel_id, guild_id, keyword, role_id, owner_id, title, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    setting.message_id,
    setting.channel_id,
    setting.guild_id,
    setting.keyword,
    setting.role_id,
    setting.owner_id,
    setting.title,
    setting.description,
    now
  );
  return { ...setting, created_at: now };
}

// 認証設定を取得
export function getVerifySetting(messageId: string): VerifySetting | null {
  const database = getDb();
  const row = database.prepare(
    "SELECT * FROM verify_settings WHERE message_id = ?"
  ).get(messageId) as VerifySetting | undefined;
  return row ?? null;
}

// 認証設定を更新
export function updateVerifySetting(
  messageId: string,
  updates: Partial<Pick<VerifySetting, 'keyword' | 'role_id' | 'title' | 'description'>>
): boolean {
  const database = getDb();
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (updates.keyword !== undefined) {
    sets.push("keyword = ?");
    values.push(updates.keyword);
  }
  if (updates.role_id !== undefined) {
    sets.push("role_id = ?");
    values.push(updates.role_id);
  }
  if (updates.title !== undefined) {
    sets.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    sets.push("description = ?");
    values.push(updates.description);
  }

  if (sets.length === 0) return false;

  values.push(messageId);
  const result = database.prepare(
    `UPDATE verify_settings SET ${sets.join(", ")} WHERE message_id = ?`
  ).run(...values);
  return result.changes > 0;
}

// 認証設定を削除
export function deleteVerifySetting(messageId: string): boolean {
  const database = getDb();
  const result = database.prepare(
    "DELETE FROM verify_settings WHERE message_id = ?"
  ).run(messageId);
  return result.changes > 0;
}
