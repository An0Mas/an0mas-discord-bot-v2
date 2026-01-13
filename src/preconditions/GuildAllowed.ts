/**
 * GuildAllowed Precondition — サーバー許可チェック
 * allowコマンドとconfigコマンド以外のすべてのコマンドに適用
 */

import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { checkGuildPermission } from "../lib/permission-utils.js";

export class GuildAllowedPrecondition extends Precondition {
    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const guildCheck = checkGuildPermission(interaction);

        if (!guildCheck.allowed) {
            return this.error({ message: guildCheck.reason });
        }

        return this.ok();
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        GuildAllowed: never;
    }
}
