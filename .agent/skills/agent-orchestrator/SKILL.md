---
name: agent-orchestrator
description: マルチエージェントの役割分担を決めるスキル。ユーザーの意図を汲み取って提案し、必要最小限の質問で explorer/worker/tester/reviewer などの担当と実行順を決める。「分担決めて」「割り振って」「この作業やろうか」や「AO」「ao」指定で使う。
---

# agent-orchestrator スキル（AO v0.3）

複数エージェント（`explorer` / `worker` / `tester` / `reviewer` など）の割り当てを標準化する。
毎回の作文を減らし、同じ入力なら同じ分担になる状態を目指す。
ユーザーの意図を先に汲み取り、質問だけで止まらず、提案を返しながら前に進める。

## いつ使うか

- 「誰に何を任せるか」を都度手で考えている
- 調査・実装・検証・レビューを分業したい
- 並列実行時の競合制御を最初から設計したい
- 失敗時の再割り当てルールを固定したい

## トリガー語

- 明示トリガー: `agent-orchestrator`, `AO`, `ao`
- 自然文トリガー: 「分担決めて」「割り振って」「この作業やろうか」
- 誤発火防止: `AO` / `ao` は独立トークンとして一致した場合のみ有効
- 有効例: `AO`, `ao`, `[AO]`, `(ao)`, `AOで分担決めて`
- 無効例: `aoi`, `chaos`, `gao`, `AOA`（部分一致/派生語）
- 全角 `ＡＯ` は無効。必要な場合は `AO` か `ao` を明示してもらう

## 実行開始ポリシー（必須）

- 明示的な実行指示がない場合は、提案までで止める
- この場合は「この方針で進めるか」を1問で確認してから着手する
- 明示指示の例: 「実行して」「進めて」「やって」「適用して」「任せる」
- 合図が曖昧な場合は、実行せず提案＋確認を優先する
- 優先順位: `ユーザーの明示指示 > プロジェクトルール（AGENTS.md） > AOデフォルト`
- AOは再利用性のため自己完結で運用可能とし、プロジェクト側に規則がある場合はそれを上位として扱う

## AO作業フォルダ規約（このプロジェクト）

- 前提: プロジェクト側の作業範囲制約を優先する。外部作業フォルダ利用は、ユーザー合意があり、かつプロジェクトルールで許可される場合のみ。
- 基本ルート: `C:\AI_Work\an0mas-discord-bot-v2\.agent\ao-workspace`
- 共通知識: `common/`
- 実行記録: `runs/<YYYYMMDD-task>/`
- 補助スクリプト: `scripts/`
- 仕様メモ: `notes/`
- run作成コマンド:
  - `& "C:\AI_Work\an0mas-discord-bot-v2\.agent\ao-workspace\scripts\new-run.ps1" -Name <YYYYMMDD-task>`

### 成果物更新ルール（必須）

- run開始時に `runs/<YYYYMMDD-task>/` を作成し、以下5ファイルを必須成果物として扱う。
  - `task-map.md`
  - `lock-table.md`
  - `schedule.md`
  - `event-log.md`
  - `result.md`
- 実行中の状態遷移、競合、再計画、検証結果は上記ファイルへ都度反映し、最終回答だけで完了扱いにしない。
- 再計画が発生した場合、`task-map/lock-table/schedule/event-log` の4ファイルを同一ターン内で更新する。
- 外部作業フォルダ利用の合意がある場合は、`event-log` に合意時刻と `Evidence` を記録する。

## 対象ロール

| ロール | 主責務 | 編集可否 |
| --- | --- | --- |
| `explorer` | 調査、影響範囲特定、根拠収集 | 編集しない |
| `worker` | 実装、修正、局所リファクタ | 編集する |
| `planner` | タスク分解、優先順位設計、段取り | 原則編集しない |
| `tester` | テスト設計、実行、失敗分析、未実施整理 | 検証用編集のみ最小限 |
| `reviewer` | 差分レビュー、回帰・設計逸脱検知 | 原則編集しない |
| `integrator` | 複数成果物の統合、競合解消 | 必要時のみ編集 |
| `docs_maintainer` | README/仕様/運用手順の同期 | 編集する |
| `security_auditor` | 権限・依存・秘密情報リスク監査 | 編集しない |

## 手順

### 1. 意図解釈と提案先行（必須）

質問前に、ユーザー発話から以下を先に提示する。

1. 解釈した意図（1〜2行）
2. すぐ実行可能な初期提案（2〜3案）
3. 提案確定に必要な最小質問（1〜2問）

意図が曖昧でも停止しない。`仮説A/B` として提案し、どちらで進めるかを確認する。

提案テンプレート:

````md
意図は「<解釈>」と理解した。
先に進める案:
1) <案A>（速度重視）
2) <案B>（品質重視）

