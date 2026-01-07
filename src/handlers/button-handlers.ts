import { ButtonInteraction } from "discord.js";
import {
    buildHelpDetail,
    buildHelpList,
    getHelpEntryByIndex,
    getHelpPageCount,
    getHelpPageEntries,
    parseHelpCustomId,
    HelpEntry,
} from "../commands/help.js";
import {
    applyBosyuAction,
    buildBosyuEditModal,
    buildBosyuComponents,
    buildBosyuEmbed,
    parseBosyuCustomId,
    parseBosyuEmbed,
} from "../commands/bosyu.js";
import {
    applyBosyuBpsrAction,
    buildBosyuBpsrEditModal,
    buildBosyuBpsrComponents,
    buildBosyuBpsrEmbed,
    parseBosyuBpsrCustomId,
    parseBosyuBpsrEmbed,
} from "../commands/bosyu-bpsr.js";
import {
    parseRemindListCustomId,
    buildRemindListEmbed,
} from "../commands/remind.js";
import { deleteReminderForUser, getRemindersForUser } from "../db.js";
import { cancelReminderTimer } from "../scheduler.js";

/**
 * Helpボタンの処理
 */
export async function handleHelpButton(
    interaction: ButtonInteraction,
    customId: string,
    helpEntries: HelpEntry[],
) {
    const totalEntries = helpEntries.length;
    const parsed = parseHelpCustomId(customId);
    if (!parsed) {
        await interaction.deferUpdate();
        return;
    }

    if (interaction.user.id !== parsed.userId) {
        await interaction.deferUpdate();
        return;
    }

    const totalPages = getHelpPageCount(totalEntries);
    if (parsed.type === "list") {
        const page = Math.min(Math.max(parsed.page, 1), totalPages);
        const pageEntries = getHelpPageEntries(helpEntries, page);
        const { embed, components } = buildHelpList({
            entries: pageEntries,
            page,
            totalPages,
            userId: parsed.userId,
        });
        await interaction.update({ embeds: [embed], components });
        return;
    }

    if (parsed.type === "detail") {
        const entry = getHelpEntryByIndex(helpEntries, parsed.index);
        if (!entry) {
            await interaction.deferUpdate();
            return;
        }
        const { embed, components } = buildHelpDetail({
            entry,
            page: parsed.page,
            userId: parsed.userId,
        });
        await interaction.update({ embeds: [embed], components });
        return;
    }

    if (parsed.type === "back") {
        const page = Math.min(Math.max(parsed.page, 1), totalPages);
        const pageEntries = getHelpPageEntries(helpEntries, page);
        const { embed, components } = buildHelpList({
            entries: pageEntries,
            page,
            totalPages,
            userId: parsed.userId,
        });
        await interaction.update({ embeds: [embed], components });
    }
}

/**
 * 通常募集ボタンの処理
 */
export async function handleBosyuButton(
    interaction: ButtonInteraction,
    customId: string,
) {
    const parsed = parseBosyuCustomId(customId);
    if (!parsed) {
        await interaction.deferUpdate();
        return;
    }

    const embed = interaction.message.embeds[0];
    const state = parseBosyuEmbed(embed, parsed.ownerId);
    if (!state) {
        await interaction.deferUpdate();
        return;
    }

    if (parsed.action === "edit") {
        if (interaction.user.id !== parsed.ownerId) {
            await interaction.deferUpdate();
            return;
        }
        await interaction.showModal(buildBosyuEditModal(state, interaction.message.id));
        return;
    }

    const updated = applyBosyuAction({
        state,
        action: parsed.action,
        actorId: interaction.user.id,
    });

    if (!updated) {
        await interaction.deferUpdate();
        return;
    }

    const nextEmbed = buildBosyuEmbed(updated);
    const nextComponents = buildBosyuComponents(updated);
    await interaction.update({
        embeds: [nextEmbed],
        components: nextComponents,
    });
}

/**
 * BPSR募集ボタンの処理
 */
export async function handleBosyuBpsrButton(
    interaction: ButtonInteraction,
    customId: string,
) {
    const parsed = parseBosyuBpsrCustomId(customId);
    if (!parsed) {
        await interaction.deferUpdate();
        return;
    }

    const embed = interaction.message.embeds[0];
    const state = parseBosyuBpsrEmbed(embed, parsed.ownerId);
    if (!state) {
        await interaction.deferUpdate();
        return;
    }

    if (parsed.action === "edit") {
        if (interaction.user.id !== parsed.ownerId) {
            await interaction.deferUpdate();
            return;
        }
        await interaction.showModal(buildBosyuBpsrEditModal(state, interaction.message.id));
        return;
    }

    const updated = applyBosyuBpsrAction({
        state,
        action: parsed.action,
        actorId: interaction.user.id,
    });

    if (!updated) {
        await interaction.deferUpdate();
        return;
    }

    const nextEmbed = buildBosyuBpsrEmbed(updated);
    const nextComponents = buildBosyuBpsrComponents(updated);
    await interaction.update({
        embeds: [nextEmbed],
        components: nextComponents,
    });
}

/**
 * リマインダー削除ボタンの処理
 */
export async function handleRemindListButton(
    interaction: ButtonInteraction,
    customId: string,
) {
    const parsed = parseRemindListCustomId(customId);
    if (!parsed) {
        await interaction.deferUpdate();
        return;
    }

    if (interaction.user.id !== parsed.userId) {
        await interaction.deferUpdate();
        return;
    }

    // タイマーをキャンセル
    cancelReminderTimer(parsed.reminderId);

    // DBから削除
    const deleted = deleteReminderForUser(parsed.userId, parsed.reminderId);
    if (!deleted) {
        await interaction.reply({
            content: "リマインダーが見つかりませんでした。",
            ephemeral: true,
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
