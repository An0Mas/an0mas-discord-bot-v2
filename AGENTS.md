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
- typecheck: `npx tsc --noEmit`（TypeScriptを触った時に推奨）
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

## package-lock.json（ゆる運用）
- 依存を追加/更新した場合は `package-lock.json` が変わってOK（同時にコミットする）
- 依存を触っていないのに `package-lock.json` が大量に変わった場合は、理由を一言添える
  - 例：`npm i` による解決差分、npm/Nodeバージョン差など

---

## 進め方（自由だけど迷った時の目安）
- 目的に関係ない大規模整形は避ける（必要なら別PR）
- TypeScriptを触ったら、できれば `npx tsc --noEmit`
- 動作確認は最低限でOK（例：Bot起動、該当コマンド1回）

---

## 出力（最小）
- 日本語で短くでOK（識別子/エラー/ログは原文のまま）
- 変更内容は「何をした / どう確認した」を1〜3行で十分
