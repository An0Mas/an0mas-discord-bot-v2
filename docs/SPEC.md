# SPEC — Discord便利Bot v1.2.0 (Sapphire)

## 0. このドキュメントの扱い（最優先）
- この `SPEC.md` が **実装済み仕様のまとめ**（現状の正）。  
 既存実装と矛盾していないことが最優先。
- 仕様変更を入れる場合は、関連ドキュメント（`docs/COMMAND.md` / `docs/HELP.md` / `docs/DETAILS/*.md` など）も合わせて更新する。
- 未確定の案や検討事項は `docs/PLANS.md` に置く。

## 1. 目的
- 「普段使いで便利」な機能を少しずつ増やす。
- 現行実装（Sapphire）を基準に、挙動と運用を明文化する。

## 2. スコープ
> 仕様の範囲は現行実装が正。必要に応じて `docs/SCOPE.md` を更新する。

### 2.1 現行に含める（実装済み）
- フレームワーク：**Sapphire Framework（discord.js v14ベース）**
- 永続化：**SQLite（ローカルファイル）**
- ヘルプ：`/help`（ephemeral + 一覧→詳細遷移 + ページ送り）
- 権限：**public / restricted / owner-only** の3タイプ
- 主要コマンド（一覧は `src/command-config.ts` が正）

### 2.2 現行に含めない（未実装）
- 音楽機能
- MessageContent intent 前提の機能

## 3. 技術要件（非交渉）
- 言語：TypeScript（`strict: true`）
- Discord：discord.js v14（Sapphire経由）
- intents：最小（`Guilds` のみ）
- Secrets：
  - Token/DBパス等は `.env` で管理する
  - コード・ログ・会話ログに直書きしない
- Web操作（検証/調査など）：必要時のみ行う

### 3.1 プロジェクト構成（src/）

```
src/
├── index.ts                 # エントリポイント（SapphireClient初期化）
├── db.ts                    # SQLite初期化
├── config.ts                # 環境変数設定
├── scheduler.ts             # リマインダースケジューラ
├── commands/                # Sapphire Commandクラス（自動登録）
│   ├── HelpCommand.ts
│   ├── BosyuCommand.ts
│   ├── BosyuBpsrCommand.ts
│   ├── RemindCommand.ts
│   ├── RemindListCommand.ts
│   ├── AllowCommand.ts
│   ├── ConfigCommand.ts
│   ├── VerifyCommand.ts
│   ├── BpsrRoleCommand.ts
│   ├── MentionReactorsCommand.ts
│   └── DiceCommand.ts
├── interaction-handlers/    # Sapphire InteractionHandler（ボタン・モーダル）
│   ├── HelpButtonHandler.ts
│   ├── BosyuButtonHandler.ts
│   ├── BosyuModalHandler.ts
│   └── ...
├── listeners/               # エラー/拒否などのリスナー
│   ├── ChatInputCommandDenied.ts
│   ├── ChatInputCommandError.ts
│   └── InteractionHandlerError.ts
├── preconditions/           # Sapphire Precondition
│   ├── GuildAllowed.ts
│   └── RestrictedAllowed.ts
└── lib/                     # 共有ユーティリティ
    ├── help-utils.ts
    ├── bosyu-utils.ts
    ├── bosyu-bpsr-utils.ts
    ├── permission-utils.ts
    ├── error-notify.ts
    └── remind-utils.ts
```


## 4. データ永続化（SQLite）
### 4.1 DBファイル配置（推奨）
- 開発用DB：`./data/dev.sqlite3`
- `data/` は gitignore 対象（DBファイルをコミットしない）

### 4.2 DBスキーマ
- 詳細は [`docs/DB-SCHEMA.md`](./DB-SCHEMA.md) を参照。

### 4.3 DBの役割（v0.1）
- v0.1 は「まず動く」を優先し、SQLiteで状態を保持する。
- ただし、機能によっては **メッセージ内容（Embed等）から状態復元**できる設計を優先してよい（bosyu等）。

