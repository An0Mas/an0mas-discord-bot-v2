/**
 * /remind コマンド — Sapphire Command 形式
 */

import { Command } from "@sapphire/framework";
import { buildRemindModal } from "../lib/remind-utils.js";

export class RemindCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "remind",
            description: "リマインダーを登録します（DM通知）",
            preconditions: ["GuildAllowed"],
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("remind")
                .setDescription("リマインダーを登録します（DM通知）")
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.showModal(buildRemindModal(interaction.user.id));
    }
}
