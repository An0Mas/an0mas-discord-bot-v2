/**
 * chatInputCommandError リスナー
 * コマンド実行中に例外が発生した時にユーザーへエラーメッセージを返す
 */

import { Listener, Events, type ChatInputCommandErrorPayload } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { notifyErrorToOwner } from '../lib/error-notify.js';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ChatInputCommandError,
    });
  }

  public async run(error: Error, { interaction, command }: ChatInputCommandErrorPayload) {
    const errorCode = `CMD_${command.name.toUpperCase()}_ERR`;

    // エラーをログ出力
    this.container.logger.error(`コマンド ${command.name} でエラーが発生:`, error);

    // オーナーにDM通知
    await notifyErrorToOwner(this.container.client, {
      source: `/${command.name}`,
      errorCode,
      interaction,
      error,
    });

    // ユーザーにエラーメッセージを返す
    const message = `⚠️ コマンドの実行中にエラーが発生しました。Bot管理者に報告してください。（エラーコード: ${errorCode}）`;

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch {
      // 返信自体が失敗した場合はログのみ
      this.container.logger.error('エラー返信に失敗:', error);
    }
  }
}