## 5. 権限 / 安全
- 既定：ユーザーが触れるのは **自分に関係するデータのみ**（機能別に明記）
- 秘密情報（Token/DB URL/パス）を返信・ログに出さない
- 例外時はユーザー向けに分かる文言で返す（内部スタックトレース等は出しすぎない）
- 権限システムの詳細は [`docs/PERMISSIONS.md`](./PERMISSIONS.md) を参照

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

## 7. 募集（bosyu）
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
  - `slots`: number（v0.1.1以降は任意入力。後述のモード判定に従う）
  - `title`: string（v0.1.1以降は任意入力。後述のモード判定に従う）
  - `body`: string（v0.1.1以降は任意入力。後述のモード判定に従う）

#### 7.3.1 モード判定
- `slots/title/body` が **全て未指定**：
  - モーダル入力を表示する（7.3.2）。
- `slots/title/body` が **全て指定**：
  - 従来どおり即時に募集を作成する（7.4以降）。
- `slots/title/body` が **一部のみ指定**：
  - エラーを ephemeral で返し、no-op（募集は作成しない）。

##### エラー文
- エラー文は簡潔に、以下の要点を含む：
  - 「3項目すべて入力するか、引数なしでモーダル入力してください」
- 例（固定文言にしてよい）：
  - `slots/title/body は3項目すべて入力するか、引数なしで /bosyu を実行してモーダル入力してください。`

#### 7.3.2 モーダル入力
- `/bosyu`（引数なし）実行時、モーダルを表示する。
- モーダルの入力項目は `slots/title/body` に対応する3項目とする。
- 送信後の挙動は「`slots/title/body` が全て指定された即時作成」と同一（7.4以降）。
- モーダルを閉じた場合は no-op（何も投稿しない）。

##### モーダル項目
- フィールド（3つ）
  - `slots`（短文入力）
  - `title`（短文入力）
  - `body`（段落入力：改行可）
- ラベル（表示名）は以下を推奨（固定でよい）：
  - slots：`募集人数（あと何名）`
  - title：`タイトル`
  - body：`内容`
- プレースホルダーは任意（未指定でもよい）。

##### 入力検証
- `slots`：
  - 全角数字が入力された場合は**半角に自動変換**する（例：`５` → `5`）
  - 整数として解釈できること（数値以外はエラー）
  - `slots >= 1`（0以下はエラー）
- `title/body`：
  - 空文字はエラー（空白のみも不可としてよい）
- エラー時：
  - ephemeral で理由を返し、no-op（募集は作成しない）

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
- 参加取消（cancel）：誰でも
- 締切/再開（close）：**作成者のみ**
- ＋/－（plus/minus）：**作成者のみ**
- 編集（edit）：**作成者のみ**（v0.1.2）

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
- edit（作成者のみ、v0.1.2）：
  - 編集モーダルを表示（タイトル/本文/人数に現在値をプリフィル）
  - 送信でEmbedを更新（参加者リスト・状態は維持）
  - 締切中（CLOSED）でも編集可能
  - 人数変更で超過（メンバー数 > 残り人数）が発生しても許可（マイナス表示OK）

---

## 8. 完了条件（Acceptance Criteria）
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
- `/bosyu` が引数なしでモーダル入力を開ける
  - 送信後は従来と同じ募集が作成される
  - 引数が一部のみ指定された場合は ephemeral エラーで no-op
  - slots が数値でない/1未満の場合は ephemeral エラーで no-op
  - モーダルを閉じた場合は no-op（何も投稿しない）
- README に最低限の手順が揃っている（起動/登録/env/DB）
- `/bosyu` に「編集」ボタンがある
  - 作成者のみが編集ボタンを操作可能
  - 編集モーダルに現在のタイトル/本文/人数がプリフィルされる
  - 送信でEmbedが更新される（参加者リスト・状態は維持）
  - 締切中でも編集可能
  - 人数変更で超過してもマイナス表示で許可
