/**
 * /bosyu-bpsr メンションモーダルハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction, TextChannel } from 'discord.js';
import {
  buildBosyuBpsrMentionMessage,
  getAllBpsrMembers,
  parseBosyuBpsrEmbed,
  parseBosyuBpsrMentionModalSubmission,
  parseBosyuBpsrMentionModalTarget,
} from '../lib/bosyu-bpsr-utils.js';

export class BosyuBpsrMentionModalHandler extends InteractionHandler {
  public constructor(
    context: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    const parsed = parseBosyuBpsrMentionModalTarget(interaction.customId);
    if (!parsed) {
      return this.none();
    }
    return this.some(parsed);
  }

  public override async run(
    interaction: ModalSubmitInteraction,
    parsed: InteractionHandler.ParseResult<this>,
  ) {
    // owner以外は無視（通常起きないが念のため）
    if (interaction.user.id !== parsed.ownerId) {
      await interaction.reply({
        content: '❌ 権限がありません。',
        ephemeral: true,
      });
      return;
    }

    // TODO: スレッド対応時はTextBasedChannelに変更
    const channel = interaction.channel as TextChannel | null;
    if (!channel) {
      await interaction.reply({
        content: '❌ チャンネルが見つかりません。',
        ephemeral: true,
      });
      return;
    }

    // 元の募集メッセージを取得
    let originalMessage;
    try {
      originalMessage = await channel.messages.fetch(parsed.messageId);
    } catch {
      await interaction.reply({
        content: '❌ 募集メッセージが見つかりません。',
        ephemeral: true,
      });
      return;
    }

    const embed = originalMessage.embeds[0];
    const state = parseBosyuBpsrEmbed(embed, parsed.ownerId);
    if (!state) {
      await interaction.reply({
        content: '❌ 募集情報を取得できません。',
        ephemeral: true,
      });
      return;
    }

    const members = getAllBpsrMembers(state);
    if (members.length === 0) {
      await interaction.reply({
        content: '📢 参加者がいないためメンションを送信できません。',
        ephemeral: true,
      });
      return;
    }

    // カスタムメッセージを取得
    const customMessage = parseBosyuBpsrMentionModalSubmission(interaction);
    if (!customMessage) {
      await interaction.reply({
        content: '❌ メッセージを入力してください。',
        ephemeral: true,
      });
      return;
    }

    // メンション送信
    const mentionMessage = buildBosyuBpsrMentionMessage(members, customMessage);
    await originalMessage.reply({
      content: mentionMessage,
    });

    await interaction.reply({
      content: '✅ メンションを送信しました。',
      ephemeral: true,
    });
  }
}
