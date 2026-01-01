# SCOPE — Discord便利Bot Roadmap

> ここは「どのバージョンで何をやるか」を固定するための宣言。
> 実装判断の優先順位は SPEC.md が最上位だが、
> 「入れる/入れない」の境界は本ファイルに従う。

---

## v0.1（MVP / 最短で動く）
### Must
- Sapphire Framework（discord.js v14ベース）
- intents：Guilds のみ
- Secrets：.env 管理（直書き禁止）
- DB：SQLite（`./data/dev.sqlite3` 推奨）
- ドキュメント：SPEC.md / HELP.md / COMMAND.md / DETAILS/bosyu.md
- `/help`
  - ephemeral（呼び出し本人のみ表示）
  - 一覧：ナンバリング + summary
  - 一覧：ページ送り（prev/next）
  - 一覧→番号ボタンで詳細表示
  - 詳細→Backで直前の一覧に戻る
  - ボタン操作は本人のみ有効
- `/bosyu`
  - 参加/取消/締切/再開/＋/－
  - 締切中は参加系ボタンdisabled
  - 一部操作は募集作成者のみ（締切/再開、＋/－）
  - 状態はEmbedから復元可能（owner_idは保持必須）

### Won’t（v0.1ではやらない）
- サーバー別/ユーザー別/ロール別のコマンド可用性（Availability）
- /config
- /poll /clean
- 音楽機能
- MessageContent intent を必要とする機能

---

## v0.2（Next / 追加予定だが時期未定）
> 「やること」は明確だが、いつやるかは未定。

### Must（予定）
- コマンド可用性（Availability）の最小実装
  - まずは「guildごとの enable/disable」だけ
  - /help 詳細に「利用制限あり」の注記を出せるようにする（可能なら）
- `/config`（最小）
  - guildごとの設定（少なくとも Availability の ON/OFF を操作可能）
  - 操作権限は管理者/管理ロールのみ（詳細はSPECで確定）

### Nice to have（余裕があれば）
- Availability を user/role まで拡張（allow/deny）
- 設定の監査ログ（audit）を最小で入れる

---

## Later（未スケジュール / いつかやるかも）
- /poll（UI強め：ボタン/セレクト）
- /clean（権限チェック必須）
- Web管理画面
- Redis（レート制限、短期キャッシュ、キュー）
