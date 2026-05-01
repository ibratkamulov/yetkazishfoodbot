import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly repo: ProductRepository) {}

  async findById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  findByCategorySlug(slug: string) {
    return this.repo.findByCategorySlug(slug);
  }

  list(params: { skip?: number; take?: number; categoryId?: string }) {
    return this.repo.findAll(params);
  }

  create(dto: CreateProductDto) {
    const { categoryId, ...rest } = dto;
    return this.repo.create({
      ...rest,
      category: { connect: { id: categoryId } },
    });
  }

  update(id: string, dto: UpdateProductDto) {
    const { categoryId, ...rest } = dto;
    const data: any = { ...rest };
    if (categoryId) data.category = { connect: { id: categoryId } };
    return this.repo.update(id, data);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
