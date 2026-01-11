/**
 * /config コマンド — Sapphire Command 形式
 * Bot設定を表示・管理（オーナー専用）
 */

import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { checkOwnerOnly, PermissionResult } from "../permissions.js";
import { getGuildConfig, getAllEnabledGuilds, getAllowedUsers, getAllowedRoles } from "../db.js";
import { getOwnerId } from "../config.js";

export class ConfigCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "config",
            description: "Bot設定を表示・管理します（オーナー専用）",
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("config")
                .setDescription("Bot設定を表示・管理します（オーナー専用）")
                .addSubcommand((sub) =>
                    sub.setName("show").setDescription("現在の設定を表示")
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("permissions")
                        .setDescription("コマンドの権限設定を表示")
                        .addStringOption((opt) =>
                            opt
                                .setName("command")
                                .setDescription("コマンド名（省略で一覧）")
                                .setRequired(false)
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
                ephemeral: true,
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "show") {
            await this.handleShow(interaction);
            return;
        }

        if (subcommand === "permissions") {
            await this.handlePermissions(interaction);
            return;
        }

        await interaction.reply({
            content: "❌ 不明なサブコマンドです。",
            ephemeral: true,
        });
    }

    private async handleShow(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
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

    private async handlePermissions(interaction: Command.ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                ephemeral: true,
            });
            return;
        }

        const commandName = interaction.options.getString("command");

        if (commandName) {
            // 特定コマンドの詳細表示
            const { isOwnerOnlyCommand, isRestrictedCommand } = await import("../command-config.js");

            const allowedUsers = getAllowedUsers(guildId, commandName);
            const allowedRoles = getAllowedRoles(guildId, commandName);

            const userList = allowedUsers.length > 0
                ? allowedUsers.map(id => `<@${id}>`).join("\n")
                : "（なし）";
            const roleList = allowedRoles.length > 0
                ? allowedRoles.map(id => `<@&${id}>`).join("\n")
                : "（なし）";

            // 権限タイプに応じたフッターメッセージ
            let footerText: string;
            if (isOwnerOnlyCommand(commandName)) {
                footerText = "このコマンドはオーナーのみ使用可能です";
            } else if (isRestrictedCommand(commandName)) {
                footerText = "設定がない場合、オーナーのみ使用可能です";
            } else {
                footerText = "設定がない場合、全員が使用可能です";
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 /${commandName} の許可設定`)
                .setColor(0x5865F2)
                .addFields(
                    {
                        name: "👤 許可ユーザー",
                        value: userList,
                        inline: true,
                    },
                    {
                        name: "🏷️ 許可ロール",
                        value: roleList,
                        inline: true,
                    }
                )
                .setFooter({ text: footerText })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
        } else {
            // 全コマンドの概要表示（中央設定から動的に取得）
            const { COMMANDS, isOwnerOnlyCommand, isRestrictedCommand } = await import("../command-config.js");

            const fields = COMMANDS.map(cmd => {
                const users = getAllowedUsers(guildId, cmd.name);
                const roles = getAllowedRoles(guildId, cmd.name);
                const hasRestrictions = users.length > 0 || roles.length > 0;

                let value: string;
                if (isOwnerOnlyCommand(cmd.name)) {
                    value = "🔐 オーナーのみ";
                } else if (hasRestrictions) {
                    value = `👤 ${users.length}人 / 🏷️ ${roles.length}ロール`;
                } else if (isRestrictedCommand(cmd.name)) {
                    value = "🔒 オーナー/許可ユーザー";
                } else {
                    value = "✅ 全員使用可";
                }
                return {
                    name: `/${cmd.name}`,
                    value,
                    inline: true,
                };
            });

            const embed = new EmbedBuilder()
                .setTitle("📋 コマンド権限設定一覧")
                .setDescription("詳細は `/config permissions command:<コマンド名>` で確認")
                .setColor(0x5865F2)
                .addFields(fields)
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
        }
    }
}
