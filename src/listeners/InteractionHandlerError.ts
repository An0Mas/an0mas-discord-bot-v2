/**
 * interactionHandlerError リスナー
 * ボタン/モーダル処理中に例外が発生した時にユーザーへエラーメッセージを返す
 */

import { Listener, Events, type InteractionHandlerError } from '@sapphire/framework';
import { MessageFlags, type Interaction } from 'discord.js';
import { notifyErrorToOwner } from '../lib/error-notify.js';

export class InteractionHandlerErrorListener extends Listener<
  typeof Events.InteractionHandlerError
> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.InteractionHandlerError,
    });
  }

  public async run(error: Error, { interaction, handler }: InteractionHandlerError) {
    const errorCode = `IH_${handler.name.toUpperCase()}_ERR`;

    // エラーをログ出力
    this.container.logger.error(`InteractionHandler ${handler.name} でエラーが発生:`, error);

    // オーナーにDM通知
    await notifyErrorToOwner(this.container.client, {
      source: handler.name,
      errorCode,
      interaction,
      error,
    });

    // ユーザーにエラーメッセージを返す
    const message = `⚠️ 操作の処理中にエラーが発生しました。Bot管理者に報告してください。（エラーコード: ${errorCode}）`;

    try {
      if (this.isRepliable(interaction)) {
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
      }
    } catch {
      // 返信自体が失敗した場合はログのみ
      this.container.logger.error('エラー返信に失敗:', error);
    }
  }

  private isRepliable(
    interaction: Interaction,
  ): interaction is Interaction & {
    reply: (...args: unknown[]) => Promise<unknown>;
    editReply: (...args: unknown[]) => Promise<unknown>;
    followUp: (...args: unknown[]) => Promise<unknown>;
    deferred: boolean;
    replied: boolean;
  } {
    return 'reply' in interaction && typeof interaction.reply === 'function';
  }
}
