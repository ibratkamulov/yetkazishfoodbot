import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { OrderService } from '../order/order.service';
import { UpdateOrderStatusDto } from '../order/dto/update-order-status.dto';

@UseGuards(ApiKeyGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly orderService: OrderService) {}

  @Get('orders/pending')
  pending() {
    return this.orderService.findPendingOrders();
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Get('stats')
  stats() {
    return this.orderService.getStats();
  }

  @Patch('orders/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto.status, dto.reason);
  }
}
