/**
 * /help ボタンハンドラ — Sapphire InteractionHandler 形式
 */

import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import {
    loadHelpEntries,
    getHelpPageCount,
    getHelpPageEntries,
    getHelpEntryByIndex,
    buildHelpList,
    buildHelpDetail,
    parseHelpCustomId,
    type HelpEntry,
} from "../lib/help-utils.js";

// キャッシュ
let helpEntriesCache: HelpEntry[] | null = null;

function getHelpEntries(): HelpEntry[] {
    if (!helpEntriesCache) {
        helpEntriesCache = loadHelpEntries();
    }
    return helpEntriesCache;
}

export class HelpButtonHandler extends InteractionHandler {
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
        // help: プレフィックスでないボタンは無視
        if (!interaction.customId.startsWith("help:")) {
            return this.none();
        }

        const parsed = parseHelpCustomId(interaction.customId);
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
        const entries = getHelpEntries();
        const totalPages = getHelpPageCount(entries.length);

        if (parsed.type === "list") {
            // ページ移動
            const page = Math.max(1, Math.min(parsed.page, totalPages));
            const pageEntries = getHelpPageEntries(entries, page);
            const { embed, components } = buildHelpList({
                entries: pageEntries,
                page,
                totalPages,
                userId: parsed.userId,
            });

            await interaction.update({
                embeds: [embed],
                components,
            });
            return;
        }

        if (parsed.type === "detail") {
            // 詳細表示
            const entry = getHelpEntryByIndex(entries, parsed.index);
            if (!entry) {
                await interaction.update({
                    content: "指定されたコマンドが見つかりません。",
                    embeds: [],
                    components: [],
                });
                return;
            }

            const { embed, components } = buildHelpDetail({
                entry,
                page: parsed.page,
                userId: parsed.userId,
            });

            await interaction.update({
                embeds: [embed],
                components,
            });
            return;
        }

        if (parsed.type === "back") {
            // 一覧に戻る
            const page = Math.max(1, Math.min(parsed.page, totalPages));
            const pageEntries = getHelpPageEntries(entries, page);
            const { embed, components } = buildHelpList({
                entries: pageEntries,
                page,
                totalPages,
                userId: parsed.userId,
            });

            await interaction.update({
                embeds: [embed],
                components,
            });
            return;
        }
    }
}
