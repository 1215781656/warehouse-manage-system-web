import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { verifyDatabaseConnectionWithRetry } from './config/db-check';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  app.enableCors({ origin: ['http://localhost:3000'], credentials: true });
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useStaticAssets(join(process.cwd(), 'server_uploads'), {
    prefix: '/files',
  });

  const config = new DocumentBuilder()
    .setTitle('色布管理系统 API')
    .setDescription('REST 接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const ds = app.get(DataSource);
  await verifyDatabaseConnectionWithRetry(ds, 3, 2000).catch((e) => {
    console.error('Database connection failed', e);
    process.exit(1);
  });
  await app.listen(3001);
}
bootstrap();
