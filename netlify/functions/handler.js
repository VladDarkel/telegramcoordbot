const { Telegraf, Input } = require("telegraf");
const fetch = require("node-fetch");

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply(
    "Я бот, який видобуває координати із JSON файлу. Надішли мені файл."
  )
);
bot.help((ctx) => ctx.reply("Надішли мені JSON-файл, і я витягну координати."));

bot.on("document", async (ctx) => {
  try {
    const fileId = ctx.message.document.file_id;
    const jsonName = ctx.message.document.file_name.split(".")[0]; // наприклад, якщо файл має назву "data.json"
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

    // Відправляємо текстове повідомлення з координатами
    await ctx.reply(finalText);

    // Створюємо Buffer із текстом і відправляємо його як документ
    const documentBuffer = Buffer.from(finalText, "utf-8");
    await ctx.replyWithDocument({
      source: documentBuffer,
      filename: `${jsonName}_coord.txt`,
    });
  } catch (error) {
    console.error("Помилка обробки файлу:", error);
    ctx.reply("Сталася помилка при обробці файлу.");
  }
});

// Стандартний формат Netlify Functions
exports.handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    try {
      const update = JSON.parse(event.body);
      await bot.handleUpdate(update);
      return {
        statusCode: 200,
        body: "ok",
      };
    } catch (error) {
      console.error("Webhook error:", error);
      return {
        statusCode: 500,
        body: "Error",
      };
    }
  } else {
    return {
      statusCode: 200,
      body: "Telegram bot is running",
    };
  }
};
