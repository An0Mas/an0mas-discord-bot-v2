import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import { Reminder } from "../db.js";

// 全角→半角変換
function toHalfWidth(str: string): string {
    return str
        .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
        .replace(/：/g, ":");
}

// 時刻パース（HH:MM または HHMM 形式）
export function parseTime(input: string): { hours: number; minutes: number } | null {
    const normalized = toHalfWidth(input.trim());

    // HH:MM 形式
    let match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return { hours, minutes };
        }
        return null;
    }

    // HHMM 形式（コロンなし、3〜4桁）
    match = normalized.match(/^(\d{1,2})(\d{2})$/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return { hours, minutes };
        }
    }

    return null;
}

// 何分前パース
export function parseMinutesBefore(input: string): number | null {
    if (!input.trim()) return 0;

    const normalized = toHalfWidth(input.trim());
    const num = parseInt(normalized, 10);

    if (isNaN(num) || num < 0) return null;
    return num;
}

// 通知時刻を計算（Unix timestamp）
export function calculateNotifyAt(hours: number, minutes: number, minutesBefore: number): number {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    target.setMinutes(target.getMinutes() - minutesBefore);
    return Math.floor(target.getTime() / 1000);
}

// リマインダー作成モーダルを生成
export function buildRemindModal(userId: string): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(`remind:create:${userId}`)
        .setTitle("リマインダー登録");

    const timeInput = new TextInputBuilder()
        .setCustomId("time")
        .setLabel("通知時間（例: 1400、コロン省略可）")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("1400")
        .setRequired(true)
        .setMaxLength(10);

    const minutesBeforeInput = new TextInputBuilder()
        .setCustomId("minutes_before")
        .setLabel("何分前に通知（未入力で0＝ちょうど通知）")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("5")
        .setRequired(false)
        .setMaxLength(5);

    const contentInput = new TextInputBuilder()
        .setCustomId("content")
        .setLabel("通知内容")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("会議開始です！")
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(minutesBeforeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
    );

    return modal;
}

// モーダルのcustomIdをパース
export function parseRemindModalTarget(customId: string): { userId: string } | null {
    const match = customId.match(/^remind:create:(\d+)$/);
    if (!match) return null;
    return { userId: match[1] };
}

// モーダル入力をパース
export function parseRemindModalSubmission(interaction: ModalSubmitInteraction):
    | { ok: true; time: { hours: number; minutes: number }; minutesBefore: number; content: string }
    | { ok: false; message: string } {

    const timeInput = interaction.fields.getTextInputValue("time");
    const minutesBeforeInput = interaction.fields.getTextInputValue("minutes_before");
    const contentInput = interaction.fields.getTextInputValue("content");

    const time = parseTime(timeInput);
    if (!time) {
        return { ok: false, message: "時刻は 1400 または 14:00 形式で入力してください" };
    }

    const minutesBefore = parseMinutesBefore(minutesBeforeInput);
    if (minutesBefore === null) {
        return { ok: false, message: "「何分前」は0以上の数値で入力してください。" };
    }

    const content = contentInput.trim();
    if (!content) {
        return { ok: false, message: "通知内容を入力してください。" };
    }

    return { ok: true, time, minutesBefore, content };
}

// リマインダー一覧Embedを生成
export function buildRemindListEmbed(reminders: Reminder[], userId: string): {
    embed: EmbedBuilder;
    components: ActionRowBuilder<ButtonBuilder>[];
} {
    if (reminders.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("📋 リマインダー一覧")
            .setDescription("リマインダーはありません。")
            .setColor(0x5865f2);
        return { embed, components: [] };
    }

    const lines = reminders.map((r, i) => {
        const date = new Date(r.notify_at * 1000);
        const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
        const contentPreview = r.content.length > 30 ? r.content.slice(0, 30) + "..." : r.content;
        return `${i + 1}. ${timeStr} - ${contentPreview}`;
    });

    const embed = new EmbedBuilder()
        .setTitle("📋 リマインダー一覧")
        .setDescription(lines.join("\n"))
        .setColor(0x5865f2)
        .setFooter({ text: "番号ボタンを押すと削除できます" });

    // 番号ボタンを生成（最大5個ずつ、最大2行）
    const buttons = reminders.slice(0, 10).map((r, i) =>
        new ButtonBuilder()
            .setCustomId(`remind:delete:${userId}:${r.id}`)
            .setLabel(String(i + 1))
            .setStyle(ButtonStyle.Secondary)
    );

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
    }

    return { embed, components: rows };
}

// ボタンのcustomIdをパース
export function parseRemindListCustomId(customId: string): { userId: string; reminderId: number } | null {
    const match = customId.match(/^remind:delete:(\d+):(\d+)$/);
    if (!match) return null;
    return { userId: match[1], reminderId: parseInt(match[2], 10) };
}

// 通知メッセージを生成
export function buildRemindNotification(reminder: Reminder): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("⏰ リマインダー")
        .setDescription(reminder.content)
        .setColor(0x57f287)
        .setTimestamp();
}
