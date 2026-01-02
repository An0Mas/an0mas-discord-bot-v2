import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

export function initDatabase() {
  const dataDir = path.resolve(process.cwd(), "data");
  const dbPath = path.join(dataDir, "dev.sqlite3");

  fs.mkdirSync(dataDir, { recursive: true });

  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
    .run();
  db.close();
}
