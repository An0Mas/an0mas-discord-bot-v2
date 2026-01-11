/**
 * /bosyu-bpsr コマンド — Sapphire Command 形式
 */

import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";
import {
    buildBosyuBpsrModal,
    buildBosyuBpsrComponents,
    buildBosyuBpsrEmbed,
    createBosyuBpsrState,
    decideBosyuBpsrCommandInput,
} from "../lib/bosyu-bpsr-utils.js";

export class BosyuBpsrCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "bosyu-bpsr",
            description: "BPSR用の募集を作成します（ロール選択式）",
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("bosyu-bpsr")
                .setDescription("BPSR用の募集を作成します（ロール選択式）")
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
        const decision = decideBosyuBpsrCommandInput({ slots, title, body });

        if (decision.type === "modal") {
            await interaction.showModal(buildBosyuBpsrModal(interaction.user.id));
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

        // 投稿者は自動参加しない（ボタンで参加）
        const state = createBosyuBpsrState({
            ownerId,
            title: decision.title,
            body: decision.body,
            remaining: decision.slots,
            tanks: [],
            attackers: [],
            healers: [],
            status: "OPEN",
        });

        const embed = buildBosyuBpsrEmbed(state);
        const components = buildBosyuBpsrComponents(state);

        await interaction.reply({
            embeds: [embed],
            components,
        });
    }
}
