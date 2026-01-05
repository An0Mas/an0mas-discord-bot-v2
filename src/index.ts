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
} from "./commands/help.js";
import {
  applyBosyuAction,
  buildBosyuEditModal,
  buildBosyuModal,
  buildBosyuComponents,
  buildBosyuEmbed,
  createBosyuState,
  decideBosyuCommandInput,
  parseBosyuModalTarget,
  parseBosyuModalSubmission,
  parseBosyuCustomId,
  parseBosyuEmbed,
} from "./commands/bosyu.js";

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
    const target = parseBosyuModalTarget(customId);
    if (!target) {
      return;
    }

    if (target.ownerId !== interaction.user.id) {
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
      return;
    }

    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.reply({
        content: "編集対象のメッセージを取得できませんでした。",
        ephemeral: true,
      });
      return;
    }

    const message = await interaction.channel.messages
      .fetch(target.messageId)
      .catch(() => null);
    if (!message) {
      await interaction.reply({
        content: "編集対象のメッセージが見つかりませんでした。",
        ephemeral: true,
      });
      return;
    }

    const currentEmbed = message.embeds[0];
    const currentState = parseBosyuEmbed(currentEmbed, target.ownerId);
    if (!currentState) {
      await interaction.reply({
        content: "募集データを読み取れませんでした。",
        ephemeral: true,
      });
      return;
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

client.login(token);
