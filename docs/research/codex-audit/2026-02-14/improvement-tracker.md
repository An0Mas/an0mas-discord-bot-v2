# 改善対応トラッカー（2026-02-14）

> 元資料: [plan-10](./2026-02-14_plan-10.md) / [risks](./2026-02-14_risks.md)

## ステータス凡例

| アイコン | 意味 |
|:---:|---|
| ⬜ | 未着手 |
| 🔄 | 進行中 |
| ✅ | 完了 |
| ⏸️ | 保留 |

## 運用ルール

- 着手前に `参照（根拠ファイル）` と `plan-10` / `risks` の該当項目を確認してから作業する。
- 実施者は `AI` または `自分` を記載する。
- 着手時に `⬜ -> 🔄`、完了時に `🔄 -> ✅` へ更新する。
- 保留時は理由と再開条件をメモに残す。
- `参照（根拠ファイル）` に、実装対象や根拠となるファイルを必ず記載する。
- 完了時は最低限以下を記録する。
  - `typecheck` 結果
  - 必要な手動/自動テスト結果
  - 証跡（コミットIDまたはPR）

## 優先タスク一覧

| # | タイトル | 優先度 | 工数 | ステータス | 参照（根拠ファイル） | 実施者（AI/自分） | 着手日 | 完了日 | 証跡（commit/PR） | メモ |
|:-:|---------|:---:|:---:|:--------:|----------------------|:----------------:|:-----:|:-----:|-------------------|------|
| 1 | 権限設定INSERTの例外分類導入 | High | S | ⬜ | `src/db.ts` |  |  |  |  | 重複例外と障害例外の分離 |
| 2 | 募集メンション分割送信対応（bosyu/bpsr） | High | S | ⏸️ | `src/lib/bosyu-utils.ts`, `src/lib/bosyu-bpsr-utils.ts`, `src/interaction-handlers/BosyuMentionButtonHandler.ts`, `src/interaction-handlers/BosyuBpsrMentionButtonHandler.ts` |  |  |  |  | 現時点で大規模募集予定なしのため保留 |
| 3 | Precondition拒否通知のレベル分離 | High | S | ⬜ | `src/listeners/ChatInputCommandDenied.ts` |  |  |  |  | 通知ノイズ削減 |
| 4 | リマインダー失敗時の再試行化 | High | M | ⬜ | `src/scheduler.ts` |  |  |  |  | 通知消失防止 |
| 5 | mention-reactors 全件取得 + 429再試行 | High | M | ⬜ | `src/lib/mention-reactors-utils.ts`, `src/interaction-handlers/MentionReactorsButtonHandler.ts` |  |  |  |  | 大規模運用対応 |
| 6 | 募集ボタン競合対策（再取得再計算） | High | M | ⬜ | `src/interaction-handlers/BosyuButtonHandler.ts`, `src/interaction-handlers/BosyuBpsrButtonHandler.ts` |  |  |  |  | 同時操作対策 |
| 7 | catch時の障害通知経路明示化 | Med | S | ⬜ | `src/interaction-handlers/BpsrRoleButtonHandler.ts`, `src/interaction-handlers/VerifyModalHandler.ts`, `src/lib/error-notify.ts` |  |  |  |  | `notifyErrorToOwner` |
| 8 | 募集メンション系の TextBasedChannel 対応 | Med | S | ⬜ | `src/interaction-handlers/BosyuMentionButtonHandler.ts`, `src/interaction-handlers/BosyuBpsrMentionButtonHandler.ts`, `src/interaction-handlers/BosyuMentionModalHandler.ts`, `src/interaction-handlers/BosyuBpsrMentionModalHandler.ts` |  |  |  |  | Thread対応 |
| 9 | DBスキーマバージョン管理導入 | Med | M | ⬜ | `src/db.ts`, `docs/DB-SCHEMA.md` |  |  |  |  | migration基盤 |
| 10 | DX品質ゲート（format/CI）整備 | Med | M | ⬜ | `package.json`, `.github/workflows` |  |  |  |  | `format:check` + CI |

## 対応履歴

| 日付 | # | ステータス | 内容 | 実施者（AI/自分） |
|------|:-:|:---------:|------|:----------------:|
| 2026-02-14 | - | ✅ | 差分監査を実施。旧監査の `ephemeral: true` 残存リスクは解消済み確認。 | AI |
| 2026-02-14 | 2 | ⏸️ | 現時点で大規模募集運用予定がないため保留化。再開条件は大規模募集運用の要件確定。 | 自分 |
