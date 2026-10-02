import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Pinned, PropertyMapHandle } from './mapTypes';
import type { Mode } from '@/types';

/**
 * Фотореалистичный 3D Google. Рисует его страница портала /embed/map3d,
 * а приложение показывает её в WebView.
 *
 * Своей копии карты здесь нет нарочно: Map3DElement — веб-компонент Maps
 * JavaScript API, нативного аналога у него нет, а второй реализацией на
 * нативном SDK мы получили бы две разные карты на iOS и Android. Заодно
 * ключ Google остаётся на нашем домене: он ограничивается по HTTP-referrer,
 * а у локального html внутри WebView нужного referrer нет.
 */
export const EMBED_URL = process.env.EXPO_PUBLIC_EMBED_URL ?? 'http://localhost:3100/embed/map3d';

/** Выключатель на случай оффлайн-сборки или кончившейся квоты Google. */
export const GOOGLE_3D = process.env.EXPO_PUBLIC_GOOGLE_3D !== '0';

interface Props {
  pins: Pinned[];
  mode: Mode;
  onSelect?: (id: string) => void;
  /** Одна метка без взаимодействия — блок «На карте» в объявлении. */
  compact?: boolean;
  /** Карта не загрузилась — экран возвращается на векторную подложку. */
  onFail?: () => void;
}

/** В адрес уезжает только то, что карте нужно: метка, цена и координаты. */
const toPayload = (pins: Pinned[]) =>
  pins.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    address: p.address,
    price: p.price,
    lat: p.lat,
    lng: p.lng,
    kind: p.kind,
    bedrooms: p.bedrooms,
    area: p.area,
    coverImage: '',
    verified: p.verified,
  }));

export const Google3DMap = forwardRef<PropertyMapHandle, Props>(function Google3DMap(
  { pins, mode, onSelect, compact = false, onFail },
  ref,
) {
  const web = useRef<WebView>(null);
  const [failed, setFailed] = useState(false);

  // Подгонку камеры делает сама страница по набору меток, поэтому ручке
  // здесь делать нечего — но экран карты вызывает fit() вслепую.
  useImperativeHandle(ref, () => ({ fit: () => undefined }));

  const uri = useMemo(() => {
    const query = new URLSearchParams({
      variant: compact ? 'single' : 'search',
      mode,
      locale: 'ru',
      pins: JSON.stringify(toPayload(pins)),
    });
    return `${EMBED_URL}?${query.toString()}`;
  }, [pins, mode, compact]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string | null };
      if (data.type === 'select' && data.id) onSelect?.(data.id);
    } catch {
      /* чужое сообщение из страницы — игнорируем */
    }
  }

  if (failed) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        ref={web}
        source={{ uri }}
        style={styles.web}
        // Карта рисуется в WebGL и держит собственный жестовый слой.
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['https://*', 'http://*']}
        onMessage={onMessage}
        onError={() => {
          setFailed(true);
          onFail?.();
        }}
        onHttpError={() => {
          setFailed(true);
          onFail?.();
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#EEF0F4' },
});
