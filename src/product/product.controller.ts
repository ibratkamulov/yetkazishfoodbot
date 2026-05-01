import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(@Query('categoryId') categoryId?: string) {
    return this.productService.list({ categoryId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @UseGuards(ApiKeyGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @UseGuards(ApiKeyGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
