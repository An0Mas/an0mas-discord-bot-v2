/**
 * /bosyu-bpsr ボタンハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import {
    applyBosyuBpsrAction,
    buildBosyuBpsrEditModal,
    buildBosyuBpsrComponents,
    buildBosyuBpsrEmbed,
    parseBosyuBpsrCustomId,
    parseBosyuBpsrEmbed,
} from "../lib/bosyu-bpsr-utils.js";

export class BosyuBpsrButtonHandler extends InteractionHandler {
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
        if (!interaction.customId.startsWith("bpsr:")) {
            return this.none();
        }

        const parsed = parseBosyuBpsrCustomId(interaction.customId);
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
        const state = parseBosyuBpsrEmbed(embed, parsed.ownerId);
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
            await interaction.showModal(buildBosyuBpsrEditModal(state, interaction.message.id));
            return;
        }

        // その他のアクション
        const updated = applyBosyuBpsrAction({
            state,
            action: parsed.action,
            actorId: interaction.user.id,
        });

        if (!updated) {
            await interaction.deferUpdate();
            return;
        }

        const nextEmbed = buildBosyuBpsrEmbed(updated);
        const nextComponents = buildBosyuBpsrComponents(updated);
        await interaction.update({
            embeds: [nextEmbed],
            components: nextComponents,
        });
    }
}
