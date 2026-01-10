/**
 * /bosyu モーダルハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ModalSubmitInteraction } from "discord.js";
import {
    buildBosyuComponents,
    buildBosyuEmbed,
    createBosyuState,
    parseBosyuModalTarget,
    parseBosyuModalSubmission,
    parseBosyuEmbed,
} from "../lib/bosyu-utils.js";

export class BosyuModalHandler extends InteractionHandler {
    public constructor(
        context: InteractionHandler.LoaderContext,
        options: InteractionHandler.Options
    ) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
        });
    }

    public override parse(interaction: ModalSubmitInteraction) {
        // bosyu-modal: または bosyu-edit: で始まるか確認
        if (!interaction.customId.startsWith("bosyu-modal:") &&
            !interaction.customId.startsWith("bosyu-edit:")) {
            return this.none();
        }

        const target = parseBosyuModalTarget(interaction.customId);
        if (!target) {
            return this.none();
        }

        // 操作ユーザー確認
        if (target.ownerId !== interaction.user.id) {
            return this.none();
        }

        return this.some(target);
    }

    public override async run(
        interaction: ModalSubmitInteraction,
        target: InteractionHandler.ParseResult<this>
    ) {
        const parsed = parseBosyuModalSubmission(interaction);
        if (!parsed.ok) {
            await interaction.reply({
                content: parsed.message,
                ephemeral: true,
            });
            return;
        }

        // 新規作成の場合
        if (target.type === "create") {
            const ownerMention = `<@${target.ownerId}>`;
            const state = createBosyuState({
                ownerId: target.ownerId,
                title: parsed.title,
                body: parsed.body,
                remaining: parsed.slots,
                members: [ownerMention],
                status: "OPEN",
            });

            const embed = buildBosyuEmbed(state);
            const components = buildBosyuComponents(state);
            await interaction.reply({
                embeds: [embed],
                components,
            });
            return;
        }

        // 編集の場合
        if (!interaction.channel || !interaction.channel.isTextBased()) {
            await interaction.reply({
                content: "編集対象のメッセージを取得できませんでした。",
                ephemeral: true,
            });
            return;
        }

        const message = await interaction.channel.messages
            .fetch(target.messageId)
            .catch(() => null);
        if (!message) {
            await interaction.reply({
                content: "編集対象のメッセージが見つかりませんでした。",
                ephemeral: true,
            });
            return;
        }

        const currentEmbed = message.embeds[0];
        const currentState = parseBosyuEmbed(currentEmbed, target.ownerId);
        if (!currentState) {
            await interaction.reply({
                content: "募集データを読み取れませんでした。",
                ephemeral: true,
            });
            return;
        }

        const nextState = createBosyuState({
            ...currentState,
            title: parsed.title,
            body: parsed.body,
            remaining: parsed.slots,
        });

        const nextEmbed = buildBosyuEmbed(nextState);
        const nextComponents = buildBosyuComponents(nextState);
        await message.edit({
            embeds: [nextEmbed],
            components: nextComponents,
        });
        await interaction.reply({
            content: "募集内容を更新しました。",
            ephemeral: true,
        });
    }
}
