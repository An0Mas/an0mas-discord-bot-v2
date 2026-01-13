/**
 * /bosyu コマンド — Sapphire Command 形式
 */

import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";
import {
    buildBosyuModal,
    buildBosyuComponents,
    buildBosyuEmbed,
    createBosyuState,
    decideBosyuCommandInput,
} from "../lib/bosyu-utils.js";

export class BosyuCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "bosyu",
            description: "参加者募集を作成します",
            preconditions: ["GuildAllowed"],
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("bosyu")
                .setDescription("参加者募集を作成します")
                .addNumberOption((option) =>
                    option
                        .setName("slots")
                        .setDescription("募集人数（1〜99）")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("タイトル（1〜100文字）")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option
                        .setName("body")
                        .setDescription("本文（1〜1000文字）")
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const slots = interaction.options.getNumber("slots");
        const title = interaction.options.getString("title");
        const body = interaction.options.getString("body");
        const decision = decideBosyuCommandInput({ slots, title, body });

        if (decision.type === "modal") {
            await interaction.showModal(buildBosyuModal(interaction.user.id));
            return;
        }

        if (decision.type === "error") {
            await interaction.reply({
                content: decision.message,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const ownerId = interaction.user.id;
        const ownerMention = `<@${ownerId}>`;

        const state = createBosyuState({
            ownerId,
            title: decision.title,
            body: decision.body,
            remaining: decision.slots,
            members: [ownerMention],
            status: "OPEN",
        });

        const embed = buildBosyuEmbed(state);
        const components = buildBosyuComponents(state);

        await interaction.reply({
            embeds: [embed],
            components,
        });
    }
}
