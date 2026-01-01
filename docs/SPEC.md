# SPEC — Discord便利Bot v0.1 (Sapphire)

## 0. このドキュメントの扱い（最優先）
- この `SPEC.md` が v0.1 の **唯一の正**（Single Source of Truth）。
- ここに書かれていない機能・挙動を **推測で追加しない**。
- 実装は Codex / Antigravity に投げる。**このチャットではコードを書かない**。
- バージョンごとの「入れる/入れない」の境界は `docs/SCOPE.md` を優先する（矛盾したらSCOPE側を正として修正する）。
- 未スケジュールの案・検討事項は `docs/PLANS.md` に置き、SPECには確定事項のみを書く。

## 1. 目的
- 「普段使いで便利」な機能を少しずつ増やす。
- v0.1 では、既存（旧Java）実装の挙動を基準に仕様を固め、Sapphireへ移植可能な形で定義する。

## 2. スコープ
> v0.1/v0.2/Later の範囲宣言は `docs/SCOPE.md` が正。

### 2.1 v0.1 に含める（確定）
- フレームワーク：**Sapphire Framework（discord.js v14ベース）**
- 永続化：**SQLite（ローカルファイル）**
- ヘルプ：`/help`（ephemeral + 一覧→詳細遷移 + ページ送り）
- 既存コマンドの移植ベース（詳細は順次追加）
  - 現時点で仕様確定済み：**募集（bosyu）**

### 2.2 v0.1 に含めない（確定）
- 音楽機能
- MessageContent intent 前提の機能
- /poll /config /clean（将来追加）
- コマンド可用性（このサーバーで使える/使えない、このユーザー/ロールだけ等）

## 3. 技術要件（非交渉）
- 言語：TypeScript（`strict: true`）
- Discord：discord.js v14（Sapphire経由）
- intents：最小（`Guilds` のみ）
- Secrets：
  - Token/DBパス等は `.env` で管理する
  - コード・ログ・会話ログに直書きしない
- Web操作（検証/調査など）：Antigravity（Chrome MCP）に任せる

## 4. データ永続化（SQLite）
### 4.1 DBファイル配置（推奨）
- 開発用DB：`./data/dev.sqlite3`
- `data/` は gitignore 対象（DBファイルをコミットしない）

### 4.2 DBの役割（v0.1）
- v0.1 は「まず動く」を優先し、SQLiteで状態を保持する。
- ただし、機能によっては **メッセージ内容（Embed等）から状態復元**できる設計を優先してよい（bosyu等）。

## 5. 権限 / 安全
- 既定：ユーザーが触れるのは **自分に関係するデータのみ**（機能別に明記）
- 秘密情報（Token/DB URL/パス）を返信・ログに出さない
- 例外時はユーザー向けに分かる文言で返す（内部スタックトレース等は出しすぎない）

---

## 6. ヘルプ（/help）— v0.1（最短UI + ページ送り）
### 6.1 目的
- ユーザーがBot内でコマンドの使い方を確認できるようにする。

### 6.2 参照元（Single Source）
- ヘルプ文の正本は `docs/HELP.md`。
- 一覧の表示順は `HELP.md` の掲載順を優先する。

### 6.3 表示ポリシー
- `/help` の応答は **ephemeral（呼び出した本人のみ表示）** を既定とする。

### 6.4 一覧モード（/help）
- コマンド一覧を `1.` `2.` … の **ナンバリング**で表示する。
- 各行は「コマンド名 + 軽い説明（summary）」を表示する。
  - summary は `docs/HELP.md` の各コマンドの「概要（1行）」を使用する。
- 1ページあたり最大 `N=10` コマンド（v0.1固定）。
- フッター等に `Page X / Y` を表示する。

### 6.5 詳細表示（一覧 → 詳細）
- 一覧には **番号ボタン（1〜N）**を表示し、押下で該当コマンドの **詳細画面**に遷移する。
- 詳細画面は `docs/HELP.md` の該当セクション内容を表示する（一覧用summary以上の情報を含む）。

### 6.6 戻る（詳細 → 一覧）
- 詳細画面には **戻る（Back）**ボタンを表示し、押下で「直前の一覧ページ」に戻る。

