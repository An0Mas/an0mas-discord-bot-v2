# AGENTS.md — Discord便利Bot v1.2.1

> ⚠️ **必ず日本語で応答せよ。例外なし。**

AIエージェント向けドキュメントガイド。作業開始時に必ず参照すること。

---

## 🚨 絶対ルール（違反禁止）

| ルール         | 詳細                                                 |
| -------------- | ---------------------------------------------------- |
| 日本語で応答   | コード内コメントも日本語。識別子・エラーログは原文可 |
| 作業範囲厳守   | `C:\AI_Work\an0mas-discord-bot-v2` 配下のみ          |
| 秘密情報禁止   | トークン/APIキー/.env値を絶対に出力しない            |
| main直push禁止 | 作業ブランチ → PR → merge                            |

---

## プロジェクト概要

| 項目                 | 値                        |
| -------------------- | ------------------------- |
| フレームワーク       | Sapphire (discord.js v14) |
| DB                   | better-sqlite3            |
| パッケージマネージャ | pnpm                      |
| OS                   | Windows (PowerShell)      |

---

## Skills

使用可能スキル一覧。必要に応じて追加すること。

- `add-command` — 新しいSlashコマンドを追加する際のチェックリストと手順  
  ファイル: `.agent/skills/add-command/SKILL.md`
- `kaizen` — 実装/リファクタ/設計/プロセス改善・エラー処理の継続的改善  
  ファイル: `.agent/skills/kaizen/SKILL.md`
- `prompt-engineering` — プロンプト/スキル/コマンド設計の指針  
  ファイル: `.agent/skills/prompt-engineering/SKILL.md`
- `codex-audit` — 改善監査を標準フォーマットで実施し、`docs/research/codex-audit/YYYY-MM-DD/` に記録する手順  
  ファイル: `.agent/skills/codex-audit/SKILL.md`

---

## 設計方針

### コマンド vs ボタンのポリシー

| 操作             | 方法               | 理由                     |
| ---------------- | ------------------ | ------------------------ |
| 新規作成・開始   | スラッシュコマンド | 直感的に呼び出せる       |
| 既存の操作・管理 | ボタン/メニュー    | コマンド一覧の肥大化防止 |

> **重要**: 新規スラッシュコマンドを安易に追加しない。既存操作はボタンで完結させる。

### 権限の3タイプ

| タイプ       | 対象                  | 例                             |
| ------------ | --------------------- | ------------------------------ |
| `public`     | 全員使用可            | `/bosyu`, `/dice`, `/help`     |
| `restricted` | オーナー/許可ユーザー | `/verify`, `/mention-reactors` |
| `owner-only` | Botオーナーのみ       | `/allow`, `/config`            |

設定は `src/command-config.ts` のCOMMANDS配列で管理。

### ephemeral応答のルール

```typescript
// エラーや個人情報は必ずephemeral
await interaction.reply({
  content: 'エラーメッセージ',
  flags: MessageFlags.Ephemeral,
});
```

> `ephemeral: true` は非推奨。必ず `flags: MessageFlags.Ephemeral` を使用。

### エラー処理ポリシー

- 例外は**握りつぶさずに投げる**（グローバルリスナーがユーザー通知＋オーナーDMを行う）
- どうしても `try/catch` で握る場合は `notifyErrorToOwner` を明示的に呼ぶ
- 返信済みの場合は `followUp({ flags: MessageFlags.Ephemeral })` を使う（`editReply` ではエフェメラル不可）

---

## ドキュメント構成

### ルートディレクトリ

| ファイル    | 内容                                   |
| ----------- | -------------------------------------- |
| `README.md` | プロジェクト概要、セットアップ手順     |
| `AGENTS.md` | AIエージェント向けガイド（本ファイル） |
| `GEMINI.md` | Gemini専用ガイド                       |
| `CLAUDE.md` | Claude専用ガイド                       |

### docs/

| ファイル         | 内容                            |
| ---------------- | ------------------------------- |
| `SCOPE.md`       | 機能スコープ、バージョン計画    |
| `SPEC.md`        | 技術仕様書（全体設計）          |
| `COMMAND.md`     | コマンド一覧と動作フロー        |
| `HELP.md`        | `/help`コマンドが読み込むデータ |
| `PERMISSIONS.md` | 権限システム、Precondition      |
| `DB-SCHEMA.md`   | データベーススキーマ            |
| `PLANS.md`       | 今後の開発計画                  |
| `DETAILS/*.md`   | 各コマンドの詳細仕様            |

