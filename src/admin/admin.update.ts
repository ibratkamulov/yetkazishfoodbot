import { Update, Command, Ctx, Action } from 'nestjs-telegraf';
import { Logger, UseGuards } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { TelegramAdminGuard } from '../common/guards/admin.guard';
import { OrderStatus } from '@prisma/client';
import { BotContext } from '../bot/interfaces/bot-context.interface';

@Update()
@UseGuards(TelegramAdminGuard)
export class AdminUpdate {
  private readonly logger = new Logger(AdminUpdate.name);

  constructor(private readonly orderService: OrderService) {}

  @Command('orders')
  async listPending(@Ctx() ctx: BotContext) {
    const orders = await this.orderService.findPendingOrders();
    if (!orders.length) {
      await ctx.reply('Kutilayotgan buyurtmalar yo\'q.');
      return;
    }

    for (const order of orders) {
      const text =
        `🆕 <b>Buyurtma #${order.orderNumber}</b>\n` +
        `👤 ${order.deliveryName} | ${order.deliveryPhone}\n` +
        `💰 ${Number(order.total).toLocaleString('uz-UZ')} so'm\n\n` +
        `<b>Mahsulotlar:</b>\n` +
        order.items
          .map((i: any) => `   • ${i.productName} × ${i.quantity}`)
          .join('\n');

      await ctx.replyWithHTML(text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Qabul', callback_data: `admin_accept_${order.id}` },
              { text: '❌ Rad', callback_data: `admin_reject_${order.id}` },
            ],
          ],
        },
      });
    }
  }

  @Action(/^admin_accept_(.+)$/)
  async accept(@Ctx() ctx: BotContext) {
    const orderId = (ctx as any).match[1];
    await this.orderService.updateStatus(orderId, OrderStatus.ACCEPTED);
    await ctx.answerCbQuery('✅ Qabul qilindi');
    try { await ctx.editMessageReplyMarkup(undefined); } catch {}
  }

  @Action(/^admin_reject_(.+)$/)
  async reject(@Ctx() ctx: BotContext) {
    const orderId = (ctx as any).match[1];
    await this.orderService.updateStatus(
      orderId,
      OrderStatus.REJECTED,
      'Rejected by admin',
    );
    await ctx.answerCbQuery('❌ Rad etildi');
    try { await ctx.editMessageReplyMarkup(undefined); } catch {}
  }

  @Action(/^admin_loc_(.+)$/)
  async location(@Ctx() ctx: BotContext) {
    const orderId = (ctx as any).match[1];
    const order = await this.orderService.findById(orderId);
    if (!order) {
      await ctx.answerCbQuery('Topilmadi');
      return;
    }
    await ctx.answerCbQuery();
    await ctx.replyWithLocation(order.deliveryLat, order.deliveryLng);
  }

  @Command('deliver')
  async setDelivered(@Ctx() ctx: BotContext) {
    const text = (ctx.message as any)?.text ?? '';
    const parts = text.split(' ');
    if (parts.length < 2) {
      await ctx.reply('Foydalanish: /deliver <orderNumber>');
      return;
    }
    const orderNumber = Number(parts[1]);
    const order = await this.orderService.findByOrderNumber(orderNumber);
    if (!order) {
      await ctx.reply('Buyurtma topilmadi.');
      return;
    }
    await this.orderService.updateStatus(order.id, OrderStatus.DELIVERED);
    await ctx.reply(`✅ Buyurtma #${orderNumber} yetkazildi.`);
  }

  @Command('stats')
  async stats(@Ctx() ctx: BotContext) {
    const s = await this.orderService.getStats();
    await ctx.replyWithHTML(
      `📊 <b>Statistika</b>\n\n` +
        `👥 Foydalanuvchilar: ${s.totalUsers}\n` +
        `📦 Jami buyurtmalar: ${s.totalOrders}\n` +
        `⏳ Kutilmoqda: ${s.pending}\n` +
        `✅ Yetkazilgan: ${s.delivered}\n` +
        `💰 Daromad: ${s.revenue.toLocaleString('uz-UZ')} so'm`,
    );
  }
}