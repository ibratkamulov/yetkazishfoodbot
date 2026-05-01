import { Markup } from 'telegraf';
import { Cart } from '../../cart/interfaces/cart.interface';
import { UZ } from '../i18n/uz';

export const cartKeyboard = (cart: Cart) => {
  const items = Object.values(cart.items);
  const rows = items.map((item) => [
    Markup.button.callback(`➖`, `cart_dec:${item.productId}`),
    Markup.button.callback(
      `${item.name} (${item.quantity})`,
      `noop:${item.productId}`,
    ),
    Markup.button.callback(`➕`, `cart_inc:${item.productId}`),
    Markup.button.callback(`🗑`, `cart_rm:${item.productId}`),
  ]);
  rows.push([
    Markup.button.callback(UZ.BTN_CLEAR, 'cart_clear'),
    Markup.button.callback(UZ.BTN_CHECKOUT, 'checkout'),
  ]);
  return Markup.inlineKeyboard(rows);
};
