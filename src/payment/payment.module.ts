import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ClickProvider } from './providers/click.provider';
import { PaymeProvider } from './providers/payme.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  providers: [PaymentService, ClickProvider, PaymeProvider, StripeProvider],
  exports: [PaymentService],
})
export class PaymentModule {}
