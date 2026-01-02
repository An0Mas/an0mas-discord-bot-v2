import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Embed,
  EmbedBuilder,
} from "discord.js";

type BosyuStatus = "OPEN" | "CLOSED";
type BosyuAction = "join" | "cancel" | "plus" | "minus" | "close";

export type BosyuState = {
  ownerId: string;
  title: string;
  body: string;
  members: string[];
  remaining: number;
  status: BosyuStatus;
};

type BosyuActionInput = {
  state: BosyuState;
  action: BosyuAction;
  actorId: string;
};

type ParsedBosyuCustomId = {
  action: BosyuAction;
  ownerId: string;
};

const BOSYU_MEMBER_FIELD = "参加メンバーリスト";
const BOSYU_REMAINING_FIELD = "募集人数";
const BOSYU_OPEN_TEXT = "【募集中】";
const BOSYU_CLOSED_TEXT = "【募集停止】";
const BOSYU_OPEN_IMAGE =
  "https://1.bp.blogspot.com/-0LJSR56tXL8/VVGVS2PQRsI/AAAAAAAAtkA/9EI2ZHrT5w8/s800/text_sankasya_bosyu.png";
const BOSYU_CLOSED_IMAGE =
  "https://1.bp.blogspot.com/-fDI1k-dkGO8/X5OcjEhqRUI/AAAAAAABcAc/DSrwuOQW6xMPgE1XZ8zvqhV0akkIctmTgCNcBGAsYHQ/s819/text_oshirase_eigyousyuuryou.png";

export function createBosyuState(input: BosyuState) {
  return input;
}

export function buildBosyuEmbed(state: BosyuState) {
  const statusText = state.status === "OPEN" ? BOSYU_OPEN_TEXT : BOSYU_CLOSED_TEXT;
  const description = `${statusText}\n${state.body}`;
  const membersFieldValue =
    state.members.length > 0 ? state.members.join("\n") : "`参加者無し`";

  return new EmbedBuilder()
    .setTitle(state.title)
    .setDescription(description)
    .setFields(
      {
        name: BOSYU_MEMBER_FIELD,
        value: membersFieldValue,
        inline: true,
      },
      {
        name: BOSYU_REMAINING_FIELD,
        value: `あと${state.remaining}名`,
        inline: true,
      },
    )
    .setImage(state.status === "OPEN" ? BOSYU_OPEN_IMAGE : BOSYU_CLOSED_IMAGE);
}

export function buildBosyuComponents(state: BosyuState) {
  const closed = state.status === "CLOSED";
  const closeLabel = closed ? "再開" : "締切";

  const joinButton = new ButtonBuilder()
    .setCustomId(`bosyu:join:${state.ownerId}`)
    .setLabel("参加")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(closed);

  const cancelButton = new ButtonBuilder()
    .setCustomId(`bosyu:cancel:${state.ownerId}`)
    .setLabel("取消")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(closed);

  const closeButton = new ButtonBuilder()
    .setCustomId(`bosyu:close:${state.ownerId}`)
    .setLabel(closeLabel)
    .setStyle(ButtonStyle.Success);

  const plusButton = new ButtonBuilder()
    .setCustomId(`bosyu:plus:${state.ownerId}`)
    .setLabel("＋")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(closed);

  const minusButton = new ButtonBuilder()
    .setCustomId(`bosyu:minus:${state.ownerId}`)
    .setLabel("－")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(closed);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      joinButton,
      cancelButton,
      closeButton,
      plusButton,
      minusButton,
    ),
  ];
}

export function parseBosyuCustomId(customId: string): ParsedBosyuCustomId | null {
  const parts = customId.split(":");
  if (parts.length !== 3) return null;
  const [, action, ownerId] = parts;
  if (
    action !== "join" &&
    action !== "cancel" &&
    action !== "plus" &&
    action !== "minus" &&
    action !== "close"
  ) {
    return null;
  }
  if (!ownerId) return null;
  return { action, ownerId };
}

export function parseBosyuEmbed(embed: Embed | null, ownerId: string) {
  if (!embed) return null;

  const description = embed.description ?? "";
  const lines = description.split(/\r?\n/);
  const statusLine = lines[0]?.trim();
  const status =
    statusLine === BOSYU_OPEN_TEXT
      ? "OPEN"
      : statusLine === BOSYU_CLOSED_TEXT
        ? "CLOSED"
        : null;

  if (!status) return null;

  const body = lines.slice(1).join("\n").trim();
  const title = embed.title ?? "";

  const membersField = embed.fields.find(
    (field) => field.name === BOSYU_MEMBER_FIELD,
  );
  const remainingField = embed.fields.find(
    (field) => field.name === BOSYU_REMAINING_FIELD,
  );

  if (!membersField || !remainingField) return null;

  const members = parseMembers(membersField.value);
  const remainingMatch = remainingField.value.match(/あと(\d+)名/);
  if (!remainingMatch) return null;
  const remaining = Number(remainingMatch[1]);
  if (!Number.isFinite(remaining)) return null;

  return {
    ownerId,
    title,
    body,
    members,
    remaining,
    status,
  } satisfies BosyuState;
}

export function applyBosyuAction(input: BosyuActionInput): BosyuState | null {
  const { state, action, actorId } = input;
  const isOwner = actorId === state.ownerId;
  const isClosed = state.status === "CLOSED";

  if (action === "join") {
    if (isClosed) return null;
    if (isMember(state.members, actorId)) return null;
    if (state.remaining <= 0) return null;
    return {
      ...state,
      members: [...state.members, `<@${actorId}>`],
      remaining: state.remaining - 1,
    };
  }

  if (action === "cancel") {
    if (isClosed) return null;
    if (!isMember(state.members, actorId)) return null;
    const members = state.members.filter((member) => !memberIncludesId(member, actorId));
    return {
      ...state,
      members,
      remaining: state.remaining + 1,
    };
  }

  if (action === "plus") {
    if (!isOwner || isClosed) return null;
    return {
      ...state,
      remaining: state.remaining + 1,
    };
  }

  if (action === "minus") {
    if (!isOwner || isClosed) return null;
    if (state.remaining <= 0) return null;
    return {
      ...state,
      remaining: state.remaining - 1,
    };
  }

  if (action === "close") {
    if (!isOwner) return null;
    return {
      ...state,
      status: state.status === "OPEN" ? "CLOSED" : "OPEN",
    };
  }

  return null;
}

function parseMembers(value: string) {
  if (value.includes("参加者無し")) return [];
  return value
    .split(/\r?\n/)
    .map((member) => member.trim())
    .filter(Boolean);
}

function isMember(members: string[], userId: string) {
  return members.some((member) => memberIncludesId(member, userId));
}

function memberIncludesId(member: string, userId: string) {
  return member.includes(userId);
}
