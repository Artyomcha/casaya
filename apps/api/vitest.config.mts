import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    // Тесты, которым нужна база, запускаются отдельным прогоном.
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.module.ts', 'src/main.ts', 'src/**/dto.ts'],
    },
  },
  resolve: {
    alias: { '@prisma/client': new URL('../../node_modules/@prisma/client/index.js', import.meta.url).pathname },
  },
});
