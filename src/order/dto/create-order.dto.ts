import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
