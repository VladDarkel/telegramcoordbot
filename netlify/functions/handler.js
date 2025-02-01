import { Telegraf } from "telegraf";
import fs from "fs";

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply(
    "Я бот, який видобуває координати із JSON файла. Надішли мені файл."
  )
);
bot.help((ctx) => ctx.reply("Надішли мені JSON-файл, і я витягну координати."));

bot.on("document", async (ctx) => {
  try {
    const fileId = ctx.message.document.file_id;
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const jsonData = await response.json();

    if (!jsonData.coordinates) {
      return ctx.reply("Файл не містить координат!");
    }

    let coordinates = jsonData.coordinates[0][0];
    let finalText = coordinates
      .map((c, i) => `${i + 1} ${c[1].toFixed(3)} ${c[0].toFixed(3)}`)
      .join("\n");

    ctx.reply(finalText);
  } catch (error) {
    console.error("Помилка обробки файлу: ", error);
    ctx.reply("Сталася помилка при обробці файлу.");
  }
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send("ok");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Error");
    }
  } else {
    res.status(200).send("Telegram bot is running");
  }
}
