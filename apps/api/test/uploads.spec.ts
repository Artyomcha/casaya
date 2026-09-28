import { describe, expect, it } from 'vitest';
import { UploadsService } from '../src/uploads/uploads.service';

const service = new UploadsService();

const file = (mimetype: string, buffer: Buffer, originalname = 'logo') => ({
  originalname,
  mimetype,
  buffer,
});

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('загрузка логотипов', () => {
  it('отказывает пустому файлу', async () => {
    await expect(service.saveImage(file('image/png', Buffer.alloc(0)))).rejects.toThrow(/пустой/);
  });

  it('отказывает файлу больше 2 МБ', async () => {
    const big = Buffer.alloc(3 * 1024 * 1024, 1);
    big.set([0x89, 0x50, 0x4e, 0x47]);
    await expect(service.saveImage(file('image/png', big))).rejects.toThrow(/2 МБ/);
  });

  it('принимает только картинки', async () => {
    await expect(service.saveImage(file('application/pdf', PNG))).rejects.toThrow(/JPEG/);
    await expect(service.saveImage(file('text/html', PNG))).rejects.toThrow(/JPEG/);
  });

  it('не верит заявленному типу — проверяет содержимое', async () => {
    // Исполняемый файл, прикинувшийся картинкой.
    const fake = Buffer.from('MZ\x90\x00executable');
    await expect(service.saveImage(file('image/png', fake))).rejects.toThrow(/не совпадает/);
  });

  it('ловит JPEG, выданный за PNG', async () => {
    await expect(service.saveImage(file('image/png', JPEG))).rejects.toThrow(/не совпадает/);
  });

  it('отклоняет SVG со скриптом', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(service.saveImage(file('image/svg+xml', svg))).rejects.toThrow(/скрипты/);
  });

  it('отклоняет SVG с обработчиком события', async () => {
    const svg = Buffer.from('<svg onload="fetch(\'/steal\')" xmlns="http://www.w3.org/2000/svg"></svg>');
    await expect(service.saveImage(file('image/svg+xml', svg))).rejects.toThrow(/скрипты/);
  });

  it('отклоняет не-SVG под видом SVG', async () => {
    await expect(service.saveImage(file('image/svg+xml', Buffer.from('просто текст')))).rejects.toThrow(/не SVG/);
  });
});

describe('удаление прежнего файла', () => {
  it('не выходит за каталог загрузок', async () => {
    // Путь с обходом каталога не должен привести к удалению чужого файла.
    await expect(service.remove('/uploads/../../.env')).resolves.toBeUndefined();
    await expect(service.remove('/uploads/sub/dir.png')).resolves.toBeUndefined();
  });

  it('игнорирует внешние ссылки и пустые значения', async () => {
    await expect(service.remove('https://cdn.example.com/a.png')).resolves.toBeUndefined();
    await expect(service.remove(null)).resolves.toBeUndefined();
    await expect(service.remove(undefined)).resolves.toBeUndefined();
  });
});
