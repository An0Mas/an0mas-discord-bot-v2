/**
 * /bosyu-bpsr モーダルハンドラ — Sapphire InteractionHandler 形式
 * ロール別人数制限対応（v0.3）
 */

import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ModalSubmitInteraction, MessageFlags } from 'discord.js';
import {
  buildBosyuBpsrComponents,
  buildBosyuBpsrEmbed,
  createBosyuBpsrState,
  parseBosyuBpsrModalTarget,
  parseBosyuBpsrModalSubmission,
  parseBosyuBpsrEmbed,
} from '../lib/bosyu-bpsr-utils.js';

export class BosyuBpsrModalHandler extends InteractionHandler {
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
    // bpsr-modal: または bpsr-edit: で始まるか確認
    if (
      !interaction.customId.startsWith('bpsr-modal:') &&
      !interaction.customId.startsWith('bpsr-edit:')
    ) {
      return this.none();
    }

    const target = parseBosyuBpsrModalTarget(interaction.customId);
    if (!target) {
      return this.none();
    }

    // 操作ユーザー確認
    if (target.ownerId !== interaction.user.id) {
      return this.none();
    }

    return this.some(target);
  }

  public override async run(
    interaction: ModalSubmitInteraction,
    target: InteractionHandler.ParseResult<this>,
  ) {
    const parsed = parseBosyuBpsrModalSubmission(interaction);
    if (!parsed.ok) {
      await interaction.reply({
        content: parsed.message,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 新規作成の場合
    if (target.type === 'create') {
      const state = createBosyuBpsrState({
        ownerId: target.ownerId,
        title: parsed.title,
        body: parsed.body,
        tankSlots: parsed.tankSlots,
        attackerSlots: parsed.attackerSlots,
        healerSlots: parsed.healerSlots,
        tanks: [],
        attackers: [],
        healers: [],
        status: 'OPEN',
      });

      const embed = buildBosyuBpsrEmbed(state);
      const components = buildBosyuBpsrComponents(state);
      await interaction.reply({
        embeds: [embed],
        components,
      });
      return;
    }

    // 編集の場合
    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.reply({
        content: '編集対象のメッセージを取得できませんでした。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const message = await interaction.channel.messages.fetch(target.messageId).catch(() => null);
    if (!message) {
      await interaction.reply({
        content: '編集対象のメッセージが見つかりませんでした。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const currentEmbed = message.embeds[0];
    const currentState = parseBosyuBpsrEmbed(currentEmbed, target.ownerId);
    if (!currentState) {
      await interaction.reply({
        content: '募集データを読み取れませんでした。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const nextState = createBosyuBpsrState({
      ...currentState,
      title: parsed.title,
      body: parsed.body,
      tankSlots: parsed.tankSlots,
      attackerSlots: parsed.attackerSlots,
      healerSlots: parsed.healerSlots,
    });

    const nextEmbed = buildBosyuBpsrEmbed(nextState);
    const nextComponents = buildBosyuBpsrComponents(nextState);
    await message.edit({
      embeds: [nextEmbed],
      components: nextComponents,
    });
    await interaction.reply({
      content: 'BPSR募集内容を更新しました。',
      flags: MessageFlags.Ephemeral,
    });
  }
}
