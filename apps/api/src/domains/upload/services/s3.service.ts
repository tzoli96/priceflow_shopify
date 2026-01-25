import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  contentType: string;
  size: number;
}

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  acl?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpointUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || 'priceflow-uploads';
    this.endpointUrl = process.env.AWS_ENDPOINT_URL || 'http://localstack:4566';

    this.s3Client = new S3Client({
      endpoint: this.endpointUrl,
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      forcePathStyle: true, // Required for LocalStack
    });

    this.logger.log(`S3Service initialized with bucket: ${this.bucket}`);
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const { folder = 'uploads', contentType } = options;

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${randomId}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: contentType || file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully: ${key}`);

      // Generate public URL
      const url = this.getPublicUrl(key);

      return {
        key,
        url,
        bucket: this.bucket,
        contentType: contentType || file.mimetype,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload a buffer to S3
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const { folder = 'uploads' } = options;

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${randomId}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Buffer uploaded successfully: ${key}`);

      const url = this.getPublicUrl(key);

      return {
        key,
        url,
        bucket: this.bucket,
        contentType,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload buffer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get public URL for a file
   * For LocalStack, we need to use the external endpoint
   */
  getPublicUrl(key: string): string {
    // For LocalStack in development, use localhost
    const isLocalStack = this.endpointUrl.includes('localstack');
    if (isLocalStack) {
      // Use localhost:4566 for external access
      return `http://localhost:4566/${this.bucket}/${key}`;
    }
    // For production S3
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
  }

  /**
   * Extract key from URL
   */
  getKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Remove bucket name from path if present
      if (pathParts[1] === this.bucket) {
        return pathParts.slice(2).join('/');
      }
      return pathParts.slice(1).join('/');
    } catch {
      return null;
    }
  }
}
