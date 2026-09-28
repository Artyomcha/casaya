import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppProviders } from '@/components/providers/AppProviders';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale, LOCALES, LOCALE_TAGS, localePath, type Locale } from '@/i18n/locales';

const geist = Geist({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const SITE = 'https://casaya.es';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    metadataBase: new URL(SITE),
    alternates: {
      canonical: localePath(locale),
      // hreflang — основа мультиязычного SEO, ради которого весь клин
      // по языкам покупателей и затевался.
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], localePath(l)])),
        'x-default': localePath('es'),
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <html lang={LOCALE_TAGS[locale]} className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <AppProviders dict={dict}>
          <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
            <Header dict={dict} locale={locale as Locale} />
            {children}
            <Footer dict={dict} locale={locale as Locale} />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
