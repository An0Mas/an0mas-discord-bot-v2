# an0mas-discord-bot-v2

個人用 Discord Bot（TypeScript + Sapphire Framework / discord.js v14）

## 機能

### /help
コマンドの使い方を一覧・詳細で確認できます（本人のみ表示）。

### /bosyu
参加者募集を作成します。ボタンで参加/取消/締切、残り人数の調整ができます。
- 引数なし：モーダルで入力
- 引数あり：即時作成

## セットアップ

### 1. 依存インストール
```bash
npm install
```

### 2. 環境変数
`.env.example` をコピーして `.env` を作成し、以下を設定：
- `DISCORD_TOKEN` - Botトークン
- `CLIENT_ID` - アプリケーションID
- `GUILD_ID` - 開発用サーバーID

### 3. コマンド登録
```bash
npm run deploy
```

### 4. 起動
```bash
npm run dev
```

## ディレクトリ構成
```
src/
├── index.ts          # エントリーポイント
├── db.ts             # DB関連
├── command-data.ts   # コマンド定義
├── deploy-commands.ts
└── commands/
    ├── help.ts       # /help 機能
    └── bosyu.ts      # /bosyu 機能
```

## DB
- `./data/dev.sqlite3` を利用（起動時に自動生成）
