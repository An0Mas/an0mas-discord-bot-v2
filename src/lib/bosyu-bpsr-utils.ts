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

// ロール定義
type BpsrRole = "tank" | "attacker" | "healer";
type BosyuBpsrStatus = "OPEN" | "CLOSED";
type BosyuBpsrAction =
  | "join-tank"
  | "join-attacker"
  | "join-healer"
  | "cancel"
  | "plus"
  | "minus"
  | "close"
  | "edit";

export type BosyuBpsrState = {
  ownerId: string;
  title: string;
  body: string;
  tanks: string[]; // 🛡️タンク参加者
  attackers: string[]; // ⚔️アタッカー参加者
  healers: string[]; // 💚ヒーラー参加者
  remaining: number;
  status: BosyuBpsrStatus;
};

type BosyuBpsrActionInput = {
  state: BosyuBpsrState;
  action: BosyuBpsrAction;
  actorId: string;
};

type ParsedBosyuBpsrCustomId = {
  action: BosyuBpsrAction;
  ownerId: string;
};

// 定数
const BPSR_TANK_FIELD = "🛡️タンク";
const BPSR_ATTACKER_FIELD = "⚔️アタッカー";
const BPSR_HEALER_FIELD = "💚ヒーラー";
const BPSR_REMAINING_FIELD = "募集人数";
const BPSR_OPEN_TEXT = "【募集中】";
const BPSR_CLOSED_TEXT = "【募集停止】";
const BPSR_OPEN_IMAGE =
  "https://1.bp.blogspot.com/-0LJSR56tXL8/VVGVS2PQRsI/AAAAAAAAtkA/9EI2ZHrT5w8/s800/text_sankasya_bosyu.png";
const BPSR_CLOSED_IMAGE =
  "https://1.bp.blogspot.com/-fDI1k-dkGO8/X5OcjEhqRUI/AAAAAAABcAc/DSrwuOQW6xMPgE1XZ8zvqhV0akkIctmTgCNcBGAsYHQ/s819/text_oshirase_eigyousyuuryou.png";

const BPSR_MODAL_ID_PREFIX = "bpsr-modal:";
const BPSR_EDIT_MODAL_ID_PREFIX = "bpsr-edit:";
const BPSR_MODAL_SLOTS_ID = "bpsr-modal-slots";
const BPSR_MODAL_TITLE_ID = "bpsr-modal-title";
const BPSR_MODAL_BODY_ID = "bpsr-modal-body";
const BPSR_PARTIAL_ERROR =
  "slots/title/body は3項目すべて入力するか、引数なしで /bosyu-bpsr を実行してモーダル入力してください。";
const BPSR_MODAL_SLOTS_LABEL = "募集人数（自分を含めてあと何名）";

export function createBosyuBpsrState(input: BosyuBpsrState) {
  return input;
}

export function buildBosyuBpsrEmbed(state: BosyuBpsrState) {
  const statusText = state.status === "OPEN" ? BPSR_OPEN_TEXT : BPSR_CLOSED_TEXT;
  const description = `${statusText}\n${state.body}`;

  const tankFieldValue =
    state.tanks.length > 0 ? state.tanks.join("\n") : "`参加者無し`";
  const attackerFieldValue =
    state.attackers.length > 0 ? state.attackers.join("\n") : "`参加者無し`";
  const healerFieldValue =
    state.healers.length > 0 ? state.healers.join("\n") : "`参加者無し`";

  return new EmbedBuilder()
    .setTitle(state.title)
    .setDescription(description)
    .setFields(
      {
        name: BPSR_TANK_FIELD,
        value: tankFieldValue,
        inline: true,
      },
      {
        name: BPSR_ATTACKER_FIELD,
        value: attackerFieldValue,
        inline: true,
      },
      {
        name: BPSR_HEALER_FIELD,
        value: healerFieldValue,
        inline: true,
      },
      {
        name: BPSR_REMAINING_FIELD,
        value: `あと${state.remaining}名`,
        inline: true,
      },
    )
    .setImage(state.status === "OPEN" ? BPSR_OPEN_IMAGE : BPSR_CLOSED_IMAGE);
}

