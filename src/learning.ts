import type { Place } from './types';
import { placeStatus, type Progress } from './storage';

export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function nextPlace(current: Place | null, places: Place[], progress: Record<string, Progress>): Place | undefined {
  const origin: [number, number] = current?.label_point ?? [137.6, 36.3];
  const candidates = places.filter(p => p.id !== current?.id && (!current || p.kind === current.kind));
  const eligible = candidates.filter(p => placeStatus(progress[p.id]) !== 'mastered');
  return eligible.sort((a, b) => {
    const priority = (p: Place) => ['due', 'unseen', 'learning', 'mastered'].indexOf(placeStatus(progress[p.id]));
    return priority(a) - priority(b) || distanceKm(origin, a.label_point) - distanceKm(origin, b.label_point);
  })[0];
}