### 6.7 ページ送り（一覧）
- 一覧には `prev`（◀）/ `next`（▶）を表示する。
- 先頭ページで `prev` は disabled、最終ページで `next` は disabled。
- 操作は **同一メッセージを編集**して更新する（新規投稿しない）。

### 6.8 操作ユーザー制限
- ボタン操作は **/help を呼び出したユーザーのみ**有効。
- 他ユーザーが押した場合は no-op（必要なら任意でephemeral通知）。

---

## 7. 募集（bosyu）— v0.1 仕様確定
### 7.1 目的
- 参加者募集用のメッセージ（Embed）を投稿し、ボタン操作で
  - 参加者リスト
  - 残り募集人数
  - 募集の締切（OPEN/CLOSED）
  を管理する。

### 7.2 状態管理方針（重要）
- bosyu の状態は原則 **募集メッセージ（Embed）の内容で完結**する（DB必須ではない）。
- ただし、操作権限（作成者のみ）判定のために **owner_id を必ず保持**する。
  - 推奨：ボタン `custom_id` に owner_id を含める
  - 代替：Embed footer 等に owner_id を埋め込む

### 7.3 入力（コマンドI/F）
- `/bosyu`
  - `slots`: number（募集人数。作成者以外に「あと何名」参加できるか）
  - `title`: string
  - `body`: string（改行可）

### 7.4 出力（Embedの要点）
- 参加メンバーリスト（フィールド）に、初期値として **作成者のメンション**を入れる。
- 募集人数（フィールド）に `あと{remaining}名` を表示する。
  - 初期 `remaining = slots`
- 状態：
  - OPEN：募集中
  - CLOSED：募集停止
- 画像：
  - OPEN/CLOSED で別画像を表示する（URLは `docs/DETAILS/bosyu.md` に定義）

※ Embedの厳密な見た目・フィールド名固定・パース規約は `docs/DETAILS/bosyu.md` に記載する。

### 7.5 ボタンと権限
- 参加（join）：誰でも
- 取消（cancel）：誰でも
- 締切/再開（close）：**作成者のみ**
- ＋/－（plus/minus）：**作成者のみ**

### 7.6 挙動（要点）
- join：
  - 未参加かつ remaining > 0 のとき参加者リストに追加し、remaining を -1
  - 参加済み、または remaining=0 の場合は no-op（状態変更なし）
- cancel：
  - 参加済みなら参加者リストから削除し、remaining を +1
  - 未参加の場合は no-op
- plus/minus（作成者のみ）：
  - plus：remaining を +1
  - minus：remaining > 0 のとき remaining を -1（0未満にしない）
- close（作成者のみ）：
  - OPEN→CLOSED：join/cancel/plus/minus を disabled、close は「再開」表示で有効
  - CLOSED→OPEN：join/cancel/plus/minus を enabled、close は「締切」表示で有効

---

## 8. 成果物（AIに求めるもの）
- 「動く最小構成」で起動できること
- README（起動手順 / コマンド登録 / 環境変数 / DB準備）
- v0.1 で確定した機能の実装が仕様通りであること
- `docs/` 配下のドキュメント（SPEC/HELP/DETAILS）と挙動が矛盾しないこと
- `docs/SCOPE.md` の v0.1 範囲を超えた機能を勝手に実装しないこと

## 9. 完了条件（Acceptance Criteria）
- intents は `Guilds` のみで動作する
- Secrets は `.env` 管理で、コード/ログに直書きされない
- `/help` が仕様通りに動く
  - ephemeral（本人のみ）
  - 一覧にナンバリング + summary
  - 番号ボタンで詳細へ遷移できる
  - Backで直前の一覧ページに戻れる
  - prev/nextで一覧ページ送りできる（同一メッセージ編集）
  - ボタンは本人のみ操作可能
- `/bosyu` が投稿でき、ボタン操作で仕様通りに状態が変わる
  - join/cancel/plus/minus/close の権限と no-op を含む
  - close により join/cancel/plus/minus が disabled になる
- README に最低限の手順が揃っている（起動/登録/env/DB）
