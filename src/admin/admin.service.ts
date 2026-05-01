import { Injectable } from '@nestjs/common';
import { OrderService } from '../order/order.service';

@Injectable()
export class AdminService {
  constructor(private readonly orderService: OrderService) {}

  getStats() {
    return this.orderService.getStats();
  }

  pendingOrders() {
    return this.orderService.findPendingOrders();
  }
}
