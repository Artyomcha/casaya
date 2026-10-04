import type { NextConfig } from 'next';
import { join } from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Отдельный самодостаточный выпуск: образ собирается без node_modules
  // монорепозитория, иначе он весит больше гигабайта.
  output: 'standalone',
  outputFileTracingRoot: join(import.meta.dirname, '..', '..'),
  images: {
    // Фото объектов приходят из CDN агентских CRM.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
