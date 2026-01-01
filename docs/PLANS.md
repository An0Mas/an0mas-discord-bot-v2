# PLANS — Discord便利Bot（将来拡張メモ / 未スケジュール）

> このファイルは「いつかやるかもしれない」「設計の候補」「検討事項」を置くメモ。
> バージョンごとの範囲（v0.1/v0.2/Later）は `docs/SCOPE.md` が正。
> 仕様の正本は `docs/SPEC.md`。

---

## 0) このファイルの使い方
- ここに書く内容は **未確定** を含む。
- 実装判断や優先順位は `SCOPE.md` を優先する。
- 実装に入る段階で、必要なら `SPEC.md` / `DETAILS/*.md` に“確定仕様”として昇格させる。

---

## 1) コマンド可用性（Availability）— 検討メモ
### 目的
- 「このサーバーで使えるか」「このユーザー/ロールだけが使えるか」を制御したい。
- /help に「使える/使えない理由」を出したい。

### 概念（案）
- 各コマンドは「どこで/誰が」使えるかの条件を持つ。
  - guild scope：許可/禁止（allow/deny）
  - user scope：許可/禁止（allow/deny）
  - role scope：許可/禁止（allow/deny）
  - channel scope：許可/禁止（allow/deny）
  - permission：Discord権限（ManageGuild等）

### 進め方（案）
- 段階導入する（まずは単純なものから）
  1. guild単位の enable/disable
  2. roleの allow/deny
  3. userの allow/deny
  4. channel制限、Discord権限条件

### 注意点
- “bosyu内部の作成者限定操作”のような **機能内部の権限**は、Availabilityとは別枠で残す。
- 複数条件が重なった場合の優先順位（deny優先等）を明確化する必要がある。

---

## 2) 設定コマンド（/config）— 検討メモ
### 目的
- サーバーごとの設定（ログチャンネル、管理ロール、言語など）を管理したい。
- Availability の管理UI（ON/OFFや許可対象）を提供したい。

### 方針（案）
- 初期は “最小” で良い（設定項目は絞る）。
- 操作権限は「管理者 or 管理ロール」に限定する。

### UX案（候補）
- `/config show`：現在の設定を表示
- `/config set key value`：設定変更（最小）
- `/config commands enable/disable <command>`：guild単位のON/OFF
- 余裕があれば、セレクトメニューで設定変更

---

## 3) DB設計案（SQLite想定の候補）
> 実装時に必要なら `DATA/sqlite.md` や `SPEC.md` に昇格させる。

### 3.1 command_overrides（候補）
- id (uuid)
- guild_id (text)            ※guild単位の設定に使う
- command (text)             ※例: "bosyu", "help"
- enabled (bool)             ※最小：guild単位ON/OFF
- allow_roles_json (text)    ※拡張用（JSON配列）
- deny_roles_json (text)
- allow_users_json (text)
- deny_users_json (text)
- updated_at (timestamptz)

### 3.2 guild_settings（候補）
- guild_id (text)
- admin_role_id (text null)
- log_channel_id (text null)
- locale (text default "ja")
- updated_at (timestamptz)

### 3.3 audit_log（候補）
- id (uuid)
- guild_id (text)
- actor_id (text)
- action (text)
- payload_json (text)
- created_at (timestamptz)

### 注意点
- JSONで持つのは最小実装向きだが、増えると検索が面倒になる。
- 将来Postgresに移すなら正規化も検討。

---

## 4) /help の拡張案（未スケジュール）
> v0.1は最短仕様で確定。ここは“将来やるなら”の案。

- 一覧に「利用制限あり」等の注記を追加
- コマンド検索（キーワード）
- カテゴリ表示（utility/admin等）
- “このサーバーでは無効” の理由表示（Availabilityと連動）

---

## 5) 追加コマンド候補（未スケジュール）
- /poll：投票（ボタン/セレクトで操作感よく）
- /clean：掃除系（権限チェック必須）
- /config：設定（上記参照）

---

## 6) 運用/安全（未スケジュールだが重要）
- 権限チェックは共通化（1箇所に集約）
- 失敗時の返信は情報を出しすぎない（内部詳細は控える）
- Secrets（Token/DBパス等）は絶対にログ出力しない
- DBは開発用と本番を分ける（将来）

---

## 7) 実装の方針（未スケジュールの設計メモ）
- 判定ロジック（Availabilityなど）はコマンド共通化する。
- 仕様（SPEC/DETAILS）と表示文（HELP/COMMAND）を混ぜない。
- 追加機能は `DETAILS/<feature>.md` を先に作ってから実装に入る。
