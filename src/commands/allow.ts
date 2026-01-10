/**
 * /allow コマンド — Bot利用許可を管理（オーナー専用）
 */

import { ChatInputCommandInteraction } from "discord.js";
import { checkOwnerOnly, PermissionResult } from "../permissions.js";
import {
    enableGuild,
    disableGuild,
    isGuildEnabled,
    addAllowedUser,
    removeAllowedUser,
    addAllowedRole,
    removeAllowedRole,
} from "../db.js";

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
 * /allow user add — ユーザーにコマンド権限を付与
 */
async function handleUserAdd(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({
            content: "❌ このコマンドはサーバー内でのみ使用できます。",
            ephemeral: true,
        });
        return;
    }

    const command = interaction.options.getString("command", true);
    const user = interaction.options.getUser("user", true);

    const success = addAllowedUser(guildId, command, user.id);
    if (success) {
        await interaction.reply({
            content: `✅ <@${user.id}> に \`/${command}\` の権限を付与しました。`,
            ephemeral: true,
        });
    } else {
        await interaction.reply({
            content: `ℹ️ <@${user.id}> は既に \`/${command}\` の権限を持っています。`,
            ephemeral: true,
        });
    }
}

/**
 * /allow user remove — ユーザーからコマンド権限を削除
 */
async function handleUserRemove(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({
            content: "❌ このコマンドはサーバー内でのみ使用できます。",
            ephemeral: true,
        });
        return;
    }

    const command = interaction.options.getString("command", true);
    const user = interaction.options.getUser("user", true);

    const success = removeAllowedUser(guildId, command, user.id);
    if (success) {
        await interaction.reply({
            content: `✅ <@${user.id}> から \`/${command}\` の権限を削除しました。`,
            ephemeral: true,
        });
    } else {
        await interaction.reply({
            content: `ℹ️ <@${user.id}> は \`/${command}\` の権限を持っていませんでした。`,
            ephemeral: true,
        });
    }
}

/**
 * /allow role add — ロールにコマンド権限を付与
 */
async function handleRoleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({
            content: "❌ このコマンドはサーバー内でのみ使用できます。",
            ephemeral: true,
        });
        return;
    }

    const command = interaction.options.getString("command", true);
    const role = interaction.options.getRole("role", true);

    const success = addAllowedRole(guildId, command, role.id);
    if (success) {
        await interaction.reply({
            content: `✅ <@&${role.id}> に \`/${command}\` の権限を付与しました。`,
            ephemeral: true,
        });
    } else {
        await interaction.reply({
            content: `ℹ️ <@&${role.id}> は既に \`/${command}\` の権限を持っています。`,
            ephemeral: true,
        });
    }
}

/**
 * /allow role remove — ロールからコマンド権限を削除
 */
async function handleRoleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({
            content: "❌ このコマンドはサーバー内でのみ使用できます。",
            ephemeral: true,
        });
        return;
    }

    const command = interaction.options.getString("command", true);
    const role = interaction.options.getRole("role", true);

    const success = removeAllowedRole(guildId, command, role.id);
    if (success) {
        await interaction.reply({
            content: `✅ <@&${role.id}> から \`/${command}\` の権限を削除しました。`,
            ephemeral: true,
        });
    } else {
        await interaction.reply({
            content: `ℹ️ <@&${role.id}> は \`/${command}\` の権限を持っていませんでした。`,
            ephemeral: true,
        });
    }
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

    if (subcommandGroup === "user") {
        if (subcommand === "add") {
            await handleUserAdd(interaction);
            return;
        }
        if (subcommand === "remove") {
            await handleUserRemove(interaction);
            return;
        }
    }

    if (subcommandGroup === "role") {
        if (subcommand === "add") {
            await handleRoleAdd(interaction);
            return;
        }
        if (subcommand === "remove") {
            await handleRoleRemove(interaction);
            return;
        }
    }

    // 想定外のサブコマンド
    await interaction.reply({
        content: "❌ 不明なサブコマンドです。",
        ephemeral: true,
    });
}

