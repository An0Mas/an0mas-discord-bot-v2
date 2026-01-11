/**
 * 認証システム用ユーティリティ
 */

import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import type { VerifySetting } from "../db.js";

// 認証ボタン用Embedを構築
export function buildVerifyEmbed(setting: VerifySetting): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle(setting.title ?? "🔐 認証")
        .setColor(0x5865F2); // Discord Blurple

    if (setting.description) {
        embed.setDescription(setting.description);
    } else {
        embed.setDescription("下のボタンを押して合言葉を入力してください。");
    }

    return embed;
}

// 認証ボタンコンポーネントを構築（編集・削除ボタン付き）
export function buildVerifyComponents(messageId: string, ownerId: string): ActionRowBuilder<ButtonBuilder>[] {
    // メイン行: 認証ボタン
    const mainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`verify-btn:${messageId}:${ownerId}`)
            .setLabel("✅ 認証する")
            .setStyle(ButtonStyle.Primary)
    );

    // 管理行: 編集・削除ボタン
    const adminRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`verify-edit:${messageId}:${ownerId}`)
            .setLabel("⚙️ 編集")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`verify-delete:${messageId}:${ownerId}`)
            .setLabel("🗑️ 削除")
            .setStyle(ButtonStyle.Danger)
    );

    return [mainRow, adminRow];
}

// 認証モーダルを構築
export function buildVerifyModal(messageId: string): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(`verify-modal:${messageId}`)
        .setTitle("認証");

    const keywordInput = new TextInputBuilder()
        .setCustomId("keyword")
        .setLabel("合言葉を入力してください")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(keywordInput);
    modal.addComponents(row);

    return modal;
}

// 編集モーダルを構築
export function buildVerifyEditModal(messageId: string, setting: VerifySetting): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(`verify-edit-modal:${messageId}`)
        .setTitle("認証設定の編集");

    const keywordInput = new TextInputBuilder()
        .setCustomId("keyword")
        .setLabel("合言葉")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100)
        .setValue(setting.keyword);

    const titleInput = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("タイトル（空白でデフォルト）")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(100)
        .setValue(setting.title ?? "");

    const descInput = new TextInputBuilder()
        .setCustomId("description")
        .setLabel("説明文（空白でデフォルト）")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500)
        .setValue(setting.description ?? "");

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(keywordInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descInput)
    );

    return modal;
}

// 全角を半角に正規化する
function normalizeToHalfWidth(str: string): string {
    return str
        // 全角英数字を半角に
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        // 全角スペースを半角に
        .replace(/　/g, " ")
        // 全角記号を半角に（よく使うもの）
        .replace(/！/g, "!")
        .replace(/？/g, "?")
        .replace(/＠/g, "@")
        .replace(/＃/g, "#");
}

// 合言葉を照合（大文字小文字区別なし、全角半角区別なし）
export function verifyKeyword(input: string, expected: string): boolean {
    const normalizedInput = normalizeToHalfWidth(input.toLowerCase().trim());
    const normalizedExpected = normalizeToHalfWidth(expected.toLowerCase().trim());
    return normalizedInput === normalizedExpected;
}

// ボタンカスタムIDをパース（認証ボタン）
export function parseVerifyButtonId(customId: string): { messageId: string; ownerId: string } | null {
    if (!customId.startsWith("verify-btn:")) {
        return null;
    }
    const parts = customId.slice("verify-btn:".length).split(":");
    if (parts.length < 2) {
        return null;
    }
    return { messageId: parts[0], ownerId: parts[1] };
}

// 編集ボタンカスタムIDをパース
export function parseVerifyEditButtonId(customId: string): { messageId: string; ownerId: string } | null {
    if (!customId.startsWith("verify-edit:")) {
        return null;
    }
    const parts = customId.slice("verify-edit:".length).split(":");
    if (parts.length < 2) {
        return null;
    }
    return { messageId: parts[0], ownerId: parts[1] };
}

// 削除ボタンカスタムIDをパース
export function parseVerifyDeleteButtonId(customId: string): { messageId: string; ownerId: string } | null {
    if (!customId.startsWith("verify-delete:")) {
        return null;
    }
    const parts = customId.slice("verify-delete:".length).split(":");
    if (parts.length < 2) {
        return null;
    }
    return { messageId: parts[0], ownerId: parts[1] };
}

// 編集モーダルカスタムIDをパース
export function parseVerifyEditModalId(customId: string): { messageId: string } | null {
    if (!customId.startsWith("verify-edit-modal:")) {
        return null;
    }
    const messageId = customId.slice("verify-edit-modal:".length);
    if (!messageId) {
        return null;
    }
    return { messageId };
}

// モーダルカスタムIDをパース
export function parseVerifyModalId(customId: string): { messageId: string } | null {
    if (!customId.startsWith("verify-modal:")) {
        return null;
    }
    const messageId = customId.slice("verify-modal:".length);
    if (!messageId) {
        return null;
    }
    return { messageId };
}
