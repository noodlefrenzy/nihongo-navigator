import { toHiragana, toRomaji } from 'wanakana';

export type ReadingTarget = {
  id: string;
  name_kanji: string;
  reading_kana: string;
  base_name?: string;
  suffix?: string;
  suffix_reading?: string;
};
export type ReadingOptions = { requireSuffix?: boolean; strictHepburn?: boolean };
export type DiffPart = { expected: string; actual: string; status: 'same' | 'missing' | 'extra' | 'different' };
export type ReadingResult = {
  grade: 'exact' | 'close' | 'wrong';
  accepted: boolean;
  kana: string;
  hepburn: string;
  notes: string[];
  diff: DiffPart[];
};

const macrons: Record<string, string> = { ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'oo' };
const displayMacrons: Record<string, string> = { aa: 'ā', ii: 'ī', uu: 'ū', ee: 'ē', oo: 'ō', ou: 'ō' };
const separators = /[\s\-‐‑‒–—'’ʼ]/gu;

/** Normalize half-width kana and katakana without consulting kanji. */
export function hiragana(value: string): string {
  return toHiragana(value.normalize('NFKC'), { passRomaji: true });
}

/** Display Hepburn is derived exclusively from the source kana. */
export function hepburn(kana: string): string {
  return toRomaji(hiragana(kana), { romanization: 'hepburn' })
    .replace(/aa|ii|uu|ee|oo|ou/g, pair => displayMacrons[pair]);
}

function roman(value: string): string {
  const normalized = hiragana(value.trim().toLowerCase());
  return toRomaji(normalized, { romanization: 'hepburn' })
    .normalize('NFC')
    .replace(/[āīūēō]/g, letter => macrons[letter])
    .replace(separators, '')
    // Aliases are applied as syllables; no broad edit-distance acceptance.
    .replace(/(?:sh|sy)([auo])/g, 'sh$1')
    .replace(/(?:ch|ty|cy)([auo])/g, 'ch$1')
    .replace(/(?:j|jy|zy)([auo])/g, 'j$1')
    .replace(/si/g, 'shi').replace(/ti/g, 'chi').replace(/tu/g, 'tsu')
    .replace(/hhu/g, 'ffu').replace(/zzi/g, 'jji')
    .replace(/hu/g, 'fu').replace(/zi/g, 'ji')
    .replace(/tch/g, 'cch')
    .replace(/m(?=[bmp])/g, 'n');
}

function vowelKey(value: string): string {
  return roman(value).replace(/aa|ii|uu|ee|ei|oo|ou/g, pair => `${pair[0]}:`);
}

/** A colon denotes a long vowel; geminated consonants remain untouched. */
export function strictKey(value: string): string {
  return vowelKey(value).replace(/n{2,}/g, 'n');
}

export function lenientKey(value: string): string {
  return strictKey(value).replace(/:/g, '');
}

// Broad n keys alone cannot distinguish かな from かんな. Check each actual
// nasal position from the authoritative kana after symmetric normalization.
function matchesNasalPositions(input: string, canonical: string, lenient: boolean): boolean {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const key = (s: string) => lenient ? vowelKey(s).replace(/:/g, '') : vowelKey(s);
  const pattern = canonical.split('ん').map(part => escape(key(part))).join('n{1,2}');
  return new RegExp(`^${pattern}$`, 'u').test(key(input));
}

function kanaLenient(value: string): string {
  return hiragana(value).replace(/([ぁ-ゖ])([あいうえおー])/gu, (pair, first: string, second: string) => {
    const end = toRomaji(first).slice(-1);
    const next = toRomaji(second);
    return second === 'ー' || ['aa', 'ii', 'uu', 'ee', 'ei', 'oo', 'ou'].includes(end + next) ? first : pair;
  });
}

function inputKana(value: string): string {
  // Keep separators until transliteration so n' before a vowel stays nasal.
  return toHiragana(value.normalize('NFKC').toLowerCase()
    .replace(/[āīūēō]/g, letter => macrons[letter])
    .replace(/[\s\-‐‑‒–—]/gu, '')
    .replace(/[’ʼ]/g, "'"));
}

/** Levenshtein alignment is explanatory only; it never decides acceptance. */
export function kanaDiff(expected: string, actual: string): DiffPart[] {
  const a = Array.from(expected), b = Array.from(actual);
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1,
      matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  const diff: DiffPart[] = [];
  let i = a.length, j = b.length;
  while (i || j) {
    if (i && j && matrix[i][j] === matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      diff.push({ expected: a[--i], actual: b[--j], status: a[i] === b[j] ? 'same' : 'different' });
    } else if (i && matrix[i][j] === matrix[i - 1][j] + 1) {
      diff.push({ expected: a[--i], actual: '', status: 'missing' });
    } else {
      diff.push({ expected: '', actual: b[--j], status: 'extra' });
    }
  }
  return diff.reverse();
}

export function matchReading(input: string, target: ReadingTarget, options: ReadingOptions = {}): ReadingResult {
  const kana = hiragana(target.reading_kana);
  if (!/^[ぁ-ゖー]+$/.test(kana)) throw new Error(`Invalid canonical kana for ${target.id}`);
  const suffix = target.suffix_reading ? hiragana(target.suffix_reading) : '';
  if (suffix && !kana.endsWith(suffix)) throw new Error(`Suffix does not match source reading for ${target.id}`);
  const base = suffix ? kana.slice(0, -suffix.length) : kana;
  const alternatives = options.requireSuffix || !suffix ? [kana] : [base, kana];
  const strict = strictKey(input), lenient = lenientKey(input);
  const normalizedKana = hiragana(input.trim()).replace(separators, '');
  const kanaInput = /^[ぁ-ゖー]+$/u.test(normalizedKana);
  const exact = Boolean(strict) && alternatives.some(reading => kanaInput
    ? normalizedKana === reading
    : strictKey(reading) === strict && matchesNasalPositions(input, reading, false));
  const close = !exact && Boolean(lenient) && alternatives.some(reading => kanaInput
    ? kanaLenient(normalizedKana) === kanaLenient(reading)
    : lenientKey(reading) === lenient && matchesNasalPositions(input, reading, true));
  const grade = exact ? 'exact' : close ? 'close' : 'wrong';
  const notes: string[] = [];
  if (close) {
    const expected = alternatives.find(reading => lenientKey(reading) === lenient)!;
    notes.push(`Long vowel: ${hepburn(expected)} = ${expected}. Keep the long vowels shown in the reading.`);
    if (options.strictHepburn) notes.push('Strict Hepburn requires every long vowel.');
  }
  if (grade === 'wrong' && kana.includes('っ') && !inputKana(input).includes('っ')) {
    notes.push('Small っ doubles the following consonant. Keep the double consonant in your answer.');
  }
  if (suffix) {
    notes.push(`${target.suffix} is read ${suffix} (${hepburn(suffix)}) here.`);
    if (grade === 'wrong' && lenient.startsWith(lenientKey(base))) {
      notes.push(options.requireSuffix && lenient === lenientKey(base)
        ? 'Include the administrative suffix in this mode.'
        : `Check the suffix: ${target.name_kanji} ends in ${suffix}.`);
    }
  }
  const actualKana = inputKana(input);
  const diffTarget = alternatives.reduce((best, current) => {
    const cost = (v: string) => kanaDiff(v, actualKana).filter(p => p.status !== 'same').length;
    return cost(current) < cost(best) ? current : best;
  });
  return { grade, accepted: exact || (close && !options.strictHepburn), kana,
    hepburn: hepburn(kana), notes, diff: grade === 'exact' ? [] : kanaDiff(diffTarget, actualKana) };
}
