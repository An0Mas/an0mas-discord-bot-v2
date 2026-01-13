import * as dotenv from "dotenv";
dotenv.config();

// ========================
// グローバルエラーハンドラ（Step 5）
// ========================
process.on("uncaughtException", (error) => {
  console.error("[FATAL] uncaughtException:", error);
  // 致命的なエラーなのでプロセス終了（PM2等で自動再起動を推奨）
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[ERROR] unhandledRejection at:", promise, "reason:", reason);
  // 継続可能なエラーとして扱う（クラッシュさせない）
});
import { SapphireClient } from "@sapphire/framework";
import { Events, GatewayIntentBits } from "discord.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { initDatabase } from "./db.js";
import { initializeScheduler } from "./scheduler.js";

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

// Guild許可チェックはPreconditionで実行（src/preconditions/GuildAllowed.ts）

client.login(token);
