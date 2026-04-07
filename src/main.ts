import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './core/helpers';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';

/**
 * Bootstraps the NestJS application.
 */
async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '127.0.0.1';
  const printableHost =
    host === '127.0.0.1' || host === '::1' || host === '0.0.0.0' || host === '::'
      ? 'localhost'
      : host;

  const normalizeOrigin = (value: string) => {
    const normalized = value.trim().replace(/\/$/, '');

    try {
      return new URL(normalized).origin;
    } catch {
      return normalized;
    }
  };
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    maxAge: 3600,
  });

  // Support both direct routes (/api/...) and gateway-prefixed routes
  // (/gateway/edunet/api/...) so Swagger "Try it out" works in local/dev.
  app.use((req, _res, next) => {
    const gatewayPrefix = '/gateway/edunet';

    if (req.url.startsWith(gatewayPrefix)) {
      req.url = req.url.slice(gatewayPrefix.length) || '/';
    }

    next();
  });

  // Serve uploaded files (CV PDFs etc.) as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api', {
    exclude: ['docs', 'docs-json', 'docs-yaml'],
  });

  // Swagger configuration
  const normalizedSwaggerServer = '/gateway/edunet';

  const config = new DocumentBuilder()
    .setTitle('EduNet API')
    .setDescription('EduNet Learning Platform Backend API')
    .setVersion('1.0')
    .addServer(normalizedSwaggerServer)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, host);

  const baseUrl = `http://${printableHost}:${port}`;

  console.log(`Application is running on: ${baseUrl}`);
  console.log(`Swagger docs: ${baseUrl}/docs`);
}
void bootstrap();
