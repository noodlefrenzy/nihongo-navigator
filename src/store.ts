import { create } from 'zustand';
import { defaultSettings, localRepository, recordAttempt, type Progress, type Settings } from './storage';
import type { ReadingResult } from './reading/matcher';

type LearningState = {
  ready: boolean; settings: Settings; progress: Record<string, Progress>; storageError: string;
  load: () => Promise<void>; setSettings: (patch: Partial<Settings>) => void;
  answer: (id: string, result: ReadingResult | null, hinted: boolean) => void;
};
let settingsWrites = Promise.resolve<unknown>(undefined);
export const useLearning = create<LearningState>((set, get) => ({
  ready: false, settings: defaultSettings, progress: {}, storageError: '',
  async load() {
    try { const loaded = await localRepository.load(); set({ ...loaded, ready: true }); }
    catch { set({ ready: true, storageError: 'Progress could not be opened. Check that browser storage is enabled, then reload.' }); }
  },
  setSettings(patch) {
    const settings = { ...get().settings, ...patch }; set({ settings });
    settingsWrites = settingsWrites.then(() => localRepository.saveSettings(settings)).catch(() => {
      set({ storageError: 'Your settings could not be saved. Check available browser storage.' });
    });
  },
  answer(id, result, hinted) {
    const item = recordAttempt(id, get().progress[id], result, hinted);
    set({ progress: { ...get().progress, [id]: item } });
    void localRepository.saveProgress(item).catch(() => set({ storageError: 'This answer could not be saved. Keep this tab open and check available browser storage.' }));
  },
}));
