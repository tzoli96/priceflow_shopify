import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
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
   * Upload customer graphic file (storefront)
   * POST /upload/graphic
   * Accepts images, PDF, AI, EPS, SVG - up to 50 MB
   */
  @Post('graphic')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadGraphic(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Broader MIME validation for design files
    const allowedGraphicTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/postscript',           // AI, EPS
      'application/illustrator',
      'application/eps',
      'image/x-eps',
      'application/octet-stream',         // fallback for AI/EPS/CDR
    ];
    if (!allowedGraphicTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: images, PDF, AI, EPS, SVG`,
      );
    }

    const result = await this.s3Service.uploadFile(file, {
      folder: 'graphics',
    });

    this.logger.log(`Graphic uploaded: ${result.url} (${file.originalname})`);

    return {
      success: true,
      data: result,
      message: 'Graphic uploaded successfully',
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
   * Proxy endpoint to serve S3 files (solves CORS issues with localhost)
   * GET /upload/file/:bucket/*
   */
  @Get('file/:bucket/*')
  async proxyFile(
    @Param('bucket') bucket: string,
    @Param() params: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    // Get the file path from wildcard param (everything after bucket/)
    const key = params['0'] || params['*'];

    if (!key) {
      throw new BadRequestException('No file key provided');
    }

    try {
      const stream = await this.s3Service.getFileStream(key);
      const metadata = await this.s3Service.getFileMetadata(key);

      // Set appropriate headers
      res.set({
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': metadata.contentLength,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      });

      stream.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to proxy file: ${key}`, error);
      throw new NotFoundException('File not found');
    }
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
