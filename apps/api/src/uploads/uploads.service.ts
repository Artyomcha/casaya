import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Разрешённые типы картинок и их расширения. */
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const MAX_BYTES = 2 * 1024 * 1024;

/** Магические байты — проверяем содержимое, а не заявленный тип. */
const SIGNATURES: [string, number[]][] = [
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]],
];

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly root = join(__dirname, '..', '..', 'public', 'uploads');

  /**
   * Сохраняет логотип или аватар и возвращает публичный путь.
   *
   * Тип определяется по содержимому файла: заголовок content-type присылает
   * клиент, и верить ему нельзя. SVG проверяется отдельно — он текстовый
   * и может содержать скрипты, поэтому принимается только без них.
   */
  async saveImage(file: { originalname: string; mimetype: string; buffer: Buffer }): Promise<string> {
    if (!file?.buffer?.length) throw new BadRequestException('Файл пустой');
    if (file.buffer.length > MAX_BYTES) throw new BadRequestException('Файл больше 2 МБ');

    const ext = ALLOWED[file.mimetype];
    if (!ext) throw new BadRequestException('Подойдёт JPEG, PNG, WebP или SVG');

    if (ext === 'svg') this.assertSafeSvg(file.buffer);
    else this.assertSignature(file.mimetype, file.buffer);

    await mkdir(this.root, { recursive: true });

    // Имя генерируем сами: в присланном может быть что угодно, вплоть до «../».
    const name = `${randomBytes(16).toString('hex')}.${ext}`;
    await writeFile(join(this.root, name), file.buffer);

    this.logger.log(`Загружено изображение ${name} (${file.buffer.length} байт)`);
    return `/uploads/${name}`;
  }

  /** Удаляет прежний файл, когда логотип заменяют. */
  async remove(publicPath: string | null | undefined): Promise<void> {
    if (!publicPath?.startsWith('/uploads/')) return;
    const name = publicPath.slice('/uploads/'.length);
    // Без этого «/uploads/../../.env» увёл бы нас из каталога загрузок.
    if (name.includes('/') || name.includes('..')) return;

    await unlink(join(this.root, name)).catch(() => undefined);
  }

  private assertSignature(mime: string, buffer: Buffer) {
    const signature = SIGNATURES.find(([m]) => m === mime)?.[1];
    if (!signature) return;

    const matches = signature.every((byte, i) => buffer[i] === byte);
    if (!matches) throw new BadRequestException('Содержимое файла не совпадает с его типом');
  }

  private assertSafeSvg(buffer: Buffer) {
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 64 * 1024)).toLowerCase();
    if (!text.includes('<svg')) throw new BadRequestException('Это не SVG');
    if (/<script|onload=|onerror=|javascript:|<foreignobject/.test(text)) {
      throw new BadRequestException('В SVG есть скрипты — такой файл принять нельзя');
    }
  }
}
