/**
 * コマンド権限設定の中央管理
 * 新しいコマンドを追加したらここに登録する
 */

// 権限タイプ
export type PermissionType =
  | 'owner-only' // オーナーのみ
  | 'restricted' // オーナー or 許可ユーザー/ロール
  | 'public'; // 全員使用可

// コマンド定義
export interface CommandDefinition {
  name: string;
  description: string;
  permissionType: PermissionType;
}

// 全コマンドの定義
export const COMMANDS: CommandDefinition[] = [
  // オーナーのみ
  { name: 'allow', description: 'Bot利用許可を管理', permissionType: 'owner-only' },
  { name: 'config', description: 'Bot設定を表示・管理', permissionType: 'owner-only' },

  // オーナー/許可ユーザー
  { name: 'verify', description: '合言葉認証システム', permissionType: 'restricted' },
  { name: 'bpsr-role', description: 'ロール付与ボタン', permissionType: 'restricted' },
  {
    name: 'mention-reactors',
    description: 'リアクション者へメンション',
    permissionType: 'restricted',
  },

  // 全員使用可
  { name: 'bosyu', description: '参加者募集', permissionType: 'public' },
  { name: 'bosyu-bpsr', description: 'ロール別募集（BPSR）', permissionType: 'public' },
  { name: 'remind', description: 'リマインダー登録', permissionType: 'public' },
  { name: 'remind-list', description: 'リマインダー一覧', permissionType: 'public' },
  { name: 'dice', description: 'ダイスロール', permissionType: 'public' },
  { name: 'help', description: 'ヘルプ表示', permissionType: 'public' },
];

// ヘルパー関数
export function getCommandsByPermissionType(type: PermissionType): CommandDefinition[] {
  return COMMANDS.filter((cmd) => cmd.permissionType === type);
}

export function getCommandDefinition(name: string): CommandDefinition | undefined {
  return COMMANDS.find((cmd) => cmd.name === name);
}

export function getAllCommandNames(): string[] {
  return COMMANDS.map((cmd) => cmd.name);
}

export function isOwnerOnlyCommand(name: string): boolean {
  const cmd = getCommandDefinition(name);
  return cmd?.permissionType === 'owner-only';
}

export function isRestrictedCommand(name: string): boolean {
  const cmd = getCommandDefinition(name);
  return cmd?.permissionType === 'restricted';
}

// /allowで許可設定可能なコマンド（owner-only以外）
export function getAllowableCommands(): CommandDefinition[] {
  return COMMANDS.filter((cmd) => cmd.permissionType !== 'owner-only');
}

// Discord選択肢形式で取得
export function getCommandChoices(): { name: string; value: string }[] {
  return getAllowableCommands().map((cmd) => ({
    name: `/${cmd.name} — ${cmd.description}`,
    value: cmd.name,
  }));
}
