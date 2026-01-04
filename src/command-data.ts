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
];

export const commandDataJson = commandData.map((command) => command.toJSON());
