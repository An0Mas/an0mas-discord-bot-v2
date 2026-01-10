/**
 * /config コマンド — Bot設定を表示・管理（オーナー専用）
 */

import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { checkOwnerOnly, PermissionResult } from "../permissions.js";
import { getGuildConfig, getAllEnabledGuilds } from "../db.js";
import { getOwnerId } from "../config.js";

/**
 * /config show — 現在の設定を表示
 */
async function handleConfigShow(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;

    // 現在のギルドの設定情報を取得
    const guildConfig = guildId ? getGuildConfig(guildId) : null;
    const allEnabledGuilds = getAllEnabledGuilds();

    const embed = new EmbedBuilder()
        .setTitle("⚙️ Bot設定")
        .setColor(0x5865F2)
        .addFields(
            {
                name: "🔑 Botオーナー",
                value: getOwnerId() ? `<@${getOwnerId()}>` : "（未設定）",
                inline: true,
            },
            {
                name: "🏠 現在のサーバー",
                value: guildId
                    ? `${interaction.guild?.name}\n許可状態: ${guildConfig?.enabled === 1 ? "✅ 許可" : "❌ 未許可"}`
                    : "（DMで実行）",
                inline: true,
            },
            {
                name: "📋 許可済みサーバー数",
                value: `${allEnabledGuilds.length} サーバー`,
                inline: true,
            }
        )
        .setTimestamp();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * /config コマンドのメインハンドラ
 */
export async function handleConfigCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    // OwnerOnlyチェック
    const ownerCheck: PermissionResult = checkOwnerOnly(interaction.user.id);
    if (!ownerCheck.allowed) {
        await interaction.reply({
            content: ownerCheck.reason,
            ephemeral: true,
        });
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "show") {
        await handleConfigShow(interaction);
        return;
    }

    // 想定外のサブコマンド
    await interaction.reply({
        content: "❌ 不明なサブコマンドです。",
        ephemeral: true,
    });
}
