import { expect, it } from 'vitest';
import { placeStatus, recordAttempt } from './storage';
import { matchReading } from './reading/matcher';
const target = { id: 'fixture', name_kanji: '東京', reading_kana: 'とうきょう' };
const result = matchReading('toukyou', target);

it('repeated attempts in one day cannot manufacture mastery', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  let progress = recordAttempt(target.id, undefined, result, false, now);
  for (let i = 0; i < 10; i++) progress = recordAttempt(target.id, progress, result, false, now);
  expect(progress.unaidedDays).toHaveLength(1);
  expect(placeStatus(progress, now.getTime())).toBe('learning');
  progress = recordAttempt(target.id, progress, result, false, new Date('2026-09-26T12:00:00Z'));
  progress = recordAttempt(target.id, progress, result, false, new Date('2026-09-27T12:00:00Z'));
  expect(placeStatus(progress, Date.parse('2026-09-27T12:00:00Z'))).toBe('mastered');
});
it('furigana and reveal do not earn unaided mastery', () => {
  expect(recordAttempt(target.id, undefined, result, true).unaidedDays).toEqual([]);
  expect(recordAttempt(target.id, undefined, null, false).lastGrade).toBe('revealed');
});
it('wrong answers clear the unaided run, and due status is time-based', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const initial = recordAttempt(target.id, undefined, result, false, now);
  const wrong = recordAttempt(target.id, initial, matchReading('tokio', target), false, now);
  expect(wrong.unaidedDays).toEqual([]);
  expect(placeStatus(initial, now.getTime() + 86400000)).toBe('due');
});
