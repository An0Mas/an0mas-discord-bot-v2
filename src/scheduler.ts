import { Client } from "discord.js";
import { getAllReminders, deleteReminder, Reminder } from "./db.js";
import { buildRemindNotification } from "./lib/remind-utils.js";

// アクティブなタイマーを管理
const activeTimers = new Map<number, NodeJS.Timeout>();

// リマインダーの通知を実行
async function executeReminder(client: Client, reminder: Reminder) {
    try {
        const user = await client.users.fetch(reminder.user_id);
        const embed = buildRemindNotification(reminder);
        await user.send({ embeds: [embed] });
        console.log(`[Scheduler] リマインダー送信成功: ID=${reminder.id}, User=${reminder.user_id}`);
    } catch (error) {
        console.error(`[Scheduler] リマインダー送信失敗: ID=${reminder.id}`, error);
    } finally {
        // DBから削除
        deleteReminder(reminder.id);
        activeTimers.delete(reminder.id);
    }
}

// 単一リマインダーのタイマーを設定
export function scheduleReminder(client: Client, reminder: Reminder) {
    const now = Math.floor(Date.now() / 1000);
    const delay = (reminder.notify_at - now) * 1000;

    if (delay <= 0) {
        // 既に過ぎている場合は即座に実行
        executeReminder(client, reminder);
        return;
    }

    // タイマーを設定
    const timer = setTimeout(() => {
        executeReminder(client, reminder);
    }, delay);

    activeTimers.set(reminder.id, timer);
    console.log(`[Scheduler] タイマー設定: ID=${reminder.id}, ${Math.floor(delay / 1000)}秒後`);
}

// 全リマインダーを読み込んでタイマー設定
export function initializeScheduler(client: Client) {
    const reminders = getAllReminders();
    console.log(`[Scheduler] ${reminders.length}件のリマインダーを読み込み`);

    for (const reminder of reminders) {
        scheduleReminder(client, reminder);
    }
}

// タイマーをキャンセル
export function cancelReminderTimer(reminderId: number) {
    const timer = activeTimers.get(reminderId);
    if (timer) {
        clearTimeout(timer);
        activeTimers.delete(reminderId);
        console.log(`[Scheduler] タイマーキャンセル: ID=${reminderId}`);
    }
}
