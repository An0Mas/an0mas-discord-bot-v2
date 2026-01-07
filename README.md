# an0mas-discord-bot-v2

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
├── index.ts                 # エントリーポイント（ルーティング）
├── db.ts                    # DB初期化
├── command-data.ts          # スラッシュコマンド定義
├── deploy-commands.ts       # コマンド登録スクリプト
├── commands/                # コマンドロジック
│   ├── help.ts
│   ├── bosyu.ts
│   └── bosyu-bpsr.ts
└── handlers/                # Interactionハンドラ
    ├── button-handlers.ts   # ボタン処理
    ├── modal-handlers.ts    # モーダル処理
    └── command-handlers.ts  # スラッシュコマンド処理
```

## DB
- `./data/dev.sqlite3` を利用（起動時に自動生成）
