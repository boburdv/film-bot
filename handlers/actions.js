const { Markup } = require("telegraf");
const films = require("../data-movie");
const mainKeyboard = require("../keyboard");

const ADMIN = 8322558694;

function handleActions(bot) {
  bot.action("cancel_order", async (ctx) => {
    const user = ctx.from.username || ctx.from.first_name;
    delete waitOrder[ctx.from.id];
    await ctx.deleteMessage().catch(() => {});
    await ctx.reply("Buyurtma bekor qilindi ✅", mainKeyboard);
    await ctx.telegram.sendMessage(ADMIN, `${user} buyurtmani bekor qildi.`);
    await ctx.answerCbQuery();
  });

  bot.action(/^reply_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    pendingReplies[ctx.from.id] = userId;
    await ctx.reply("Marhamat, foydalanuvchiga xabar yuboring.");
    await ctx.answerCbQuery();
  });

  bot.action("go_back", async (ctx) => {
    const id = ctx.from.id;
    delete waitOrder[id];
    if (userLast[id]?.specialMsg) {
      await ctx.telegram.deleteMessage(id, userLast[id].specialMsg).catch(() => {});
      delete userLast[id].specialMsg;
    }
    await ctx.answerCbQuery();
    await ctx.reply("Bosh menuga qaytdingiz ✅", mainKeyboard);
  });

  bot.action(/nav_(.+)_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const [_, f, page] = ctx.match;
    const id = ctx.from.id;
    const parts = Object.keys(films[f]);
    const reply_markup = undefined;

    if (userLast[id]?.msg) {
      await ctx.telegram.editMessageReplyMarkup(id, userLast[id].msg, null, reply_markup).catch(() => {});
    }
  });

  const { sendFilm } = require("./text");

  bot.action(/(.+)_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const [_, f, p] = ctx.match;
    const id = ctx.from.id;

    if (userLast[id]?.msg) {
      await ctx.telegram.deleteMessage(id, userLast[id].msg).catch(() => {});
    }

    await sendFilm(ctx, f, p);
  });

  bot.action("go_back_main", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("Bosh menyuga qaytdingiz ✅", mainKeyboard);
  });
}

function generateButtons(f, parts, page = 1, current = null) {
  const total = parts.length;
  if (total <= 1) return undefined;

  if (current) {
    const currentIndex = parts.indexOf(String(current));
    const buttons = [];
    const prev = parts[currentIndex - 1];
    const next = parts[currentIndex + 1];

    if (prev) buttons.push(Markup.button.callback(`${prev}-qism`, `${f}_${prev}`));
    if (next) buttons.push(Markup.button.callback(`${next}-qism`, `${f}_${next}`));

    if (buttons.length === 1) {
      const prev2 = parts[currentIndex - 2];
      const next2 = parts[currentIndex + 2];

      if (!prev && next2) buttons.push(Markup.button.callback(`${next2}-qism`, `${f}_${next2}`));
      else if (!next && prev2) buttons.unshift(Markup.button.callback(`${prev2}-qism`, `${f}_${prev2}`));
    }

    return Markup.inlineKeyboard([buttons]).reply_markup;
  }

  return undefined;
}

module.exports = handleActions;
module.exports.generateButtons = generateButtons;
