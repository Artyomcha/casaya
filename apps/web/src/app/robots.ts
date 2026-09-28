import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Кабинет агентства — приватный, в индекс не нужен.
      disallow: ['/api/', '/*/pro/cabinet'],
    },
    sitemap: 'https://casaya.es/sitemap.xml',
  };
}
