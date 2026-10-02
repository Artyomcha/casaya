import { requireNativeView } from 'expo';
import type { StyleProp, ViewStyle } from 'react-native';

/** Метка: только то, что нужно карте. Остальное рисует само приложение. */
export interface NativePin {
  id: string;
  /** Готовая подпись — цена. Форматирование остаётся в JS. */
  label: string;
  lat: number;
  lng: number;
}

export interface CasayaMaps3dViewProps {
  /** JSON с метками: одна форма данных на всех платформах. */
  pins: string;
  /** JSON с камерой: центр, наклон, азимут и охват считает JS. */
  camera: string;
  variant: 'search' | 'single';
  apiKey: string;
  onSelectPin?: (event: { nativeEvent: { id: string } }) => void;
  style?: StyleProp<ViewStyle>;
}

export const CasayaMaps3dView = requireNativeView<CasayaMaps3dViewProps>('CasayaMaps3d');
