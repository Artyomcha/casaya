#!/usr/bin/env node
/**
 * Качает xcframework Maps 3D SDK в модуль.
 *
 * Google раздаёт SDK только через Swift Package Manager, а Expo-модули
 * собираются CocoaPods. Положить загрузку в prepare_command подспека нельзя:
 * для локальных подов (:path) CocoaPods его не выполняет. Поэтому отдельный
 * скрипт, который дёргается перед сборкой iOS.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const iosDir = join(here, '..', 'ios');
const frameworks = join(iosDir, 'Frameworks');
const target = join(frameworks, 'GoogleMaps3D.xcframework');

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

if (await exists(target)) {
  console.log('maps3d: xcframework уже на месте');
  process.exit(0);
}

const url = (await readFile(join(iosDir, 'maps3d-url.txt'), 'utf8')).trim();
console.log(`maps3d: качаю ${url}`);

await mkdir(frameworks, { recursive: true });
const zip = join(frameworks, 'sdk.zip');

const res = await fetch(url);
if (!res.ok) {
  console.error(`maps3d: не скачалось, ${res.status}`);
  process.exit(1);
}
await pipeline(res.body, createWriteStream(zip));
execFileSync('unzip', ['-q', '-o', zip, '-d', frameworks], { stdio: 'inherit' });
await rm(zip);

console.log('maps3d: готово');
