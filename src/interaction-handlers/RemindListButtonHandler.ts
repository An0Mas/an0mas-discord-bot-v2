/**
 * /remind-list ボタンハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction, MessageFlags } from "discord.js";
import {
    parseRemindListCustomId,
    buildRemindListEmbed,
} from "../lib/remind-utils.js";
import { deleteReminderForUser, getRemindersForUser } from "../db.js";
import { cancelReminderTimer } from "../scheduler.js";

export class RemindListButtonHandler extends InteractionHandler {
    public constructor(
        context: InteractionHandler.LoaderContext,
        options: InteractionHandler.Options
    ) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        if (!interaction.customId.startsWith("remind:delete:")) {
            return this.none();
        }

        const parsed = parseRemindListCustomId(interaction.customId);
        if (!parsed) {
            return this.none();
        }

        // 操作ユーザー確認
        if (parsed.userId !== interaction.user.id) {
            return this.none();
        }

        return this.some(parsed);
    }

    public override async run(
        interaction: ButtonInteraction,
        parsed: InteractionHandler.ParseResult<this>
    ) {
        // タイマーをキャンセル
        cancelReminderTimer(parsed.reminderId);

        // DBから削除
        const deleted = deleteReminderForUser(parsed.userId, parsed.reminderId);
        if (!deleted) {
            await interaction.reply({
                content: "リマインダーが見つかりませんでした。",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // 更新された一覧を表示
        const reminders = getRemindersForUser(parsed.userId);
        const { embed, components } = buildRemindListEmbed(reminders, parsed.userId);
        await interaction.update({
            embeds: [embed],
            components,
        });
    }
}
