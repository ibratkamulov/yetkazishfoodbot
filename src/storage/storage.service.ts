import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './providers/local.provider';
import { S3StorageProvider } from './providers/s3.provider';
import {
  IStorageProvider,
  UploadInput,
} from './interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: IStorageProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly local: LocalStorageProvider,
    private readonly s3: S3StorageProvider,
  ) {
    const name = this.config.get<string>('STORAGE_PROVIDER') ?? 'local';
    this.provider = name === 's3' ? this.s3 : this.local;
    this.logger.log(`Storage provider: ${name}`);
  }

  upload(input: UploadInput) {
    return this.provider.upload(input);
  }

  delete(key: string) {
    return this.provider.delete(key);
  }
}
