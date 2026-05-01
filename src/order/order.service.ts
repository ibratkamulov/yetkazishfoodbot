import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { UserService } from '../user/user.service';
import { OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_CREATED, ORDER_STATUS_CHANGED } from './order.events';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly userService: UserService,
    private readonly events: EventEmitter2,
  ) {}

  async checkout(userId: string, notes?: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!this.userService.isRegistered(user)) {
      throw new BadRequestException('User not fully registered');
    }

    const cart = await this.cartService.getCart(userId);
    if (this.cartService.isEmpty(cart)) {
      throw new BadRequestException('Cart is empty');
    }

    const items = this.cartService.toItems(cart);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;

    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee,
          total,
          deliveryName: user.name,
          deliveryPhone: user.phone!,
          deliveryLat: user.latitude!,
          deliveryLng: user.longitude!,
          deliveryAddress: user.address,
          notes,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              productName: it.name,
              unitPrice: it.price,
              quantity: it.quantity,
              totalPrice: it.price * it.quantity,
            })),
          },
        },
        include: { items: true, user: true },
      });
    });

    await this.cartService.clearCart(userId);
    this.events.emit(ORDER_CREATED, order);

    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus, reason?: string) {
    const data: any = { status };
    if (status === OrderStatus.ACCEPTED) data.acceptedAt = new Date();
    if (status === OrderStatus.DELIVERED) data.deliveredAt = new Date();
    if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) {
      data.cancelledAt = new Date();
      data.cancelReason = reason;
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true, user: true },
    });

    this.events.emit(ORDER_STATUS_CHANGED, order);
    return order;
  }

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, user: true, payment: true },
    });
  }

  findByOrderNumber(orderNumber: number) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, user: true, payment: true },
    });
  }

  findUserOrders(userId: string, take = 10) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take,
    });
  }

  findPendingOrders() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { items: true, user: true },
    });
  }

  async getStats() {
    const [totalOrders, pending, delivered, totalRevenue, totalUsers] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
        this.prisma.order.aggregate({
          where: { status: OrderStatus.DELIVERED },
          _sum: { total: true },
        }),
        this.userService.count(),
      ]);

    return {
      totalOrders,
      pending,
      delivered,
      totalUsers,
      revenue: Number(totalRevenue._sum.total ?? 0),
    };
  }
}
