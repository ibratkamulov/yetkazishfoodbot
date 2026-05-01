import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  list() {
    return this.categoryService.findAll();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @UseGuards(ApiKeyGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @UseGuards(ApiKeyGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
