import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import {
  IStorageProvider,
  UploadInput,
  UploadResult,
} from '../interfaces/storage-provider.interface';

/**
 * S3-compatible storage provider (works with AWS S3, MinIO, R2, etc.).
 * NOTE: To use this, install `@aws-sdk/client-s3` and uncomment the SDK calls.
 * The structure here is intentionally ready to plug in.
 */
@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly bucket?: string;
  private readonly endpoint?: string;
  private readonly region?: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET');
    this.endpoint = this.config.get<string>('S3_ENDPOINT');
    this.region = this.config.get<string>('S3_REGION');
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const ext = path.extname(input.filename) || '';
    const key = `${randomUUID()}${ext}`;

    // TODO: With @aws-sdk/client-s3:
    //   const client = new S3Client({ region, endpoint, credentials: {...} });
    //   await client.send(new PutObjectCommand({
    //     Bucket: this.bucket, Key: key, Body: input.buffer,
    //     ContentType: input.mimetype, ACL: 'public-read',
    //   }));

    const url = this.endpoint
      ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    this.logger.log(`(stub) S3 upload: ${key}`);
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    // TODO: implement S3 DeleteObject
    this.logger.log(`(stub) S3 delete: ${key}`);
  }
}
