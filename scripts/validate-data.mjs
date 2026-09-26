import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { hepburn } from '../src/reading/matcher.ts';
import { labelInputHash } from './check-label-tiles.mjs';
const read = async name => JSON.parse(await readFile(name, 'utf8'));
const manifest = await read('public/data/places/manifest.json');
assert.equal(manifest.prefectures.length, 47);
const names = ['regions', 'prefectures', 'major-cities', ...manifest.prefectures.map(p => p.code)];
const chunks = await Promise.all(names.map(n => read(`public/data/places/${n}.json`)));
assert.deepEqual(chunks.slice(0, 3).map(c => c.length), [8, 47, 86]);
assert.equal(chunks.slice(3).flat().length, 1918);
assert.deepEqual(chunks.slice(3).map(c => c.length), manifest.prefectures.map(p => p.count));
for (const chunk of chunks) assert.equal(new Set(chunk.map(p => p.id)).size, chunk.length, 'Duplicate ID within a chunk');
const places = new Map(chunks.flat().map(p => [p.id, p]));
assert.equal(places.size, 1973);
for (const p of places.values()) {
  assert.match(p.reading_kana, /^[ぁ-ゖ]+$/u, p.id);
  assert.equal(p.reading_hepburn, hepburn(p.reading_kana), p.id);
  assert.ok(p.reading_kana.endsWith(p.suffix_reading), p.id);
  assert.ok(p.parent_ids.every(id => places.has(id)), `Missing parent for ${p.id}`);
  assert.ok(p.sources.reading_kana.dataset && p.sources.geometry_ref.dataset, `Missing provenance ${p.id}`);
  assert.ok(p.label_point.length === 2 && p.label_point.every(Number.isFinite), p.id);
}
for (const file of [...names, 'labels']) {
  const path = `public/data/tiles/${file}.pmtiles`;
  assert.ok((await stat(path)).size > 100);
  assert.equal((await readFile(path)).subarray(0, 7).toString(), 'PMTiles');
}
const report = await read('reports/phase1-data-validation.json');
const labels = await read('reports/label-tile-validation.json');
const glyphSource = (await read('data/sources.lock.json')).sources.find(s => s.id === 'noto-sans-map-glyphs-601ae607');
assert.ok(glyphSource, 'Missing map glyph source pin');
for (const [path, hash] of [[glyphSource.local_path, glyphSource.sha256], [glyphSource.license_path, glyphSource.license_sha256]]) {
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), hash, `Map font asset changed: ${path}`);
}
assert.equal(labels.status, 'passed');
assert.equal(labels.input_sha256, labelInputHash(places.values()), 'Place data changed; rebuild label tiles.');
assert.equal(labels.archive_sha256, createHash('sha256').update(await readFile('public/data/tiles/labels.pmtiles')).digest('hex'), 'Label archive changed; revalidate zoom coverage.');
assert.deepEqual(labels.checks.map(c => c.zoom), [3, 4, 5, 6, 7, 8, 9, 10]);
for (const check of labels.checks) {
  const expected = [...places.values()].filter(p => p.min_zoom <= check.zoom);
  assert.equal(check.labels, expected.length, `Label coverage at zoom ${check.zoom}`);
  const counts = {};
  for (const place of expected) counts[place.kind] = (counts[place.kind] || 0) + 1;
  assert.deepEqual(check.counts, counts);
}
assert.equal(report.status, 'passed');
assert.equal(report.all_admin_label_points_inside_source_and_output, true);
const municipalities = await read('reports/municipality-validation.json');
assert.equal(municipalities.status, 'passed');
assert.equal(municipalities.label_point_checks.length, 1918);
assert.ok(municipalities.label_point_checks.every(p => p.inside_source && p.inside_output && p.valid_polygon));
assert.equal(municipalities.count.designated_city_wards, 171);
assert.equal(chunks[names.indexOf('13')].filter(p => p.suffix === '区').length, 23);
const centralWards = [...places.values()].filter(p => p.name_kanji === '中区');
assert.ok(centralWards.length > 1 && new Set(centralWards.map(p => p.id)).size === centralWards.length);
assert.ok(centralWards.every(p => p.parent_ids.length === 3));
console.log(`PASS: ${places.size} canonical place records, hierarchy, readings, provenance and PMTiles artifacts, including complete label coverage at zooms 3–10.`);
