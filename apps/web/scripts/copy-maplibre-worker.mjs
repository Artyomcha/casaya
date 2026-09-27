/**
 * MapLibre грузит тайлы в web-worker'е, и его модуль нужно отдавать как
 * статический файл: сам бандлер его не эмитит, worker падает на 404.
 * Копируем из node_modules перед dev и build, чтобы файл всегда совпадал
 * с установленной версией пакета, а не жил вендорной копией в репозитории.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'));
const out = join(process.cwd(), 'public', 'vendor', 'maplibre');

await mkdir(out, { recursive: true });
await copyFile(join(dist, 'maplibre-gl-shared.mjs'), join(out, 'maplibre-gl-shared.mjs'));

// Воркер импортирует общий модуль по относительному пути — он рядом, менять нечего.
const worker = await readFile(join(dist, 'maplibre-gl-worker.mjs'), 'utf8');
await writeFile(join(out, 'maplibre-gl-worker.mjs'), worker);

const { version } = require('maplibre-gl/package.json');
console.log(`maplibre worker ${version} → public/vendor/maplibre/`);
