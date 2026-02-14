/**
 * /remind モーダルハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ModalSubmitInteraction, MessageFlags } from 'discord.js';
import {
  parseRemindModalTarget,
  parseRemindModalSubmission,
  calculateNotifyAt,
} from '../lib/remind-utils.js';
import { addReminder } from '../db.js';
import { scheduleReminder } from '../scheduler.js';

export class RemindModalHandler extends InteractionHandler {
  public constructor(
    context: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(context, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith('remind:create:')) {
      return this.none();
    }

    const target = parseRemindModalTarget(interaction.customId);
    if (!target) {
      return this.none();
    }

    // 操作ユーザー確認
    if (target.userId !== interaction.user.id) {
      return this.none();
    }

    return this.some(target);
  }

  public override async run(
    interaction: ModalSubmitInteraction,
    _target: InteractionHandler.ParseResult<this>,
  ) {
    const parsed = parseRemindModalSubmission(interaction);
    if (!parsed.ok) {
      await interaction.reply({
        content: parsed.message,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 通知時刻を計算
    const notifyAt = calculateNotifyAt(
      parsed.time.hours,
      parsed.time.minutes,
      parsed.minutesBefore,
    );

    // 過去の時刻チェック
    const now = Math.floor(Date.now() / 1000);
    if (notifyAt <= now) {
      await interaction.reply({
        content: '通知時刻が過去です。未来の時刻を指定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // DBに保存
    const reminder = addReminder(interaction.user.id, notifyAt, parsed.content);

    // タイマー設定（clientはcontainerから取得）
    scheduleReminder(this.container.client, reminder);

    // 通知時刻を表示用にフォーマット
    const notifyDate = new Date(notifyAt * 1000);
    const timeStr = `${notifyDate.getHours().toString().padStart(2, '0')}:${notifyDate.getMinutes().toString().padStart(2, '0')}`;

    await interaction.reply({
      content: `⏰ リマインダーを登録しました！\n通知時刻: **${timeStr}**\n内容: ${parsed.content}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
