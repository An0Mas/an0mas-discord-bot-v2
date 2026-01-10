/**
 * /allow コマンド — Bot利用許可を管理（オーナー専用）
 */

import { ChatInputCommandInteraction } from "discord.js";
import { checkOwnerOnly, PermissionResult } from "../permissions.js";
import { enableGuild, disableGuild, isGuildEnabled } from "../db.js";

/**
 * /allow guild add — このサーバーを許可リストに追加
 */
async function handleGuildAdd(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({
            content: "❌ このコマンドはサーバー内でのみ使用できます。",
            ephemeral: true,
        });
        return;
    }

    // 既に許可済みかチェック
    if (isGuildEnabled(guildId)) {
        await interaction.reply({
            content: "ℹ️ このサーバーは既に許可リストに登録されています。",
            ephemeral: true,
        });
        return;
    }

    enableGuild(guildId);
    await interaction.reply({
        content: `✅ サーバー「${interaction.guild?.name}」を許可リストに追加しました。`,
        ephemeral: true,
    });
}

/**
 * /allow guild remove — このサーバーを許可リストから削除
 */
async function handleGuildRemove(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({
            content: "❌ このコマンドはサーバー内でのみ使用できます。",
            ephemeral: true,
        });
        return;
    }

    // 許可されていないかチェック
    if (!isGuildEnabled(guildId)) {
        await interaction.reply({
            content: "ℹ️ このサーバーは許可リストに登録されていません。",
            ephemeral: true,
        });
        return;
    }

    disableGuild(guildId);
    await interaction.reply({
        content: `✅ サーバー「${interaction.guild?.name}」を許可リストから削除しました。`,
        ephemeral: true,
    });
}

/**
 * /allow コマンドのメインハンドラ
 */
export async function handleAllowCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    // OwnerOnlyチェック
    const ownerCheck: PermissionResult = checkOwnerOnly(interaction.user.id);
    if (!ownerCheck.allowed) {
        await interaction.reply({
            content: ownerCheck.reason,
            ephemeral: true,
        });
        return;
    }

    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (subcommandGroup === "guild") {
        if (subcommand === "add") {
            await handleGuildAdd(interaction);
            return;
        }
        if (subcommand === "remove") {
            await handleGuildRemove(interaction);
            return;
        }
    }

    // 想定外のサブコマンド
    await interaction.reply({
        content: "❌ 不明なサブコマンドです。",
        ephemeral: true,
    });
}
