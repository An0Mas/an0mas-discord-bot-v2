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

## 使用ライブラリ
- `better-sqlite3`

## ファイル
- `src/db.ts` - DB初期化＋CRUD関数
