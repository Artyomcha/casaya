/**
 * Загрузчик Maps JavaScript API. Один промис на страницу: второй вызов
 * вернёт тот же, иначе Google ругается на повторную загрузку скрипта.
 */
export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

/** Канал beta: в alpha Google рисует поверх карты баннер «только для разработки». */
const VERSION = 'beta';

/** Библиотеки перечислены в адресе, поэтому importLibrary не нужен. */
const LIBRARIES = 'maps3d,marker';

/** Имя колбэка готовности: API умеет звать только глобальную функцию по имени. */
const READY = '__casayaMapsReady';

export interface GoogleMaps {
  maps3d: {
    Map3DElement: new (options: Record<string, unknown>) => HTMLElement & Record<string, unknown>;
    Marker3DInteractiveElement: new (options: Record<string, unknown>) => HTMLElement & Record<string, unknown>;
    AltitudeMode: Record<string, string>;
    MapMode: Record<string, string>;
  };
  marker: {
    PinElement: new (options: Record<string, unknown>) => { element?: HTMLElement };
  };
}

type Win = Window & { google?: { maps?: Record<string, unknown> } } & Record<string, unknown>;

let loading: Promise<GoogleMaps> | null = null;

export function loadGoogleMaps(): Promise<GoogleMaps> {
  if (loading) return loading;
  if (typeof window === 'undefined') return Promise.reject(new Error('только в браузере'));
  if (!GOOGLE_KEY) return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY не задан'));

  const w = window as unknown as Win;
  loading = new Promise<GoogleMaps>((resolve, reject) => {
    w[READY] = () => {
      const maps = w.google?.maps as unknown as GoogleMaps | undefined;
      if (maps?.maps3d?.Map3DElement) resolve(maps);
      else reject(new Error('библиотека maps3d недоступна для этого ключа'));
    };
    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}` +
      `&v=${VERSION}&libraries=${LIBRARIES}&loading=async&callback=${READY}`;
    script.async = true;
    script.onerror = () => reject(new Error('Maps JavaScript API не загрузился'));
    document.head.appendChild(script);
  });
  return loading;
}
