/**
 * 権限チェックユーティリティ
 * Guild許可、オーナーチェック、ユーザー/ロール権限を統合管理
 */

import { Interaction } from "discord.js";
import { isGuildEnabled, getAllowedUsers, getAllowedRoles } from "../db.js";
import { isBotOwner } from "../config.js";

// ========================
// 型定義
// ========================

/**
 * 権限チェック結果の型
 */
export type PermissionResult =
    | { allowed: true }
    | { allowed: false; reason: string };

// ========================
// Guild・オーナーチェック
// ========================

/**
 * Guild（サーバー）が許可されているかチェック
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
        reason: "🚫 このサーバーではBotが有効化されていません。管理者に `/allow guild add` を依頼してください。",
    };
}

/**
 * Botオーナー専用コマンドの権限チェック
 */
export function checkOwnerOnly(userId: string): PermissionResult {
    if (isBotOwner(userId)) {
        return { allowed: true };
    }
    return {
        allowed: false,
        reason: "🚫 このコマンドはBotオーナー専用です。",
    };
}

/**
 * Guild許可とOwnerOnly両方をチェック（OwnerOnlyコマンド用）
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

// ========================
// ユーザー/ロール権限チェック
// ========================

/**
 * ユーザーが特定コマンドの実行権限を持っているかチェック
 */
export function isUserAllowedForCommand(
    guildId: string,
    command: string,
    userId: string,
    userRoleIds: string[]
): boolean {
    const allowedUsers = getAllowedUsers(guildId, command);
    if (allowedUsers.includes(userId)) {
        return true;
    }

    const allowedRoles = getAllowedRoles(guildId, command);
    for (const roleId of userRoleIds) {
        if (allowedRoles.includes(roleId)) {
            return true;
        }
    }

    return false;
}

/**
 * 許可設定が存在するかチェック（空の場合はEveryoneとして扱う）
 */
export function hasAnyPermissionSettings(guildId: string, command: string): boolean {
    const allowedUsers = getAllowedUsers(guildId, command);
    const allowedRoles = getAllowedRoles(guildId, command);
    return allowedUsers.length > 0 || allowedRoles.length > 0;
}
