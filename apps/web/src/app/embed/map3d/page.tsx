'use client';

import { useEffect, useState } from 'react';
import { Google3DMap } from '@/components/map/Google3DMap';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/locales';
import type { MapPin, Mode } from '@/lib/types';

/**
 * Карта для встраивания в приложение. Живёт на нашем домене нарочно:
 * ключ Google ограничивается по HTTP-referrer, а у локального файла внутри
 * WebView referrer нашего домена нет — ключ пришлось бы оставить без защиты.
 *
 * Данные приходят двумя путями: параметрами адреса (чтобы страницу можно было
 * открыть в браузере и проверить) и сообщением из приложения, когда выдача
 * меняется уже после загрузки.
 */
interface Payload {
  pins: MapPin[];
  mode: Mode;
  locale: Locale;
  variant: 'search' | 'single';
}

const isLocale = (value: string | null): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

/** Приложение шлёт тот же объект, что кладётся в адрес, — разбор общий. */
function parse(raw: string | null): MapPin[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MapPin[]) : [];
  } catch {
    return [];
  }
}

export default function EmbeddedMap3D() {
  const [payload, setPayload] = useState<Payload>({
    pins: [],
    mode: 'buy',
    locale: DEFAULT_LOCALE,
    variant: 'search',
  });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const locale = query.get('locale');
    setPayload((prev) => ({
      pins: parse(query.get('pins')) || prev.pins,
      mode: query.get('mode') === 'rent' ? 'rent' : 'buy',
      locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
      variant: query.get('variant') === 'single' ? 'single' : 'search',
    }));

    const onMessage = (event: MessageEvent) => {
      // Сообщение приходит из WebView приложения, его содержимое — наши же
      // данные выдачи, но проверяем форму: чужой фрейм тоже может написать.
      const data = typeof event.data === 'string' ? safeJson(event.data) : event.data;
      if (!data || typeof data !== 'object' || !Array.isArray((data as Payload).pins)) return;
      const next = data as Partial<Payload>;
      setPayload((prev) => ({
        pins: next.pins ?? prev.pins,
        mode: next.mode === 'rent' ? 'rent' : 'buy',
        locale: isLocale(next.locale ?? null) ? (next.locale as Locale) : prev.locale,
        variant: next.variant === 'single' ? 'single' : 'search',
      }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  /** Нажатие на метку возвращается в приложение: карточку рисует оно само. */
  const select = (id: string | null) => {
    const rn = (window as unknown as { ReactNativeWebView?: { postMessage: (s: string) => void } })
      .ReactNativeWebView;
    rn?.postMessage(JSON.stringify({ type: 'select', id }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#EEF0F4' }}>
      {payload.pins.length > 0 && (
        <Google3DMap
          pins={payload.pins}
          mode={payload.mode}
          locale={payload.locale}
          variant={payload.variant}
          onSelect={select}
          onFail={() => select(null)}
          height="100%"
        />
      )}
    </div>
  );
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
