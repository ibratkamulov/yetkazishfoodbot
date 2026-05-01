import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ORDER_CREATED, ORDER_STATUS_CHANGED } from '../order/order.events';
import { OrderStatus } from '@prisma/client';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '⏳ Kutilmoqda',
  ACCEPTED: '✅ Qabul qilindi',
  PREPARING: '👨‍🍳 Tayyorlanmoqda',
  ON_THE_WAY: '🚗 Yo\'lda',
  DELIVERED: '📦 Yetkazildi',
  CANCELLED: '❌ Bekor qilindi',
  REJECTED: '🚫 Rad etildi',
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly adminIds: number[];

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly config: ConfigService,
  ) {
    this.adminIds = (this.config.get<string>('BOT_ADMIN_IDS') ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter(Boolean);
  }

  @OnEvent(ORDER_CREATED)
  async onOrderCreated(order: any) {
    const text =
      `🆕 <b>Yangi buyurtma #${order.orderNumber}</b>\n\n` +
      `👤 ${order.deliveryName}\n` +
      `📞 ${order.deliveryPhone}\n` +
      `💰 ${Number(order.total).toLocaleString('uz-UZ')} so'm\n\n` +
      `<b>Mahsulotlar:</b>\n` +
      order.items
        .map(
          (i: any) =>
            `• ${i.productName} × ${i.quantity} = ${Number(i.totalPrice).toLocaleString('uz-UZ')}`,
        )
        .join('\n');

    for (const id of this.adminIds) {
      try {
        await this.bot.telegram.sendMessage(id, text, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Qabul qilish',
                  callback_data: `admin_accept_${order.id}`,
                },
                {
                  text: '❌ Rad etish',
                  callback_data: `admin_reject_${order.id}`,
                },
              ],
              [
                {
                  text: '📍 Lokatsiya',
                  callback_data: `admin_loc_${order.id}`,
                },
              ],
            ],
          },
        });
      } catch (e: any) {
        this.logger.error(`Notify admin ${id}: ${e.message}`);
      }
    }
  }

  @OnEvent(ORDER_STATUS_CHANGED)
  async onStatusChanged(order: any) {
    if (!order?.user?.telegramId) return;
    try {
      const label = STATUS_LABELS[order.status as OrderStatus] ?? order.status;
      await this.bot.telegram.sendMessage(
        Number(order.user.telegramId),
        `📦 Buyurtma <b>#${order.orderNumber}</b> holati: <b>${label}</b>`,
        { parse_mode: 'HTML' },
      );
    } catch (e: any) {
      this.logger.error(`Notify user: ${e.message}`);
    }
  }
}
