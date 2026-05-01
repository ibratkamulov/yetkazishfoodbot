export interface UploadInput {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface IStorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
