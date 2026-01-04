import * as dotenv from "dotenv";
dotenv.config();

import { SapphireClient } from "@sapphire/framework";
import {
  ButtonInteraction,
  Events,
  GatewayIntentBits,
} from "discord.js";

import { initDatabase } from "./db.js";
import {
  buildHelpDetail,
  buildHelpList,
  getHelpEntryByIndex,
  getHelpPageCount,
  getHelpPageEntries,
  loadHelpEntries,
  parseHelpCustomId,
} from "./help.js";
import {
  applyBosyuAction,
  buildBosyuModal,
  buildBosyuComponents,
  buildBosyuEmbed,
  createBosyuState,
  decideBosyuCommandInput,
  parseBosyuModalOwnerId,
  parseBosyuModalSubmission,
  parseBosyuCustomId,
  parseBosyuEmbed,
} from "./bosyu.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN を .env に設定してね");

initDatabase();
const helpEntries = loadHelpEntries();

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "help") {
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
      return;
    }

    if (interaction.commandName === "bosyu") {
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
      return;
    }
  }

  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;
    const ownerId = parseBosyuModalOwnerId(customId);
    if (!ownerId) {
      return;
    }

    if (ownerId !== interaction.user.id) {
      await interaction.reply({
        content: "このモーダルはあなた専用です。",
        ephemeral: true,
      });
      return;
    }

    const parsed = parseBosyuModalSubmission(interaction);
    if (!parsed.ok) {
      await interaction.reply({
        content: parsed.message,
        ephemeral: true,
      });
      return;
    }

    const ownerMention = `<@${ownerId}>`;
    const state = createBosyuState({
      ownerId,
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
  }

  if (interaction.isButton()) {
    const customId = interaction.customId;
    if (customId.startsWith("help:")) {
      await handleHelpButton(interaction, customId, helpEntries.length);
      return;
    }

    if (customId.startsWith("bosyu:")) {
      await handleBosyuButton(interaction, customId);
      return;
    }
  }
});

async function handleHelpButton(
  interaction: ButtonInteraction,
  customId: string,
  totalEntries: number,
) {
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

async function handleBosyuButton(
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

client.login(token);
