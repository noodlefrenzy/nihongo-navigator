import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { checkLabelTiles, labelInputHash } from './check-label-tiles.mjs';

await mkdir('.data-cache/derived', { recursive: true });
await mkdir('public/data/tiles', { recursive: true });
const manifest = JSON.parse(await readFile('public/data/places/manifest.json', 'utf8'));
const prefectureCodes = manifest.prefectures.map(p => p.code);
const boundaries = process.argv.includes('--labels-only') ? [] : [['prefectures', 0, 8], ['regions', 0, 7], ['major-cities', 6, 12], ...prefectureCodes.map(code => [code, 8, 13])];
for (const [name, min, max] of boundaries) {
  const input = `.data-cache/derived/${name}.geojson`;
  try { await rename(`public/data/geometry/${name}.geojson`, input); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const archive = `.data-cache/derived/${name}.pmtiles`;
  execFileSync('.venv/bin/tippecanoe', ['-q', '-f', '-o', archive,
    '-l', 'boundaries', '-Z', String(min), '-z', String(max), '--detect-shared-borders', input], { stdio: 'inherit' });
  await rename(archive, `public/data/tiles/${name}.pmtiles`);
}
const chunks = (await Promise.all(['regions', 'prefectures', 'major-cities', ...prefectureCodes].map(async name =>
  JSON.parse(await readFile(`public/data/places/${name}.json`, 'utf8'))))).flat();
const places = [...new Map(chunks.map(p => [p.id, p])).values()];
const features = places.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: p.label_point },
  // These are curriculum tiers, not a point-density sample. Retain every
  // eligible label and let MapLibre resolve collisions at display time.
  tippecanoe: { minzoom: p.min_zoom },
  properties: { id: p.id, name: p.name_kanji, reading: p.reading_kana, kind: p.kind, priority: p.priority } }));
await writeFile('.data-cache/derived/labels.geojson', JSON.stringify({ type: 'FeatureCollection', features }));
execFileSync('.venv/bin/tippecanoe', ['-q', '-f', '-o', '.data-cache/derived/labels.pmtiles', '-l', 'labels',
  '-Z', '0', '-z', '10', '-r', '1', '--no-feature-limit', '--no-tile-size-limit', '.data-cache/derived/labels.geojson'], { stdio: 'inherit' });
const checks = checkLabelTiles('.data-cache/derived/labels.pmtiles', places);
await rename('.data-cache/derived/labels.pmtiles', 'public/data/tiles/labels.pmtiles');
await mkdir('reports', { recursive: true });
await writeFile('reports/label-tile-validation.json', JSON.stringify({ status: 'passed',
  input_sha256: labelInputHash(places),
  archive_sha256: createHash('sha256').update(await readFile('public/data/tiles/labels.pmtiles')).digest('hex'),
  checks,
}, null, 2) + '\n');
console.log(`Built ${boundaries.length ? 'boundary archives and ' : ''}Japanese labels; verified complete coverage at zooms 3–10.`);
