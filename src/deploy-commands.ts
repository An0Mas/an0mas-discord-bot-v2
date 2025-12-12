import * as dotenv from "dotenv";
dotenv.config();

import { REST, Routes } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("DISCORD_TOKEN / CLIENT_ID / GUILD_ID を .env に設定してね");
}

const commands = [{ name: "ping", description: "Replies with Pong!" }];

const rest = new REST({ version: "10" }).setToken(token);

console.log("スラッシュコマンド登録中...");
await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
console.log("登録完了！");
