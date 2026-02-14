---
name: codex-audit
description: Discord Botリポジトリの改善監査を実施し、結果を docs/research/codex-audit/YYYY-MM-DD に summary/risks/plan-10/appendix/improvement-tracker 形式で保存・運用するタスクで使用する。リスク特定、優先度付き改善計画、最小テスト観点、実行結果（成功/未確認）、実装進捗管理を標準化して出力したい場合に使う。
---

# codex-audit スキル

監査結果を毎回同じ構造で残し、比較しやすくするための手順。

## 実行手順

1. `docs/research/codex-audit/scripts/new-audit.ps1` を実行して日付フォルダを作成する。  
   例: `& .\docs\research\codex-audit\scripts\new-audit.ps1`
2. 生成された以下6ファイルを編集する。
   - `README.md`
   - `YYYY-MM-DD_summary.md`
   - `YYYY-MM-DD_risks.md`
   - `YYYY-MM-DD_plan-10.md`
   - `YYYY-MM-DD_appendix.md`
   - `improvement-tracker.md`
3. 必須観点を調査する。
   - Interaction（`deferReply` / `editReply` / `followUp` / 二重応答）
   - Rate limit / スパム耐性（429 / バースト / キュー）
   - 並行性（同時実行 / 二重クリック / 排他）
   - DB/永続化（整合性 / 再起動 / マイグレーション）
   - ロギング/監視（分類 / 通知 / 再試行）
   - 権限/セキュリティ（判定 / 入力検証 / 秘密情報）
   - Sapphire設計（責務分離 / 共通化）
   - DX（lint / format / CI / README）
4. `package.json` の `scripts` に存在するコマンドだけ実行する。存在しない項目は「未確認」と明記する。
5. `plan-10` は「Impact高 × 工数低」順で並べる。各項目に小差分実装案、テスト観点、ロールバック案を書く。
6. 実装対応時は `improvement-tracker.md` を更新する。
   - 着手前に `参照（根拠ファイル）` と `plan-10` / `risks` の該当項目を読んでから作業する。
   - ステータス（`⬜`/`🔄`/`✅`/`⏸️`）を変更する。
   - 各タスクに `参照（根拠ファイル）` を必ず記載する。
   - 実施者は `AI` または `自分` を記載する。
   - 完了時は `typecheck` と必要テストの結果、証跡（コミット/PR）を記録する。

## 出力ルール

- 不明点は断言しない。`未確認` または `推測` と書く。
- 大規模リファクタを避け、段階導入の案を優先する。
- 可能な限り、根拠として該当ファイルと行の目安を記載する。
- `improvement-tracker.md` はタイトルだけで実装に入らないよう、`参照（根拠ファイル）` 列を維持する。
- `ephemeral: true` ではなく `flags: MessageFlags.Ephemeral` を基準に評価する。
- トラッカーの完了条件は「実装 + 最低限検証 + 証跡記録」を満たすこと。

## テンプレート

- テンプレートは `docs/research/codex-audit/_template/` にある。
- プレースホルダ `{{DATE}}` は監査日（`YYYY-MM-DD`）に置換する。
