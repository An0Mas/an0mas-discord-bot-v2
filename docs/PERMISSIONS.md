# 権限システム — Discord便利Bot v0.2

## 概要

本Botは3層の権限モデルを採用しています。

```
[Guild許可] → [コマンド種別] → [実行]
     ↓ 未許可         ↓ 権限なし
   全拒否           エラー返信
```

---

## コマンド種別

| 種別 | 条件 | 例 |
|------|------|-----|
| **Everyone** | 許可済みGuildなら誰でも実行可 | `/help`, `/bosyu`, `/remind` |
| **Restricted** | Guild許可 + 許可ユーザー/ロール | （将来用） |
| **OwnerOnly** | Botオーナー本人のみ | `/allow`, `/config` |

---

## 設定ファイル

### .env
```env
OWNER_ID=123456789012345678
```
- Botオーナーを特定するDiscord User ID
- `/allow`, `/config` の実行権限に使用

---

## データベーステーブル

### guild_config
サーバー単位の許可設定

```sql
CREATE TABLE guild_config (
  guild_id   TEXT PRIMARY KEY,
  enabled    INTEGER NOT NULL DEFAULT 0
);
```

### allowed_users
コマンド別許可ユーザー

```sql
CREATE TABLE allowed_users (
  guild_id   TEXT NOT NULL,
  command    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  PRIMARY KEY (guild_id, command, user_id)
);
```

### allowed_roles
コマンド別許可ロール

```sql
CREATE TABLE allowed_roles (
  guild_id   TEXT NOT NULL,
  command    TEXT NOT NULL,
  role_id    TEXT NOT NULL,
  PRIMARY KEY (guild_id, command, role_id)
);
```

---

## 関連モジュール

| ファイル | 役割 |
|----------|------|
| `src/config.ts` | OWNER_ID取得、`isBotOwner()` |
| `src/lib/permission-utils.ts` | 権限チェック関数群 |
| `src/preconditions/GuildAllowed.ts` | Guild許可Precondition |
| `src/db.ts` | DB操作（許可リストCRUD） |
| `src/commands/AllowCommand.ts` | `/allow` コマンド（Sapphire） |
| `src/commands/ConfigCommand.ts` | `/config` コマンド（Sapphire） |

---

## Guild許可チェックの実装

### Preconditionとは

SapphireフレームワークのPreconditionは、コマンド実行前に条件をチェックする仕組みです。
条件を満たさない場合、Sapphireが自動的にエラーメッセージを返します。

### GuildAllowed Precondition

`src/preconditions/GuildAllowed.ts` でGuild許可チェックを実装しています。

```typescript
import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { checkGuildPermission } from "../lib/permission-utils.js";

export class GuildAllowedPrecondition extends Precondition {
    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const guildCheck = checkGuildPermission(interaction);
        
        if (!guildCheck.allowed) {
            return this.error({ message: guildCheck.reason });
        }
        
        return this.ok();
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        GuildAllowed: never;
    }
}
```

### 新コマンドへの適用方法

コマンドのコンストラクタで `preconditions` を指定します：

```typescript
export class MyCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "mycommand",
            description: "コマンドの説明",
            preconditions: ["GuildAllowed"],  // ← これを追加
        });
    }
}
```

### 適用対象

| コマンド | Precondition | 備考 |
|----------|--------------|------|
| `/help` | GuildAllowed | ✅ |
| `/bosyu` | GuildAllowed | ✅ |
| `/bosyu-bpsr` | GuildAllowed | ✅ |
| `/dice` | GuildAllowed | ✅ |
| `/remind` | GuildAllowed | ✅ |
| `/remind-list` | GuildAllowed | ✅ |
| `/verify` | GuildAllowed | ✅ |
| `/allow` | なし | オーナー専用（Guild許可前でも使用可能） |
| `/config` | なし | オーナー専用（Guild許可前でも使用可能） |

### なぜPreconditionを使うのか

以前はindex.tsの`Events.InteractionCreate`リスナーでGuild許可チェックを行っていましたが、
Sapphireのコマンド処理と競合し、タイムアウトエラー（Unknown interaction: 10062）が発生することがありました。

Preconditionを使うことで：
- ✅ Sapphireのコマンド処理フローに統合される
- ✅ 競合やタイムアウトが発生しない
- ✅ エラーメッセージが正しく表示される

---

## 主要関数

### permissions.ts

```typescript
// Guild許可チェック
checkGuildPermission(interaction): PermissionResult

// オーナー専用チェック
checkOwnerOnly(userId): PermissionResult
```

### db.ts

```typescript
// Guild許可
isGuildEnabled(guildId): boolean
enableGuild(guildId): void
disableGuild(guildId): void

// コマンド別許可
addAllowedUser(guildId, command, userId): boolean
removeAllowedUser(guildId, command, userId): boolean
getAllowedUsers(guildId, command): string[]

addAllowedRole(guildId, command, roleId): boolean
removeAllowedRole(guildId, command, roleId): boolean
getAllowedRoles(guildId, command): string[]

// 権限判定
isUserAllowedForCommand(guildId, command, userId, roleIds): boolean
hasAnyPermissionSettings(guildId, command): boolean
```

---

## Restrictedコマンドの実装方法

コマンドをRestrictedにするには、ハンドラ内で以下のチェックを追加：

```typescript
import { hasAnyPermissionSettings, isUserAllowedForCommand } from "../db.js";

// 許可設定が存在する場合のみチェック
if (hasAnyPermissionSettings(guildId, "bosyu")) {
  const userRoles = member.roles.cache.map(r => r.id);
  if (!isUserAllowedForCommand(guildId, "bosyu", userId, userRoles)) {
    await interaction.reply({
      content: "🚫 このコマンドを実行する権限がありません。",
      ephemeral: true,
    });
    return;
  }
}
```

---

## 管理コマンド

### /allow
```
/allow guild add          — サーバーを許可
/allow guild remove       — サーバーを不許可
/allow user add <cmd> <user>   — ユーザーに権限付与
/allow user remove <cmd> <user> — ユーザーから権限削除
/allow role add <cmd> <role>   — ロールに権限付与
/allow role remove <cmd> <role> — ロールから権限削除
```

### /config
```
/config show              — 基本設定を表示
/config permissions       — 権限設定一覧
/config permissions command:<name> — 特定コマンドの詳細
```
