/**
 * 設定モジュール
 * 環境変数から読み込んだBot設定を管理
 */

/**
 * BotオーナーのDiscord User IDを取得
 * dotenv.config()が先に実行されるよう、関数経由で遅延取得
 */
export function getOwnerId(): string {
    return process.env.OWNER_ID || '';
}

/**
 * 指定されたユーザーがBotオーナーかどうかを判定
 * @param userId 判定対象のDiscord User ID
 * @returns Botオーナーであれば true
 */
export function isBotOwner(userId: string): boolean {
    const ownerId = getOwnerId();
    if (!ownerId) {
        // OWNER_IDが未設定の場合は誰もオーナーとして認識しない
        return false;
    }
    return userId === ownerId;
}
