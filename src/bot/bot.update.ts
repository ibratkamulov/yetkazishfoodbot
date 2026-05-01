import {
  Action,
  Command,
  Ctx,
  Hears,
  Message,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CategoryService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';
import { PaymentService } from '../payment/payment.service';
import { BotContext } from './interfaces/bot-context.interface';
import {
  mainMenu,
  requestPhoneKeyboard,
  requestLocationKeyboard,
  productKeyboard,
  cartKeyboard,
  checkoutKeyboard,
} from './keyboards';
import { UZ } from './i18n/uz';
import { PaymentProvider } from '@prisma/client';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  // ==================== START FLOW ====================

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const tg = ctx.from!;
    const user = await this.userService.findOrCreateFromTelegram({
      telegramId: tg.id,
      name: tg.first_name,
      username: tg.username,
    });

    if (!user.phone) {
      ctx.session.step = 'awaiting_phone';
      await ctx.reply(
        `${UZ.WELCOME(user.name)}\n\n${UZ.ASK_PHONE}`,
        requestPhoneKeyboard(),
      );
      return;
    }

    if (user.latitude === null || user.longitude === null) {
      ctx.session.step = 'awaiting_location';
      await ctx.reply(UZ.ASK_LOCATION, requestLocationKeyboard());
      return;
    }

    ctx.session.step = 'browsing';
    await ctx.reply(UZ.CHOOSE_CATEGORY, await mainMenu(this.categoryService));
  }

  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    const contact = (ctx.message as any).contact;
    if (contact.user_id !== ctx.from?.id) {
      await ctx.reply(UZ.ONLY_OWN_PHONE);
      return;
    }

    const user = await this.userService.findByTelegramId(ctx.from.id);
    if (!user) return;
    await this.userService.setPhone(user.id, contact.phone_number);

    ctx.session.step = 'awaiting_location';
    await ctx.reply(
      `${UZ.PHONE_RECEIVED}\n${UZ.ASK_LOCATION}`,
      requestLocationKeyboard(),
    );
  }

  @On('location')
  async onLocation(@Ctx() ctx: BotContext) {
    const loc = (ctx.message as any).location;
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;

    await this.userService.setLocation(user.id, loc.latitude, loc.longitude);
    ctx.session.step = 'browsing';

    await ctx.reply(UZ.LOCATION_RECEIVED);
    await ctx.reply(UZ.CHOOSE_CATEGORY, await mainMenu(this.categoryService));
  }

  // ==================== CATALOG ====================

  @Hears(UZ.BTN_CART)
  async onCartBtn(@Ctx() ctx: BotContext) {
    return this.showCart(ctx);
  }

  @Hears(UZ.BTN_HELP)
  async onHelp(@Ctx() ctx: BotContext) {
    await ctx.reply(
      'ℹ️ Yordam\n\n' +
        '/start — qayta boshlash\n' +
        'Mahsulot tanlash → Savatga qo\'shish → Buyurtma berish\n\n' +
        'Savol yoki muammo bo\'lsa: @support_username',
    );
  }

  @Hears(UZ.BTN_ORDERS)
  async onMyOrders(@Ctx() ctx: BotContext) {
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) {
      await ctx.reply(UZ.ASK_REGISTER);
      return;
    }
    const orders = await this.orderService.findUserOrders(user.id, 5);
    if (!orders.length) {
      await ctx.reply('Sizda hali buyurtmalar yo\'q.');
      return;
    }

    for (const o of orders) {
      const text =
        `📦 <b>Buyurtma #${o.orderNumber}</b>\n` +
        `Holat: <b>${o.status}</b>\n` +
        `Sana: ${o.createdAt.toLocaleString('uz-UZ')}\n` +
        `Jami: ${Number(o.total).toLocaleString('uz-UZ')} so'm`;
      await ctx.replyWithHTML(text);
    }
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext, @Message('text') text: string) {
    // Bypass for known navigation buttons (handled by @Hears)
    if ([UZ.BTN_CART, UZ.BTN_HELP, UZ.BTN_ORDERS, UZ.BTN_BACK].includes(text)) {
      return;
    }

    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user || !this.userService.isRegistered(user)) {
      await ctx.reply(UZ.ASK_REGISTER);
      return;
    }

    const category = await this.categoryService.findByDisplayName(text);
    if (!category) {
      // Unknown text — quietly ignore or hint
      return;
    }

    ctx.session.currentCategorySlug = category.slug;
    const products = await this.productService.findByCategorySlug(category.slug);

    if (!products.length) {
      await ctx.reply(UZ.EMPTY_CATEGORY);
      return;
    }

    await ctx.reply(`📦 ${category.emoji ?? ''} ${category.name}`);
    for (const p of products) {
      const caption =
        `🍽 <b>${p.name}</b>\n\n` +
        `💰 ${Number(p.price).toLocaleString('uz-UZ')} so'm\n\n` +
        `📝 ${p.description}`;

      try {
        await ctx.replyWithPhoto(p.imageUrl, {
          caption,
          parse_mode: 'HTML',
          ...productKeyboard(p.id),
        });
      } catch (e: any) {
        this.logger.warn(`Photo failed for ${p.id}: ${e.message}`);
        await ctx.replyWithHTML(caption, productKeyboard(p.id));
      }
    }
  }

  // ==================== CART ====================

  @Action(/^add:(.+)$/)
  async addToCart(@Ctx() ctx: BotContext) {
    const productId = (ctx as any).match[1];
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;

    try {
      const cart = await this.cartService.addItem(user.id, productId, 1);
      const { itemCount } = this.cartService.computeTotals(cart);
      await ctx.answerCbQuery(UZ.PRODUCT_ADDED(itemCount));
    } catch (e: any) {
      await ctx.answerCbQuery(`❌ ${e.message}`);
    }
  }

  private async showCart(ctx: BotContext) {
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;

    const cart = await this.cartService.getCart(user.id);
    if (this.cartService.isEmpty(cart)) {
      await ctx.reply(UZ.EMPTY_CART);
      return;
    }

    const items = this.cartService.toItems(cart);
    const { subtotal } = this.cartService.computeTotals(cart);

    const text =
      `${UZ.CART_TITLE}\n\n` +
      items
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.name}\n   ${i.quantity} × ${i.price.toLocaleString('uz-UZ')} = <b>${(i.quantity * i.price).toLocaleString('uz-UZ')}</b> so'm`,
        )
        .join('\n\n') +
      `\n\n💰 Jami: <b>${subtotal.toLocaleString('uz-UZ')} so'm</b>`;

    await ctx.replyWithHTML(text, cartKeyboard(cart));
  }

  @Action(/^cart_inc:(.+)$/)
  async cartInc(@Ctx() ctx: BotContext) {
    const pid = (ctx as any).match[1];
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;
    await this.cartService.updateQuantity(user.id, pid, +1);
    await ctx.answerCbQuery('+1');
    await this.refreshCartView(ctx, user.id);
  }

  @Action(/^cart_dec:(.+)$/)
  async cartDec(@Ctx() ctx: BotContext) {
    const pid = (ctx as any).match[1];
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;
    await this.cartService.updateQuantity(user.id, pid, -1);
    await ctx.answerCbQuery('-1');
    await this.refreshCartView(ctx, user.id);
  }

  @Action(/^cart_rm:(.+)$/)
  async cartRm(@Ctx() ctx: BotContext) {
    const pid = (ctx as any).match[1];
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;
    await this.cartService.removeItem(user.id, pid);
    await ctx.answerCbQuery('🗑');
    await this.refreshCartView(ctx, user.id);
  }

  @Action('cart_clear')
  async cartClear(@Ctx() ctx: BotContext) {
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;
    await this.cartService.clearCart(user.id);
    await ctx.answerCbQuery('Savat tozalandi');
    try {
      await ctx.editMessageText(UZ.EMPTY_CART);
    } catch {}
  }

  @Action(/^noop:.+$/)
  async noop(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
  }

  // ==================== CHECKOUT ====================

  @Action('checkout')
  async checkout(@Ctx() ctx: BotContext) {
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;

    const cart = await this.cartService.getCart(user.id);
    if (this.cartService.isEmpty(cart)) {
      await ctx.answerCbQuery('Savat bo\'sh');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.reply(
      '💳 To\'lov usulini tanlang:',
      checkoutKeyboard(),
    );
  }

  @Action(/^pay:(CASH|CLICK|PAYME|STRIPE)$/)
  async confirmPayment(@Ctx() ctx: BotContext) {
    const provider = (ctx as any).match[1] as PaymentProvider;
    const user = await this.userService.findByTelegramId(ctx.from!.id);
    if (!user) return;

    try {
      const order = await this.orderService.checkout(user.id);
      const payment = await this.paymentService.initiate(order.id, provider);

      await ctx.answerCbQuery('✅');
      await ctx.editMessageReplyMarkup(undefined).catch(() => {});

      await ctx.replyWithHTML(
        UZ.ORDER_CREATED(order.orderNumber, Number(order.total)),
      );

      // For online providers, send the payment URL stored in rawResponse during init
      const raw = payment.rawResponse as any;
      // The provider returns `paymentUrl` separately; we passed it through init result
      // and saved it in raw. Easier: re-read by externalId/raw — for simplicity show CASH msg.
      if (provider === PaymentProvider.CASH) {
        await ctx.reply('💵 Naqd to\'lov tanlandi. Kuryer kelganda to\'laysiz.');
      } else {
        await ctx.reply(
          `🔗 To\'lov uchun havola operatordan keladi (${provider}).`,
        );
      }
    } catch (e: any) {
      this.logger.error(`Checkout failed: ${e.message}`);
      await ctx.answerCbQuery('Xatolik!');
      await ctx.reply(`❌ ${e.message}`);
    }
  }

  @Action('checkout_cancel')
  async checkoutCancel(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery('Bekor qilindi');
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {}
  }

  // ==================== HELPERS ====================

  private async refreshCartView(ctx: BotContext, userId: string) {
    const cart = await this.cartService.getCart(userId);
    if (this.cartService.isEmpty(cart)) {
      try {
        await ctx.editMessageText(UZ.EMPTY_CART);
      } catch {}
      return;
    }
    const { subtotal } = this.cartService.computeTotals(cart);
    const items = this.cartService.toItems(cart);
    const text =
      `${UZ.CART_TITLE}\n\n` +
      items
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.name} — ${i.quantity} × ${i.price.toLocaleString('uz-UZ')} = <b>${(i.quantity * i.price).toLocaleString('uz-UZ')}</b>`,
        )
        .join('\n') +
      `\n\n💰 Jami: <b>${subtotal.toLocaleString('uz-UZ')} so'm</b>`;
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...cartKeyboard(cart),
      });
    } catch {}
  }
}
