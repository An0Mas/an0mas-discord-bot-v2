import { ChatInputCommandInteraction } from "discord.js";
import {
    buildHelpList,
    getHelpPageCount,
    getHelpPageEntries,
    HelpEntry,
} from "../commands/help.js";
import {
    buildBosyuModal,
    buildBosyuComponents,
    buildBosyuEmbed,
    createBosyuState,
    decideBosyuCommandInput,
} from "../commands/bosyu.js";
import {
    buildBosyuBpsrModal,
    buildBosyuBpsrComponents,
    buildBosyuBpsrEmbed,
    createBosyuBpsrState,
    decideBosyuBpsrCommandInput,
} from "../commands/bosyu-bpsr.js";

/**
 * /help コマンドの処理
 */
export async function handleHelpCommand(
    interaction: ChatInputCommandInteraction,
    helpEntries: HelpEntry[],
): Promise<void> {
    const totalPages = getHelpPageCount(helpEntries.length);
    const page = 1;
    const pageEntries = getHelpPageEntries(helpEntries, page);
    const { embed, components } = buildHelpList({
        entries: pageEntries,
        page,
        totalPages,
        userId: interaction.user.id,
    });

    await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true,
    });
}

/**
 * /bosyu コマンドの処理
 */
export async function handleBosyuCommand(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    const slots = interaction.options.getNumber("slots");
    const title = interaction.options.getString("title");
    const body = interaction.options.getString("body");
    const decision = decideBosyuCommandInput({ slots, title, body });

    if (decision.type === "modal") {
        await interaction.showModal(buildBosyuModal(interaction.user.id));
        return;
    }

    if (decision.type === "error") {
        await interaction.reply({
            content: decision.message,
            ephemeral: true,
        });
        return;
    }

    const ownerId = interaction.user.id;
    const ownerMention = `<@${ownerId}>`;

    const state = createBosyuState({
        ownerId,
        title: decision.title,
        body: decision.body,
        remaining: decision.slots,
        members: [ownerMention],
        status: "OPEN",
    });

    const embed = buildBosyuEmbed(state);
    const components = buildBosyuComponents(state);

    await interaction.reply({
        embeds: [embed],
        components,
    });
}

/**
 * /bosyu-bpsr コマンドの処理
 */
export async function handleBosyuBpsrCommand(
    interaction: ChatInputCommandInteraction,
): Promise<void> {
    const slots = interaction.options.getNumber("slots");
    const title = interaction.options.getString("title");
    const body = interaction.options.getString("body");
    const decision = decideBosyuBpsrCommandInput({ slots, title, body });

    if (decision.type === "modal") {
        await interaction.showModal(buildBosyuBpsrModal(interaction.user.id));
        return;
    }

    if (decision.type === "error") {
        await interaction.reply({
            content: decision.message,
            ephemeral: true,
        });
        return;
    }

    const ownerId = interaction.user.id;

    // 投稿者は自動参加しない（ボタンで参加）
    const state = createBosyuBpsrState({
        ownerId,
        title: decision.title,
        body: decision.body,
        remaining: decision.slots,
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
}
