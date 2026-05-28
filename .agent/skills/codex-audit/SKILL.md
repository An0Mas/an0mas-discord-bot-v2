---
name: codex-audit
description: Discord Botリポジトリの改善監査を実施し、Vaultの実装判断ログも確認して、結果を docs/research/codex-audit/YYYY-MM-DD に summary/risks/plan-10/appendix/improvement-tracker 形式で保存・運用するタスクで使用する。リスク特定、優先度付き改善計画、最小テスト観点、実行結果（成功/未確認）、実装進捗管理を標準化して出力したい場合に使う。
---

# codex-audit スキル

監査結果を毎回同じ構造で残し、比較しやすくするための手順。

## 実行手順

1. Vault preflightを行い、過去の実装判断・暫定対応・既知リスクを確認する。
   - `vault-query` 相当の軽い読み取りで、`C:\Obsidian\codex-knowledge-vault\index.md` / `hot.md` から関連ノートを1-3件へ絞る。
   - `an0mas-discord-bot-v2` では、まず `projects/an0mas-discord-bot-v2/implementation-rationale.md` と `risks-and-backlog.md` を見る。
   - 必要に応じて `workflow-and-rules.md`、`architecture-and-patterns.md`、`feature-knowhow.md` も参照する。
   - Vault由来の情報は監査観点の入口として扱い、現行の `src/` / `docs/` / 既存監査ログで照合してから断定する。
2. `docs/research/codex-audit/scripts/new-audit.ps1` を実行して日付フォルダを作成する。
   例: `& .\docs\research\codex-audit\scripts\new-audit.ps1`
3. 生成された以下6ファイルを編集する。
   - `README.md`
   - `YYYY-MM-DD_summary.md`
   - `YYYY-MM-DD_risks.md`
   - `YYYY-MM-DD_plan-10.md`
   - `YYYY-MM-DD_appendix.md`
   - `improvement-tracker.md`
4. 必須観点を調査する。
   - Interaction（`deferReply` / `editReply` / `followUp` / 二重応答）
   - Rate limit / スパム耐性（429 / バースト / キュー）
   - 並行性（同時実行 / 二重クリック / 排他）
   - DB/永続化（整合性 / 再起動 / マイグレーション）
   - ロギング/監視（分類 / 通知 / 再試行）
   - 権限/セキュリティ（判定 / 入力検証 / 秘密情報）
   - Sapphire設計（責務分離 / 共通化）
   - DX（lint / format / CI / README）
5. 実装判断監査として、安易な逃げや暫定対応の固定化がないか確認する。
   - workaround / fallback / skip / TODO / suppression / 型回避 / 例外握りつぶしを検索する。
   - 根本原因を直さず局所対応にした箇所、検証を弱めた箇所、仕様未記載のまま進んだ箇所を確認する。
   - Vaultに記録された判断理由が、現在の仕様・コード・運用前提でも妥当か見直す。
   - 妥当性が未確認なら、`未確認` として `summary` または `appendix` に残す。
6. `package.json` の `scripts` に存在するコマンドだけ実行する。存在しない項目は「未確認」と明記する。
7. `plan-10` は「Impact高 × 工数低」順で並べる。各項目に小差分実装案、テスト観点、ロールバック案を書く。
8. 実装対応時は `improvement-tracker.md` を更新する。
   - 着手前に `監査参照（plan-10/risks）` と `主参照（MD）` / `実装参照（src等）` を確認してから作業する。
   - ステータス（`⬜`/`🔄`/`✅`/`⏸️`）を変更する。
   - 各タスクに `監査参照（plan-10/risks）` を必ず記載する（`plan-10` と `risks` のリンクを両方）。
   - `risks` のリンクは `#high` などのセクションではなく、`#risk-high-1` 形式の個別項目アンカーへ直接リンクする。
   - 各タスクに `主参照（MD）` と `実装参照（src等）` を必ず記載する。
   - `整合性` を `一致` / `MD未記載` / `不一致` で記録する。
   - `MD未記載` または `不一致` のタスクは、ドキュメント更新タスクを別行で起票する。
   - 実施者は `AI` または `自分` を記載する。
   - 完了時は `typecheck` と必要テストの結果、証跡（コミット/PR）を記録する。

## 出力ルール

- 不明点は断言しない。`未確認` または `推測` と書く。
- 大規模リファクタを避け、段階導入の案を優先する。
- 可能な限り、根拠として該当ファイルと行の目安を記載する。
- `improvement-tracker.md` はタイトルだけで実装に入らないよう、`監査参照（plan-10/risks）` と `主参照（MD）` と `実装参照（src等）` と `整合性` の4点を維持する。
- `YYYY-MM-DD_risks.md` には `risk-high-1` / `risk-med-1` / `risk-low-1` 形式の個別アンカーを付け、トラッカーから一意に参照できる状態を保つ。
- `主参照（MD）` は仕様の正とし、`実装参照（src等）` と不整合が出た場合はドキュメント更新を計画に含める。
- Vault参照は `summary` または `appendix` に、読んだノート、拾った監査観点、現行repoでの照合状態を残す。
- Vault由来の疑いを `risks` / `plan-10` / `improvement-tracker` に入れる場合は、現行repoで確認済みか未確認かを明記する。
- `ephemeral: true` ではなく `flags: MessageFlags.Ephemeral` を基準に評価する。
- トラッカーの完了条件は「実装 + 最低限検証 + 証跡記録」を満たすこと。

## テンプレート

- テンプレートは `docs/research/codex-audit/_template/` にある。
- プレースホルダ `{{DATE}}` は監査日（`YYYY-MM-DD`）に置換する。
