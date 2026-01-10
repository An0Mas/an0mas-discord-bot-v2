/**
 * /help コマンド — Sapphire Command 形式
 */

import { Command } from "@sapphire/framework";
import {
    loadHelpEntries,
    getHelpPageCount,
    getHelpPageEntries,
    buildHelpList,
    type HelpEntry,
} from "../lib/help-utils.js";

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
            name: "help",
            description: "コマンドの使い方を一覧・詳細で確認できます",
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("help")
                .setDescription("コマンドの使い方を一覧・詳細で確認できます")
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const entries = getHelpEntries();
        const totalPages = getHelpPageCount(entries.length);
        const page = 1;
        const userId = interaction.user.id;

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
            ephemeral: true,
        });
    }
}
