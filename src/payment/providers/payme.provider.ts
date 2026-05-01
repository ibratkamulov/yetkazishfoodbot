import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import {
  IPaymentProvider,
  PaymentInitInput,
  PaymentInitResult,
  PaymentVerifyResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class PaymeProvider implements IPaymentProvider {
  readonly name = PaymentProvider.PAYME;
  private readonly logger = new Logger(PaymeProvider.name);

  constructor(private readonly config: ConfigService) {}

  async init(input: PaymentInitInput): Promise<PaymentInitResult> {
    const merchantId = this.config.get<string>('PAYME_MERCHANT_ID');

    // Payme uses base64-encoded URL params for the checkout link
    const params = `m=${merchantId};ac.order_id=${input.orderId};a=${input.amount * 100}`;
    const encoded = Buffer.from(params).toString('base64');
    const paymentUrl = `https://checkout.paycom.uz/${encoded}`;

    const externalId = `payme_${input.orderId}_${Date.now()}`;
    this.logger.log(`Initiated Payme payment ${externalId}`);

    return { externalId, paymentUrl, raw: { stub: true, merchantId } };
  }

  async verify(externalId: string): Promise<PaymentVerifyResult> {
    this.logger.log(`Verifying Payme payment ${externalId}`);
    // TODO: implement Payme JSON-RPC checkout API
    return { paid: false, externalId, raw: { stub: true } };
  }

  async refund(externalId: string, amount?: number): Promise<void> {
    this.logger.log(`Refunding Payme ${externalId} amount=${amount}`);
    // TODO: implement Payme refund
  }
}
