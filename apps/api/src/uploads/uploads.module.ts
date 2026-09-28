import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  // Файлы держим в памяти: проверить содержимое надо до записи на диск.
  imports: [MulterModule.register({ storage: memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
