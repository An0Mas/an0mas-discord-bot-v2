/**
 * /mention-reactors コマンド — Sapphire Command 形式
 * 特定メッセージのリアクションを押した人全員にメンションを送る
 */

import { Command } from '@sapphire/framework';
import { MessageFlags, type TextBasedChannel } from 'discord.js';
import {
  getReactionInfoList,
  buildReactionButtons,
  parseMessageInput,
} from '../lib/mention-reactors-utils.js';

export class MentionReactorsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'mention-reactors',
      description: 'リアクションを押した人全員にメンションを送ります',
      preconditions: ['GuildAllowed', 'RestrictedAllowed'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('mention-reactors')
        .setDescription('リアクションを押した人全員にメンションを送ります')
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('対象メッセージのIDまたはリンク')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const input = interaction.options.getString('message', true);

    // 入力をパース（ID or URL）
    const { guildId, channelId, messageId } = parseMessageInput(input);

    // 別サーバーのリンクは拒否
    if (guildId && guildId !== interaction.guildId) {
      await interaction.reply({
        content: '❌ このリンクは別サーバーのため使用できません。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // メッセージを取得するチャンネルを決定
    let targetChannel: TextBasedChannel | null = null;

    if (channelId) {
      // URLからチャンネルIDが指定された場合
      try {
        const channel = await this.container.client.channels.fetch(channelId);
        if (channel && 'messages' in channel) {
          targetChannel = channel as TextBasedChannel;
        }
      } catch {
        // チャンネル取得失敗
      }
    } else {
      // チャンネルIDが指定されていない場合は現在のチャンネル
      if (interaction.channel && 'messages' in interaction.channel) {
        targetChannel = interaction.channel;
      }
    }

    if (!targetChannel) {
      await interaction.reply({
        content: '❌ チャンネルが見つかりません。正しいメッセージリンクを指定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // メッセージを取得
    let message;
    try {
      message = await targetChannel.messages.fetch({ message: messageId, force: true });
    } catch {
      await interaction.reply({
        content:
          '❌ メッセージが見つかりません。正しいメッセージIDまたはメッセージリンクを指定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // リアクション情報を取得
    const reactions = getReactionInfoList(message);

    if (reactions.length === 0) {
      await interaction.reply({
        content: '❌ このメッセージにはリアクションがありません。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // ボタンを構築（channelIdを埋め込む）
    const rows = buildReactionButtons(reactions, targetChannel.id, messageId);

    await interaction.reply({
      content: '📋 メンションを送りたいリアクションを選択してください：',
      components: rows,
      flags: MessageFlags.Ephemeral,
    });
  }
}
