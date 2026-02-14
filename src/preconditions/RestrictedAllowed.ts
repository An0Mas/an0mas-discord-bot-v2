/**
 * RestrictedAllowed Precondition — Restricted権限チェック
 * command-config.tsで「restricted」に設定されたコマンドに適用
 * オーナー or 許可されたユーザー/ロールのみ実行可能
 */

import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { isUserAllowedForCommand, hasAnyPermissionSettings } from '../lib/permission-utils.js';
import { getOwnerId } from '../config.js';

export class RestrictedAllowedPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    // サーバー外は拒否
    if (!guildId) {
      return this.error({ message: '❌ このコマンドはサーバー内でのみ使用できます。' });
    }

    // オーナーは常に許可
    const ownerId = getOwnerId();
    if (userId === ownerId) {
      return this.ok();
    }

    // メンバーのロールを取得
    const member = interaction.member as GuildMember | null;
    const userRoleIds = member?.roles.cache.map((r) => r.id) ?? [];

    // 許可設定がある場合はチェック
    if (hasAnyPermissionSettings(guildId, commandName)) {
      const allowed = isUserAllowedForCommand(guildId, commandName, userId, userRoleIds);
      if (!allowed) {
        return this.error({
          message: `❌ このコマンドを実行する権限がありません。\n（Bot管理者による許可が必要です）`,
        });
      }
      return this.ok();
    }

    // 許可設定がない場合はオーナーのみ
    return this.error({
      message: `❌ このコマンドはまだ許可設定がありません。\n（Bot管理者による許可が必要です）`,
    });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    RestrictedAllowed: never;
  }
}
