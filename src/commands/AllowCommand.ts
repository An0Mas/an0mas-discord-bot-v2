/**
 * /allow コマンド — Sapphire Command 形式
 * Bot利用許可を管理（オーナー専用）
 */

import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";
import { checkOwnerOnly, PermissionResult } from "../lib/permission-utils.js";
import {
    enableGuild,
    disableGuild,
    isGuildEnabled,
    addAllowedUser,
    removeAllowedUser,
    addAllowedRole,
    removeAllowedRole,
} from "../db.js";
import { getCommandChoices } from "../command-config.js";

export class AllowCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "allow",
            description: "Bot利用許可を管理します（オーナー専用）",
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("allow")
                .setDescription("Bot利用許可を管理します（オーナー専用）")
                .addSubcommandGroup((group) =>
                    group
                        .setName("guild")
                        .setDescription("サーバーの許可を管理")
                        .addSubcommand((sub) =>
                            sub.setName("add").setDescription("このサーバーを許可")
                        )
                        .addSubcommand((sub) =>
                            sub.setName("remove").setDescription("このサーバーの許可を解除")
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("user")
                        .setDescription("ユーザーのコマンド権限を管理")
                        .addSubcommand((sub) =>
                            sub
                                .setName("add")
                                .setDescription("ユーザーにコマンド権限を付与")
                                .addStringOption((opt) =>
                                    opt.setName("command").setDescription("コマンド名").setRequired(true)
                                        .addChoices(...getCommandChoices())
                                )
                                .addUserOption((opt) =>
                                    opt.setName("user").setDescription("ユーザー").setRequired(true)
                                )
                        )
                        .addSubcommand((sub) =>
                            sub
                                .setName("remove")
                                .setDescription("ユーザーからコマンド権限を削除")
                                .addStringOption((opt) =>
                                    opt.setName("command").setDescription("コマンド名").setRequired(true)
                                        .addChoices(...getCommandChoices())
                                )
                                .addUserOption((opt) =>
                                    opt.setName("user").setDescription("ユーザー").setRequired(true)
                                )
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("role")
                        .setDescription("ロールのコマンド権限を管理")
                        .addSubcommand((sub) =>
                            sub
                                .setName("add")
                                .setDescription("ロールにコマンド権限を付与")
                                .addStringOption((opt) =>
                                    opt.setName("command").setDescription("コマンド名").setRequired(true)
                                        .addChoices(...getCommandChoices())
                                )
                                .addRoleOption((opt) =>
                                    opt.setName("role").setDescription("ロール").setRequired(true)
                                )
                        )
                        .addSubcommand((sub) =>
                            sub
                                .setName("remove")
                                .setDescription("ロールからコマンド権限を削除")
                                .addStringOption((opt) =>
                                    opt.setName("command").setDescription("コマンド名").setRequired(true)
                                        .addChoices(...getCommandChoices())
                                )
                                .addRoleOption((opt) =>
                                    opt.setName("role").setDescription("ロール").setRequired(true)
                                )
                        )
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        // OwnerOnlyチェック
        const ownerCheck: PermissionResult = checkOwnerOnly(interaction.user.id);
        if (!ownerCheck.allowed) {
            await interaction.reply({
                content: ownerCheck.reason,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === "guild") {
            if (subcommand === "add") {
                await this.handleGuildAdd(interaction);
                return;
            }
            if (subcommand === "remove") {
                await this.handleGuildRemove(interaction);
                return;
            }
        }

        if (subcommandGroup === "user") {
            if (subcommand === "add") {
                await this.handleUserAdd(interaction);
                return;
            }
            if (subcommand === "remove") {
                await this.handleUserRemove(interaction);
                return;
            }
        }

        if (subcommandGroup === "role") {
            if (subcommand === "add") {
                await this.handleRoleAdd(interaction);
                return;
            }
            if (subcommand === "remove") {
                await this.handleRoleRemove(interaction);
                return;
            }
        }

        await interaction.reply({
            content: "❌ 不明なサブコマンドです。",
            flags: MessageFlags.Ephemeral,
        });
    }

    private async handleGuildAdd(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (isGuildEnabled(guildId)) {
            await interaction.reply({
                content: "ℹ️ このサーバーは既に許可リストに登録されています。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        enableGuild(guildId);
        await interaction.reply({
            content: `✅ サーバー「${interaction.guild?.name}」を許可リストに追加しました。`,
            flags: MessageFlags.Ephemeral,
        });
    }

    private async handleGuildRemove(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!isGuildEnabled(guildId)) {
            await interaction.reply({
                content: "ℹ️ このサーバーは許可リストに登録されていません。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        disableGuild(guildId);
        await interaction.reply({
            content: `✅ サーバー「${interaction.guild?.name}」を許可リストから削除しました。`,
            flags: MessageFlags.Ephemeral,
        });
    }

    private async handleUserAdd(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const command = interaction.options.getString("command", true);
        const user = interaction.options.getUser("user", true);

        const success = addAllowedUser(guildId, command, user.id);
        if (success) {
            await interaction.reply({
                content: `✅ <@${user.id}> に \`/${command}\` の権限を付与しました。`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: `ℹ️ <@${user.id}> は既に \`/${command}\` の権限を持っています。`,
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    private async handleUserRemove(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const command = interaction.options.getString("command", true);
        const user = interaction.options.getUser("user", true);

        const success = removeAllowedUser(guildId, command, user.id);
        if (success) {
            await interaction.reply({
                content: `✅ <@${user.id}> から \`/${command}\` の権限を削除しました。`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: `ℹ️ <@${user.id}> は \`/${command}\` の権限を持っていませんでした。`,
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    private async handleRoleAdd(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const command = interaction.options.getString("command", true);
        const role = interaction.options.getRole("role", true);

        const success = addAllowedRole(guildId, command, role.id);
        if (success) {
            await interaction.reply({
                content: `✅ <@&${role.id}> に \`/${command}\` の権限を付与しました。`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: `ℹ️ <@&${role.id}> は既に \`/${command}\` の権限を持っています。`,
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    private async handleRoleRemove(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const command = interaction.options.getString("command", true);
        const role = interaction.options.getRole("role", true);

        const success = removeAllowedRole(guildId, command, role.id);
        if (success) {
            await interaction.reply({
                content: `✅ <@&${role.id}> から \`/${command}\` の権限を削除しました。`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: `ℹ️ <@&${role.id}> は \`/${command}\` の権限を持っていませんでした。`,
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
