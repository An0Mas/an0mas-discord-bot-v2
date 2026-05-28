# Original SKILL.md part 2 of 2

Source: C:\AI_Work\an0mas-discord-bot-v2\.agent\skills\add-command\SKILL.md
Original line range: 181-218

This file preserves the original SKILL.md content before the 200-line router split.

---

`AGENTS.md` に合わせて以下を順に実行する。

```bash
pnpm lint:fix
pnpm format
pnpm verify
```

必要に応じて手動確認:

```bash
pnpm dev
```

確認項目:

- [ ] Discord 上でコマンドが表示される
- [ ] 実行結果が仕様どおり
- [ ] ボタン/モーダルが仕様どおり（該当時）
- [ ] `/help` 一覧と詳細に反映される

---

## 7. PR 前チェック

- [ ] 作業ブランチ（例: `agent/<short-task>`）で作業している
- [ ] `main` へ直接 push していない
- [ ] PR 本文に `目的 / 変更点 / 検証結果` を記載した
- [ ] 破壊的変更の有無を明記した

---

## 禁止事項

- `ephemeral: true` を使う（必ず `flags: MessageFlags.Ephemeral`）
- 例外を握りつぶして終了する
- 仕様変更があるのにドキュメント更新を省略する
