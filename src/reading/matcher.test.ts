import { describe, expect, it } from 'vitest';
import { hepburn, hiragana, kanaDiff, lenientKey, matchReading, strictKey, type ReadingTarget } from './matcher';

// Readings explicitly supplied by the user's acceptance specification.
// These test fixtures are never published as curriculum records.
const place = (name_kanji: string, reading_kana: string, id = name_kanji): ReadingTarget => ({ id, name_kanji, reading_kana });
const tokyo = place('東京', 'とうきょう');
const osaka = place('大阪', 'おおさか');
const shinOsaka = place('新大阪', 'しんおおさか');
const sapporo = place('札幌', 'さっぽろ');
const shinbashi = place('新橋', 'しんばし');
const nihonbashi = place('日本橋', 'にほんばし', 'test:tokyo-nihonbashi');
const nipponbashi = place('日本橋', 'にっぽんばし', 'test:osaka-nipponbashi');
const kusatsu = { ...place('草津町', 'くさつまち'), base_name: '草津', suffix: '町', suffix_reading: 'まち' };

describe('required reading acceptance table', () => {
  it.each([
    ...['tokyo', 'toukyo'].map(input => [tokyo, input, 'close']),
    ...['tōkyō', 'toukyou', 'とうきょう', 'トウキョウ'].map(input => [tokyo, input, 'exact']),
    [tokyo, 'tokio', 'wrong'],
    [osaka, 'osaka', 'close'], [osaka, 'ōsaka', 'exact'], [osaka, 'oosaka', 'exact'],
    ...['shin-osaka', 'shinosaka'].map(input => [shinOsaka, input, 'close']),
    ...["shin'ōsaka", 'shinnoosaka'].map(input => [shinOsaka, input, 'exact']),
    [sapporo, 'sapporo', 'exact'], [sapporo, 'saporo', 'wrong'],
    [shinbashi, 'shimbashi', 'exact'], [shinbashi, 'shinbashi', 'exact'],
    [nihonbashi, 'nihonbashi', 'exact'], [nipponbashi, 'nipponbashi', 'exact'],
    [nihonbashi, 'nipponbashi', 'wrong'], [nipponbashi, 'nihonbashi', 'wrong'],
    [kusatsu, 'kusatsu', 'exact'], [kusatsu, 'kusatsumachi', 'exact'],
    [kusatsu, 'kusatsuchou', 'wrong'],
  ] as [ReadingTarget, string, string][])('$0.name_kanji ← %s: %s', (target, input, grade) => {
    const result = matchReading(input, target);
    expect(result.grade).toBe(grade);
    expect(result.accepted).toBe(grade !== 'wrong');
  });
});

describe('diagnostics, settings and conservative matching', () => {
  it('explains the missed small tsu', () => {
    const result = matchReading('saporo', sapporo);
    expect(result.notes.join(' ')).toContain('Small っ');
    expect(result.diff).toContainEqual({ expected: 'っ', actual: '', status: 'missing' });
  });
  it('explains the actual town suffix', () => {
    expect(matchReading('kusatsuchou', kusatsu).notes.join(' ')).toContain('まち');
  });
  it('requires the suffix only when configured', () => {
    expect(matchReading('kusatsu', kusatsu, { requireSuffix: true }).accepted).toBe(false);
    expect(matchReading('kusatsumachi', kusatsu, { requireSuffix: true }).grade).toBe('exact');
  });
  it('preserves the close diagnosis when strict mode rejects it', () => {
    const result = matchReading('tokyo', tokyo, { strictHepburn: true });
    expect(result).toMatchObject({ grade: 'close', accepted: false });
    expect(result.notes.join(' ')).toContain('Long vowel');
  });
  it.each(['', 'tokyooo', 'toky', 'tookyouu', 'takkyo', 'toky0', '東京', 'tokyö', 'tōkiō'])('rejects %s', input => {
    expect(matchReading(input, tokyo).accepted).toBe(false);
  });
  it.each([['sima', 'しま'], ['tiba', 'ちば'], ['turu', 'つる'], ['huzi', 'ふじ'], ['syou', 'しょう'], ['tyou', 'ちょう'], ['zyou', 'じょう']])('accepts Kunrei %s', (input, kana) => {
    expect(matchReading(input, place('test', kana)).grade).toBe('exact');
  });
  it('normalizes half-width source kana', () => expect(hiragana('ﾎｯｶｲﾄﾞｳ')).toBe('ほっかいどう'));
  it('derives macron Hepburn', () => expect(hepburn('とうきょう')).toBe('tōkyō'));
  it('preserves gemination in both keys', () => {
    expect(strictKey('さっぽろ')).not.toBe(strictKey('さぽろ'));
    expect(lenientKey('さっぽろ')).not.toBe(lenientKey('さぽろ'));
  });
  it('keeps duplicate names tied to their input record', () => {
    expect(nihonbashi.id).not.toBe(nipponbashi.id);
    expect(matchReading('nihonbashi', nipponbashi).accepted).toBe(false);
  });
  it('aligns kana for substitution and insertions', () => {
    expect(kanaDiff('みた', 'さんだ').some(part => part.status !== 'same')).toBe(true);
  });
  it.each(['kanna', 'kannna', "kan'na"])('accepts nasal notation %s without deleting the next n', input => {
    expect(matchReading(input, place('fixture', 'かんな')).grade).toBe('exact');
  });
  it.each(['kana', 'かな', 'かあな'])('never silently drops a nasal: %s', input => {
    expect(matchReading(input, place('fixture', 'かんな')).accepted).toBe(false);
  });
  it('does not merge distinct homophonic kana', () => {
    expect(matchReading('ぢ', place('fixture', 'じ')).accepted).toBe(false);
    expect(matchReading('じ', place('fixture', 'ぢ')).accepted).toBe(false);
    expect(matchReading('ぢ ま', place('fixture', 'じま')).accepted).toBe(false);
    expect(matchReading('しん おおさか', shinOsaka).grade).toBe('exact');
  });
  it.each(['maccha', 'matcha', 'mattya'])('accepts geminated Hepburn and Kunrei %s', input => {
    expect(matchReading(input, place('fixture', 'まっちゃ')).grade).toBe('exact');
  });
  it.each([['ezzi', 'えっじ'], ['hhu', 'っふ']])('retains gemination in Kunrei alias %s', (input, kana) => {
    expect(matchReading(input, place('normalization fixture', kana)).grade).toBe('exact');
    expect(matchReading(input.replace(/(.)\1/, '$1'), place('normalization fixture', kana)).accepted).toBe(false);
  });
});
