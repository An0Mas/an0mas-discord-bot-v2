import { SlashCommandBuilder } from "discord.js";

export const commandData = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("コマンドの使い方を一覧・詳細で確認できます。"),
  new SlashCommandBuilder()
    .setName("bosyu")
    .setDescription("参加者募集を作成します。")
    .addNumberOption((option) =>
      option
        .setName("slots")
        .setDescription("作成者以外にあと何人参加できるか")
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("募集のタイトル")
        .setMinLength(1)
        .setMaxLength(256),
    )
    .addStringOption((option) =>
      option
        .setName("body")
        .setDescription("募集内容")
        .setMinLength(1)
        .setMaxLength(2000),
    ),
  new SlashCommandBuilder()
    .setName("bosyu-bpsr")
    .setDescription("BPSR特化のロール別募集を作成します。")
    .addNumberOption((option) =>
      option
        .setName("slots")
        .setDescription("募集人数（自分を含めてあと何人参加できるか）")
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("募集のタイトル")
        .setMinLength(1)
        .setMaxLength(256),
    )
    .addStringOption((option) =>
      option
        .setName("body")
        .setDescription("募集内容")
        .setMinLength(1)
        .setMaxLength(2000),
    ),
  new SlashCommandBuilder()
    .setName("remind")
    .setDescription("リマインダーを登録します。"),
  new SlashCommandBuilder()
    .setName("remind-list")
    .setDescription("自分のリマインダー一覧を表示します。"),
  new SlashCommandBuilder()
    .setName("allow")
    .setDescription("Bot利用許可を管理します（オーナー専用）")
    .addSubcommandGroup((group) =>
      group
        .setName("guild")
        .setDescription("Guild単位の許可を管理")
        .addSubcommand((sub) =>
          sub.setName("add").setDescription("このサーバーを許可リストに追加")
        )
        .addSubcommand((sub) =>
          sub.setName("remove").setDescription("このサーバーを許可リストから削除")
        )
    ),
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Bot設定を表示・管理します（オーナー専用）")
    .addSubcommand((sub) =>
      sub.setName("show").setDescription("現在の設定を表示")
    ),
];

export const commandDataJson = commandData.map((command) => command.toJSON());
