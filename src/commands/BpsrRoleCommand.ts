/**
 * /bpsr-role コマンド
 * ロール付与ボタンパネルを設置する
 */

import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import {
  buildBpsrRoleComponents,
  buildBpsrRoleEmbed,
  DEFAULT_BODY,
  DEFAULT_TITLE,
} from '../lib/bpsr-role-utils.js';

export class BpsrRoleCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'bpsr-role',
      description: 'ロール付与ボタンを設置します',
      preconditions: ['GuildAllowed', 'RestrictedAllowed'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('bpsr-role')
        .setDescription('ロール付与ボタンを設置します')
        .addRoleOption((opt) =>
          opt.setName('tank').setDescription('タンクロール').setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName('attacker').setDescription('アタッカーロール').setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName('healer').setDescription('ヒーラーロール').setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('title')
            .setDescription('タイトル（デフォルト: ロール選択）')
            .setRequired(false),
        )
        .addStringOption((opt) => opt.setName('body').setDescription('説明文').setRequired(false)),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // 権限チェックはRestrictedAllowed Preconditionで実施済み
    await this.handleSetup(interaction);
  }

  private async handleSetup(interaction: Command.ChatInputCommandInteraction) {
    const tankRole = interaction.options.getRole('tank', true);
    const attackerRole = interaction.options.getRole('attacker', true);
    const healerRole = interaction.options.getRole('healer', true);
    const title = interaction.options.getString('title') ?? DEFAULT_TITLE;
    const body = interaction.options.getString('body') ?? DEFAULT_BODY;

    // BOTのロール位置チェック
    const botMember = interaction.guild!.members.me;
    if (!botMember) {
      await interaction.reply({
        content: '❌ BOTのメンバー情報を取得できませんでした。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 各ロールがBOTより下にあるか確認
    const rolesToCheck = [
      { role: tankRole, name: 'タンク' },
      { role: attackerRole, name: 'アタッカー' },
      { role: healerRole, name: 'ヒーラー' },
    ];

    for (const { role, name } of rolesToCheck) {
      const targetRole = interaction.guild!.roles.cache.get(role.id);
      if (targetRole && botMember.roles.highest.position <= targetRole.position) {
        await interaction.reply({
          content: `❌ BOTのロール位置が ${name}ロール <@&${role.id}> より低いため、このロールを付与できません。`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    // Embedとボタンを構築
    const embed = buildBpsrRoleEmbed(title, body);
    const components = buildBpsrRoleComponents(tankRole.id, attackerRole.id, healerRole.id);

    // メッセージを投稿
    await interaction.reply({
      embeds: [embed],
      components,
    });
  }
}
