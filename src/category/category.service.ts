import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  findAll() {
    return this.repo.findAllActive();
  }

  async findBySlug(slug: string) {
    const category = await this.repo.findBySlug(slug);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  /**
   * Look up a category by its display label (used by Telegram keyboards
   * where users tap on text like "🥤 Ichimliklar").
   */
  async findByDisplayName(text: string) {
    const all = await this.repo.findAllActive();
    return (
      all.find((c) => {
        const label = `${c.emoji ?? ''} ${c.name}`.trim();
        return label === text.trim() || c.name === text.trim();
      }) ?? null
    );
  }

  create(dto: CreateCategoryDto) {
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.repo.update(id, dto);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
