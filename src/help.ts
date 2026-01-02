import fs from "node:fs";
import path from "node:path";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

type HelpEntry = {
  name: string;
  summary: string;
  detail: string;
};

type HelpListBuildInput = {
  entries: HelpEntry[];
  page: number;
  totalPages: number;
  userId: string;
};

type HelpDetailBuildInput = {
  entry: HelpEntry;
  page: number;
  userId: string;
};

type ParsedHelpCustomId =
  | { type: "list"; userId: string; page: number }
  | { type: "detail"; userId: string; index: number; page: number }
  | { type: "back"; userId: string; page: number };

const HELP_PAGE_SIZE = 10;

export function loadHelpEntries(): HelpEntry[] {
  const filePath = path.resolve(process.cwd(), "docs", "HELP.md");
  const content = fs.readFileSync(filePath, "utf8");
  const sections = content.split(/^## /m);
  const entries: HelpEntry[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const lines = trimmed.split(/\r?\n/);
    const titleLine = lines[0]?.trim();
    if (!titleLine?.startsWith("/")) continue;

    const summary = extractSummary(lines);
    const detail = lines.slice(1).join("\n").trim();
    entries.push({
      name: titleLine.split(/\s+/)[0],
      summary,
      detail: detail || summary,
    });
  }

  return entries;
}

export function getHelpPageCount(totalEntries: number) {
  return Math.max(1, Math.ceil(totalEntries / HELP_PAGE_SIZE));
}

export function getHelpPageEntries(entries: HelpEntry[], page: number) {
  const start = (page - 1) * HELP_PAGE_SIZE;
  return entries.slice(start, start + HELP_PAGE_SIZE);
}

export function getHelpEntryByIndex(entries: HelpEntry[], index: number) {
  return entries[index - 1];
}

export function buildHelpList(input: HelpListBuildInput) {
  const startIndex = (input.page - 1) * HELP_PAGE_SIZE;
  const lines = input.entries.map((entry, offset) => {
    const index = startIndex + offset + 1;
    const summary = entry.summary ? ` - ${entry.summary}` : "";
    return `${index}. ${entry.name}${summary}`;
  });

  const embed = new EmbedBuilder()
    .setTitle("Help")
    .setDescription(lines.join("\n") || "（表示できるコマンドがありません）")
    .setFooter({ text: `Page ${input.page} / ${input.totalPages}` });

  const components = [
    ...buildNumberRows(input.entries, startIndex, input.userId, input.page),
    buildNavRow(input.userId, input.page, input.totalPages),
  ];

  return { embed, components };
}

export function buildHelpDetail(input: HelpDetailBuildInput) {
  const embed = new EmbedBuilder()
    .setTitle(input.entry.name)
    .setDescription(input.entry.detail);

  const backButton = new ButtonBuilder()
    .setCustomId(`help:back:${input.userId}:${input.page}`)
    .setLabel("Back")
    .setStyle(ButtonStyle.Secondary);

  const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(backButton)];
  return { embed, components };
}

export function parseHelpCustomId(customId: string): ParsedHelpCustomId | null {
  const parts = customId.split(":");
  if (parts.length < 3) return null;
  const [, type, userId, value, pageValue] = parts;

  if (!userId) return null;

  if (type === "list") {
    const page = Number(value);
    if (!Number.isFinite(page)) return null;
    return { type: "list", userId, page };
  }

  if (type === "detail") {
    const index = Number(value);
    const page = Number(pageValue);
    if (!Number.isFinite(index) || !Number.isFinite(page)) return null;
    return { type: "detail", userId, index, page };
  }

  if (type === "back") {
    const page = Number(value);
    if (!Number.isFinite(page)) return null;
    return { type: "back", userId, page };
  }

  return null;
}

function extractSummary(lines: string[]) {
  const summaryIndex = lines.findIndex((line) => line.trim() === "### 概要");
  if (summaryIndex === -1) return "";
  for (let i = summaryIndex + 1; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (line) return line;
  }
  return "";
}

function buildNumberRows(
  entries: HelpEntry[],
  startIndex: number,
  userId: string,
  page: number,
) {
  const buttons = entries.map((_, offset) => {
    const index = startIndex + offset + 1;
    return new ButtonBuilder()
      .setCustomId(`help:detail:${userId}:${index}:${page}`)
      .setLabel(String(index))
      .setStyle(ButtonStyle.Secondary);
  });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.slice(i, i + 5),
    );
    rows.push(row);
  }

  return rows;
}

function buildNavRow(userId: string, page: number, totalPages: number) {
  const prevButton = new ButtonBuilder()
    .setCustomId(`help:list:${userId}:${page - 1}`)
    .setLabel("Prev")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 1);

  const nextButton = new ButtonBuilder()
    .setCustomId(`help:list:${userId}:${page + 1}`)
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= totalPages);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    prevButton,
    nextButton,
  );
}
