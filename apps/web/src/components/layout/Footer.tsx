import Link from 'next/link';
import { Logo } from '@/components/ui/icons';
import { c } from '@/lib/theme';

const COLUMNS = [
  {
    h: 'Покупателям',
    items: [
      ['Купить', '/search?mode=buy'],
      ['Снять', '/search?mode=rent'],
      ['Новостройки', '/new'],
      ['Ипотека', '/mortgage'],
      ['Оценка', '/value'],
    ],
  },
  {
    h: 'Профессионалам',
    items: [
      ['Casaya Pro', '/pro'],
      ['Подключить фид', '/pro/cabinet'],
      ['Тарифы', '/pro#tariffs'],
      ['Разместить объявление', '/post'],
    ],
  },
  {
    h: 'Сервисы',
    items: [
      ['Сделка под ключ', '/services'],
      ['Casaya+', '/services#plus'],
      ['Видео-осмотр', '/services'],
      ['Избранное', '/favorites'],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer style={{ maxWidth: 1360, margin: '0 auto', padding: '96px 32px 40px' }}>
      <div
        style={{
          borderTop: `1px solid ${c.line}`,
          paddingTop: 40,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={30} />
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1 }}>casaya</span>
          </div>
          <div style={{ fontSize: 14, color: c.grey, lineHeight: 1.55, maxWidth: 240 }}>
            Платформа проверенной недвижимости на Коста-Бланке.
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.h} style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{col.h}</div>
            {col.items.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="h-fg-ink"
                style={{ border: 0, background: 'transparent', padding: 0, font: 'inherit', textAlign: 'left', color: c.grey, cursor: 'pointer' }}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 40,
          fontSize: 13,
          color: c.greyLight,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>© 2026 Casaya. Аликанте, Испания.</span>
        <span>RU · EN · NL · DE · SV · PL · FR</span>
      </div>
    </footer>
  );
}
