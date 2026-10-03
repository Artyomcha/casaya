import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Заголовки безопасности. CSP для API не нужна — он отдаёт JSON и картинки,
  // а своя политика у портала; crossOriginResourcePolicy ослаблен намеренно,
  // иначе приложение не покажет фотографии с хоста API.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Доверяем заголовку прокси: без этого ограничение частоты считает всех
  // посетителей одним адресом балансировщика.
  app.set('trust proxy', 1);

  // Демо-фото объектов отдаём с того же хоста, что и API: мобильному
  // приложению тогда нужен один адрес, а не два. Фото из фидов агентств
  // приходят абсолютными ссылками на их CDN и сюда не попадают.
  app.useStaticAssets(join(__dirname, '..', 'public'), { maxAge: '7d' });
  app.setGlobalPrefix('api');
  app.enableCors({
    // Значение по умолчанию — адрес портала в разработке. На проде
    // WEB_ORIGIN задаётся явно, иначе браузер не пустит запросы к API.
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3100').split(','),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  // Тело запроса ограничиваем: по умолчанию express принимает 100 КБ JSON,
  // но загрузка файлов идёт мимо и ограничена своим лимитом.
  app.useBodyParser('json', { limit: '256kb' });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Casaya API → http://localhost:${port}/api`);
}

bootstrap();
