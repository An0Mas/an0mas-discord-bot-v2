# DETAILS — bosyu（募集） v0.1

## 0. 目的
- 参加者募集メッセージ（Embed）を投稿し、ボタン操作で
  - 参加者リスト
  - 残り募集人数
  - 募集の締切（OPEN/CLOSED）
  を管理する。

## 1. 状態モデル
### 1.1 状態
- OPEN：募集中
- CLOSED：募集停止

### 1.2 状態遷移
- `close`（締切/再開：ownerのみ）
  - OPEN → CLOSED
  - CLOSED → OPEN

## 2. コマンドI/F（Slash）
- `/bosyu`
  - `slots`: number
    - 意味：作成者“以外”に「あと何名参加できるか」
  - `title`: string
  - `body`: string（改行可）

## 3. 出力（Embed）仕様
> スクショ準拠。厳密なUI再現は不要だが、情報構造は一致させる。

### 3.1 Embed表示（要点）
- Embedの上部に `title` を表示（author欄、またはそれに相当する目立つ位置）
- Embed本文（説明）は以下の構造を推奨：
  - 1行目：状態表示
    - OPEN：`【募集中】`
    - CLOSED：`【募集停止】`
  - 2行目以降：`body`

※ “どの欄に出すか（title/description/author等）” は実装都合で調整可。
※ ただし「状態表示文字列」は固定（パース/復元の基準になるため）。

### 3.2 フィールド（inline=true）
#### 参加メンバーリスト
- フィールド名：`参加メンバーリスト`
- 初期値：作成者のメンション（例：`<@123...>`）
- 表示形式：メンションを改行区切りで列挙
- 参加者が0人になった場合：`` `参加者無し` ``

#### 募集人数
- フィールド名：`募集人数`
- 表示形式：`あと{remaining}名`
- 初期値：`remaining = slots`

### 3.3 画像
- OPEN：
  - `https://1.bp.blogspot.com/-0LJSR56tXL8/VVGVS2PQRsI/AAAAAAAAtkA/9EI2ZHrT5w8/s800/text_sankasya_bosyu.png`
- CLOSED：
  - `https://1.bp.blogspot.com/-fDI1k-dkGO8/X5OcjEhqRUI/AAAAAAABcAc/DSrwuOQW6xMPgE1XZ8zvqhV0akkIctmTgCNcBGAsYHQ/s819/text_oshirase_eigyousyuuryou.png`

## 4. コンポーネント（ボタン）仕様
### 4.1 ボタン一覧
- `join`（Primary）：`参加`
- `cancel`（Danger）：`取消`
- `close`（Success）：状態に応じて `締切` / `再開`
- `plus`（Secondary）：`＋`（絵文字/ラベルどちらでも可）
- `minus`（Secondary）：`－`

### 4.2 ボタンの有効/無効
- OPEN：
  - `join` / `cancel` / `plus` / `minus`：enabled
  - `close`：enabled（ラベル `締切`）
- CLOSED：
  - `join` / `cancel` / `plus` / `minus`：disabled
  - `close`：enabled（ラベル `再開`）

## 5. 権限（owner判定）
- `close` / `plus` / `minus` は **募集作成者（owner）のみ**実行可能。
- `join` / `cancel` は **誰でも**実行可能。

### 5.1 owner_id の保持（必須）
- Embedの見た目（author icon等）では判定しない。
- 以下のいずれかで **owner_id を必ず保持**する：
  - ボタン `custom_id` に owner_id を含める（推奨）
  - Embed footer に `owner_id=<user_id>` を埋める

## 6. 操作ロジック（状態更新）
### 6.1 join（誰でも）
- 前提：状態がOPEN
- 条件：
  - 参加者リストに自分が未登録
  - `remaining > 0`
- 成功時：
  - 自分のメンションを参加者リスト末尾に追加
  - `remaining -= 1`
- 失敗時：
  - no-op（状態変更なし）
  - 失敗理由通知は任意（v0.1は旧挙動踏襲なら無言でOK）

### 6.2 cancel（誰でも）
- 前提：状態がOPEN
- 条件：参加者リストに自分が登録済み
- 成功時：
  - 自分のメンションを参加者リストから削除
  - 参加者が0人なら `` `参加者無し` ``
  - `remaining += 1`
- 失敗時：
  - no-op（状態変更なし）

### 6.3 plus/minus（ownerのみ）
- 前提：状態がOPEN
- plus：
  - `remaining += 1`
- minus：
  - `remaining > 0` のとき `remaining -= 1`
  - 0未満にしない

### 6.4 close（ownerのみ）
- OPEN → CLOSED：
  - 状態表示を `【募集停止】` に変更
  - 画像を CLOSED 用に変更
  - `join/cancel/plus/minus` を disabled
  - `close` は enabled のまま、ラベルを `再開` に変更
- CLOSED → OPEN：
  - 状態表示を `【募集中】` に変更
  - 画像を OPEN 用に変更
  - `join/cancel/plus/minus` を enabled
  - `close` は enabled のまま、ラベルを `締切` に変更

## 7. パース/復元規約（Embedから状態復元）
> DBなしで動かす前提のため、表示文字列を固定する。

- 状態判定：
  - 状態表示の文字列で判定（`【募集中】` / `【募集停止】`）
- 参加者取得：
  - `参加メンバーリスト` フィールドから改行区切りメンションを取得
  - `` `参加者無し` `` の場合は空リスト扱い
- remaining取得：
  - `募集人数` フィールド文字列 `あと{N}名` から数値Nを抽出

## 8. 未確認（要追加根拠）
- 参加済み/満員/未参加などの「失敗時に返信するか」は、旧Javaコード確認後に確定。
- `slots` の上限/下限、`title/body` の文字数制限は、旧Javaまたは運用都合で確定。