export function buildBosyuBpsrComponents(state: BosyuBpsrState) {
  const closed = state.status === "CLOSED";
  const closeLabel = closed ? "再開" : "締切";

  // 1行目: ロール別参加ボタン
  const tankButton = new ButtonBuilder()
    .setCustomId(`bpsr:join-tank:${state.ownerId}`)
    .setLabel("🛡️タンク")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(closed);

  const attackerButton = new ButtonBuilder()
    .setCustomId(`bpsr:join-attacker:${state.ownerId}`)
    .setLabel("⚔️アタッカー")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(closed);

  const healerButton = new ButtonBuilder()
    .setCustomId(`bpsr:join-healer:${state.ownerId}`)
    .setLabel("💚ヒーラー")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(closed);

  // 2行目: 取消/締切/＋/－
  const cancelButton = new ButtonBuilder()
    .setCustomId(`bpsr:cancel:${state.ownerId}`)
    .setLabel("参加取消")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(closed);

  const closeButton = new ButtonBuilder()
    .setCustomId(`bpsr:close:${state.ownerId}`)
    .setLabel(closeLabel)
    .setStyle(ButtonStyle.Success);

  const plusButton = new ButtonBuilder()
    .setCustomId(`bpsr:plus:${state.ownerId}`)
    .setLabel("＋")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(closed);

  const minusButton = new ButtonBuilder()
    .setCustomId(`bpsr:minus:${state.ownerId}`)
    .setLabel("－")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(closed);

  // 3行目: 編集
  const editButton = new ButtonBuilder()
    .setCustomId(`bpsr:edit:${state.ownerId}`)
    .setLabel("編集")
    .setStyle(ButtonStyle.Secondary);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      tankButton,
      attackerButton,
      healerButton,
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      cancelButton,
      closeButton,
      plusButton,
      minusButton,
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(editButton),
  ];
}

export function parseBosyuBpsrCustomId(customId: string): ParsedBosyuBpsrCustomId | null {
  const parts = customId.split(":");
  if (parts.length !== 3) return null;
  const [prefix, action, ownerId] = parts;
  if (prefix !== "bpsr") return null;
  if (
    action !== "join-tank" &&
    action !== "join-attacker" &&
    action !== "join-healer" &&
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

export function buildBosyuBpsrModal(userId: string) {
  const slotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_SLOTS_ID)
    .setLabel(BPSR_MODAL_SLOTS_LABEL)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const titleInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_TITLE_ID)
    .setLabel("タイトル")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const bodyInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_BODY_ID)
    .setLabel("内容")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`${BPSR_MODAL_ID_PREFIX}${userId}`)
    .setTitle("BPSR募集作成")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(slotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
    );
}

export function buildBosyuBpsrEditModal(state: BosyuBpsrState, messageId: string) {
  const slotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_SLOTS_ID)
    .setLabel(BPSR_MODAL_SLOTS_LABEL)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(state.remaining));

  const titleInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_TITLE_ID)
    .setLabel("タイトル")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(state.title);

  const bodyInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_BODY_ID)
    .setLabel("内容")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setValue(state.body);

  return new ModalBuilder()
    .setCustomId(`${BPSR_EDIT_MODAL_ID_PREFIX}${state.ownerId}:${messageId}`)
    .setTitle("BPSR募集編集")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(slotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
    );
}

export function parseBosyuBpsrModalOwnerId(customId: string) {
  if (!customId.startsWith(BPSR_MODAL_ID_PREFIX)) return null;
  const ownerId = customId.slice(BPSR_MODAL_ID_PREFIX.length);
  return ownerId.length > 0 ? ownerId : null;
}

export function parseBosyuBpsrEditModalTarget(customId: string) {
  if (!customId.startsWith(BPSR_EDIT_MODAL_ID_PREFIX)) return null;
  const payload = customId.slice(BPSR_EDIT_MODAL_ID_PREFIX.length);
  const parts = payload.split(":");
  if (parts.length !== 2) return null;
  const [ownerId, messageId] = parts;
  if (!ownerId || !messageId) return null;
  return { ownerId, messageId };
}

export function parseBosyuBpsrModalTarget(customId: string):
  | { type: "create"; ownerId: string }
  | { type: "edit"; ownerId: string; messageId: string }
  | null {
  const createOwnerId = parseBosyuBpsrModalOwnerId(customId);
  if (createOwnerId) {
    return { type: "create", ownerId: createOwnerId };
  }

  const editTarget = parseBosyuBpsrEditModalTarget(customId);
  if (editTarget) {
    return { type: "edit", ...editTarget };
  }

  return null;
}

export function decideBosyuBpsrCommandInput(input: {
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
    return { type: "error", message: BPSR_PARTIAL_ERROR };
  }

  const validated = validateBosyuBpsrInput({
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

export function parseBosyuBpsrModalSubmission(
  interaction: ModalSubmitInteraction,
):
  | { ok: true; slots: number; title: string; body: string }
  | { ok: false; message: string } {
  const slotsRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_SLOTS_ID)
    .trim();
  const titleRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_TITLE_ID)
    .trim();
  const bodyRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_BODY_ID)
    .trim();

  const slotsValue = parseSlotsInput(slotsRaw);
  if (slotsValue === null || slotsValue < 1) {
    return { ok: false, message: "slots は1以上の整数で入力してください。" };
  }

  return validateBosyuBpsrInput({
    slots: slotsValue,
    title: titleRaw,
    body: bodyRaw,
  });
}

