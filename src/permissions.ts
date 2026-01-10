/**
 * 権限チェックモジュール
 * Guild許可チェックとOwnerOnlyチェックを集約
 */

import { Interaction } from 'discord.js';
import { isGuildEnabled } from './db.js';
import { isBotOwner } from './config.js';

// 権限チェック結果の型
export type PermissionResult =
    | { allowed: true }
    | { allowed: false; reason: string };

/**
 * Guild（サーバー）が許可されているかチェック
 * @param interaction Discordのinteraction
 * @returns 許可されていれば { allowed: true }、そうでなければ理由付きで { allowed: false }
 */
export function checkGuildPermission(interaction: Interaction): PermissionResult {
    // DMの場合はスキップ（将来的にはDM許可も設定可能に）
    if (!interaction.guildId) {
        return { allowed: true };
    }

    if (isGuildEnabled(interaction.guildId)) {
        return { allowed: true };
    }

    return {
        allowed: false,
        reason: '🚫 このサーバーではBotの利用が許可されていません。',
    };
}

/**
 * Botオーナー専用コマンドの権限チェック
 * @param userId チェック対象のユーザーID
 * @returns Botオーナーであれば { allowed: true }、そうでなければ理由付きで { allowed: false }
 */
export function checkOwnerOnly(userId: string): PermissionResult {
    if (isBotOwner(userId)) {
        return { allowed: true };
    }
    return {
        allowed: false,
        reason: '🚫 このコマンドはBotオーナー専用です。',
    };
}

/**
 * Guild許可とOwnerOnly両方をチェック（OwnerOnlyコマンド用）
 * @param interaction Discordのinteraction
 * @returns 許可されていれば { allowed: true }、そうでなければ理由付きで { allowed: false }
 */
export function checkOwnerOnlyCommand(interaction: Interaction): PermissionResult {
    // まずGuild許可をチェック
    const guildCheck = checkGuildPermission(interaction);
    if (!guildCheck.allowed) {
        return guildCheck;
    }

    // 次にOwnerOnlyをチェック
    return checkOwnerOnly(interaction.user.id);
}
