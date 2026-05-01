import { PaymentProvider as ProviderEnum } from '@prisma/client';

export interface PaymentInitInput {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  description?: string;
}

export interface PaymentInitResult {
  externalId: string;
  paymentUrl?: string;
  raw: any;
}

export interface PaymentVerifyResult {
  paid: boolean;
  externalId: string;
  raw: any;
}

export interface IPaymentProvider {
  readonly name: ProviderEnum;
  init(input: PaymentInitInput): Promise<PaymentInitResult>;
  verify(externalId: string): Promise<PaymentVerifyResult>;
  refund?(externalId: string, amount?: number): Promise<void>;
}
