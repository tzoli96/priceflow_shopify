import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { S3Service, UploadResult } from './services/s3.service';

interface UploadResponse {
  success: boolean;
  data: UploadResult | UploadResult[];
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  // Allowed image types
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  // Max file size (5MB)
  private readonly maxFileSize = 5 * 1024 * 1024;

  constructor(private readonly s3Service: S3Service) {}

  /**
   * Upload a single image
   * POST /upload/image
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.validateFile(file);

    const result = await this.s3Service.uploadFile(file, {
      folder: folder || 'images',
    });

    this.logger.log(`Image uploaded: ${result.url}`);

    return {
      success: true,
      data: result,
      message: 'Image uploaded successfully',
    };
  }

  /**
   * Upload multiple images
   * POST /upload/images
   */
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ): Promise<UploadResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate all files
    files.forEach((file) => this.validateFile(file));

    const results = await Promise.all(
      files.map((file) =>
        this.s3Service.uploadFile(file, {
          folder: folder || 'images',
        }),
      ),
    );

    this.logger.log(`${results.length} images uploaded`);

    return {
      success: true,
      data: results,
      message: `${results.length} images uploaded successfully`,
    };
  }

  /**
   * Upload icon for template field
   * POST /upload/icon
   */
  @Post('icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadIcon(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.validateFile(file, 1 * 1024 * 1024); // 1MB max for icons

    const result = await this.s3Service.uploadFile(file, {
      folder: 'icons',
    });

    this.logger.log(`Icon uploaded: ${result.url}`);

    return {
      success: true,
      data: result,
      message: 'Icon uploaded successfully',
    };
  }

  /**
   * Upload option image for SELECT/RADIO fields
   * POST /upload/option-image
   */
  @Post('option-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOptionImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.validateFile(file);

    const result = await this.s3Service.uploadFile(file, {
      folder: 'option-images',
    });

    this.logger.log(`Option image uploaded: ${result.url}`);

    return {
      success: true,
      data: result,
      message: 'Option image uploaded successfully',
    };
  }

  /**
   * Delete a file by key
   * DELETE /upload/file?key=...
   */
  @Delete('file')
  async deleteFile(@Query('key') key: string): Promise<DeleteResponse> {
    if (!key) {
      throw new BadRequestException('No key provided');
    }

    // Decode the key (it might be URL encoded)
    const decodedKey = decodeURIComponent(key);

    await this.s3Service.deleteFile(decodedKey);

    this.logger.log(`File deleted: ${decodedKey}`);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  /**
   * Check if file exists
   * GET /upload/exists?key=...
   */
  @Get('exists')
  async fileExists(
    @Query('key') key: string,
  ): Promise<{ exists: boolean; url?: string }> {
    if (!key) {
      throw new BadRequestException('No key provided');
    }

    const decodedKey = decodeURIComponent(key);
    const exists = await this.s3Service.fileExists(decodedKey);

    return {
      exists,
      url: exists ? this.s3Service.getPublicUrl(decodedKey) : undefined,
    };
  }

  /**
   * Validate uploaded file
   */
  private validateFile(
    file: Express.Multer.File,
    maxSize = this.maxFileSize,
  ): void {
    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      throw new BadRequestException(
        `File too large. Maximum size: ${maxMB}MB`,
      );
    }
  }
}
