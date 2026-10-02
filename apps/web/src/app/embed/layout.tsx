import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

/**
 * Встраиваемые страницы живут вне языкового префикса, поэтому html и body
 * им нужно объявить самим: корневой layout портала их не рисует, он отдаёт
 * эту работу layout'у языка.
 *
 * Шапки и подвала здесь нет намеренно — страница целиком занята картой
 * внутри WebView приложения.
 */
export const metadata: Metadata = {
  // Встраиваемая карта в поиске не нужна, это служебная страница.
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0, fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
