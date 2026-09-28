import type { ReactNode } from 'react';
import './globals.css';

/**
 * Корневой layout ничего не знает о языке: атрибут lang и вся обвязка
 * живут в src/app/[locale]/layout.tsx, куда middleware и направляет запросы.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
