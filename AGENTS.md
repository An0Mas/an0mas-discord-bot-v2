# AGENTS.md — Personal Discord Bot (Lite)

このリポジトリで作業するAIエージェント（Codex/AntiGravity等）向けのガイドです。
個人開発なので基本は自由に進めてOK。ただし**致命的事故（秘密漏洩 / main破壊 / 作業範囲逸脱）だけは厳守**。

## TL;DR（最優先）
1. **作業範囲は `C:\AI_Work\an0mas-discord-bot-v2` 配下のみ**（他の場所は触らない）
2. **mainへ直接コミット/直pushしない**（作業ブランチ → PR → merge）
3. **秘密情報（トークン/APIキー/.env値）を本文/差分/ログに出さない**
4. それ以外は基本自由：大きめ変更もOK（ただし無関係な大改造は避ける）
5. **新しいバージョン/タスク開始時は `git status` → `git pull` して `AGENTS.md` / `docs/SCOPE.md` / `docs/SPEC.md` を読み直す（pullに失敗/競合したら中断して報告）**

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

### Code Structure（src/）
- スラッシュコマンド実装は `src/commands/` に配置（例：`help.ts` / `bosyu.ts`）
- `index.ts` は起動と登録のみ（肥大化禁止）
- 新機能追加時は `src/commands/` に追加し、`index.ts` から登録する

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
- `docs/` 内の仕様書類を **参照するだけ** なら、リポジトリをそのまま読んでよい。
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

## Work Log（**必須**）
- **タスク開始時に必ず** `docs/agent-notes/_TEMPLATE.md` をコピーして、タスクごとにログファイルを作る
  - ファイル名: `agent_<タスク名>.md`（例: `agent_v0.1-impl.md`, `agent_add-poll.md`）
- **作業の随時更新**:
  - 「目的」はタスク開始時に記入
  - 「やったこと」は作業しながら、または完了時に**要点だけ**追記（箇条書きでOK）
  - 「確認」はテスト・検証した内容を記録
  - 「次」は残タスクや次の作業を記入
- **トラブル・副次的タスクは別ファイルで記録**:
  - npm問題、環境構築、エラー調査など、メインタスクから脱線した作業は別ログを作る
  - 例: `agent_npm-troubleshoot.md`, `agent_setup-nodejs.md`, `agent_fix-eperm.md`
  - メインタスクのログには「→別ログ参照: agent_npm-troubleshoot.md」と記載する
- ログは簡潔に（**5〜15行目安**）。ただしトラブル対応などで必要なら増えてOK
- 秘密情報（トークン/.env値/秘密URL/個人情報）は絶対に書かない
- `docs/agent-notes/` はローカル運用（原則コミットしない）。テンプレ `_TEMPLATE.md` のみ追跡する

## Node / npm 実行（Windows：最終運用）
- **Get-Command node は使わない**（環境によって失敗し、誤判定の原因になる）。
- 代わりに **where.exe とフルパス実行**で進める（PATH競合/認識ズレ回避）。
  - 確認：`where.exe node` / `where.exe npm`
  - Node確認：`& "C:\Program Files\nodejs\node.exe" -v`
  - npm実行：`& "C:\Program Files\nodejs\npm.cmd" i`
  - verify：`& "C:\Program Files\nodejs\npm.cmd" run verify`
  - deploy：`& "C:\Program Files\nodejs\npm.cmd" run deploy`
  - dev：`& "C:\Program Files\nodejs\npm.cmd" run dev`

### npmキャッシュ（EPERM対策：最終運用）
- **repo直下キャッシュは禁止**（`.npm-cache` を作らない / `--cache .\.npm-cache` を使わない）。
- キャッシュは **ユーザー領域に固定**する（安定運用）。
  - リポジトリ直下に `.npmrc` を作成し、以下を設定する：
    - `cache=${LOCALAPPDATA}\npm-cache`
- これにより、EPERM（unlink失敗）や謎の副作用ディレクトリ発生を抑える。

---

## PowerShell注意（Windows：最終運用）
- PowerShellでは **`%VAR%`（cmd形式）を使わない**。
  - 文字列のまま扱われ、`%SystemDrive%` のような不要ディレクトリが作られる原因になる。
- 環境変数は必ず **`$env:VAR`** を使う。
  - 例：`$env:SystemDrive` / `$env:LOCALAPPDATA`
- cmd文法が必要な場合は **その行だけ** `cmd /c` に閉じ込め、混在させない。

---

## 予期せぬ生成物が出たら（最終運用）
- リポジトリ直下に以下が作成された場合は **コミットせず削除**する：
  - `"%SystemDrive%\"`（文字列のまま作られたディレクトリ）
  - `_npm_version.txt`
  - そのほか `*.log` や `npm-*.log` などの一時ログ
- 削除できない場合は、まず **動いている関連プロセスを止める**：
  - `npm run dev` / watch / node プロセス等を停止
  - それでもダメなら、削除はユーザーに依頼して作業を止める（無理に継続しない）。
- **削除できないから即 `.gitignore` 追加はしない**（原因を固定せずignoreで隠すのは禁止）。
  - 恒常的に再発する場合のみ、ユーザーに報告して対策（設定修正）を優先する。
