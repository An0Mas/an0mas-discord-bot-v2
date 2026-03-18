/**
 * 認証ボタンハンドラ — Sapphire InteractionHandler 形式
 * 認証ボタン、編集ボタン、削除ボタンを処理
 */

import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ButtonInteraction, type GuildMember, MessageFlags } from 'discord.js';
import { getVerifySetting, deleteVerifySetting } from '../db.js';
import { isUserAllowedForCommand, hasAnyPermissionSettings } from '../lib/permission-utils.js';
import { isBotOwner } from '../config.js';
import {
  parseVerifyButtonId,
  parseVerifyEditButtonId,
  parseVerifyDeleteButtonId,
  buildVerifyModal,
  buildVerifyEditModal,
} from '../lib/verify-utils.js';

export class VerifyButtonHandler extends InteractionHandler {
  public constructor(
    context: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    // 認証ボタン
    const verifyBtn = parseVerifyButtonId(interaction.customId);
    if (verifyBtn) {
      return this.some({ type: 'verify' as const, ...verifyBtn });
    }

    // 編集ボタン
    const editBtn = parseVerifyEditButtonId(interaction.customId);
    if (editBtn) {
      return this.some({ type: 'edit' as const, ...editBtn });
    }

    // 削除ボタン
    const deleteBtn = parseVerifyDeleteButtonId(interaction.customId);
    if (deleteBtn) {
      return this.some({ type: 'delete' as const, ...deleteBtn });
    }

    return this.none();
  }

  public override async run(
    interaction: ButtonInteraction,
    result: InteractionHandler.ParseResult<this>,
  ) {
    const { type, messageId, ownerId } = result;

    if (type === 'verify') {
      // 認証モーダルは最優先で即表示（interaction期限切れ対策）
      const modal = buildVerifyModal(messageId);
      await interaction.showModal(modal);
      return;
    }

    // 設定を取得
    const setting = getVerifySetting(messageId);
    if (!setting) {
      await interaction.reply({
        content: '❌ この認証は無効になっています。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 編集・削除は権限チェックが必要
    const hasPermission = this.checkPermission(interaction, ownerId);
    if (!hasPermission) {
      await interaction.reply({
        content: '🚫 この操作は認証の作成者または許可されたユーザーのみ実行できます。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (type === 'edit') {
      // 編集モーダルを表示
      const modal = buildVerifyEditModal(messageId, setting);
      await interaction.showModal(modal);
      return;
    }

    if (type === 'delete') {
      // 削除確認なしで即削除（UXのためシンプルに）
      try {
        await interaction.message.delete();
      } catch {
        // メッセージが見つからない場合は無視
      }
      deleteVerifySetting(messageId);
      await interaction.reply({
        content: '✅ 認証ボタンを削除しました。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  private checkPermission(interaction: ButtonInteraction, ownerId: string): boolean {
    const userId = interaction.user.id;

    // 作成者は常に許可
    if (userId === ownerId) {
      return true;
    }

    // オーナーは常に許可
    if (isBotOwner(userId)) {
      return true;
    }

    // 許可ユーザー/ロールかチェック
    if (!interaction.guildId) {
      return false;
    }

    const member = interaction.member as GuildMember | null;
    if (!member) {
      return false;
    }

    const userRoleIds = member.roles.cache.map((r) => r.id);

    // 許可設定がない場合は作成者/オーナーのみ
    if (!hasAnyPermissionSettings(interaction.guildId, 'verify')) {
      return false;
    }

    return isUserAllowedForCommand(interaction.guildId, 'verify', userId, userRoleIds);
  }
}
