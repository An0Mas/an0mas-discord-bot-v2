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
  tankSlots: number; // 🛡️タンク枠数
  attackerSlots: number; // ⚔️アタッカー枠数
  healerSlots: number; // 💚ヒーラー枠数
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
const BPSR_OPEN_TEXT = "【募集中】";
const BPSR_CLOSED_TEXT = "【募集停止】";
const BPSR_OPEN_IMAGE =
  "https://1.bp.blogspot.com/-0LJSR56tXL8/VVGVS2PQRsI/AAAAAAAAtkA/9EI2ZHrT5w8/s800/text_sankasya_bosyu.png";
const BPSR_CLOSED_IMAGE =
  "https://1.bp.blogspot.com/-fDI1k-dkGO8/X5OcjEhqRUI/AAAAAAABcAc/DSrwuOQW6xMPgE1XZ8zvqhV0akkIctmTgCNcBGAsYHQ/s819/text_oshirase_eigyousyuuryou.png";

const BPSR_MODAL_ID_PREFIX = "bpsr-modal:";
const BPSR_EDIT_MODAL_ID_PREFIX = "bpsr-edit:";
const BPSR_MODAL_TITLE_ID = "bpsr-modal-title";
const BPSR_MODAL_BODY_ID = "bpsr-modal-body";
const BPSR_MODAL_TANK_SLOTS_ID = "bpsr-modal-tank-slots";
const BPSR_MODAL_ATTACKER_SLOTS_ID = "bpsr-modal-attacker-slots";
const BPSR_MODAL_HEALER_SLOTS_ID = "bpsr-modal-healer-slots";

export function createBosyuBpsrState(input: BosyuBpsrState) {
  return input;
}

export function buildBosyuBpsrEmbed(state: BosyuBpsrState) {
  const statusText = state.status === "OPEN" ? BPSR_OPEN_TEXT : BPSR_CLOSED_TEXT;
  const description = `${statusText}\n${state.body}`;

  // ロール別表示（参加者数/枠数）
  const tankRemaining = state.tankSlots - state.tanks.length;
  const attackerRemaining = state.attackerSlots - state.attackers.length;
  const healerRemaining = state.healerSlots - state.healers.length;

  const tankFieldName = `🛡️タンク（${state.tanks.length}/${state.tankSlots}）`;
  const attackerFieldName = `⚔️アタッカー（${state.attackers.length}/${state.attackerSlots}）`;
  const healerFieldName = `💚ヒーラー（${state.healers.length}/${state.healerSlots}）`;

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
        name: tankFieldName,
        value: tankFieldValue,
        inline: true,
      },
      {
        name: attackerFieldName,
        value: attackerFieldValue,
        inline: true,
      },
      {
        name: healerFieldName,
        value: healerFieldValue,
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

  // 2行目: 取消/締切/編集
  const cancelButton = new ButtonBuilder()
    .setCustomId(`bpsr:cancel:${state.ownerId}`)
    .setLabel("参加取消")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(closed);

  const closeButton = new ButtonBuilder()
    .setCustomId(`bpsr:close:${state.ownerId}`)
    .setLabel(closeLabel)
    .setStyle(ButtonStyle.Success);

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
      editButton,
    ),
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

  const tankSlotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_TANK_SLOTS_ID)
    .setLabel("🛡️タンク人数")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("例: 1")
    .setRequired(true);

  const attackerSlotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_ATTACKER_SLOTS_ID)
    .setLabel("⚔️アタッカー人数")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("例: 2")
    .setRequired(true);

  const healerSlotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_HEALER_SLOTS_ID)
    .setLabel("💚ヒーラー人数")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("例: 1")
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`${BPSR_MODAL_ID_PREFIX}${userId}`)
    .setTitle("BPSR募集作成")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(tankSlotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(attackerSlotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(healerSlotsInput),
    );
}

