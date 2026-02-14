/**
 * エラー通知ユーティリティ
 * エラー発生時にオーナーへDMで詳細情報を送信
 */

import { Client, type Interaction } from 'discord.js';
import { getOwnerId } from '../config.js';

export type ErrorContext = {
  source: string; // コマンド名 / ハンドラ名
  errorCode: string; // エラーコード
  interaction?: Interaction; // インタラクション（あれば）
  error: Error; // エラーオブジェクト
};

/**
 * オーナーにエラー詳細をDMで送信
 */
export async function notifyErrorToOwner(client: Client, context: ErrorContext): Promise<void> {
  try {
    const ownerId = getOwnerId();
    if (!ownerId) return;

    const owner = await client.users.fetch(ownerId);
    if (!owner) return;

    const message = buildErrorMessage(context);

    // 2000文字制限対策（分割送信）
    if (message.length > 1900) {
      const parts = splitMessage(message, 1900);
      for (const part of parts) {
        await owner.send(part);
      }
    } else {
      await owner.send(message);
    }
  } catch (err) {
    // DM送信自体が失敗しても何もしない（無限ループ防止）
    console.error('エラーDM送信に失敗:', err);
  }
}

/**
 * エラーメッセージを構築
 */
function buildErrorMessage(context: ErrorContext): string {
  const { source, errorCode, interaction, error } = context;
  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  let message = `⚠️ **エラー発生**\n\n`;

  // 発生場所
  message += `📍 **発生場所**\n`;
  message += `- ソース: \`${source}\`\n`;
  message += `- エラーコード: \`${errorCode}\`\n\n`;

  // コンテキスト
  message += `👤 **コンテキスト**\n`;
  if (interaction) {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const user = interaction.user;

    message += `- サーバー: ${guild?.name ?? 'DM'} (${interaction.guildId ?? 'N/A'})\n`;
    message += `- チャンネル: ${channel && 'name' in channel ? `#${channel.name}` : 'N/A'} (${interaction.channelId})\n`;
    message += `- ユーザー: ${user.username} (${user.id})\n`;
  } else {
    message += `- コンテキスト情報なし\n`;
  }
  message += `- 時刻: ${now}\n\n`;

  // エラー詳細
  message += `❌ **エラー内容**\n`;
  message += `\`\`\`\n`;
  message += `${error.name}: ${error.message}\n`;

  // スタックトレース（先頭10行）
  if (error.stack) {
    const stackLines = error.stack.split('\n').slice(1, 11);
    message += stackLines.join('\n');
  }
  message += `\n\`\`\``;

  return message;
}

/**
 * メッセージを指定文字数で分割
 */
function splitMessage(text: string, maxLength: number): string[] {
  const parts: string[] = [];
  let current = text;

  while (current.length > maxLength) {
    let splitIndex = current.lastIndexOf('\n', maxLength);
    if (splitIndex === -1) splitIndex = maxLength;

    parts.push(current.substring(0, splitIndex));
    current = current.substring(splitIndex);
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}
