/**
 * /bosyu メンション確認ボタンハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction, TextChannel } from "discord.js";
import {
    buildBosyuMentionMessage,
    buildBosyuMentionModal,
    parseBosyuEmbed,
    parseBosyuMentionConfirmCustomId,
} from "../lib/bosyu-utils.js";

export class BosyuMentionButtonHandler extends InteractionHandler {
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
        if (!interaction.customId.startsWith("bosyu-mention:")) {
            return this.none();
        }

        const parsed = parseBosyuMentionConfirmCustomId(interaction.customId);
        if (!parsed) {
            return this.none();
        }

        return this.some(parsed);
    }

    public override async run(
        interaction: ButtonInteraction,
        parsed: InteractionHandler.ParseResult<this>
    ) {
        // owner以外は無視
        if (interaction.user.id !== parsed.ownerId) {
            await interaction.deferUpdate();
            return;
        }

        // TODO: スレッド対応時はTextBasedChannelに変更
        const channel = interaction.channel as TextChannel | null;
        if (!channel) {
            await interaction.update({
                content: "❌ チャンネルが見つかりません。",
                components: [],
            });
            return;
        }

        // 元の募集メッセージを取得
        let originalMessage;
        try {
            originalMessage = await channel.messages.fetch(parsed.messageId);
        } catch {
            await interaction.update({
                content: "❌ 募集メッセージが見つかりません。",
                components: [],
            });
            return;
        }

        const embed = originalMessage.embeds[0];
        const state = parseBosyuEmbed(embed, parsed.ownerId);
        if (!state) {
            await interaction.update({
                content: "❌ 募集情報を取得できません。",
                components: [],
            });
            return;
        }

        if (state.members.length === 0) {
            await interaction.update({
                content: "📢 参加者がいないためメンションを送信できません。",
                components: [],
            });
            return;
        }

        // キャンセル
        if (parsed.action === "cancel") {
            await interaction.update({
                content: "❌ メンションをキャンセルしました。",
                components: [],
            });
            return;
        }

        // モーダル表示
        if (parsed.action === "modal") {
            await interaction.showModal(
                buildBosyuMentionModal(parsed.ownerId, parsed.messageId)
            );
            return;
        }

        // 送信
        if (parsed.action === "send") {
            const mentionMessage = buildBosyuMentionMessage(state.members);
            await originalMessage.reply({
                content: mentionMessage,
            });
            await interaction.update({
                content: "✅ メンションを送信しました。",
                components: [],
            });
            return;
        }
    }
}
