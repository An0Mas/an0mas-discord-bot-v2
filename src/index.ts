import * as dotenv from "dotenv";
dotenv.config();

import { SapphireClient } from "@sapphire/framework";
import { Events, GatewayIntentBits } from "discord.js";

import { initDatabase } from "./db.js";
import { loadHelpEntries } from "./commands/help.js";
import {
  handleHelpCommand,
  handleBosyuCommand,
  handleBosyuBpsrCommand,
} from "./handlers/command-handlers.js";
import {
  handleBosyuModalSubmit,
  handleBosyuBpsrModalSubmit,
} from "./handlers/modal-handlers.js";
import {
  handleHelpButton,
  handleBosyuButton,
  handleBosyuBpsrButton,
} from "./handlers/button-handlers.js";

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
  // スラッシュコマンド処理
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "help") {
      await handleHelpCommand(interaction, helpEntries);
      return;
    }

    if (interaction.commandName === "bosyu") {
      await handleBosyuCommand(interaction);
      return;
    }

    if (interaction.commandName === "bosyu-bpsr") {
      await handleBosyuBpsrCommand(interaction);
      return;
    }
  }

  // モーダル送信処理
  if (interaction.isModalSubmit()) {
    // 通常のbosyuモーダル処理
    if (await handleBosyuModalSubmit(interaction)) {
      return;
    }

    // BPSRモーダル処理
    if (await handleBosyuBpsrModalSubmit(interaction)) {
      return;
    }
  }

  // ボタン処理
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith("help:")) {
      await handleHelpButton(interaction, customId, helpEntries);
      return;
    }

    if (customId.startsWith("bosyu:")) {
      await handleBosyuButton(interaction, customId);
      return;
    }

    if (customId.startsWith("bpsr:")) {
      await handleBosyuBpsrButton(interaction, customId);
      return;
    }
  }
});

client.login(token);
