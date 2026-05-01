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
export class ClickProvider implements IPaymentProvider {
  readonly name = PaymentProvider.CLICK;
  private readonly logger = new Logger(ClickProvider.name);

  constructor(private readonly config: ConfigService) {}

  async init(input: PaymentInitInput): Promise<PaymentInitResult> {
    const merchantId = this.config.get<string>('CLICK_MERCHANT_ID');
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID');

    // Production: real Click API integration goes here.
    // Click typically uses a redirect-based payment URL.
    const externalId = `click_${input.orderId}_${Date.now()}`;
    const paymentUrl =
      `https://my.click.uz/services/pay?service_id=${serviceId}` +
      `&merchant_id=${merchantId}&amount=${input.amount}` +
      `&transaction_param=${input.orderId}`;

    this.logger.log(`Initiated Click payment ${externalId}`);
    return { externalId, paymentUrl, raw: { stub: true, merchantId, serviceId } };
  }

  async verify(externalId: string): Promise<PaymentVerifyResult> {
    this.logger.log(`Verifying Click payment ${externalId}`);
    // TODO: call Click API to verify
    return { paid: false, externalId, raw: { stub: true } };
  }

  async refund(externalId: string, amount?: number): Promise<void> {
    this.logger.log(`Refunding Click ${externalId} amount=${amount}`);
    // TODO: implement Click refund API
  }
}
