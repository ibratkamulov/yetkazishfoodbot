import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  PORT!: number;

  @IsString()
  BOT_TOKEN!: string;

  @IsString()
  BOT_ADMIN_IDS!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_HOST!: string;

  @IsNumber()
  REDIS_PORT!: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsNumber()
  REDIS_DB?: number;

  @IsString()
  ADMIN_API_KEY!: string;

  @IsOptional()
  @IsString()
  STORAGE_PROVIDER?: string;

  @IsOptional()
  @IsNumber()
  THROTTLE_TTL?: number;

  @IsOptional()
  @IsNumber()
  THROTTLE_LIMIT?: number;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(
      `Config validation error:\n${errors.map((e) => e.toString()).join('\n')}`,
    );
  }
  return validated;
}
