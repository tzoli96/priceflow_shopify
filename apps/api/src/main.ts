import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',        // Development - Next.js
      'https://app.teszt.uk',         // Production
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Shop'],
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error, just strip non-whitelisted properties
      transform: true,            // Auto-transform payloads to DTO instances
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
