import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findByCategorySlug(slug: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { category: { slug }, isAvailable: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findAll(params: { skip?: number; take?: number; categoryId?: string } = {}) {
    return this.prisma.product.findMany({
      where: params.categoryId ? { categoryId: params.categoryId } : {},
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }

  delete(id: string): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }
}
