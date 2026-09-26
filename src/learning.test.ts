import { expect, it } from 'vitest';
import { distanceKm, nextPlace } from './learning';
import { recordAttempt } from './storage';
import type { Place } from './types';
const place = (id: string, point: [number, number], kind: Place['kind'] = 'prefecture'): Place => ({
  id, label_point: point, kind, name_kanji: '', reading_kana: '', reading_hepburn: '', parent_ids: [], geometry_ref: '', min_zoom: 5, priority: 0, sources: {},
});
it('Next stays in the current tier and chooses the nearest new place', () => {
  const current = place('current', [140, 36]);
  const near = place('near', [140.1, 36]);
  const far = place('far', [142, 37]);
  const otherTier = place('other', [140, 36], 'municipality');
  expect(nextPlace(current, [far, otherTier, current, near], {})?.id).toBe('near');
  expect(distanceKm(current.label_point, current.label_point)).toBe(0);
});
it('Next prioritizes due places and stops when no eligible place remains', () => {
  const current = place('current', [140, 36]);
  const due = place('due', [142, 37]);
  const next = place('new', [140.1, 36]);
  const progress = recordAttempt('due', undefined, null, true, new Date('2024-01-01'));
  expect(nextPlace(current, [current, due, next], { due: progress })?.id).toBe('due');
  expect(nextPlace(current, [current], {})).toBeUndefined();
});
