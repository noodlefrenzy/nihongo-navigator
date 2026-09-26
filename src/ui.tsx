import type { Place } from './types';
import type { PlaceStatus } from './storage';

export function Icon({ kind }: { kind: 'close' | 'arrow' | 'settings' }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={kind === 'close' ? 'M6 6l12 12M18 6 6 18' : kind === 'arrow' ? 'M4 12h16m-6-6 6 6-6 6' : 'M4 7h16M4 17h16M9 4v6m6 4v6'} /></svg>;
}
export function PlaceName({ place, reading }: { place: Place; reading: boolean }) {
  return <span lang="ja">{reading ? <ruby>{place.name_kanji}<rp>（</rp><rt>{place.reading_kana}</rt><rp>）</rp></ruby> : place.name_kanji}</span>;
}
export const statusNames: Record<PlaceStatus, string> = { unseen: 'New', learning: 'Learning', mastered: 'Mastered', due: 'Review' };
export function StatusIcon({ state }: { state: PlaceStatus }) {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    {state === 'mastered' ? <path d="m4 10 4 4 8-9" /> : state === 'due' ? <><path d="M4 8a6 6 0 1 1 1 7M4 3v5h5" /></> : <><circle cx="10" cy="10" r="5.5" />{state === 'learning' && <path d="M10 4.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor" />}</>}
  </svg>;
}
