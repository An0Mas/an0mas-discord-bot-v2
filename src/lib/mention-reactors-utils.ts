/**
 * mention-reactors ユーティリティ
 * リアクションを押した人へのメンション機能
 */

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type Message,
    type MessageReaction,
    type User,
} from "discord.js";

// カスタムIDプレフィックス
export const MENTION_REACTORS_PREFIX = "mention-reactors";

/**
 * リアクション情報
 */
export type ReactionInfo = {
    emoji: string;       // 絵文字（表示用）
    emojiId: string;     // 絵文字ID（customIdに埋め込む用）
    count: number;       // リアクション数
    isCustom: boolean;   // カスタム絵文字かどうか
};

/**
 * メッセージからリアクション情報を取得
 */
export function getReactionInfoList(message: Message): ReactionInfo[] {
    const reactions: ReactionInfo[] = [];

    message.reactions.cache.forEach((reaction: MessageReaction) => {
        const emoji = reaction.emoji;
        const isCustom = emoji.id !== null;

        reactions.push({
            emoji: emoji.toString(),
            emojiId: isCustom ? emoji.id! : emoji.name!,
            count: reaction.count,
            isCustom,
        });
    });

    return reactions;
}

/**
 * リアクション選択ボタンを構築
 */
export function buildReactionButtons(
    reactions: ReactionInfo[],
    messageId: string
): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();
    let buttonCount = 0;

    // 各リアクションのボタン
    for (const reaction of reactions) {
        if (buttonCount >= 4) {
            // 4つでボタンを切り、「全員」用に1つ残す
            rows.push(currentRow);
            currentRow = new ActionRowBuilder<ButtonBuilder>();
            buttonCount = 0;
        }

        const customId = buildCustomId(messageId, reaction.emojiId, reaction.isCustom);

        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`${reaction.emoji} ${reaction.count}人`)
                .setStyle(ButtonStyle.Secondary)
        );
        buttonCount++;
    }

    // 「全員」ボタンを追加
    const allCustomId = buildCustomId(messageId, "all", false);
    currentRow.addComponents(
        new ButtonBuilder()
            .setCustomId(allCustomId)
            .setLabel("📋 全員")
            .setStyle(ButtonStyle.Primary)
    );

    rows.push(currentRow);
    return rows;
}

/**
 * customIdを構築
 * 形式: mention-reactors:<messageId>:<emojiId>:<isCustom>
 */
export function buildCustomId(
    messageId: string,
    emojiId: string,
    isCustom: boolean
): string {
    return `${MENTION_REACTORS_PREFIX}:${messageId}:${emojiId}:${isCustom ? "1" : "0"}`;
}

/**
 * customIdをパース
 */
export function parseCustomId(customId: string): {
    messageId: string;
    emojiId: string;
    isCustom: boolean;
    isAll: boolean;
} | null {
    if (!customId.startsWith(MENTION_REACTORS_PREFIX + ":")) {
        return null;
    }

    const parts = customId.split(":");
    if (parts.length !== 4) {
        return null;
    }

    const [, messageId, emojiId, isCustomFlag] = parts;
    return {
        messageId,
        emojiId,
        isCustom: isCustomFlag === "1",
        isAll: emojiId === "all",
    };
}

/**
 * customIdがmention-reactors用かチェック
 */
export function isMentionReactorsCustomId(customId: string): boolean {
    return customId.startsWith(MENTION_REACTORS_PREFIX + ":");
}

/**
 * リアクションを押したユーザー一覧を取得
 */
export async function fetchReactionUsers(
    message: Message,
    emojiId: string,
    isCustom: boolean
): Promise<User[]> {
    // 絵文字を検索
    const reaction = message.reactions.cache.find((r) => {
        if (isCustom) {
            return r.emoji.id === emojiId;
        }
        return r.emoji.name === emojiId;
    });

    if (!reaction) {
        return [];
    }

    // ユーザー一覧を取得（最大100人）
    const users = await reaction.users.fetch({ limit: 100 });
    return [...users.values()];
}

/**
 * 全リアクションを押したユーザー一覧を取得（重複排除）
 */
export async function fetchAllReactionUsers(message: Message): Promise<User[]> {
    const userSet = new Map<string, User>();

    for (const [, reaction] of message.reactions.cache) {
        const users = await reaction.users.fetch({ limit: 100 });
        users.forEach((user) => {
            if (!userSet.has(user.id)) {
                userSet.set(user.id, user);
            }
        });
    }

    return [...userSet.values()];
}

/**
 * メンション文字列を構築（2000文字制限対策で分割）
 */
export function buildMentionMessages(users: User[], maxLength: number = 1900): string[] {
    if (users.length === 0) {
        return ["リアクションを押したユーザーがいません。"];
    }

    const messages: string[] = [];
    let current = "";

    for (const user of users) {
        const mention = `<@${user.id}> `;

        if (current.length + mention.length > maxLength) {
            messages.push(current.trim());
            current = "";
        }

        current += mention;
    }

    if (current.trim().length > 0) {
        messages.push(current.trim());
    }

    return messages;
}
