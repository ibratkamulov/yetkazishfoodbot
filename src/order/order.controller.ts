import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(ApiKeyGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('pending')
  pending() {
    return this.orderService.findPendingOrders();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status, dto.reason);
  }
}
