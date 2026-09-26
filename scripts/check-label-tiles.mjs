import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const labelInputHash = places => createHash('sha256')
  .update(JSON.stringify([...places].sort((a, b) => a.id.localeCompare(b.id))))
  .digest('hex');

// Decode the actual archive: header checks and the places list cannot detect
// labels dropped by the tiler before MapLibre gets a chance to lay them out.
export function checkLabelTiles(archive, places) {
  const checks = [];
  for (let zoom = 3; zoom <= 10; zoom++) {
    const decoded = JSON.parse(execFileSync('.venv/bin/tippecanoe-decode',
      ['-Z', String(zoom), '-z', String(zoom), archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
    const actual = new Map();
    function collect(value) {
      if (!value || typeof value !== 'object') return;
      if (value.type === 'Feature' && value.properties?.kind) actual.set(value.properties.id, value.properties);
      for (const child of Object.values(value)) collect(child);
    }
    collect(decoded);
    const expected = places.filter(p => p.min_zoom <= zoom);
    const missing = expected.filter(p => !actual.has(p.id)).map(p => p.id);
    assert.equal(missing.length, 0, `Zoom ${zoom} is missing ${missing.length} labels: ${missing.slice(0, 8).join(', ')}`);
    assert.equal(actual.size, expected.length, `Unexpected labels at zoom ${zoom}`);
    for (const place of expected) {
      const label = actual.get(place.id);
      assert.equal(label.name, place.name_kanji, place.id);
      assert.equal(label.reading, place.reading_kana, place.id);
      assert.equal(label.kind, place.kind, place.id);
    }
    const counts = {};
    for (const label of actual.values()) counts[label.kind] = (counts[label.kind] || 0) + 1;
    checks.push({ zoom, labels: actual.size, counts });
  }
  return checks;
}
