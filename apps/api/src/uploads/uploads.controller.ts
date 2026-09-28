import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from './uploads.service';

@Controller()
export class UploadsController {
  constructor(
    private readonly uploads: UploadsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Логотип агентства — заменяет квадрат с инициалами в выдаче. */
  @Post('agencies/:id/logo')
  @UseInterceptors(FileInterceptor('file'))
  async agencyLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не пришёл');

    const agency = await this.prisma.agency.findUnique({ where: { id }, select: { logoUrl: true } });
    if (!agency) throw new NotFoundException('Агентство не найдено');

    const logoUrl = await this.uploads.saveImage(file);
    await this.uploads.remove(agency.logoUrl);

    return this.prisma.agency.update({
      where: { id },
      data: { logoUrl },
      select: { id: true, name: true, initials: true, brandColor: true, logoUrl: true },
    });
  }

  /** Аватар частного продавца. */
  @Post('users/:id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async userAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не пришёл');

    const user = await this.prisma.user.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const avatarUrl = await this.uploads.saveImage(file);
    await this.uploads.remove(user.avatarUrl);

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { id: true, name: true, avatarUrl: true },
    });
  }
}
