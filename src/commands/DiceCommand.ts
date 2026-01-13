/**
 * /dice コマンド — ダイスロール
 */

import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";

export class DiceCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "dice",
            description: "ダイスロール。指定した形式でダイスを振ります",
            preconditions: ["GuildAllowed"],
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("dice")
                .setDescription("ダイスロール。指定した形式でダイスを振ります")
                .addStringOption((option) =>
                    option
                        .setName("expression")
                        .setDescription("ダイス式（例: 2d6, 1d100）省略時は 1d6")
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(
        interaction: Command.ChatInputCommandInteraction
    ) {
        const expression = interaction.options.getString("expression") ?? "1d6";
        const result = this.rollDice(expression);

        if (result.error) {
            await interaction.reply({
                content: result.error,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const user = interaction.user;
        const message = `🎲 <@${user.id}> rolled **${expression}**\nResult: ${result.display}`;

        await interaction.reply({
            content: message,
            allowedMentions: { users: [] }, // メンション通知を抑制
        });
    }

    /**
     * NdM形式のダイス式をパースして振る
     */
    private rollDice(expression: string): {
        rolls?: number[];
        total?: number;
        display?: string;
        error?: string;
    } {
        // NdM形式をパース（大文字小文字どちらも対応）
        const match = expression.toLowerCase().match(/^(\d+)d(\d+)$/);
        if (!match) {
            return { error: "❌ 無効な形式です。例: 2d6, 1d100" };
        }

        const count = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);

        // バリデーション
        if (count < 1 || count > 100) {
            return { error: "❌ ダイスの個数は1〜100個までです" };
        }
        if (sides < 2 || sides > 1000) {
            return { error: "❌ ダイスの面数は2〜1000までです" };
        }

        // ダイスを振る
        const rolls: number[] = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }

        const total = rolls.reduce((sum, val) => sum + val, 0);

        // 表示形式
        let display: string;
        if (count === 1) {
            display = `**${total}**`;
        } else {
            display = `${rolls.join(" + ")} = **${total}**`;
        }

        return { rolls, total, display };
    }
}