確定のために必要な確認は2点だけ:
1) <質問1>
2) <質問2>
````

実行確認テンプレート（明示指示がない場合）:

```md
意図は「<解釈>」と理解した。
まずは次の方針を提案する。
1) <案A>
2) <案B>

この方針で実行に進めてよいか？
```

質問テンプレート（詳細確認が必要な場合のみ）:

```md
進め方を固めるため、まず重要な2点だけ確認させてください。
1) 目的:
2) 変更範囲:

必要なら続けて、
3) 優先度・期限:
4) リスク許容度（低/中/高）:
5) 検証レベル（最小/標準/厳格）:
```

### 2. ヒアリング（必須）

提案提示のあと、未確定項目を確認する。未確定は `未確定` として保持し、決め打ちしない。
最初から5問を機械的に並べず、重要度の高い順に 1〜2 問ずつ確認する。

1. 目的（何を達成したいか）
2. 変更範囲（触ってよいファイル/禁止領域）
3. 優先度・期限（速度重視/品質重視）
4. リスク許容度（低/中/高）
5. 検証レベル（最小/標準/厳格）

### 3. 役割割り当て

次の決定表に従う。

| 条件 | 割り当て |
| --- | --- |
| 変更前に仕様/影響範囲が不明 | `explorer` を先行 |
| 実装変更がある | `worker` 必須 |
| コード変更がある | `tester` と `reviewer` を必須化 |
| 2人以上の `worker` 成果を統合 | `integrator` を追加 |
| README/仕様との差分が発生 | `docs_maintainer` を追加 |
| 権限、認証、依存更新、機密に触れる | `security_auditor` を追加 |
| タスクが大きい/並列前提 | `planner` を追加 |

### 4. タスク分解と状態初期化（必須）

`task-map` を先に作成し、各タスクの依存と編集対象を確定する。

必須項目:
- `Task ID`
- `Role`
- `Task`
- `Initial State`
- `Final State`
- `Depends On`
- `ReadTargets`
- `WriteTargets`
- `CriticalResource`
- `RiskLevel`
- `DoD Gate`

状態モデル:

| State | 意味 |
| --- | --- |
| `READY` | 実行可能待ち |
| `RUNNING` | 実行中 |
| `WAIT` | 競合待機 |
| `BLOCKED` | 外部要因待ち |
| `DONE` | 完了 |
| `FAILED` | 失敗 |

遷移規則:
1. `READY -> RUNNING`: 依存解決済みかつ必要lock取得済み
2. `RUNNING -> WAIT`: lock競合またはowner変更待ち
3. `RUNNING -> BLOCKED`: 外部依存不足
4. `RUNNING -> DONE`: 必須ゲートを満たした
5. `RUNNING -> FAILED`: 継続不能エラー
6. `WAIT/BLOCKED/FAILED -> READY`: 再開条件を満たした

遷移権限:
- `RUNNING -> WAIT/BLOCKED/FAILED` は実行中ロールが宣言可能
- `READY -> RUNNING` と `FAILED -> READY` は呼び出し元（またはオーケストレータ）が確定

### 5. 実行順とスケジューラ

デフォルト順:

1. `planner`（必要時）
2. `explorer`
3. `worker`
4. `integrator`（必要時）
5. `tester`
6. `reviewer`
7. `docs_maintainer`（必要時）
8. `security_auditor`（必要時）

並列可否判定:

`並列OK = DependsOn解決済み AND WriteTargets非交差 AND CriticalResource競合なし`

スケジューラモード:

| Mode | Max Parallel | Queue Policy | 用途 |
| --- | --- | --- | --- |
| `safe` | 1 | FIFO | 高リスク/初回運用 |
| `balanced` | 2 | FIFO + 依存優先 | 標準運用 |
| `fast` | 3 | クリティカルパス優先 | 低リスク短納期 |

