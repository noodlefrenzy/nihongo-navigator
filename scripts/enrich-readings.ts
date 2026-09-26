import { readFileSync } from 'node:fs';
import { hepburn } from '../src/reading/matcher.ts';
const places = JSON.parse(readFileSync(0, 'utf8'));
for (const p of places) {
  p.reading_hepburn = hepburn(p.reading_kana);
  p.sources.reading_hepburn = { derived: 'WanaKana 5.3.1 Hepburn from reading_kana; display macrons' };
}
process.stdout.write(JSON.stringify(places));
