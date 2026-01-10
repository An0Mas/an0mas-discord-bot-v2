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

## v0.1.1（Patch / UX改善）
> v0.1の範囲を広げず、既存機能の使い勝手を改善するパッチ。

### Must
- `/bosyu` のモーダル入力対応（引数なしでモーダル起動）
  - 引数（slots/title/body）が「全て未指定」の場合：モーダルを表示し、送信で募集を作成する
  - 引数が「全て指定」の場合：従来どおり即時作成する
  - 引数が「一部のみ指定」の場合：ephemeralでエラーを返し、no-op（募集は作成しない）
- ドキュメント（HELP.md / COMMAND.md）に、上記の使い方を追記する

### Won’t（v0.1.1ではやらない）
- `/bosyu-modal` などの別コマンド追加（/bosyuに統合する）
- 募集の状態管理方針（Embed復元）や権限モデルの変更
- Availability 等の新機能追加

---

## v0.1.2（Patch / 編集機能追加）
> 募集作成後の再編集を可能にするパッチ。

### Must
- `/bosyu` に「編集」ボタンを追加
  - 押下で編集モーダルを表示（タイトル/本文/人数に現在値をプリフィル）
  - 送信でEmbedを更新
  - 操作権限は作成者のみ
  - 締切中でも編集可能
- 人数変更で超過（メンバー数 > 残り人数）が発生しても許可（マイナス表示OK）
- ドキュメント（HELP.md / COMMAND.md / DETAILS/bosyu.md）に使い方を追記

### Won't（v0.1.2ではやらない）
- 編集履歴の記録
- 超過時の警告ダイアログ/禁止処理（将来検討）

---

## v0.2（実装済み ✅）
> v0.1系の後に実装された機能群。

### 実装済み
- `/bosyu-bpsr`（BPSR特化のロール別募集）
  - ロール別参加ボタン（🛡️タンク / ⚔️アタッカー / 💚ヒーラー）
  - ロール変更はボタン押し直しで自動切替
  - 募集人数は全体で管理（ロール別制限なし）
  - 投稿者は自動参加せず、ボタンで参加
- `/remind` + `/remind-list`（リマインダー）
  - 指定時刻にDMで通知
  - モーダルで入力（時刻/何分前/内容）
  - 一覧表示＋削除ボタン
  - SQLiteで永続化（Bot再起動後も維持）
- コマンド可用性（Availability）
  - guildごとの enable/disable
  - ユーザー/ロール別許可
- `/allow`（オーナー専用）
  - guild add/remove
  - user/role add/remove
- `/config`（オーナー専用）
  - show / permissions
- Sapphireフレームワーク移行
- エラーログと監視の整備

---

## Later（未スケジュール / いつかやるかも）
- /poll（UI強め：ボタン/セレクト）
- /clean（権限チェック必須）
- Web管理画面
- Redis（レート制限、短期キャッシュ、キュー）
