/**
 * Загрузчик Maps JavaScript API. Один промис на страницу: второй вызов
 * вернёт тот же, иначе Google ругается на повторную загрузку скрипта.
 */
export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

/** Фотореалистичные 3D-тайлы пока живут в канале alpha. */
const VERSION = 'alpha';

let loading: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loading) return loading;
  if (!GOOGLE_KEY) return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY не задан'));

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}` +
      `&v=${VERSION}&libraries=maps3d,marker&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Maps JavaScript API не загрузился'));
    document.head.appendChild(script);
  });
  return loading;
}
