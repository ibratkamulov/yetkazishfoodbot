import { Markup } from 'telegraf';

export const checkoutKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('💵 Naqd', 'pay:CASH'),
      Markup.button.callback('💳 Click', 'pay:CLICK'),
    ],
    [
      Markup.button.callback('💳 Payme', 'pay:PAYME'),
    ],
    [Markup.button.callback('❌ Bekor qilish', 'checkout_cancel')],
  ]);
