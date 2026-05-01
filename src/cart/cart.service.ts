import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ProductService } from '../product/product.service';
import { Cart, CartItem } from './interfaces/cart.interface';

@Injectable()
export class CartService {
  private readonly TTL = 60 * 60 * 24 * 3; // 3 days
  private readonly keyPrefix = 'cart:';

  constructor(
    private readonly redis: RedisService,
    private readonly productService: ProductService,
  ) {}

  private key(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.redis.get<Cart>(this.key(userId));
    return cart ?? { userId, items: {}, updatedAt: Date.now() };
  }

  async addItem(userId: string, productId: string, qty = 1): Promise<Cart> {
    const product = await this.productService.findById(productId);
    if (!product || !product.isAvailable) {
      throw new NotFoundException('Product not available');
    }

    const cart = await this.getCart(userId);
    const existing = cart.items[productId];

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items[productId] = {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: qty,
        imageUrl: product.imageUrl,
      };
    }

    cart.updatedAt = Date.now();
    await this.redis.set(this.key(userId), cart, this.TTL);
    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    delete cart.items[productId];
    cart.updatedAt = Date.now();
    await this.redis.set(this.key(userId), cart, this.TTL);
    return cart;
  }

  async updateQuantity(
    userId: string,
    productId: string,
    delta: number,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items[productId];
    if (!item) return cart;

    item.quantity += delta;
    if (item.quantity <= 0) {
      delete cart.items[productId];
    }

    cart.updatedAt = Date.now();
    await this.redis.set(this.key(userId), cart, this.TTL);
    return cart;
  }

  async setQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items[productId];
    if (!item) return cart;

    if (quantity <= 0) {
      delete cart.items[productId];
    } else {
      item.quantity = quantity;
    }
    cart.updatedAt = Date.now();
    await this.redis.set(this.key(userId), cart, this.TTL);
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  computeTotals(cart: Cart): { subtotal: number; itemCount: number } {
    const items = Object.values(cart.items);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { subtotal, itemCount };
  }

  isEmpty(cart: Cart): boolean {
    return Object.keys(cart.items).length === 0;
  }

  toItems(cart: Cart): CartItem[] {
    return Object.values(cart.items);
  }
}
