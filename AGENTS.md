# AGENTS.md — Personal Discord Bot (Lite)

このリポジトリで作業するAIエージェント（Codex/AntiGravity等）向けのガイドです。
個人開発なので基本は自由に進めてOK。ただし**致命的事故（秘密漏洩 / main破壊 / 作業範囲逸脱）だけは厳守**。

## TL;DR（最優先）
1. **作業範囲は `C:\AI_Work\an0mas-discord-bot-v2` 配下のみ**（他の場所は触らない）
2. **mainへ直接コミット/直pushしない**（作業ブランチ → PR → merge）
3. **秘密情報（トークン/APIキー/.env値）を本文/差分/ログに出さない**
4. それ以外は基本自由：大きめ変更もOK（ただし無関係な大改造は避ける）

---

## Repo Specific
- Root: `C:\AI_Work\an0mas-discord-bot-v2`
- Main code: `src/`
- Package manager: `npm`
- OS: Windows（PowerShell想定）
- Language: TypeScript
- Bot framework: discord.js
- Env: dotenv（`.env` はリポジトリ直下、コミット禁止）
- Dev runner: tsx（`npm run dev`）

### Commands
- install: `npm i`
- dev: `npm run dev`（Bot起動）
- deploy: `npm run deploy`（スラッシュコマンド登録）
- typecheck: `npm run typecheck`（TypeScriptの型チェック）
- verify: `npm run verify`（確認まとめ：現状はtypecheckのみ）
- test: （未設定なら省略可 / 追加したらここに追記）

---

## Secrets / Env（最重要）
- `.env.example` をコピーして `.env` を作る（`.env` はコミット禁止）
- `.env` の値はPR本文/コメント/ログに貼らない
- トークン/APIキー/Cookie/秘密URL/個人情報を出さない
- うっかり混ざりやすいので注意：
  - 起動ログ（設定値ダンプ）
  - `process.env` の表示
  - `.env` の中身を貼る行為

### Required（.env）
- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`

### Optional（将来機能で使用予定）
- `CLIENT_SECRET`
- `REDIRECT_URI`

---

## Git / GitHub（最小ルール）
- **mainへ直接コミットしない**
- 作業はブランチで行う：例 `agent/<short-task>`（例：`agent/add-ping`）
- まとまったらPRを作る（本文は短くてOK）

---

## Docs（SPEC/HELP/COMMAND/SCOPE/PLANS/DETAILS）— 更新ルール（重要）
docs配下の文章は「仕様の正」として扱う。コンテキスト増加による誤り（幻覚/内容のすり替わり）を避けるため、以下を厳守する。

### ルール
- `docs/` 内の仕様書類（`SPEC.md` / `HELP.md` / `COMMAND.md` / `SCOPE.md` / `PLANS.md` / `DETAILS/*.md`）を追記・変更する前に、**必ずユーザーに最新版のファイル or テキスト提示を要求**する。
- ユーザーから提示された最新版を根拠に、変更は **差分（diff）で提案**する（原則：差分→了承→反映）。
- 会話の記憶や推測で「こっそり内容を補完/修正」しない（書いてないことは足さない）。
- ファイル名/配置を変える場合は、参照元（例：`SPEC.md` が参照する `docs/HELP.md` 等）も同時に整合させる。

### 役割（迷ったらここ）
- `SPEC.md`：v0.xの確定仕様（MUST/SHOULD、完了条件）
- `SCOPE.md`：v0.1/v0.2/Later の「入れる/入れない」境界（時期は未定でも範囲は固定）
- `HELP.md`：/help表示文言の正本（一覧summary含む）
- `COMMAND.md`：ユーザー向け早見表
- `DETAILS/*.md`：機能ごとの詳細仕様（UI/Embed/遷移/パース規約など）
- `PLANS.md`：未スケジュール案・設計メモ（未確定を含む）

---

## package-lock.json（ゆる運用）
- 依存を追加/更新した場合は `package-lock.json` が変わってOK（同時にコミットする）
- 依存を触っていないのに `package-lock.json` が大量に変わった場合は、理由を一言添える
  - 例：`npm i` による解決差分、npm/Nodeバージョン差など

---

## 進め方（自由だけど迷った時の目安）
- 目的に関係ない大規模整形は避ける（必要なら別PR）
- TypeScriptを触ったら、できれば `npm run verify`（現状は型チェックのみ）
- 動作確認は最低限でOK（例：Bot起動、該当コマンド1回）

---

## 出力（最小）
- 日本語で短くでOK（識別子/エラー/ログは原文のまま）
- 変更内容は「何をした / どう確認した」を1〜3行で十分
- docs（仕様書）を変更した場合は、必ず「どのファイルを」「なぜ」変えたかを1行添える

## Work Log（推奨）
- `docs/agent-notes/_TEMPLATE.md` をコピーして、タスクごとにログを作る
  - 例: `docs/agent-notes/agent_add-ping.md`
- ログには「目的 / やったこと / 確認 / 次」を短く残す（5〜15行目安）
- 秘密情報（トークン/.env値/秘密URL/個人情報）や冗長ログは書かない
- `docs/agent-notes/` はローカル運用（原則コミットしない）。テンプレ `_TEMPLATE.md` のみ追跡する。

## Node / npm 実行（Windowsはフルパス推奨）
- PATH競合を避けるため `npm` を素で叩かない。
- 以降は原則 `C:\Program Files\nodejs\npm.cmd` をフルパスで実行する。
  - 例：`& "C:\Program Files\nodejs\npm.cmd" i`
  - 例：`& "C:\Program Files\nodejs\npm.cmd" run verify`
- `Get-Command node` が失敗する環境では作業を進めず、`where.exe node` とフルパス実行で確認する。

## PowerShell注意（Windows）
- PowerShellでは `%VAR%`（cmd形式の環境変数展開）を使わない。文字列のまま扱われ、`%SystemDrive%` のような不要ディレクトリを作る原因になる。
- 環境変数は必ず `$env:VAR` を使う（例：`$env:SystemDrive`）。

## 予期せぬ生成物が出たら
- リポジトリ直下に `%SystemDrive%/` や `_npm_version.txt` 等が作成された場合は、コミットせず削除する。
- 削除できない場合は、関連プロセス（watch/dev等）停止後に再試行し、それでもダメなら `.gitignore` に追加して回避する。
