import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Демо-фото объектов отдаём с того же хоста, что и API: мобильному
  // приложению тогда нужен один адрес, а не два. Фото из фидов агентств
  // приходят абсолютными ссылками на их CDN и сюда не попадают.
  app.useStaticAssets(join(__dirname, '..', 'public'), { maxAge: '7d' });
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Casaya API → http://localhost:${port}/api`);
}

bootstrap();
