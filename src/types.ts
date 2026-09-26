import type { ReadingTarget } from './reading/matcher';
export type Place = ReadingTarget & {
  kind: 'region' | 'prefecture' | 'major-city' | 'municipality';
  reading_hepburn: string;
  parent_ids: string[];
  label_point: [number, number];
  geometry_ref: string;
  min_zoom: number;
  priority: number;
  sources: Record<string, unknown>;
};
