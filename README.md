# an0mas-discord-bot-v2 (v1.2.1)

個人用 Discord Bot（TypeScript + Sapphire Framework / discord.js v14）

## 機能

### /help

コマンドの使い方を一覧・詳細で確認できます（本人のみ表示）。

### /bosyu

参加者募集を作成します。ボタンで参加/取消/締切、残り人数の調整ができます。

- 引数なし：モーダルで入力
- 引数あり：即時作成

### /bosyu-bpsr

BPSR（ゲーム）特化のロール別募集を作成します。

- 🛡️ タンク / ⚔️ アタッカー / 💚 ヒーラー でロール選択
- ロール変更はボタン押し直しで自動切替
- 投稿者は自動参加せず、ボタンで参加

### /bpsr-role

ロール付与ボタンを設置します。タンク/アタッカー/ヒーラーから選択し、排他的にロールを付与します。

### /remind

指定時刻にDMでリマインダー通知を受け取れます。

### /remind-list

登録済みリマインダーの一覧表示・削除ができます。

### /dice

ダイスロール。NdM形式で指定できます（例: 2d6, 1d100）。

### /verify

合言葉認証システム。指定のキーワードを入力したユーザーにロールを付与します。

### /allow (オーナー専用)

サーバー許可・ユーザー/ロール権限を管理します。

### /config (オーナー専用)

Bot設定・権限設定を確認します。

## セットアップ

### 1. 依存インストール

```bash
pnpm install
```

### 2. 環境変数

`.env.example` をコピーして `.env` を作成し、以下を設定：

- `DISCORD_TOKEN` - Botトークン
- `CLIENT_ID` - アプリケーションID
- `OWNER_ID` - BotオーナーのユーザーID

### 3. 起動

```bash
pnpm dev
```

> **Note**: Sapphireがコマンドを自動登録するため、`pnpm deploy` は不要です。

## Bot権限設定（OAuth2 URL Generator）

Discord Developer Portal でBot招待URLを生成する際に必要な設定です。

### 必要なScopes

- `bot`
- `applications.commands`

### 必要なBot Permissions

| カテゴリ | 権限                 | 必須 |
| -------- | -------------------- | :--: |
| General  | View Channels        |  ✅  |
| General  | Manage Roles         |  ✅  |
| Text     | Send Messages        |  ✅  |
| Text     | Embed Links          |  ✅  |
| Text     | Read Message History |  ✅  |
| Text     | Use Slash Commands   |  ✅  |
| Text     | Add Reactions        |  -   |

## ディレクトリ構成

```
src/
├── index.ts                 # エントリーポイント（SapphireClient初期化）
├── db.ts                    # SQLite操作
├── config.ts                # 環境変数設定
├── command-config.ts        # コマンドメタデータ・権限タイプ
├── scheduler.ts             # リマインダースケジューラ
├── commands/                # Sapphire Commandクラス（自動登録）
│   ├── HelpCommand.ts
│   ├── BosyuCommand.ts
│   ├── BosyuBpsrCommand.ts
│   ├── BpsrRoleCommand.ts
│   ├── RemindCommand.ts
│   ├── RemindListCommand.ts
│   ├── DiceCommand.ts
│   ├── VerifyCommand.ts
│   ├── AllowCommand.ts
│   └── ConfigCommand.ts
├── interaction-handlers/    # Sapphire InteractionHandler（ボタン・モーダル）
│   └── ...
├── listeners/               # Sapphireイベントリスナー（エラーハンドリング）
│   └── ...
├── preconditions/           # Sapphire Precondition（権限チェック）
│   └── GuildAllowed.ts
└── lib/                     # 共有ユーティリティ
    ├── permission-utils.ts  # 権限チェック
    ├── error-notify.ts      # エラーDM通知
    ├── help-utils.ts
    ├── bosyu-utils.ts
    ├── bosyu-bpsr-utils.ts
    ├── bpsr-role-utils.ts
    ├── remind-utils.ts
    └── verify-utils.ts
```

## DB

- `./data/dev.sqlite3` を利用（起動時に自動生成）
- WALモード + busy_timeout=5000ms

## 品質ゲート / CI（現状）

- ローカル品質ゲート（推奨）:
  - `pnpm lint:fix`
  - `pnpm format`
  - `pnpm verify`
- `pnpm verify` は `typecheck + lint` を実行します。
- GitHub Actions によるCIワークフロー（`verify` / `format:check`）は未整備です。
- 監査タスクとして、最小CI（`pnpm verify` + `pnpm format:check`）の導入を計画しています。

## 技術スタック

- **フレームワーク**: Sapphire Framework
- **Discord**: discord.js v14
- **言語**: TypeScript (strict mode)
- **DB**: SQLite (better-sqlite3)
