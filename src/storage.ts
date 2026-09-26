import Dexie, { type Table } from 'dexie';
import type { ReadingResult } from './reading/matcher';

export type Settings = {
  labelFurigana: 'always' | 'never'; sentenceFurigana: 'always' | 'never';
  strictHepburn: boolean; requireSuffix: boolean; inputMode: 'romaji' | 'kana';
  sentenceLevel: 'beginner' | 'intermediate' | 'advanced';
  ttsVoice: string; ttsRate: number;
};
export const defaultSettings: Settings = { labelFurigana: 'never', sentenceFurigana: 'always',
  strictHepburn: false, requireSuffix: false, inputMode: 'romaji', sentenceLevel: 'beginner', ttsVoice: '', ttsRate: 1 };
export type Progress = {
  id: string; attempts: number; accepted: number; exact: number; lastReviewed: string;
  unaidedDays: string[]; lastGrade: ReadingResult['grade'] | 'revealed'; hints: number;
};
export type PlaceStatus = 'unseen' | 'learning' | 'mastered' | 'due';

class ChizuDB extends Dexie {
  progress!: Table<Progress, string>;
  settings!: Table<{ id: string; value: Settings }, string>;
  constructor() { super('chizu'); this.version(1).stores({ progress: 'id,lastReviewed', settings: 'id' }); }
}
const db = new ChizuDB();

/** Repository boundary: a future sync adapter can replace these operations. */
export const localRepository = {
  async load() {
    const [progress, setting] = await Promise.all([db.progress.toArray(), db.settings.get('preferences')]);
    return { progress: Object.fromEntries(progress.map(p => [p.id, p])), settings: { ...defaultSettings, ...setting?.value } };
  },
  saveProgress: (item: Progress) => db.progress.put(item),
  saveSettings: (value: Settings) => db.settings.put({ id: 'preferences', value }),
};

export function placeStatus(progress?: Progress, now = Date.now()): PlaceStatus {
  if (!progress) return 'unseen';
  if (now - Date.parse(progress.lastReviewed) >= 24 * 60 * 60 * 1000) return 'due';
  return progress.unaidedDays.length >= 3 ? 'mastered' : 'learning';
}

export function recordAttempt(id: string, old: Progress | undefined, result: ReadingResult | null, hinted: boolean, now = new Date()): Progress {
  const days = old?.unaidedDays ?? [];
  const day = now.toISOString().slice(0, 10);
  const unaided = result?.grade === 'exact' && !hinted;
  return { id, attempts: (old?.attempts ?? 0) + 1, accepted: (old?.accepted ?? 0) + Number(result?.accepted ?? false),
    exact: (old?.exact ?? 0) + Number(result?.grade === 'exact'), lastReviewed: now.toISOString(),
    unaidedDays: unaided ? [...new Set([...days, day])] : result?.accepted ? days : [],
    lastGrade: result?.grade ?? 'revealed', hints: (old?.hints ?? 0) + Number(hinted || !result) };
}
