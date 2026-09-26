import { access } from 'node:fs/promises';

const required = [
  'places/manifest.json', 'places/regions.json', 'places/prefectures.json',
  'places/major-cities.json', 'tiles/prefectures.pmtiles',
  'tiles/major-cities.pmtiles', 'tiles/labels.pmtiles',
  ...Array.from({ length: 47 }, (_, index) => String(index + 1).padStart(2, '0'))
    .flatMap(code => [`places/${code}.json`, `tiles/${code}.pmtiles`]),
];
try {
  await Promise.all(required.map(path => access(new URL(`../public/data/${path}`, import.meta.url))));
} catch {
  console.error('Map data is missing. This source release omits generated map assets pending GSI clearance.');
  console.error('For local development, follow README.md: install the Python environment, then run pnpm data:build.');
  console.error('Keep generated outputs local until the redistribution conditions in docs/PUBLISHING.md are resolved.');
  process.exitCode = 1;
}
