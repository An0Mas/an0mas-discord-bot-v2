# AGENTS.md — Codex / AI Agent Instructions

このリポジトリで作業するAIエージェント（Codex等）の行動規範です。
最初に必ず読み、優先順位順に厳守してください。

## TL;DR（最優先）
1. **やりとり・レビューコメント・PR本文は原則日本語**で書く（識別子/エラー文/固有名詞は原文のまま）。  
2. **小さく変更**する：最小差分 → すぐ検証 → まとめて説明。  
3. 変更後は基本 **型チェック**を通す（`npx tsc --noEmit` / または `npm run typecheck` がある場合はそれ）。  
4. **秘密情報（トークン/APIキー）を貼らない・書かない・ログに出さない**（環境変数を使う）。  
5. 破壊的操作（削除/大量変更/強制push/DB操作など）は**事前に確認**する。

---

## Repo Specific
- Root: `C:\AI_Work\an0mas-discord-bot-v2`
- Main code: `src/`
- Package manager: `npm`
- Commands:
  - install: `npm i`
  - dev: `npm run dev`（Bot起動）
  - deploy: `npm run deploy`（スラッシュコマンド登録）
  - typecheck: `npx tsc --noEmit`（または `npm run typecheck`）
  - test: （未設定なら省略可 / 追加したらここに追記）

---

## Project Context
- OS: Windows（PowerShell想定）
- Runtime: Node.js
- Language: TypeScript
- Bot framework: discord.js
- Env: dotenv（`.env` はリポジトリ直下、コミット禁止）
- Dev runner: tsx（`npm run dev`）

### Common Tasks
- `npm i` — 依存関係インストール
- `npm run dev` — Bot起動（開発）
- `npm run deploy` — スラッシュコマンド登録（開発用ギルド）
- `npx tsc --noEmit` — 型チェック（導入済みの場合）

> 追加のビルド/テスト/CIコマンドがある場合は、このファイルに追記すること。

---

## Language & Communication（日本語方針）
- **ユーザーへの説明、PR説明、レビューコメント、タスクの進捗報告は日本語**。
- 例外：以下はそのまま（改変しない）
  - コード中の識別子（関数名・型名など）
  - エラーメッセージ、CLI出力
  - 外部ドキュメントの引用（引用の直後に**日本語要約**を付ける）
- コードコメントは原則日本語（既存が英語の場合は、周辺に合わせて統一）。
- 内部の推論言語は任意（英語で考えてOK）。ただし**推論の逐語（長い思考過程）は出力しない**。

---

## Workflow（作業の進め方）
- まず最小の理解：該当箇所・再現手順・期待結果を確認。
- **小さな単位**で進める：
  1) Plan（箇条書き）  
  2) Diff（最小差分）  
  3) Commands（実行手順 + ロールバック）  
  4) Checks（型/フォーマット/テスト結果）
- 迷ったら「安全・可逆・最小差分」を優先する。
- “ついで” の大規模整形や無関係なリファクタはしない（必要なら別PR/別コミット）。

---

## Safety（安全と秘密情報）
- **トークン、APIキー、Cookie、個人情報、秘密URL**を本文/差分/ログに出さない。
- 認証情報は **環境変数**で参照する（例：`process.env.*`）。
- `.env` は **必ずコミット禁止**（`.gitignore` に含める）。
- 次は許可なしに実行しない：
  - `rm -rf`, 大量削除/移動、強制push、破壊的マイグレーション、DB更新、権限変更
- 不確実な操作は「やる前に」確認を求める。

---

## Coding Standards（実装方針：短く強く）
- **型安全**を優先：
  - `any` の広域使用、`!`（non-null assertion）、曖昧な `as` キャストは避ける
  - 必要なら **型ガード**や入力バリデーションを追加
- **可読性**：
  - 100LOC超の関数を作らない（分割する）
  - 例外を握りつぶさない（`catch {}` で無言にしない）
  - Promise の未処理拒否を放置しない
- ログは必要最小限（トークンや `.env` の値を出さない）。
- （任意）Formatter/Linter を導入した場合は、そのコマンドを Common Tasks に追記し、以後それを正とする。

---

## MCP Tooling Policy（使い分け）
目的に応じてツールを切り替える。取得した情報は要点だけ使い、過剰に貼らない。

- **Serena**：プロジェクト内の安全な編集・ナビゲーション。差分は小さく。
- **Context7**：公式ドキュメント参照（例：TypeScript）。
- **Exa**：Web検索（実装パターン、リリース情報、比較検討）。参照は要点+リンク。
- **GitHub MCP**：Issue/PR/リポジトリ情報の参照（必要なときだけ）。

---

## Output Format（変更提案の書き方）
回答は原則この順番で出す（短く、必要十分に）。

### Plan
- 変更点を箇条書き（3〜7項目目安）

### Diff
- 最小の unified diff または編集した部分のみ

### Commands
- 実行コマンド（例：`npm run dev` / `npm run deploy` / `npx tsc --noEmit`）
- ロールバック（例：`git restore <files>` / `git checkout -- <files>`）

### Checks
- `npx tsc --noEmit` の結果（実施有無）
- Bot動作確認（/ping 等）の結果（実施有無）
- テスト/ビルドがある場合は結果

---

## Anti-patterns（やらない）
- 無関係な大規模整形、ファイル全体の書き換え、巨大PR
- `any`/`!`/雑なキャストでの逃げ
- 例外の握りつぶし、ログへの秘密情報出力
- “動いたからOK” で型チェック/テストを省略する
- `.env` やトークン類をコミットする／本文に貼る
