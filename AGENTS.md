# AGENTS.md — Discord便利Bot v1.1.0

> ⚠️ **必ず日本語で応答してください。コード内コメントも日本語で記述してください。**

AIエージェント向けドキュメントガイド。
新しいチャットで作業を始める際は、まずこのファイルを参照してください。

---

## 🚨 最優先ルール（厳守）

1. **日本語で応答する**（識別子・エラー・ログは原文のまま可）
2. **作業範囲は `C:\AI_Work\an0mas-discord-bot-v2` 配下のみ**
3. **秘密情報（トークン/APIキー/.env値）を出力しない**
4. **mainへ直接push禁止**（作業ブランチ → PR → merge）

---

## プロジェクト概要

Discord用の便利Botで、Sapphireフレームワークを使用したTypeScript実装です。

**技術スタック:**
- TypeScript + Node.js（strict mode）
- discord.js v14 + Sapphire Framework
- better-sqlite3（データベース）
- pnpm（パッケージマネージャ）

**環境:**
- OS: Windows（PowerShell想定）
- Root: `C:\AI_Work\an0mas-discord-bot-v2`
- Env: dotenv（`.env` はリポジトリ直下、コミット禁止）

---

## 設計方針

### コマンド vs ボタンのポリシー

| 操作 | 方法 | 理由 |
|------|------|------|
| 新規作成・開始 | スラッシュコマンド | 直感的に呼び出せる |
| 既存の操作・管理 | ボタン/メニュー | コマンド一覧の肥大化防止 |

> **重要**: 新規スラッシュコマンドを安易に追加しない。既存操作はボタンで完結させる。

### 権限の3タイプ

| タイプ | 対象 | 例 |
|--------|------|-----|
| `public` | 全員使用可 | `/bosyu`, `/dice`, `/help` |
| `restricted` | オーナー/許可ユーザー | `/verify`, `/mention-reactors` |
| `owner-only` | Botオーナーのみ | `/allow`, `/config` |

設定は `src/command-config.ts` のCOMMANDS配列で管理。

### ephemeral応答のルール

```typescript
// エラーや個人情報は必ずephemeral
await interaction.reply({
    content: "エラーメッセージ",
    flags: MessageFlags.Ephemeral,
});
```

> `ephemeral: true` は非推奨。必ず `flags: MessageFlags.Ephemeral` を使用。

---

## ドキュメント構成

### ルートディレクトリ

| ファイル | 内容 |
|----------|------|
| `README.md` | プロジェクト概要、セットアップ手順 |
| `AGENTS.md` | AIエージェント向けガイド（本ファイル） |
| `GEMINI.md` | Gemini専用ガイド |
| `CLAUDE.md` | Claude専用ガイド |

### docs/

| ファイル | 内容 |
|----------|------|
| `SCOPE.md` | 機能スコープ、バージョン計画 |
| `SPEC.md` | 技術仕様書（全体設計） |
| `COMMAND.md` | コマンド一覧と動作フロー |
| `HELP.md` | `/help`コマンドが読み込むデータ |
| `PERMISSIONS.md` | 権限システム、Precondition |
| `DB-SCHEMA.md` | データベーススキーマ |
| `PLANS.md` | 今後の開発計画 |
| `DETAILS/*.md` | 各コマンドの詳細仕様 |

---

## ソースコード構成

```
src/
├── index.ts              # エントリポイント
├── config.ts             # 環境変数・設定
├── db.ts                 # データベース操作
├── scheduler.ts          # リマインダースケジューラ
├── command-config.ts     # コマンドメタデータ・権限タイプ
├── commands/             # Sapphireコマンド
├── interaction-handlers/ # ボタン・モーダルハンドラ
├── lib/                  # ユーティリティ関数
│   ├── permission-utils.ts  # 権限チェック
│   ├── bosyu-utils.ts       # 募集機能
│   ├── bosyu-bpsr-utils.ts  # BPSR募集機能
│   ├── remind-utils.ts      # リマインダー機能
│   ├── verify-utils.ts      # 認証機能
│   ├── help-utils.ts        # ヘルプ機能
│   └── mention-reactors-utils.ts # リアクションメンション
└── preconditions/        # Sapphire Precondition
    ├── GuildAllowed.ts   # Guild許可チェック
    └── RestrictedAllowed.ts # Restricted権限チェック
```

---

## 開発コマンド

```bash
pnpm install    # 依存インストール
pnpm dev        # 開発サーバー起動
pnpm tsc --noEmit  # TypeScriptビルドチェック
pnpm start      # 本番起動
```

---

## 実装パターン

### 新コマンドを追加する場合

1. `docs/DETAILS/<command>.md` を作成（仕様）
2. `src/commands/<Command>Command.ts` を作成
3. `preconditions: ["GuildAllowed"]` を追加
4. 必要に応じてボタン/モーダルハンドラを作成
5. `docs/HELP.md` にヘルプ情報を追加
6. `src/command-config.ts` にメタデータを追加
7. `docs/COMMAND.md` を更新

### ファイル命名規則

| 種類 | 命名パターン | 例 |
|------|-------------|-----|
| コマンド | `<Name>Command.ts` | `DiceCommand.ts` |
| ボタンハンドラ | `<Name>ButtonHandler.ts` | `BosyuButtonHandler.ts` |
| モーダルハンドラ | `<Name>ModalHandler.ts` | `BosyuModalHandler.ts` |
| ユーティリティ | `<name>-utils.ts` | `bosyu-utils.ts` |

---

## やってはいけないこと

| ❌ やってはいけない | ✅ 代わりにやること |
|--------------------|---------------------|
| 英語で応答 | 日本語で応答 |
| 新規スラッシュコマンドを乱発 | ボタンで既存機能を拡張 |
| `ephemeral: true` を使う | `flags: MessageFlags.Ephemeral` |
| deferReplyなしで3秒以上の処理 | 先に `deferReply()` を呼ぶ |
| mainへ直接コミット/push | 作業ブランチを使う |
| 秘密情報をログ出力 | 絶対に出力しない |

---

## Git運用

- **mainへ直接コミットしない**
- 作業はブランチで行う：例 `agent/<short-task>`
- まとまったらPRを作る（本文は短くてOK）

---

## 注意事項

- コマンド応答は3秒以内に行う必要がある（Discordの制限）
- 長い処理は `deferReply()` を使用
- Unknown interaction (10062) エラーはPreconditionで防止済み
- **コード内コメントは日本語で記述**
