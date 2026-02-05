import * as dotenv from "dotenv";
dotenv.config();

import { SapphireClient } from "@sapphire/framework";
import { ActivityType, Events, GatewayIntentBits } from "discord.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { initDatabase } from "./db.js";
import { initializeScheduler } from "./scheduler.js";
import { notifyErrorToOwner } from "./lib/error-notify.js";

// package.jsonからバージョン取得
// TODO: dist/のみをデプロイする構成に変更する場合は、
//       環境変数(BOT_VERSION)からの取得に切り替えるか、フォールバック処理を追加すること
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

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

// ========================
// グローバルエラーハンドラ
// ========================
const normalizeError = (reason: unknown): Error => {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === "string" ? reason : JSON.stringify(reason));
};

const notifyProcessError = async (source: string, error: Error) => {
  try {
    await notifyErrorToOwner(client, {
      source,
      errorCode: "PROCESS_ERR",
      error,
    });
  } catch (notifyError) {
    console.error("プロセスエラー通知に失敗:", notifyError);
  }
};

process.on("uncaughtException", (error) => {
  console.error("[FATAL] uncaughtException:", error);
  void notifyProcessError("uncaughtException", error);
  // 致命的なエラーなのでプロセス終了（PM2等で自動再起動を推奨）
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[ERROR] unhandledRejection at:", promise, "reason:", reason);
  void notifyProcessError("unhandledRejection", normalizeError(reason));
  // 継続可能なエラーとして扱う（クラッシュさせない）
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
  // ステータス設定
  // TODO: 本番運用時は「開発中」表記を変更すること
  try {
    readyClient.user.setActivity(`⚙️ v${version} 開発中`, { type: ActivityType.Playing });
  } catch (error) {
    console.warn("[WARN] ステータス設定に失敗:", error);
  }
  // スケジューラ初期化（起動時にDBからリマインダーを読み込み）
  initializeScheduler(readyClient);
});

// Guild許可チェックはPreconditionで実行（src/preconditions/GuildAllowed.ts）

client.login(token);
