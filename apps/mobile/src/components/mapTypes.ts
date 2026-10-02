import type { Listing } from '@/types';

/** Объект с координатами: без них метку ставить некуда. */
export type Pinned = Listing & { lat: number; lng: number };

export interface PropertyMapHandle {
  /** Подогнать камеру под все метки: [top, right, bottom, left] в точках. */
  fit: (padding: [number, number, number, number]) => void;
}
