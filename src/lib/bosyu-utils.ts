import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Embed,
  EmbedBuilder,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

type BosyuStatus = "OPEN" | "CLOSED";
type BosyuAction = "join" | "cancel" | "plus" | "minus" | "close" | "edit";

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

const BOSYU_MODAL_ID_PREFIX = "bosyu-modal:";
const BOSYU_EDIT_MODAL_ID_PREFIX = "bosyu-edit:";
const BOSYU_MODAL_SLOTS_ID = "bosyu-modal-slots";
const BOSYU_MODAL_TITLE_ID = "bosyu-modal-title";
const BOSYU_MODAL_BODY_ID = "bosyu-modal-body";
const BOSYU_PARTIAL_ERROR =
  "slots/title/body は3項目すべて入力するか、引数なしで /bosyu を実行してモーダル入力してください。";

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
    .setLabel("参加取消")
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

  const editButton = new ButtonBuilder()
    .setCustomId(`bosyu:edit:${state.ownerId}`)
    .setLabel("編集")
    .setStyle(ButtonStyle.Secondary);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      joinButton,
      cancelButton,
      closeButton,
      plusButton,
      minusButton,
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(editButton),
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
    action !== "close" &&
    action !== "edit"
  ) {
    return null;
  }
  if (!ownerId) return null;
  return { action, ownerId };
}

export function buildBosyuModal(userId: string) {
  const slotsInput = new TextInputBuilder()
    .setCustomId(BOSYU_MODAL_SLOTS_ID)
    .setLabel("募集人数（あと何名）")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const titleInput = new TextInputBuilder()
    .setCustomId(BOSYU_MODAL_TITLE_ID)
    .setLabel("タイトル")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const bodyInput = new TextInputBuilder()
    .setCustomId(BOSYU_MODAL_BODY_ID)
    .setLabel("内容")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`${BOSYU_MODAL_ID_PREFIX}${userId}`)
    .setTitle("募集作成")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(slotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
    );
}

export function buildBosyuEditModal(state: BosyuState, messageId: string) {
  const slotsInput = new TextInputBuilder()
    .setCustomId(BOSYU_MODAL_SLOTS_ID)
    .setLabel("募集人数（あと何名）")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(state.remaining));

  const titleInput = new TextInputBuilder()
    .setCustomId(BOSYU_MODAL_TITLE_ID)
    .setLabel("タイトル")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(state.title);

  const bodyInput = new TextInputBuilder()
    .setCustomId(BOSYU_MODAL_BODY_ID)
    .setLabel("内容")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setValue(state.body);

  return new ModalBuilder()
    .setCustomId(`${BOSYU_EDIT_MODAL_ID_PREFIX}${state.ownerId}:${messageId}`)
    .setTitle("募集編集")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(slotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
    );
}

export function parseBosyuModalOwnerId(customId: string) {
  if (!customId.startsWith(BOSYU_MODAL_ID_PREFIX)) return null;
  const ownerId = customId.slice(BOSYU_MODAL_ID_PREFIX.length);
  return ownerId.length > 0 ? ownerId : null;
}

export function parseBosyuEditModalTarget(customId: string) {
  if (!customId.startsWith(BOSYU_EDIT_MODAL_ID_PREFIX)) return null;
  const payload = customId.slice(BOSYU_EDIT_MODAL_ID_PREFIX.length);
  const parts = payload.split(":");
  if (parts.length !== 2) return null;
  const [ownerId, messageId] = parts;
  if (!ownerId || !messageId) return null;
  return { ownerId, messageId };
}

export function parseBosyuModalTarget(customId: string):
  | { type: "create"; ownerId: string }
  | { type: "edit"; ownerId: string; messageId: string }
  | null {
  const createOwnerId = parseBosyuModalOwnerId(customId);
  if (createOwnerId) {
    return { type: "create", ownerId: createOwnerId };
  }

  const editTarget = parseBosyuEditModalTarget(customId);
  if (editTarget) {
    return { type: "edit", ...editTarget };
  }

  return null;
}

export function decideBosyuCommandInput(input: {
  slots: number | null;
  title: string | null;
  body: string | null;
}):
  | { type: "modal" }
  | { type: "error"; message: string }
  | { type: "create"; slots: number; title: string; body: string } {
  const hasSlots = input.slots !== null;
  const hasTitle = input.title !== null;
  const hasBody = input.body !== null;
  const hasAny = hasSlots || hasTitle || hasBody;
  const hasAll = hasSlots && hasTitle && hasBody;

  if (!hasAny) {
    return { type: "modal" };
  }

  if (!hasAll) {
    return { type: "error", message: BOSYU_PARTIAL_ERROR };
  }

  const validated = validateBosyuInput({
    slots: input.slots as number,
    title: input.title as string,
    body: input.body as string,
  });

  if (!validated.ok) {
    return { type: "error", message: validated.message };
  }

  return {
    type: "create",
    slots: validated.slots,
    title: validated.title,
    body: validated.body,
  };
}

export function parseBosyuModalSubmission(
  interaction: ModalSubmitInteraction,
):
  | { ok: true; slots: number; title: string; body: string }
  | { ok: false; message: string } {
  const slotsRaw = interaction.fields
    .getTextInputValue(BOSYU_MODAL_SLOTS_ID)
    .trim();
  const titleRaw = interaction.fields
    .getTextInputValue(BOSYU_MODAL_TITLE_ID)
    .trim();
  const bodyRaw = interaction.fields
    .getTextInputValue(BOSYU_MODAL_BODY_ID)
    .trim();

  const slotsValue = parseSlotsInput(slotsRaw);
  if (slotsValue === null || slotsValue < 1) {
    return { ok: false, message: "slots は1以上の整数で入力してください。" };
  }

  return validateBosyuInput({
    slots: slotsValue,
    title: titleRaw,
    body: bodyRaw,
  });
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

function parseSlotsInput(value: string) {
  const normalized = normalizeDigits(value.trim());
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function normalizeDigits(value: string) {
  return value.replace(/[０-９]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) - 0xff10 + 0x30),
  );
}

function validateBosyuInput(input: {
  slots: number;
  title: string;
  body: string;
}):
  | { ok: true; slots: number; title: string; body: string }
  | { ok: false; message: string } {
  if (!Number.isInteger(input.slots) || input.slots < 1) {
    return {
      ok: false,
      message: "slots は1以上の整数で入力してください。",
    };
  }

  const trimmedTitle = input.title.trim();
  if (trimmedTitle.length === 0) {
    return {
      ok: false,
      message: "title は空欄にできません。",
    };
  }

  const trimmedBody = input.body.trim();
  if (trimmedBody.length === 0) {
    return {
      ok: false,
      message: "body は空欄にできません。",
    };
  }

  return {
    ok: true,
    slots: input.slots,
    title: trimmedTitle,
    body: trimmedBody,
  };
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
