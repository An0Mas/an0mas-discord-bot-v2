/**
 * ロール付与ボタンハンドラ — Sapphire InteractionHandler 形式
 * タンク/アタッカー/ヒーラーの排他的ロール付与
 */

import {
    InteractionHandler,
    InteractionHandlerTypes,
} from "@sapphire/framework";
import { type ButtonInteraction, type GuildMember, MessageFlags } from "discord.js";
import {
    parseBpsrRoleCustomId,
    isBpsrRoleCustomId,
    getRoleIdByType,
    getOtherRoleTypes,
    ROLE_LABELS,
    type BpsrRoleType,
} from "../lib/bpsr-role-utils.js";

export class BpsrRoleButtonHandler extends InteractionHandler {
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
        // bpsr-roleボタンかチェック
        if (!isBpsrRoleCustomId(interaction.customId)) {
            return this.none();
        }

        const parsed = parseBpsrRoleCustomId(interaction.customId);
        if (!parsed) {
            return this.none();
        }

        return this.some(parsed);
    }

    public override async run(
        interaction: ButtonInteraction,
        result: InteractionHandler.ParseResult<this>
    ) {
        const { type, tankRoleId, attackerRoleId, healerRoleId } = result;

        // サーバー内チェック
        if (!interaction.guild || !interaction.guildId) {
            await interaction.reply({
                content: "❌ このボタンはサーバー内でのみ使用できます。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // メンバー情報を取得
        const member = interaction.member as GuildMember | null;
        if (!member) {
            await interaction.reply({
                content: "❌ メンバー情報を取得できませんでした。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // 選択したロールID
        const selectedRoleId = getRoleIdByType(
            type,
            tankRoleId,
            attackerRoleId,
            healerRoleId
        );

        // 現在そのロールを持っているか
        const hasSelectedRole = member.roles.cache.has(selectedRoleId);

        // 他のロールID
        const otherRoleIds = getOtherRoleTypes(type).map((t) =>
            getRoleIdByType(t, tankRoleId, attackerRoleId, healerRoleId)
        );

        try {
            if (hasSelectedRole) {
                // トグル解除: 既に持っている場合は解除のみ
                await member.roles.remove(selectedRoleId);
                await interaction.reply({
                    content: `🔄 ${ROLE_LABELS[type]} を解除しました。`,
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                // 排他付与: 選択ロールを付与し、他は解除
                const rolesToRemove = otherRoleIds.filter((id) =>
                    member.roles.cache.has(id)
                );

                // 他のロールを解除
                if (rolesToRemove.length > 0) {
                    await member.roles.remove(rolesToRemove);
                }

                // 選択したロールを付与
                await member.roles.add(selectedRoleId);

                await interaction.reply({
                    content: `✅ ${ROLE_LABELS[type]} を付与しました。`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            // 権限不足などのエラー
            console.error("[BpsrRoleButtonHandler] ロール操作エラー:", error);

            // 既にreplyしていなければエラーメッセージを返す
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ ロールの操作に失敗しました。BOTの権限を確認してください。",
                    flags: MessageFlags.Ephemeral,
                });
            }
            // エラーを再throwしない（リスナーで二重replyを防ぐ）
        }
    }
}
