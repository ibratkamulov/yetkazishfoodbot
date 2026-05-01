import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    UserModule,
    CategoryModule,
    ProductModule,
    CartModule,
    OrderModule,
    PaymentModule,
  ],
  providers: [BotUpdate],
})
export class BotModule {}
