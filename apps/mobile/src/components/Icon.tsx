import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { c } from '@/theme';

interface Props {
  d: string;
  size?: number;
  color?: string;
  width?: number;
  fill?: string;
}

/** Иконка по SVG-пути из макета. */
export function Icon({ d, size = 20, color = c.ink, width = 1.9, fill = 'none' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Логотип Casaya. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={9} fill={c.violet} />
      <Path d="M9 26V15.5a7 7 0 0 1 14 0V26Z" fill={c.white} />
      <Path d="M13.5 26v-7a2.5 2.5 0 0 1 5 0v7Z" fill={c.violet} />
      <Circle cx={24} cy={8} r={3} fill={c.peach} />
    </Svg>
  );
}

/** Треугольник «play» у метки видео-тура. */
export function PlayIcon({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5v14l11-7z" fill={c.white} />
    </Svg>
  );
}
