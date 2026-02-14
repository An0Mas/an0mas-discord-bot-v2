/**
 * /bosyu-bpsr コマンド — Sapphire Command 形式
 * ロール別人数制限対応（v0.3）
 */

import { Command } from '@sapphire/framework';
import { buildBosyuBpsrModal } from '../lib/bosyu-bpsr-utils.js';

export class BosyuBpsrCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'bosyu-bpsr',
      description: 'BPSR用の募集を作成します（ロール別人数制限）',
      preconditions: ['GuildAllowed'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('bosyu-bpsr').setDescription('BPSR用の募集を作成します（ロール別人数制限）'),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // ロール別人数をモーダルで入力
    await interaction.showModal(buildBosyuBpsrModal(interaction.user.id));
  }
}
