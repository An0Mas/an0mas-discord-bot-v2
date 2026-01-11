/**
 * 認証モーダルハンドラ — Sapphire InteractionHandler 形式
 * 認証モーダルと編集モーダルを処理
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ModalSubmitInteraction, GuildMember } from "discord.js";
import { getVerifySetting, updateVerifySetting } from "../db.js";
import {
    parseVerifyModalId,
    parseVerifyEditModalId,
    verifyKeyword,
    buildVerifyEmbed,
    buildVerifyComponents,
} from "../lib/verify-utils.js";

export class VerifyModalHandler extends InteractionHandler {
    public constructor(
        context: InteractionHandler.LoaderContext,
        options: InteractionHandler.Options
    ) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
        });
    }

    public override parse(interaction: ModalSubmitInteraction) {
        // 認証モーダル
        const verifyModal = parseVerifyModalId(interaction.customId);
        if (verifyModal) {
            return this.some({ type: "verify" as const, messageId: verifyModal.messageId });
        }

        // 編集モーダル
        const editModal = parseVerifyEditModalId(interaction.customId);
        if (editModal) {
            return this.some({ type: "edit" as const, messageId: editModal.messageId });
        }

        return this.none();
    }

    public override async run(
        interaction: ModalSubmitInteraction,
        result: InteractionHandler.ParseResult<this>
    ) {
        const { type, messageId } = result;

        // 設定を取得
        const setting = getVerifySetting(messageId);
        if (!setting) {
            await interaction.reply({
                content: "❌ この認証は無効になっています。",
                ephemeral: true,
            });
            return;
        }

        if (type === "verify") {
            await this.handleVerify(interaction, setting);
            return;
        }

        if (type === "edit") {
            await this.handleEdit(interaction, messageId, setting);
            return;
        }
    }

    private async handleVerify(
        interaction: ModalSubmitInteraction,
        setting: ReturnType<typeof getVerifySetting>
    ) {
        if (!setting) return;

        // 入力値を取得
        const input = interaction.fields.getTextInputValue("keyword");

        // 合言葉を照合
        if (!verifyKeyword(input, setting.keyword)) {
            await interaction.reply({
                content: "❌ 合言葉が違います。もう一度お試しください。",
                ephemeral: true,
            });
            return;
        }

        // ロールを付与
        const member = interaction.member as GuildMember | null;
        if (!member || !member.roles) {
            await interaction.reply({
                content: "❌ メンバー情報を取得できませんでした。",
                ephemeral: true,
            });
            return;
        }

        try {
            // 既にロールを持っている場合
            if (member.roles.cache.has(setting.role_id)) {
                await interaction.reply({
                    content: "ℹ️ 既に認証済みです。",
                    ephemeral: true,
                });
                return;
            }

            // ロールを付与
            await member.roles.add(setting.role_id);
            await interaction.reply({
                content: "✅ 認証が完了しました！ロールが付与されました。",
                ephemeral: true,
            });
        } catch (error: any) {
            console.error("Failed to add role:", error);

            // エラーコードに応じてメッセージを出し分け
            if (error?.code === 50013) {
                // Missing Permissions - ロール位置の問題
                await interaction.reply({
                    content: `❌ BOTのロール位置が <@&${setting.role_id}> より低いため、このロールを付与できません。`,
                    ephemeral: true,
                });
            } else {
                // その他の権限エラー
                await interaction.reply({
                    content: "❌ ロールの付与に失敗しました。BOTの権限を確認してください。",
                    ephemeral: true,
                });
            }
        }
    }

    private async handleEdit(
        interaction: ModalSubmitInteraction,
        messageId: string,
        setting: ReturnType<typeof getVerifySetting>
    ) {
        if (!setting) return;

        // 入力値を取得
        const keyword = interaction.fields.getTextInputValue("keyword");
        const title = interaction.fields.getTextInputValue("title") || null;
        const description = interaction.fields.getTextInputValue("description") || null;

        // DBを更新
        updateVerifySetting(messageId, { keyword, title, description });

        // 更新後の設定を取得
        const updatedSetting = getVerifySetting(messageId);
        if (!updatedSetting) {
            await interaction.reply({
                content: "❌ 設定の更新中にエラーが発生しました。",
                ephemeral: true,
            });
            return;
        }

        // メッセージを更新
        try {
            const message = interaction.message;
            if (message) {
                const embed = buildVerifyEmbed(updatedSetting);
                const components = buildVerifyComponents(messageId, setting.owner_id);
                await message.edit({ embeds: [embed], components });
            }
        } catch (error) {
            console.error("Failed to update message:", error);
        }

        await interaction.reply({
            content: "✅ 認証設定を更新しました。",
            ephemeral: true,
        });
    }
}
