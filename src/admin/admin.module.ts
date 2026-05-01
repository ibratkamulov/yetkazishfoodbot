import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUpdate } from './admin.update';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [AdminController],
  providers: [AdminService, AdminUpdate],
  exports: [AdminService],
})
export class AdminModule {}
