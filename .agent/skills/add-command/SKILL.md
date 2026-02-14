---
name: add-command
description: 新しいSlashコマンドを追加する際のチェックリストと手順
---

# add-command スキル

新しい Slash コマンドをこのリポジトリへ追加するための標準手順。
`AGENTS.md` の方針（ボタン優先、`flags: MessageFlags.Ephemeral`、PR運用、検証手順）に合わせる。

---

## 0. 事前判断（必須）

- [ ] 新規コマンドが本当に必要か確認した  
      既存機能の拡張はボタン/メニューを優先する。
- [ ] 権限タイプ（`public` / `restricted` / `owner-only`）を決めた
- [ ] 3秒超の可能性がある処理かを判断した（`deferReply` 要否）

---

## 1. 実装チェックリスト

### コード

- [ ] `src/commands/{Name}Command.ts` を作成
- [ ] `src/command-config.ts` の `COMMANDS` に追加
- [ ] 必要なら `src/lib/{name}-utils.ts` を作成
- [ ] 必要なら `src/interaction-handlers/{Name}ButtonHandler.ts` を作成
- [ ] 必要なら `src/interaction-handlers/{Name}ModalHandler.ts` を作成

### ドキュメント

- [ ] `docs/HELP.md` を更新（新コマンドは必須）
- [ ] `docs/COMMAND.md` を更新（新コマンドは必須）
- [ ] 複雑な機能なら `docs/DETAILS/{name}.md` を作成/更新
- [ ] 権限仕様を変えるなら `docs/PERMISSIONS.md` を更新
- [ ] 振る舞い仕様を変えるなら `docs/SPEC.md` を更新
- [ ] DB追加/変更があるなら `docs/DB-SCHEMA.md` を更新

---

## 2. コマンド実装パターン

### ファイル名規則

- クラス名: `{Name}Command`（PascalCase）
- ファイル名: `src/commands/{Name}Command.ts`
- ローカル import: `.js` 拡張子を付ける

### 基本テンプレート（整形済み）

```typescript
import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';

export class {Name}Command extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: '{name}',
      description: '{概要}',
      preconditions: ['GuildAllowed'], // 権限タイプに応じて変更
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('{name}')
        .setDescription('{概要}')
        // .addStringOption((opt) =>
        //   opt.setName('option').setDescription('説明').setRequired(true),
        // )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // 長い処理（3秒超想定）がある場合
    // await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    // const result = await heavyTask();
    // await interaction.editReply({ content: result });
    // return;

    // 短い処理（3秒以内）
    await interaction.reply({
      content: '...',
      flags: MessageFlags.Ephemeral,
    });
  }
}
```

### エラー処理

- 原則: 例外は握りつぶさず throw（グローバルリスナーに集約）
- `try/catch` で握るなら `notifyErrorToOwner` を明示呼び出し
- 返信済みなら `followUp({ flags: MessageFlags.Ephemeral })` を使う

### 権限タイプと preconditions

| 権限タイプ | preconditions | 例 |
|-----------|---------------|----|
| `public` | `['GuildAllowed']` | `bosyu`, `dice`, `help` |
| `restricted` | `['GuildAllowed', 'RestrictedAllowed']` | `verify`, `mention-reactors` |
| `owner-only` | なし（コマンド内で owner 判定） | `allow`, `config` |

---

## 3. `command-config` 追加

`src/command-config.ts` の `COMMANDS` に必ず追加する。

```typescript
{ name: '{name}', description: '{概要}', permissionType: '{public|restricted|owner-only}' }
```

---

## 4. InteractionHandler / customId 方針

### customId 設計ルール

- 固定フォーマットを全機能に強制しない
- 機能単位で `buildXxxCustomId` / `parseXxxCustomId` を `src/lib/*-utils.ts` に実装する
- `parse` 側で prefix と要素数を厳密チェックする
- 100文字制限を超えない設計にする

### 例（ButtonHandler）

```typescript
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { parseXxxCustomId } from '../lib/xxx-utils.js';

export class {Name}ButtonHandler extends InteractionHandler {
  public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    const parsed = parseXxxCustomId(interaction.customId);
    if (!parsed) return this.none();
    return this.some(parsed);
  }

  public override async run(
    interaction: ButtonInteraction,
    parsed: InteractionHandler.ParseResult<this>,
  ) {
    // ボタン処理
  }
}
```

---

## 5. ドキュメント書式ルール

### `docs/HELP.md`（必須）

- `## /{name}` セクションを追加
- `### 概要` を必ず入れる（`/help` 一覧生成で使用）
- 最低限: `概要 / 使い方 / 動作 / 例`

### `docs/COMMAND.md`（必須）

- 早見表として `## /{name}` を追加
- 最低限: `使い方 / パラメータ（あれば） / 動作`

### `docs/DETAILS/{name}.md`（推奨）

- ボタン/モーダル/権限分岐など複雑なコマンドでは必須

---

## 6. 検証手順（コード変更時）

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

