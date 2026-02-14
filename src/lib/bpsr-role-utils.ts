/**
 * /bpsr-role コマンド用ユーティリティ
 * ロール付与ボタンパネル機能
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

// ボタンcustomIdプレフィックス
export const BPSR_ROLE_BUTTON_PREFIX = 'bpsr-role';

// ロールタイプ
export type BpsrRoleType = 'tank' | 'attacker' | 'healer';

// ボタンラベル（/bosyu-bpsrと同じ）
export const ROLE_LABELS: Record<BpsrRoleType, string> = {
  tank: '🛡️タンク',
  attacker: '⚔️アタッカー',
  healer: '💚ヒーラー',
} as const;

// デフォルト値
export const DEFAULT_TITLE = 'ロール選択';
export const DEFAULT_BODY = 'メインのジョブを選択してください。';

/**
 * パースされたcustomId
 */
export interface ParsedBpsrRoleCustomId {
  type: BpsrRoleType;
  tankRoleId: string;
  attackerRoleId: string;
  healerRoleId: string;
}

/**
 * customIdをパース
 * 形式: bpsr-role:<type>:<tankId>:<attackerId>:<healerId>
 */
export function parseBpsrRoleCustomId(customId: string): ParsedBpsrRoleCustomId | null {
  if (!customId.startsWith(`${BPSR_ROLE_BUTTON_PREFIX}:`)) {
    return null;
  }

  const parts = customId.split(':');
  if (parts.length !== 5) {
    return null;
  }

  const [, type, tankRoleId, attackerRoleId, healerRoleId] = parts;

  if (!['tank', 'attacker', 'healer'].includes(type)) {
    return null;
  }

  return {
    type: type as BpsrRoleType,
    tankRoleId,
    attackerRoleId,
    healerRoleId,
  };
}

/**
 * customIdがbpsr-roleボタンかどうか判定
 */
export function isBpsrRoleCustomId(customId: string): boolean {
  return customId.startsWith(`${BPSR_ROLE_BUTTON_PREFIX}:`);
}

/**
 * customIdを構築
 */
export function buildBpsrRoleCustomId(
  type: BpsrRoleType,
  tankRoleId: string,
  attackerRoleId: string,
  healerRoleId: string,
): string {
  return `${BPSR_ROLE_BUTTON_PREFIX}:${type}:${tankRoleId}:${attackerRoleId}:${healerRoleId}`;
}

/**
 * ボタンコンポーネントを構築
 */
export function buildBpsrRoleComponents(
  tankRoleId: string,
  attackerRoleId: string,
  healerRoleId: string,
): ActionRowBuilder<ButtonBuilder>[] {
  const tankButton = new ButtonBuilder()
    .setCustomId(buildBpsrRoleCustomId('tank', tankRoleId, attackerRoleId, healerRoleId))
    .setLabel(ROLE_LABELS.tank)
    .setStyle(ButtonStyle.Primary);

  const attackerButton = new ButtonBuilder()
    .setCustomId(buildBpsrRoleCustomId('attacker', tankRoleId, attackerRoleId, healerRoleId))
    .setLabel(ROLE_LABELS.attacker)
    .setStyle(ButtonStyle.Primary);

  const healerButton = new ButtonBuilder()
    .setCustomId(buildBpsrRoleCustomId('healer', tankRoleId, attackerRoleId, healerRoleId))
    .setLabel(ROLE_LABELS.healer)
    .setStyle(ButtonStyle.Primary);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(tankButton, attackerButton, healerButton),
  ];
}

/**
 * Embedを構築
 */
export function buildBpsrRoleEmbed(title: string, body: string): EmbedBuilder {
  return new EmbedBuilder().setTitle(title).setDescription(body).setColor(0x5865f2); // Discord Blurple
}

/**
 * ロールタイプからロールIDを取得
 */
export function getRoleIdByType(
  type: BpsrRoleType,
  tankRoleId: string,
  attackerRoleId: string,
  healerRoleId: string,
): string {
  switch (type) {
    case 'tank':
      return tankRoleId;
    case 'attacker':
      return attackerRoleId;
    case 'healer':
      return healerRoleId;
  }
}

/**
 * 他のロールタイプを取得（排他用）
 */
export function getOtherRoleTypes(type: BpsrRoleType): BpsrRoleType[] {
  const all: BpsrRoleType[] = ['tank', 'attacker', 'healer'];
  return all.filter((t) => t !== type);
}
