'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, Chevron, Globe } from '@/components/ui/icons';
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT, type Locale } from '@/i18n/locales';
import { c } from '@/lib/theme';

/**
 * Переключатель языка. Меняет префикс в текущем адресе, а не уводит
 * на главную: посетитель остаётся на той же странице.
 */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const switchTo = (next: Locale) => {
    // Выбор запоминаем, чтобы корень сайта больше не угадывал по браузеру.
    document.cookie = `casaya_locale=${next};path=/;max-age=31536000;samesite=lax`;
    const rest = pathname.replace(new RegExp(`^/${locale}`), '') || '';
    setOpen(false);
    router.push(`/${next}${rest}`);
  };

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className="h-soft"
        style={{
          border: 0,
          background: open ? c.surfaceAlt : 'transparent',
          font: 'inherit',
          fontSize: 14,
          fontWeight: 500,
          color: c.ink,
          padding: '9px 10px',
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Globe size={18} />
        {LOCALE_SHORT[locale]}
        <Chevron size={12} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            minWidth: 190,
            background: c.white,
            border: `1px solid ${c.line}`,
            borderRadius: 18,
            padding: 8,
            boxShadow: '0 24px 48px -16px rgba(23,17,43,0.22)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 40,
          }}
        >
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                lang={l}
                onClick={() => switchTo(l)}
                className="h-soft"
                style={{
                  border: 0,
                  background: active ? c.violetTintSoft : 'transparent',
                  font: 'inherit',
                  fontSize: 15,
                  fontWeight: active ? 600 : 500,
                  color: c.ink,
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ width: 26, color: c.grey, fontSize: 13, fontWeight: 600 }}>
                  {LOCALE_SHORT[l]}
                </span>
                <span style={{ flex: 1 }}>{LOCALE_NAMES[l]}</span>
                {active && <Check size={14} color={c.violet} width={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
