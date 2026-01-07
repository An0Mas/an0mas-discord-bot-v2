import { Client, ModalSubmitInteraction } from "discord.js";
import {
    buildBosyuComponents,
    buildBosyuEmbed,
    createBosyuState,
    parseBosyuModalTarget,
    parseBosyuModalSubmission,
    parseBosyuEmbed,
} from "../commands/bosyu.js";
import {
    buildBosyuBpsrComponents,
    buildBosyuBpsrEmbed,
    createBosyuBpsrState,
    parseBosyuBpsrModalTarget,
    parseBosyuBpsrModalSubmission,
    parseBosyuBpsrEmbed,
} from "../commands/bosyu-bpsr.js";
import {
    parseRemindModalTarget,
    parseRemindModalSubmission,
    calculateNotifyAt,
} from "../commands/remind.js";
import { addReminder } from "../db.js";
import { scheduleReminder } from "../scheduler.js";

/**
 * 通常募集のモーダル送信処理
 * @returns true if handled, false otherwise
 */
export async function handleBosyuModalSubmit(
    interaction: ModalSubmitInteraction,
): Promise<boolean> {
    const customId = interaction.customId;
    const target = parseBosyuModalTarget(customId);

    if (!target) {
        return false;
    }

    if (target.ownerId !== interaction.user.id) {
        await interaction.reply({
            content: "このモーダルはあなた専用です。",
            ephemeral: true,
        });
        return true;
    }

    const parsed = parseBosyuModalSubmission(interaction);
    if (!parsed.ok) {
        await interaction.reply({
            content: parsed.message,
            ephemeral: true,
        });
        return true;
    }

    // 新規作成の場合
    if (target.type === "create") {
        const ownerMention = `<@${target.ownerId}>`;
        const state = createBosyuState({
            ownerId: target.ownerId,
            title: parsed.title,
            body: parsed.body,
            remaining: parsed.slots,
            members: [ownerMention],
            status: "OPEN",
        });

        const embed = buildBosyuEmbed(state);
        const components = buildBosyuComponents(state);
        await interaction.reply({
            embeds: [embed],
            components,
        });
        return true;
    }

    // 編集の場合
    if (!interaction.channel || !interaction.channel.isTextBased()) {
        await interaction.reply({
            content: "編集対象のメッセージを取得できませんでした。",
            ephemeral: true,
        });
        return true;
    }

    const message = await interaction.channel.messages
        .fetch(target.messageId)
        .catch(() => null);
    if (!message) {
        await interaction.reply({
            content: "編集対象のメッセージが見つかりませんでした。",
            ephemeral: true,
        });
        return true;
    }

    const currentEmbed = message.embeds[0];
    const currentState = parseBosyuEmbed(currentEmbed, target.ownerId);
    if (!currentState) {
        await interaction.reply({
            content: "募集データを読み取れませんでした。",
            ephemeral: true,
        });
        return true;
    }

    const nextState = createBosyuState({
        ...currentState,
        title: parsed.title,
        body: parsed.body,
        remaining: parsed.slots,
    });

    const nextEmbed = buildBosyuEmbed(nextState);
    const nextComponents = buildBosyuComponents(nextState);
    await message.edit({
        embeds: [nextEmbed],
        components: nextComponents,
    });
    await interaction.reply({
        content: "募集内容を更新しました。",
        ephemeral: true,
    });
    return true;
}

/**
 * BPSR募集のモーダル送信処理
 * @returns true if handled, false otherwise
 */
export async function handleBosyuBpsrModalSubmit(
    interaction: ModalSubmitInteraction,
): Promise<boolean> {
    const customId = interaction.customId;
    const bpsrTarget = parseBosyuBpsrModalTarget(customId);

    if (!bpsrTarget) {
        return false;
    }

    if (bpsrTarget.ownerId !== interaction.user.id) {
        await interaction.reply({
            content: "このモーダルはあなた専用です。",
            ephemeral: true,
        });
        return true;
    }

    const parsed = parseBosyuBpsrModalSubmission(interaction);
    if (!parsed.ok) {
        await interaction.reply({
            content: parsed.message,
            ephemeral: true,
        });
        return true;
    }

    // 新規作成の場合
    if (bpsrTarget.type === "create") {
        const state = createBosyuBpsrState({
            ownerId: bpsrTarget.ownerId,
            title: parsed.title,
            body: parsed.body,
            remaining: parsed.slots,
            tanks: [],
            attackers: [],
            healers: [],
            status: "OPEN",
        });

        const embed = buildBosyuBpsrEmbed(state);
        const components = buildBosyuBpsrComponents(state);
        await interaction.reply({
            embeds: [embed],
            components,
        });
        return true;
    }

    // 編集の場合
    if (!interaction.channel || !interaction.channel.isTextBased()) {
        await interaction.reply({
            content: "編集対象のメッセージを取得できませんでした。",
            ephemeral: true,
        });
        return true;
    }

    const message = await interaction.channel.messages
        .fetch(bpsrTarget.messageId)
        .catch(() => null);
    if (!message) {
        await interaction.reply({
            content: "編集対象のメッセージが見つかりませんでした。",
            ephemeral: true,
        });
        return true;
    }

    const currentEmbed = message.embeds[0];
    const currentState = parseBosyuBpsrEmbed(currentEmbed, bpsrTarget.ownerId);
    if (!currentState) {
        await interaction.reply({
            content: "募集データを読み取れませんでした。",
            ephemeral: true,
        });
        return true;
    }

    const nextState = createBosyuBpsrState({
        ...currentState,
        title: parsed.title,
        body: parsed.body,
        remaining: parsed.slots,
    });

    const nextEmbed = buildBosyuBpsrEmbed(nextState);
    const nextComponents = buildBosyuBpsrComponents(nextState);
    await message.edit({
        embeds: [nextEmbed],
        components: nextComponents,
    });
    await interaction.reply({
        content: "BPSR募集内容を更新しました。",
        ephemeral: true,
    });
    return true;
}

/**
 * リマインダーのモーダル送信処理
 * @returns true if handled, false otherwise
 */
export async function handleRemindModalSubmit(
    interaction: ModalSubmitInteraction,
    client: Client,
): Promise<boolean> {
    const customId = interaction.customId;
    const target = parseRemindModalTarget(customId);

    if (!target) {
        return false;
    }

    if (target.userId !== interaction.user.id) {
        await interaction.reply({
            content: "このモーダルはあなた専用です。",
            ephemeral: true,
        });
        return true;
    }

    const parsed = parseRemindModalSubmission(interaction);
    if (!parsed.ok) {
        await interaction.reply({
            content: parsed.message,
            ephemeral: true,
        });
        return true;
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
            content: "通知時刻が過去です。未来の時刻を指定してください。",
            ephemeral: true,
        });
        return true;
    }

    // DBに保存
    const reminder = addReminder(interaction.user.id, notifyAt, parsed.content);

    // タイマー設定
    scheduleReminder(client, reminder);

    // 通知時刻を表示用にフォーマット
    const notifyDate = new Date(notifyAt * 1000);
    const timeStr = `${notifyDate.getHours().toString().padStart(2, "0")}:${notifyDate.getMinutes().toString().padStart(2, "0")}`;

    await interaction.reply({
        content: `⏰ リマインダーを登録しました！\n通知時刻: **${timeStr}**\n内容: ${parsed.content}`,
        ephemeral: true,
    });
    return true;
}
