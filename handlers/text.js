const { Markup } = require("telegraf");
const films = require("../data-movie");
const mainKeyboard = require("../keyboard");
const { generateButtons } = require("./actions");

const ADMIN = 8322558694;
global.pendingReplies = {};
global.orderTime = {};
global.userLast = {};
global.waitOrder = {};

module.exports = async function handleText(bot, ctx) {
  const id = ctx.from.id;
  const text = ctx.message.text.trim();

  if (pendingReplies[id]) {
    const target = pendingReplies[id];
    await ctx.telegram.sendMessage(target, text);
    await ctx.telegram.sendMessage(id, "✅ Javob yuborildi.");
    delete pendingReplies[id];
    return;
  }

  if (waitOrder[id]) {
    waitOrder[id] = false;
    orderTime[id] = Date.now();
    const user = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.first_name} (${ctx.from.id})`;
    if (userLast[id]?.specialMsg) {
      await ctx.telegram.editMessageReplyMarkup(id, userLast[id].specialMsg, null, null).catch(() => {});
      delete userLast[id].specialMsg;
    }
    await ctx.reply("✅", { reply_markup: { remove_keyboard: true } });
    await ctx.telegram.sendMessage(ADMIN, `📥 Buyurtma: ${text}\n\n👤 User: ${user}`, Markup.inlineKeyboard([[Markup.button.callback("📩 Javob yozish", `reply_${ctx.from.id}`)]]));
    await ctx.reply("Buyurtma qabul qilindi. Tez orada javob qaytariladi. Iltimos, kuting...", Markup.inlineKeyboard([[Markup.button.callback("❌ Bekor qilish", "cancel_order")]]));
    return;
  }

  if (!/^\d+$/.test(text)) {
    return ctx.reply("Faqat film ID 𝗿𝗮𝗾𝗮𝗺𝗶𝗻𝗶 kiriting ❗️");
  }

  const old = userLast[id] || {};
  if (old.msg) ctx.telegram.deleteMessage(id, old.msg).catch(() => {});
  userLast[id] = {};

  let found;
  outer: for (const f in films) {
    for (const p in films[f]) {
      if (films[f][p] === +text) {
        found = { f, p };
        break outer;
      }
    }
  }

  if (found) return sendFilm(ctx, found.f, found.p);

  try {
    const sent = await ctx.telegram.copyMessage(id, "-1002556318549", +text);
    userLast[id].msg = sent.message_id;
  } catch {
    await ctx.reply("Film topilmadi ❌");
  }
};

async function sendFilm(ctx, f, p) {
  const id = ctx.chat.id;
  const msgId = films[f]?.[p];
  if (!msgId) return ctx.reply("Kechirasiz, texnik nosozlik ❌");
  try {
    const parts = Object.keys(films[f]);
    const reply_markup = generateButtons(f, parts, 1, p);
    if (userLast[id]?.msg) {
      await ctx.telegram.deleteMessage(id, userLast[id].msg).catch(() => {});
    }
    const sent = await ctx.telegram.copyMessage(id, "-1002556318549", msgId, { reply_markup });
    userLast[id] = { msg: sent.message_id };
  } catch {
    await ctx.reply("Filmni yuborishda xatolik yuz berdi ❌");
  }
}

module.exports.sendFilm = sendFilm;
