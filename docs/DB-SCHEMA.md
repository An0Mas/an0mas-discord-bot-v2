# DB構成 — an0mas-discord-bot-v2

作成日: 2026-01-08
DB: SQLite (`data/dev.sqlite3`)

---

## テーブル一覧

### 1. meta
メタ情報用テーブル（キー・バリュー形式）

```sql
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| key | TEXT | キー（PK） |
| value | TEXT | 値 |

---

### 2. reminders
リマインダー情報テーブル

```sql
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  notify_at INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER | リマインダーID（PK、自動採番） |
| user_id | TEXT | DiscordユーザーID |
| notify_at | INTEGER | 通知時刻（Unix timestamp） |
| content | TEXT | 通知内容 |
| created_at | INTEGER | 登録時刻（Unix timestamp） |

#### インデックス
```sql
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_notify_at ON reminders(notify_at);
```

---

### 3. guild_config
Guild（サーバー）設定テーブル — 権限管理用

```sql
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id   TEXT PRIMARY KEY,
  enabled    INTEGER NOT NULL DEFAULT 0,
  admin_role TEXT,
  config_json TEXT
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| guild_id | TEXT | DiscordギルドID（PK） |
| enabled | INTEGER | Bot利用許可（1=許可, 0=未許可） |
| admin_role | TEXT | 設定変更権限を委譲するロールID（将来用） |
| config_json | TEXT | その他設定をJSONで保持（将来用） |

---

### 4. allowed_users
コマンド別許可ユーザーテーブル — Restrictedコマンドの権限管理

```sql
CREATE TABLE IF NOT EXISTS allowed_users (
  guild_id   TEXT NOT NULL,
  command    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  PRIMARY KEY (guild_id, command, user_id)
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| guild_id | TEXT | DiscordギルドID |
| command | TEXT | コマンド名（例: bosyu） |
| user_id | TEXT | 許可されたユーザーID |

---

### 5. allowed_roles
コマンド別許可ロールテーブル — Restrictedコマンドの権限管理

```sql
CREATE TABLE IF NOT EXISTS allowed_roles (
  guild_id   TEXT NOT NULL,
  command    TEXT NOT NULL,
  role_id    TEXT NOT NULL,
  PRIMARY KEY (guild_id, command, role_id)
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| guild_id | TEXT | DiscordギルドID |
| command | TEXT | コマンド名（例: bosyu） |
| role_id | TEXT | 許可されたロールID |

---

## 使用ライブラリ
- `better-sqlite3`

## ファイル
- `src/db.ts` - DB初期化＋CRUD関数
