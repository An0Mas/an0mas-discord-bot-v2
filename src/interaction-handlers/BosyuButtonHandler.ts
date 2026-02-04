/**
 * /bosyu ボタンハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import {
    applyBosyuAction,
    buildBosyuEditModal,
    buildBosyuComponents,
    buildBosyuEmbed,
    buildBosyuMentionConfirmComponents,
    parseBosyuCustomId,
    parseBosyuEmbed,
} from "../lib/bosyu-utils.js";

export class BosyuButtonHandler extends InteractionHandler {
    public constructor(
        context: InteractionHandler.LoaderContext,
        options: InteractionHandler.Options
    ) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        if (!interaction.customId.startsWith("bosyu:")) {
            return this.none();
        }

        const parsed = parseBosyuCustomId(interaction.customId);
        if (!parsed) {
            return this.none();
        }

        return this.some(parsed);
    }

    public override async run(
        interaction: ButtonInteraction,
        parsed: InteractionHandler.ParseResult<this>
    ) {
        const embed = interaction.message.embeds[0];
        const state = parseBosyuEmbed(embed, parsed.ownerId);
        if (!state) {
            await interaction.deferUpdate();
            return;
        }

        // 編集モーダル表示
        if (parsed.action === "edit") {
            if (interaction.user.id !== parsed.ownerId) {
                await interaction.deferUpdate();
                return;
            }
            await interaction.showModal(buildBosyuEditModal(state, interaction.message.id));
            return;
        }

        // メンション確認表示
        if (parsed.action === "mention") {
            if (interaction.user.id !== parsed.ownerId) {
                await interaction.deferUpdate();
                return;
            }
            const memberCount = state.members.length;
            if (memberCount === 0) {
                await interaction.reply({
                    content: "📢 参加者がいないためメンションを送信できません。",
                    ephemeral: true,
                });
                return;
            }
            const components = buildBosyuMentionConfirmComponents(
                parsed.ownerId,
                interaction.message.id,
            );
            await interaction.reply({
                content: `📢 参加者 **${memberCount}人** にメンションを送信します`,
                components,
                ephemeral: true,
            });
            return;
        }

        // その他のアクション
        const updated = applyBosyuAction({
            state,
            action: parsed.action,
            actorId: interaction.user.id,
        });

        if (!updated) {
            await interaction.deferUpdate();
            return;
        }

        const nextEmbed = buildBosyuEmbed(updated);
        const nextComponents = buildBosyuComponents(updated);
        await interaction.update({
            embeds: [nextEmbed],
            components: nextComponents,
        });
    }
}

