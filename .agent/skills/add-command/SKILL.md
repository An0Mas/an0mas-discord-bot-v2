---
name: add-command
description: 新しいSlashコマンドを追加する際のチェックリストと手順
---

# add-command スキル

新しい Slash コマンドをこのリポジトリへ追加するための入口。
詳細な元手順は削除せず `references/original-skill/` に保存している。

## 最重要ルール

- `AGENTS.md` を優先する。
- 新規コマンドが本当に必要か最初に確認する。既存操作はボタン/メニューで完結できないかを見る。
- `ephemeral: true` は使わず、`flags: MessageFlags.Ephemeral` を使う。
- 例外を握る場合は `notifyErrorToOwner` を明示的に呼ぶ。
- コード変更時は `pnpm lint:fix` -> `pnpm format` -> `pnpm verify` を実行する。
- main 直コミット/直pushは禁止。作業ブランチとPR運用に従う。

## 最小ワークフロー

1. コマンド追加が妥当か判断する。
2. `src/commands/{Name}Command.ts` を作る。
3. `src/command-config.ts` の `COMMANDS` に追加する。
4. 必要な handler / customId / util を追加する。
5. `docs/HELP.md`、`docs/COMMAND.md`、必要なら `docs/DETAILS/{name}.md` を更新する。
6. 権限タイプを `public` / `restricted` / `owner-only` から選ぶ。
7. 標準検証を実行し、PR本文に目的・変更点・検証結果を書く。

## 参照する詳細

元の `SKILL.md` は情報保持のためそのまま保存している。

- `references/original-skill/SKILL.original.md`: 元ファイルの完全コピー。
- `references/original-skill/part-01.md`: 元1-180行。事前判断、実装チェックリスト、基本テンプレート、エラー処理、権限、config、handler、docs規則。
- `references/original-skill/part-02.md`: 元181-218行。検証手順、PR前チェック、禁止事項。

作業中に迷ったら、該当する `part-XX.md` を読む。テンプレートやコード例が必要な時は必ず元の詳細を確認する。

## 停止条件

- コマンド追加の必要性が弱い。
- 権限タイプが決まらない。
- customId の衝突可能性がある。
- 検証コマンドが失敗し、原因が未確認。
- AGENTS.md と元手順が矛盾する。
