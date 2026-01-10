import * as dotenv from "dotenv";
dotenv.config();

import { SapphireClient } from "@sapphire/framework";
import { Events, GatewayIntentBits } from "discord.js";

import { initDatabase } from "./db.js";
import { initializeScheduler } from "./scheduler.js";
import { checkGuildPermission } from "./permissions.js";
import {
  handleBosyuCommand,
  handleBosyuBpsrCommand,
  handleRemindCommand,
  handleRemindListCommand,
  handleAllowCommand,
  handleConfigCommand,
} from "./handlers/command-handlers.js";
import {
  handleBosyuModalSubmit,
  handleBosyuBpsrModalSubmit,
  handleRemindModalSubmit,
} from "./handlers/modal-handlers.js";
import {
  handleBosyuButton,
  handleBosyuBpsrButton,
  handleRemindListButton,
} from "./handlers/button-handlers.js";

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN を .env に設定してね");

initDatabase();

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds],
  loadMessageCommandListeners: true,
  baseUserDirectory: __dirname,
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
  // スケジューラ初期化（起動時にDBからリマインダーを読み込み）
  initializeScheduler(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // /allow, /config, /help コマンドはGuild許可チェックをスキップ
  // /help はSapphireが処理するが、Preconditionで対応予定
  const isOwnerOnlyCommand = interaction.isChatInputCommand() &&
    (interaction.commandName === "allow" || interaction.commandName === "config");

  // Sapphire管理のコマンド（/help）はSapphireが処理するためスキップ
  const isSapphireCommand = interaction.isChatInputCommand() &&
    interaction.commandName === "help";

  // 1. Guild許可チェック（最優先、ただしオーナー専用コマンド・Sapphireコマンドはスキップ）
  if (!isOwnerOnlyCommand && !isSapphireCommand) {
    const guildCheck = checkGuildPermission(interaction);
    if (!guildCheck.allowed) {
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: guildCheck.reason,
          ephemeral: true,
        });
      }
      return;
    }
  }

  // スラッシュコマンド処理（/help以外）
  if (interaction.isChatInputCommand()) {
    // /help はSapphireが自動処理するためここでは処理しない

    if (interaction.commandName === "bosyu") {
      await handleBosyuCommand(interaction);
      return;
    }

    if (interaction.commandName === "bosyu-bpsr") {
      await handleBosyuBpsrCommand(interaction);
      return;
    }

    if (interaction.commandName === "remind") {
      await handleRemindCommand(interaction);
      return;
    }

    if (interaction.commandName === "remind-list") {
      await handleRemindListCommand(interaction);
      return;
    }

    if (interaction.commandName === "allow") {
      await handleAllowCommand(interaction);
      return;
    }

    if (interaction.commandName === "config") {
      await handleConfigCommand(interaction);
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

    // リマインダーモーダル処理
    if (await handleRemindModalSubmit(interaction, client)) {
      return;
    }
  }

  // ボタン処理（help以外 — helpはSapphire InteractionHandlerが処理）
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // help: はSapphireが処理するためスキップ
    if (customId.startsWith("help:")) {
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

    if (customId.startsWith("remind:")) {
      await handleRemindListButton(interaction, customId);
      return;
    }
  }
});

client.login(token);