高リスク領域（1件一致で `RiskLevel=high`）:
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig*.json`
- `eslint.config.*`, `.eslintrc*`
- `.prettierrc*`, `prettier.config.*`
- `**/migrations/**`, `**/schema*.sql`
- `src/**/permission*.ts`, `src/**/auth*.ts`
- `.github/workflows/**`

`high` を含むタスク群は常時直列化する。

### 6. ロック・競合・再計画（必須）

ロック規約:
1. 既定粒度は `ファイル単位`
2. 取得対象は昇順ソートで取得（デッドロック回避）
3. 全対象取得できない場合は `WAIT` に遷移
4. `DONE/FAILED/BLOCKED` 遷移時に解放
5. タイムアウトは既定 `10分`、延長は1回まで（追加 `10分`）
6. 2回目のタイムアウト超過は再計画トリガー

WAIT集計:
- `WAIT` 遷移時に `Wait Started At` 記録
- `READY` 復帰または `DONE/FAILED` 時に `Wait Total Minutes` 加算
- `Wait Total Minutes > 10` は再計画トリガー

競合時の標準動作:
1. 衝突検知
2. 後続を `WAIT`
3. ownerを1人に固定
4. `task-map/lock-table/schedule/event-log` を更新

再計画トリガー:
- 同一対象で競合2回以上
- `WAIT` 累積時間10分超
- 高リスク領域へ波及
- `FAILED` が発生し同手順で復旧不能

再計画決定者:
- 決定権は呼び出し元
- 各ロールは提案のみ

owner引き継ぎ:
1. 旧ownerが進捗と未完了差分を `event-log` に記録
2. 呼び出し元が新ownerを確定
3. `lock-table` の handoff 履歴を更新

### 7. テスト実行可否判定とDoDゲート（必須）

`tester` は最初に「実施可否」を判定してからテスト計画を出す。

判定ルール:
1. ローカル完結コマンドが存在するか（例: `pnpm typecheck`, `pnpm lint`, `pnpm verify`）
2. 外部依存が必要か（Discordトークン、外部API、本番Guild、ネットワーク固有環境）
3. 実行環境が揃っているか（環境変数、認証情報、起動要件）

DoDゲート:

| Change Type | 必須チェック |
| --- | --- |
| `code` | `pnpm lint:fix` -> `pnpm format` -> `pnpm verify` |
| `config/deps` | `pnpm lint:fix` -> `pnpm format` -> `pnpm verify` |
| `docs-only` | `pnpm format`（必要時） |

出力ルール:
- 実施できた項目は `実施済み`
- 実施できない項目は `未実施` として次を必ず書く
  - `未実施理由`
  - `手動検証手順`
  - `期待結果`

ゲート失敗時:
- `DONE` 遷移は禁止
- `FAILED` または `BLOCKED` で記録し再計画へ回す

### 8. 各ロールへの指示文を生成

各ロールへの依頼は次のテンプレートで固定する。

```md
[ROLE: <role-name>]
- 目的:
- 担当範囲:
- 入力:
- 作業手順:
- 状態遷移ルール:
- 完了条件:
- 禁止事項:
- 失敗時の報告形式:
```

ロール別の最小追記:
- `explorer`: 「編集禁止」「根拠ファイルと行番号を出す」
- `worker`: 「担当外ファイルは触らない」「新規WriteTargetsを即時申告」
- `tester`: 「実施済み/未実施を分離」「Task-wise DoDを記録」
- `reviewer`: 「重大度順で指摘」「再現手順を添える」

### 8.1 サポート口調ルール（必須）

各ロール指示文は命令調だけにせず、以下を含める。

1. なぜその担当にしたか（理由1行）
2. 迷った時の判断軸（優先順位）
3. 代替案（時間が足りない時の簡易案）

### 9. オーケストレーション結果の出力形式（必須）

最終的に次の形式で提示する。
`役割分担` は固定幅テーブル、`task-map/schedule/lock/event-log/result` はMarkdown表で出力する。
AOでサブエージェントを使う場合は、`エージェント起動計画（実行前）` と `エージェント実行結果（実行後）` も必須とする。

````md
## ヒアリング結果
- 解釈した意図:
- 初期提案:
- 目的:
- 変更範囲:
- 優先度・期限:
- リスク許容度:
- 検証レベル:

## 役割分担
```text
+----+------------------+----------------------------------+----------------------+
| No | Role             | Responsibility                   | Start Condition      |
+----+------------------+----------------------------------+----------------------+
| 01 | explorer         | 影響範囲調査・根拠収集           | 目的/変更範囲の確認後 |
| 02 | worker           | 実装・修正                       | 明示GO後             |
| 03 | integrator       | 複数差分の統合（必要時）         | 複数worker差分確定後  |
| 04 | tester           | 検証可否判定・実施・未実施整理   | 統合差分の確定後      |
| 05 | reviewer         | 回帰/設計逸脱チェック            | tester報告後         |
| 06 | docs_maintainer  | ドキュメント同期（必要時）       | 仕様/挙動変更時       |
| 07 | security_auditor | 権限/依存/機密監査（必要時）     | 高リスク変更時        |
+----+------------------+----------------------------------+----------------------+
```

## task-map
| Task ID | Role | Task | Initial State | Final State | Depends On | ReadTargets | WriteTargets | CriticalResource | RiskLevel | DoD Gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## スケジューラ設定
- Mode:
- Max Parallel:
- Queue Policy:
- Wait Timeout Minutes:

## 実行グループ
| Group | Tasks | Start Condition | Mode Override | Gate |
| --- | --- | --- | --- | --- |

## Revision履歴
| Revision | Changed At | Changed By | Reason | Affected Groups |
| --- | --- | --- | --- | --- |

## lock-table
| Target | Scope (file/dir/resource) | Owner | Status (LOCKED/WAIT/FREE) | Acquired At | Timeout At | Wait Started At | Wait Total Minutes | Waiting Tasks | Updated At |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## テスト実行可否判定
- 実施済み:
- 未実施:
  - 未実施理由:
  - 手動検証手順:
  - 期待結果:

## Task-wise DoDゲート判定
| Task ID | Change Type | Required Checks | Result (pass/fail/na) | Note |
| --- | --- | --- | --- | --- |

## run全体DoD判定
| Change Type | Required Checks | Result (pass/fail/na) | Note |
| --- | --- | --- | --- |

## event-log（必須）
### 状態遷移ログ
| Time | EventType | Task ID | Prev State | New State | Actor | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |

### lock/競合ログ
| Time | EventType | Target | Owner | Waiting Tasks | Replan ID | Action | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

### 再計画ログ
| Time | Replan ID | Trigger | Decision | Updated Files | Approved By | Evidence |
| --- | --- | --- | --- | --- | --- | --- |

### 検証コマンドログ
| Time | Task ID | Command | Exit Code | Result | Evidence |
| --- | --- | --- | --- | --- | --- |

## Evidence URI規約
- 形式: `evidence://<run>/<kind>/<id>`
- kind例: `command`, `diff`, `log`, `note`, `screenshot`

## 各ロール指示文
[ROLE: ...]
...

## エージェント起動計画（実行前）
```text
+----+------------------+-------------+--------------------------------------+----------------------+
| No | Role             | Agent Type  | Assigned Task                        | Start Condition      |
+----+------------------+-------------+--------------------------------------+----------------------+
| 01 | explorer         | explorer    | 影響範囲調査と根拠抽出               | 実行GO後             |
| 02 | worker           | worker      | 実装変更                              | explorer完了後       |
| 03 | integrator       | integrator  | 複数worker差分の統合                 | 複数worker完了後     |
| 04 | tester           | tester      | テスト実行可否判定と検証             | 統合完了後           |
| 05 | reviewer         | reviewer    | 回帰/設計逸脱レビュー                | tester完了後         |
| 06 | docs_maintainer  | N/A         | 今回不要                              | N/A                  |
+----+------------------+-------------+--------------------------------------+----------------------+
```

## エージェント実行結果（実行後）
```text
+----+------------------+-------------+-------------------+------------------------------+
| No | Role             | Agent Type  | Status            | Notes                        |
+----+------------------+-------------+-------------------+------------------------------+
| 01 | explorer         | explorer    | completed         | agent_id=ag-xxx              |
| 02 | worker           | worker      | completed         | agent_id=ag-yyy              |
| 03 | integrator       | integrator  | completed         | agent_id=ag-zzz              |
| 04 | tester           | tester      | failed/completed  | 失敗時は要因を1行で記載      |
| 05 | reviewer         | reviewer    | completed         | 指摘件数を要約               |
| 06 | docs_maintainer  | N/A         | not_started       | 未割当理由を記載             |
+----+------------------+-------------+-------------------+------------------------------+
```

## 未確定事項
- ...
````

補足:
- 端末で崩れにくくするため、固定幅テーブルの列名は英字を維持する。
- 必要時ロールは、未割当でも行を残して `N/A` を記載する。
- サブエージェント未起動ロールは `Agent Type=N/A`、`Status=not_started`。
- 実行結果は推測で埋めない。`wait` 結果か最終応答に基づき記載する。
- `Evidence` には秘密情報（token/api key/.env値）を含めない。

## 禁止事項

- ヒアリングなしで割り当てを確定しない
- 明示指示なしで実装・検証を開始しない
- `explorer` に編集作業をさせない
- `worker` が担当範囲外を変更しない
- 同一 `WriteTargets` の複数worker同時編集を許可しない
- 高リスク領域を並列実行しない
- 再計画時に `task-map/lock-table/schedule/event-log` の更新を省略しない
- `tester` の報告を「多分OK」で終わらせない
- 外部依存で未実施の検証を「成功」と扱わない
- 例外や失敗を握りつぶして報告しない
- 質問を一度に投げすぎて、提案なしで止まらない
- ユーザーの意図より手順遵守を優先しすぎない
- 「確認だけ」で終わり、次アクション提案を出さない

## クイックモード（ユーザーが「任せる」と言った場合）

詳細回答がない場合は、次の暫定値で開始し、未確定を明示する。

- 優先度: 標準
- リスク許容度: 中
- 検証レベル: 標準
- スケジューラモード: `balanced`
- 並列上限: `2`
- 実行順: `explorer -> worker -> (integrator) -> tester -> reviewer`

「任せる」は実行GOとして扱う。目的と変更範囲を1回確認できた時点で、追加確認なしで着手してよい。
ただし、目的と変更範囲だけは最低限確認する。

この時も「解釈した意図」と「先に進める案」を必ず1つ以上提示する。
