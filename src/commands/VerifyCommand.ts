/**
 * /verify コマンド — Sapphire Command 形式
 * 合言葉認証システムを管理（setup のみ、edit/deleteはボタンで実行）
 */

import { Command } from '@sapphire/framework';
import { saveVerifySetting } from '../db.js';
import { buildVerifyEmbed, buildVerifyComponents } from '../lib/verify-utils.js';
import { MessageFlags } from 'discord.js';

export class VerifyCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'verify',
      description: '合言葉認証システムを設置します',
      preconditions: ['GuildAllowed', 'RestrictedAllowed'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('verify')
        .setDescription('合言葉認証システムを設置します')
        .addStringOption((opt) =>
          opt.setName('keyword').setDescription('正解の合言葉').setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('付与するロール').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('title').setDescription('タイトル（デフォルト: 認証）').setRequired(false),
        )
        .addStringOption((opt) =>
          opt.setName('description').setDescription('説明文').setRequired(false),
        ),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // 権限チェックはRestrictedAllowed Preconditionで実施済み
    await this.handleSetup(interaction);
  }

  private async handleSetup(interaction: Command.ChatInputCommandInteraction) {
    const keyword = interaction.options.getString('keyword', true);
    const role = interaction.options.getRole('role', true);
    const title = interaction.options.getString('title') ?? null;
    const description = interaction.options.getString('description') ?? null;

    // BOTのロール位置チェック
    const botMember = interaction.guild!.members.me;
    if (!botMember) {
      await interaction.reply({
        content: '❌ BOTのメンバー情報を取得できませんでした。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const targetRole = interaction.guild!.roles.cache.get(role.id);
    if (targetRole && botMember.roles.highest.position <= targetRole.position) {
      await interaction.reply({
        content: `❌ BOTのロール位置が <@&${role.id}> より低いため、このロールを付与できません。`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 仮のメッセージIDでEmbed構築（後で更新）
    const tempMessageId = 'temp';
    const ownerId = interaction.user.id;
    const tempSetting = {
      message_id: tempMessageId,
      channel_id: interaction.channelId,
      guild_id: interaction.guildId!,
      keyword,
      role_id: role.id,
      owner_id: ownerId,
      title,
      description,
      created_at: 0,
    };

    const embed = buildVerifyEmbed(tempSetting);
    const components = buildVerifyComponents(tempMessageId, ownerId);

    // メッセージを投稿
    const reply = await interaction.reply({
      embeds: [embed],
      components,
      fetchReply: true,
    });

    // 実際のメッセージIDで保存
    const setting = {
      message_id: reply.id,
      channel_id: interaction.channelId,
      guild_id: interaction.guildId!,
      keyword,
      role_id: role.id,
      owner_id: ownerId,
      title,
      description,
    };
    saveVerifySetting(setting);

    // Embedとボタンを正しいIDで更新
    const finalEmbed = buildVerifyEmbed({ ...setting, created_at: 0 });
    const finalComponents = buildVerifyComponents(reply.id, ownerId);
    await reply.edit({
      embeds: [finalEmbed],
      components: finalComponents,
    });
  }
}