export function parseBosyuBpsrEmbed(embed: Embed | null, ownerId: string) {
  if (!embed) return null;

  const description = embed.description ?? "";
  const lines = description.split(/\r?\n/);
  const statusLine = lines[0]?.trim();
  const status =
    statusLine === BPSR_OPEN_TEXT
      ? "OPEN"
      : statusLine === BPSR_CLOSED_TEXT
        ? "CLOSED"
        : null;

  if (!status) return null;

  const body = lines.slice(1).join("\n").trim();
  const title = embed.title ?? "";

  const tankField = embed.fields.find(
    (field) => field.name === BPSR_TANK_FIELD,
  );
  const attackerField = embed.fields.find(
    (field) => field.name === BPSR_ATTACKER_FIELD,
  );
  const healerField = embed.fields.find(
    (field) => field.name === BPSR_HEALER_FIELD,
  );
  const remainingField = embed.fields.find(
    (field) => field.name === BPSR_REMAINING_FIELD,
  );

  if (!tankField || !attackerField || !healerField || !remainingField) return null;

  const tanks = parseMembers(tankField.value);
  const attackers = parseMembers(attackerField.value);
  const healers = parseMembers(healerField.value);
  const remainingMatch = remainingField.value.match(/あと(\d+)名/);
  if (!remainingMatch) return null;
  const remaining = Number(remainingMatch[1]);
  if (!Number.isFinite(remaining)) return null;

  return {
    ownerId,
    title,
    body,
    tanks,
    attackers,
    healers,
    remaining,
    status,
  } satisfies BosyuBpsrState;
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

function validateBosyuBpsrInput(input: {
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

export function applyBosyuBpsrAction(input: BosyuBpsrActionInput): BosyuBpsrState | null {
  const { state, action, actorId } = input;
  const isOwner = actorId === state.ownerId;
  const isClosed = state.status === "CLOSED";
  const actorMention = `<@${actorId}>`;

  // ロール別参加処理
  if (action === "join-tank" || action === "join-attacker" || action === "join-healer") {
    if (isClosed) return null;

    const currentRole = findMemberRole(state, actorId);
    const targetRole: BpsrRole =
      action === "join-tank" ? "tank" :
        action === "join-attacker" ? "attacker" : "healer";

    // 同じロールで参加済みの場合は no-op
    if (currentRole === targetRole) return null;

    // 未参加の場合：remaining をチェック
    if (currentRole === null && state.remaining <= 0) return null;

    // 新しい状態を作成
    let newTanks = [...state.tanks];
    let newAttackers = [...state.attackers];
    let newHealers = [...state.healers];
    let newRemaining = state.remaining;

    // 既存のロールから削除
    if (currentRole === "tank") {
      newTanks = newTanks.filter((m) => !memberIncludesId(m, actorId));
    } else if (currentRole === "attacker") {
      newAttackers = newAttackers.filter((m) => !memberIncludesId(m, actorId));
    } else if (currentRole === "healer") {
      newHealers = newHealers.filter((m) => !memberIncludesId(m, actorId));
    } else {
      // 新規参加の場合は remaining を減らす
      newRemaining -= 1;
    }

    // 新しいロールに追加
    if (targetRole === "tank") {
      newTanks.push(actorMention);
    } else if (targetRole === "attacker") {
      newAttackers.push(actorMention);
    } else {
      newHealers.push(actorMention);
    }

    return {
      ...state,
      tanks: newTanks,
      attackers: newAttackers,
      healers: newHealers,
      remaining: newRemaining,
    };
  }

  if (action === "cancel") {
    if (isClosed) return null;
    const currentRole = findMemberRole(state, actorId);
    if (currentRole === null) return null;

    let newTanks = [...state.tanks];
    let newAttackers = [...state.attackers];
    let newHealers = [...state.healers];

    if (currentRole === "tank") {
      newTanks = newTanks.filter((m) => !memberIncludesId(m, actorId));
    } else if (currentRole === "attacker") {
      newAttackers = newAttackers.filter((m) => !memberIncludesId(m, actorId));
    } else {
      newHealers = newHealers.filter((m) => !memberIncludesId(m, actorId));
    }

    return {
      ...state,
      tanks: newTanks,
      attackers: newAttackers,
      healers: newHealers,
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

function findMemberRole(state: BosyuBpsrState, userId: string): BpsrRole | null {
  if (state.tanks.some((m) => memberIncludesId(m, userId))) return "tank";
  if (state.attackers.some((m) => memberIncludesId(m, userId))) return "attacker";
  if (state.healers.some((m) => memberIncludesId(m, userId))) return "healer";
  return null;
}

function memberIncludesId(member: string, userId: string) {
  return member.includes(userId);
}
