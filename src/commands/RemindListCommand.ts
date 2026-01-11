/**
 * /remind-list コマンド — Sapphire Command 形式
 */

import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";
import { buildRemindListEmbed } from "../lib/remind-utils.js";
import { getRemindersForUser } from "../db.js";

export class RemindListCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "remind-list",
            description: "登録したリマインダーの一覧を表示します",
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("remind-list")
                .setDescription("登録したリマインダーの一覧を表示します")
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const reminders = getRemindersForUser(interaction.user.id);
        const { embed, components } = buildRemindListEmbed(reminders, interaction.user.id);

        await interaction.reply({
            embeds: [embed],
            components,
            flags: MessageFlags.Ephemeral,
        });
    }
}
