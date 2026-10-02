import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, matchLocale } from '@/i18n/locales';

const LOCALE_COOKIE = 'casaya_locale';

/**
 * Каждая страница живёт под префиксом языка: /es, /en, /ru и так далее.
 * Корень отдаёт редирект на язык браузера — или на сохранённый выбор,
 * если посетитель уже переключался вручную.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    saved && (LOCALES as readonly string[]).includes(saved)
      ? saved
      : matchLocale(request.headers.get('accept-language'));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Статика, картинки и служебные пути языкового префикса не получают.
  matcher: ['/((?!_next|api|img|vendor|favicon.ico|robots.txt|sitemap.xml).*)'],
};

export { DEFAULT_LOCALE, LOCALE_COOKIE };
