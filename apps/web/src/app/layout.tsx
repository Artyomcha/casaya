import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppProviders } from '@/components/providers/AppProviders';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'Casaya — недвижимость в Испании без фейков и дублей',
  description:
    'Проверенные объекты на Коста-Бланке: видео-тур, nota simple, подтверждённый собственник. Ипотека, NIE, юрист и защищённый задаток в одном месте.',
  metadataBase: new URL('https://casaya.es'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <AppProviders>
          <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
            <Header />
            {children}
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
