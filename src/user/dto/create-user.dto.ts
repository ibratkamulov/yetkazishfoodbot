import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  telegramId!: number;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
