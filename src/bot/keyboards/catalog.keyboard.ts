import { Markup } from 'telegraf';
import { UZ } from '../i18n/uz';

export const productKeyboard = (productId: string) =>
  Markup.inlineKeyboard([
    Markup.button.callback(UZ.BTN_ADD, `add:${productId}`),
  ]);
