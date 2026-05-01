import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { StripeProvider } from './providers/stripe.provider';
import { IPaymentProvider } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentService {
  private readonly providers: Map<PaymentProvider, IPaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    click: ClickProvider,
    payme: PaymeProvider,
    stripe: StripeProvider,
  ) {
    this.providers = new Map<PaymentProvider, IPaymentProvider>([
      [PaymentProvider.CLICK, click],
      [PaymentProvider.PAYME, payme],
      [PaymentProvider.STRIPE, stripe],
    ]);
  }

  private getProvider(name: PaymentProvider): IPaymentProvider {
    const p = this.providers.get(name);
    if (!p) throw new NotFoundException(`Payment provider ${name} not found`);
    return p;
  }

  async initiate(orderId: string, providerName: PaymentProvider) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (providerName === PaymentProvider.CASH) {
      return this.prisma.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          provider: providerName,
          status: PaymentStatus.PENDING,
          amount: order.total,
          currency: 'UZS',
        },
        update: {
          provider: providerName,
          status: PaymentStatus.PENDING,
          amount: order.total,
        },
      });
    }

    const provider = this.getProvider(providerName);
    const result = await provider.init({
      orderId,
      amount: Number(order.total),
      currency: 'UZS',
    });

    return this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        provider: providerName,
        status: PaymentStatus.PROCESSING,
        amount: order.total,
        currency: 'UZS',
        externalId: result.externalId,
        rawResponse: result.raw,
      },
      update: {
        provider: providerName,
        status: PaymentStatus.PROCESSING,
        externalId: result.externalId,
        rawResponse: result.raw,
      },
    });
  }

  async verify(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment || !payment.externalId) {
      throw new NotFoundException('Payment not found');
    }
    const provider = this.getProvider(payment.provider);
    const result = await provider.verify(payment.externalId);

    if (result.paid) {
      return this.prisma.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });
    }
    return payment;
  }

  async markPaid(externalId: string) {
    return this.prisma.payment.updateMany({
      where: { externalId },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });
  }
}
