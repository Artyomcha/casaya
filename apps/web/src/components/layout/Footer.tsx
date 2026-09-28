import Link from 'next/link';
import { Logo } from '@/components/ui/icons';
import type { Dictionary } from '@/i18n/getDictionary';
import { localePath, type Locale } from '@/i18n/locales';
import { LOCALE_SHORT, LOCALES } from '@/i18n/locales';
import { c } from '@/lib/theme';

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const href = (path: string) => localePath(locale, path);

  const columns = [
    {
      heading: dict.footer.buyers,
      items: [
        [dict.nav.buy, href('search?mode=buy')],
        [dict.nav.rent, href('search?mode=rent')],
        [dict.nav.newBuild, href('new')],
        [dict.nav.mortgage, href('mortgage')],
        [dict.nav.valuation, href('value')],
      ],
    },
    {
      heading: dict.footer.professionals,
      items: [
        ['Casaya Pro', href('pro')],
        [dict.footer.proCabinet, href('pro/cabinet')],
        ['CRM', href('pro/crm')],
        [dict.footer.proTariffs, `${href('pro')}#tariffs`],
        [dict.footer.postListing, href('post')],
      ],
    },
    {
      heading: dict.footer.services,
      items: [
        [dict.footer.turnkey, href('services')],
        [dict.footer.plus, `${href('services')}#plus`],
        [dict.footer.videoViewing, href('services')],
        [dict.nav.favorites, href('favorites')],
      ],
    },
  ];

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
            {dict.footer.tagline}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.heading} style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{col.heading}</div>
            {col.items.map(([label, url]) => (
              <Link
                key={label}
                href={url}
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
        <span>{dict.footer.rights}</span>
        {/* Языки в подвале — ещё и внутренние ссылки для поисковиков. */}
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LOCALES.map((l) => (
            <Link
              key={l}
              href={localePath(l)}
              hrefLang={l}
              className="h-fg-ink"
              style={{ color: l === locale ? c.ink : c.greyLight, fontWeight: l === locale ? 600 : 400 }}
            >
              {LOCALE_SHORT[l]}
            </Link>
          ))}
        </span>
      </div>
    </footer>
  );
}