### バージョン更新対象ファイル

リリース時に以下のファイルのバージョンを更新すること：

| ファイル       | 更新箇所              |
| -------------- | --------------------- |
| `package.json` | `"version": "x.x.x"`  |
| `README.md`    | タイトル行 `(vx.x.x)` |
| `AGENTS.md`    | タイトル行 `vx.x.x`   |
| `docs/SPEC.md` | タイトル行 `vx.x.x`   |

#### バージョニングルール（セマンティックバージョニング）

| 変更タイプ                   | バージョン           | 例                               |
| ---------------------------- | -------------------- | -------------------------------- |
| 破壊的変更・大規模リファクタ | **メジャー** (x.0.0) | API互換性が崩れる変更            |
| 新機能追加                   | **マイナー** (x.y.0) | 新コマンド、新ボタン機能         |
| バグ修正・内部改善           | **パッチ** (x.y.z)   | エラー処理改善、ドキュメント整備 |

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
│   ├── error-notify.ts      # エラー通知
│   ├── bosyu-utils.ts       # 募集機能
│   ├── bosyu-bpsr-utils.ts  # BPSR募集機能
│   ├── remind-utils.ts      # リマインダー機能
│   ├── verify-utils.ts      # 認証機能
│   ├── help-utils.ts        # ヘルプ機能
│   ├── mention-reactors-utils.ts # リアクションメンション
│   └── bpsr-role-utils.ts   # BPSRロール付与
├── listeners/            # イベントリスナー
│   ├── ChatInputCommandDenied.ts
│   ├── ChatInputCommandError.ts
│   └── InteractionHandlerError.ts
└── preconditions/        # Sapphire Precondition
    ├── GuildAllowed.ts   # Guild許可チェック
    └── RestrictedAllowed.ts # Restricted権限チェック
```

---

## 開発コマンド

```bash
pnpm install    # 依存インストール
pnpm dev        # 開発サーバー起動
pnpm typecheck  # TypeScript型チェック
pnpm verify     # ビルド検証（typecheckのエイリアス）
```

---

## 実装パターン

### 新コマンドを追加する場合

詳細は `add-command` スキルを参照（`.agent/skills/add-command/SKILL.md`）。

**クイックチェックリスト：**

1. 本当にスラッシュコマンドが必要か確認（ボタンで完結できないか）
2. `src/commands/{Name}Command.ts` を作成
3. `src/command-config.ts` にCOMMANDS追加
4. `docs/HELP.md` にヘルプ情報追加（`### 概要` 必須）
5. `docs/COMMAND.md` を更新
6. 必要に応じて `docs/DETAILS/*.md` を作成

### ファイル命名規則

| 種類             | 命名パターン             | 例                      |
| ---------------- | ------------------------ | ----------------------- |
| コマンド         | `<Name>Command.ts`       | `DiceCommand.ts`        |
| ボタンハンドラ   | `<Name>ButtonHandler.ts` | `BosyuButtonHandler.ts` |
| モーダルハンドラ | `<Name>ModalHandler.ts`  | `BosyuModalHandler.ts`  |
| ユーティリティ   | `<name>-utils.ts`        | `bosyu-utils.ts`        |

---

## ❌ 禁止事項（違反は即修正）

| 禁止                  | 必須                                |
| --------------------- | ----------------------------------- |
| 英語で応答            | **日本語で応答**                    |
| 新規コマンド乱発      | **ボタンで既存機能を拡張**          |
| `ephemeral: true`     | **`flags: MessageFlags.Ephemeral`** |
| deferReplyなしで3秒超 | **先に `deferReply()` を呼ぶ**      |
| main直接push          | **作業ブランチを使う**              |
| 秘密情報をログ出力    | **絶対に出力しない**                |

---

## Git運用

- **mainへ直接コミットしない**
- 作業はブランチで行う：例 `agent/<short-task>`
- まとまったらPRを作る（本文は短くてOK）

---

## 注意事項

- コマンド応答は3秒以内に行う必要がある（Discordの制限）
- 長い処理は `deferReply()` を使用
- **コード内コメントは日本語で記述**
