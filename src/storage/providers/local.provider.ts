import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  IStorageProvider,
  UploadInput,
  UploadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('STORAGE_LOCAL_PATH') ?? './uploads';
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    await fs.mkdir(this.basePath, { recursive: true });
    const ext = path.extname(input.filename) || '';
    const key = `${randomUUID()}${ext}`;
    const fullPath = path.join(this.basePath, key);

    await fs.writeFile(fullPath, input.buffer);
    this.logger.log(`Uploaded: ${key}`);

    // In production, expose via static server or CDN
    return { url: `/uploads/${key}`, key };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    try {
      await fs.unlink(fullPath);
      this.logger.log(`Deleted: ${key}`);
    } catch (e: any) {
      this.logger.warn(`Failed to delete ${key}: ${e.message}`);
    }
  }
}
