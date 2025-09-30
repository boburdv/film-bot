const { Markup } = require("telegraf");

const CHANNEL = "-1002556318549";
global.userLast = {};
global.waitOrder = {};

module.exports = async function handleBuyurtma(bot, ctx) {
  const userId = ctx.from.id;
  waitOrder[userId] = true;

  const msg = await ctx.telegram.copyMessage(userId, CHANNEL, 75, {
    caption: "Buyurtma qilishdan oldin ushbu videoni albatta ko'ring!\n\nTelegram kanal: @movely_studios",
    reply_markup: Markup.inlineKeyboard([[Markup.button.callback("Ortga qaytish", "go_back")]]).reply_markup,
  });

  userLast[userId] = { specialMsg: msg.message_id };
};
