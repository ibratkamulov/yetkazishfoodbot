export const UZ = {
  WELCOME: (name: string) =>
    `Assalomu alaykum, ${name}! 👋\nFastfood botimizga xush kelibsiz.`,
  ASK_PHONE: 'Iltimos, telefon raqamingizni yuboring:',
  ASK_LOCATION: 'Endi lokatsiyangizni yuboring:',
  PHONE_RECEIVED: '✅ Telefon qabul qilindi!',
  LOCATION_RECEIVED: '✅ Lokatsiya qabul qilindi!',
  CHOOSE_CATEGORY: '📋 Quyidagi kategoriyalardan birini tanlang:',
  EMPTY_CATEGORY: 'Bu kategoriyada hozircha mahsulotlar yo\'q.',
  EMPTY_CART: '🛒 Savat bo\'sh.',
  CART_TITLE: '🛒 <b>Savat</b>',
  ASK_REGISTER: 'Iltimos, /start buyrug\'ini bosing.',
  ONLY_OWN_PHONE: '❌ Faqat o\'zingizning raqamingizni yuboring.',
  PRODUCT_ADDED: (n: number) => `✅ Savatga qo'shildi (jami: ${n})`,
  ORDER_CREATED: (n: number, total: number) =>
    `🎉 <b>Buyurtma #${n} qabul qilindi!</b>\n\n` +
    `💰 ${total.toLocaleString('uz-UZ')} so'm\n` +
    `📞 Operator tez orada bog'lanadi.`,

  BTN_CART: '🛒 Savat',
  BTN_ORDERS: '📦 Mening buyurtmalarim',
  BTN_HELP: 'ℹ️ Yordam',
  BTN_BACK: '⬅️ Orqaga',
  BTN_CHECKOUT: '✅ Buyurtma berish',
  BTN_CLEAR: '🗑 Tozalash',
  BTN_ADD: '🛒 Savatga qo\'shish',
};
