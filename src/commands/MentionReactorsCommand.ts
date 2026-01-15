/**
 * /mention-reactors コマンド — Sapphire Command 形式
 * 特定メッセージのリアクションを押した人全員にメンションを送る
 */

import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";
import {
    getReactionInfoList,
    buildReactionButtons,
} from "../lib/mention-reactors-utils.js";

export class MentionReactorsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "mention-reactors",
            description: "リアクションを押した人全員にメンションを送ります",
            preconditions: ["GuildAllowed", "RestrictedAllowed"],
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("mention-reactors")
                .setDescription("リアクションを押した人全員にメンションを送ります")
                .addStringOption((option) =>
                    option
                        .setName("message_id")
                        .setDescription("対象メッセージのID")
                        .setRequired(true)
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const messageId = interaction.options.getString("message_id", true);

        // チャンネルチェック
        if (!interaction.channel || !("messages" in interaction.channel)) {
            await interaction.reply({
                content: "❌ このチャンネルではメッセージを取得できません。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // メッセージを取得（現在のチャンネル → 親チャンネルの順で検索）
        let message;
        try {
            message = await interaction.channel.messages.fetch({ message: messageId, force: true });
        } catch {
            // スレッドの場合は親チャンネルも検索
            if ("parent" in interaction.channel && interaction.channel.parent) {
                try {
                    const parentChannel = interaction.channel.parent;
                    if ("messages" in parentChannel) {
                        message = await parentChannel.messages.fetch({ message: messageId, force: true });
                    }
                } catch {
                    // 親チャンネルでも見つからない
                }
            }
        }

        if (!message) {
            await interaction.reply({
                content: "❌ メッセージが見つかりません。正しいメッセージIDを指定してください。\n（同じチャンネルまたはスレッドの親チャンネル内のメッセージのみ対象です）",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // リアクション情報を取得
        const reactions = getReactionInfoList(message);

        if (reactions.length === 0) {
            await interaction.reply({
                content: "❌ このメッセージにはリアクションがありません。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // ボタンを構築
        const rows = buildReactionButtons(reactions, messageId);

        await interaction.reply({
            content: "📋 メンションを送りたいリアクションを選択してください：",
            components: rows,
            flags: MessageFlags.Ephemeral,
        });
    }
}
