/**
 * /help コマンド — Sapphire Command 形式
 */

import { Command } from '@sapphire/framework';
import { type GuildMember, MessageFlags } from 'discord.js';
import {
  loadHelpEntries,
  filterEntriesByPermission,
  getHelpPageCount,
  getHelpPageEntries,
  buildHelpList,
  type HelpEntry,
} from '../lib/help-utils.js';

// 起動時にヘルプエントリをロード（キャッシュ）
let helpEntriesCache: HelpEntry[] | null = null;

function getHelpEntries(): HelpEntry[] {
  if (!helpEntriesCache) {
    helpEntriesCache = loadHelpEntries();
  }
  return helpEntriesCache;
}

export class HelpCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'help',
      description: 'コマンドの使い方を一覧・詳細で確認できます',
      preconditions: ['GuildAllowed'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('help').setDescription('コマンドの使い方を一覧・詳細で確認できます'),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const allEntries = getHelpEntries();
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const member = interaction.member as GuildMember | null;

    // 権限でフィルタリング
    const entries = filterEntriesByPermission(allEntries, userId, guildId, member);

    const totalPages = getHelpPageCount(entries.length);
    const page = 1;

    const pageEntries = getHelpPageEntries(entries, page);
    const { embed, components } = buildHelpList({
      entries: pageEntries,
      page,
      totalPages,
      userId,
    });

    await interaction.reply({
      embeds: [embed],
      components,
      flags: MessageFlags.Ephemeral,
    });
  }
}