export function buildBosyuBpsrEditModal(state: BosyuBpsrState, messageId: string) {
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

  const tankSlotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_TANK_SLOTS_ID)
    .setLabel("🛡️タンク人数")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(state.tankSlots));

  const attackerSlotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_ATTACKER_SLOTS_ID)
    .setLabel("⚔️アタッカー人数")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(state.attackerSlots));

  const healerSlotsInput = new TextInputBuilder()
    .setCustomId(BPSR_MODAL_HEALER_SLOTS_ID)
    .setLabel("💚ヒーラー人数")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(state.healerSlots));

  return new ModalBuilder()
    .setCustomId(`${BPSR_EDIT_MODAL_ID_PREFIX}${state.ownerId}:${messageId}`)
    .setTitle("BPSR募集編集")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(tankSlotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(attackerSlotsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(healerSlotsInput),
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

export function decideBosyuBpsrCommandInput(): { type: "modal" } {
  // ロール別人数制限のため、常にモーダルで入力
  return { type: "modal" };
}

export function parseBosyuBpsrModalSubmission(
  interaction: ModalSubmitInteraction,
):
  | { ok: true; title: string; body: string; tankSlots: number; attackerSlots: number; healerSlots: number }
  | { ok: false; message: string } {
  const titleRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_TITLE_ID)
    .trim();
  const bodyRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_BODY_ID)
    .trim();
  const tankSlotsRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_TANK_SLOTS_ID)
    .trim();
  const attackerSlotsRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_ATTACKER_SLOTS_ID)
    .trim();
  const healerSlotsRaw = interaction.fields
    .getTextInputValue(BPSR_MODAL_HEALER_SLOTS_ID)
    .trim();

  if (titleRaw.length === 0) {
    return { ok: false, message: "タイトルは空欄にできません。" };
  }
  if (bodyRaw.length === 0) {
    return { ok: false, message: "内容は空欄にできません。" };
  }

  const tankSlots = parseSlotsInput(tankSlotsRaw);
  if (tankSlots === null || tankSlots < 0) {
    return { ok: false, message: "タンク人数は0以上の整数で入力してください。" };
  }
  const attackerSlots = parseSlotsInput(attackerSlotsRaw);
  if (attackerSlots === null || attackerSlots < 0) {
    return { ok: false, message: "アタッカー人数は0以上の整数で入力してください。" };
  }
  const healerSlots = parseSlotsInput(healerSlotsRaw);
  if (healerSlots === null || healerSlots < 0) {
    return { ok: false, message: "ヒーラー人数は0以上の整数で入力してください。" };
  }

  if (tankSlots + attackerSlots + healerSlots === 0) {
    return { ok: false, message: "合計人数は1名以上にしてください。" };
  }

  return {
    ok: true,
    title: titleRaw,
    body: bodyRaw,
    tankSlots,
    attackerSlots,
    healerSlots,
  };
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

  // フィールド名から枠数をパース（例: "🛡️タンク（1/2）"）
  const tankField = embed.fields.find(
    (field) => field.name.startsWith("🛡️タンク"),
  );
  const attackerField = embed.fields.find(
    (field) => field.name.startsWith("⚔️アタッカー"),
  );
  const healerField = embed.fields.find(
    (field) => field.name.startsWith("💚ヒーラー"),
  );

  if (!tankField || !attackerField || !healerField) return null;

  // フィールド名から枠数を抽出（例: "🛡️タンク（1/2）" → 2）
  const tankSlotsMatch = tankField.name.match(/（\d+\/(\d+)）/);
  const attackerSlotsMatch = attackerField.name.match(/（\d+\/(\d+)）/);
  const healerSlotsMatch = healerField.name.match(/（\d+\/(\d+)）/);

  if (!tankSlotsMatch || !attackerSlotsMatch || !healerSlotsMatch) return null;

  const tankSlots = Number(tankSlotsMatch[1]);
  const attackerSlots = Number(attackerSlotsMatch[1]);
  const healerSlots = Number(healerSlotsMatch[1]);

  if (!Number.isFinite(tankSlots) || !Number.isFinite(attackerSlots) || !Number.isFinite(healerSlots)) {
    return null;
  }

  const tanks = parseMembers(tankField.value);
  const attackers = parseMembers(attackerField.value);
  const healers = parseMembers(healerField.value);

  return {
    ownerId,
    title,
    body,
    tanks,
    attackers,
    healers,
    tankSlots,
    attackerSlots,
    healerSlots,
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

    // ターゲットロールの空き枠チェック
    const targetRemaining =
      targetRole === "tank" ? state.tankSlots - state.tanks.length :
        targetRole === "attacker" ? state.attackerSlots - state.attackers.length :
          state.healerSlots - state.healers.length;

    // 未参加の場合：ターゲットロールの空き枠をチェック
    if (currentRole === null && targetRemaining <= 0) return null;

    // ロール変更の場合：ターゲットロールの空き枠をチェック
    if (currentRole !== null && targetRemaining <= 0) return null;

    // 新しい状態を作成
    let newTanks = [...state.tanks];
    let newAttackers = [...state.attackers];
    let newHealers = [...state.healers];

    // 既存のロールから削除
    if (currentRole === "tank") {
      newTanks = newTanks.filter((m) => !memberIncludesId(m, actorId));
    } else if (currentRole === "attacker") {
      newAttackers = newAttackers.filter((m) => !memberIncludesId(m, actorId));
    } else if (currentRole === "healer") {
      newHealers = newHealers.filter((m) => !memberIncludesId(m, actorId));
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
    };
  }

  // plus/minusはロール別人数では不要（編集モーダルで変更可能）
  if (action === "plus" || action === "minus") {
    // no-op: ロール別人数管理では枠の+/-は編集で行う
    return null;
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
