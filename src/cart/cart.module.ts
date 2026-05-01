import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
