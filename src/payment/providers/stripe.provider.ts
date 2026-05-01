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
export class StripeProvider implements IPaymentProvider {
  readonly name = PaymentProvider.STRIPE;
  private readonly logger = new Logger(StripeProvider.name);

  constructor(private readonly config: ConfigService) {}

  async init(input: PaymentInitInput): Promise<PaymentInitResult> {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('Stripe secret key is not configured');
    }

    // TODO: Use real `stripe` SDK to create a PaymentIntent / Checkout Session.
    const externalId = `stripe_${input.orderId}_${Date.now()}`;
    return {
      externalId,
      paymentUrl: undefined,
      raw: { stub: true },
    };
  }

  async verify(externalId: string): Promise<PaymentVerifyResult> {
    this.logger.log(`Verifying Stripe payment ${externalId}`);
    return { paid: false, externalId, raw: { stub: true } };
  }

  async refund(externalId: string, amount?: number): Promise<void> {
    this.logger.log(`Refunding Stripe ${externalId} amount=${amount}`);
  }
}
