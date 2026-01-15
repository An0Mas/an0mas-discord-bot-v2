/**
 * MentionReactorsボタンハンドラ — Sapphire InteractionHandler 形式
 * リアクション選択ボタンの処理
 */

import {
    InteractionHandler,
    InteractionHandlerTypes,
} from "@sapphire/framework";
import { type ButtonInteraction, MessageFlags } from "discord.js";
import {
    isMentionReactorsCustomId,
    parseCustomId,
    fetchReactionUsers,
    fetchAllReactionUsers,
    buildMentionMessages,
} from "../lib/mention-reactors-utils.js";

export class MentionReactorsButtonHandler extends InteractionHandler {
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
        if (!isMentionReactorsCustomId(interaction.customId)) {
            return this.none();
        }

        const parsed = parseCustomId(interaction.customId);
        if (!parsed) {
            return this.none();
        }

        return this.some(parsed);
    }

    public override async run(
        interaction: ButtonInteraction,
        result: InteractionHandler.ParseResult<this>
    ) {
        const { messageId, emojiId, isCustom, isAll } = result;

        // チャンネルチェック
        if (!interaction.channel || !("messages" in interaction.channel)) {
            await interaction.reply({
                content: "❌ このチャンネルではメッセージを取得できません。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // メッセージを取得
        let message;
        try {
            message = await interaction.channel.messages.fetch(messageId);
        } catch {
            await interaction.reply({
                content: "❌ 元のメッセージが見つかりません。削除された可能性があります。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // deferReply（ユーザー取得に時間がかかる場合があるため）
        await interaction.deferReply();

        try {
            // ユーザー一覧を取得
            let users;
            if (isAll) {
                users = await fetchAllReactionUsers(message);
            } else {
                users = await fetchReactionUsers(message, emojiId, isCustom);
            }

            if (users.length === 0) {
                await interaction.editReply({
                    content: "リアクションを押したユーザーがいません。",
                });
                return;
            }

            // メンションメッセージを構築
            const mentionMessages = buildMentionMessages(users);

            // 最初のメッセージはeditReplyで送信
            await interaction.editReply({
                content: `📢 ${users.length}人にメンションを送信しました：\n${mentionMessages[0]}`,
            });

            // 2000文字を超えた場合は追加メッセージを送信
            if (mentionMessages.length > 1 && "send" in interaction.channel) {
                for (let i = 1; i < mentionMessages.length; i++) {
                    await interaction.channel.send(mentionMessages[i]);
                }
            }
        } catch (error) {
            console.error("[MentionReactorsButtonHandler] エラー:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ メンションの送信に失敗しました。",
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.editReply({
                    content: "❌ メンションの送信に失敗しました。",
                });
            }
        }
    }
}
