/**
 * chatInputCommandDenied リスナー
 * Preconditionが失敗した時にユーザーへエラーメッセージを返す
 */

import { Listener, Events, type ChatInputCommandDeniedPayload, type UserError } from "@sapphire/framework";
import { MessageFlags } from "discord.js";

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: Events.ChatInputCommandDenied,
        });
    }

    public async run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
        // エラーメッセージをephemeralで返す
        const message = error.message || "⚠️ 内部エラーが発生しました。Bot管理者に報告してください。（エラーコード: PRECOND_UNKNOWN）";

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: message });
        } else {
            await interaction.reply({
                content: message,
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
