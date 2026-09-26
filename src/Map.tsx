import { useEffect, useRef, useState } from 'react';
import maplibregl, { type ExpressionSpecification } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import type { Place } from './types';
import { placeStatus, type Progress, type PlaceStatus } from './storage';
import 'maplibre-gl/dist/maplibre-gl.css';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
const attribution = '「国土数値情報（行政区域データ）」（国土交通省、2024年）を加工して作成。';
const names: ExpressionSpecification = ['get', 'name'];
const ruby: ExpressionSpecification = ['format', ['get', 'reading'], { 'font-scale': 0.55 }, '\n', {}, ['get', 'name'], { 'font-scale': 1 }];

const tierAt = (zoom: number): Place['kind'] => zoom < 5 ? 'region' : zoom < 7 ? 'prefecture' : zoom < 9 ? 'major-city' : 'municipality';
const inTier = (place: Place, tier: Place['kind']) => place.kind === tier || (tier === 'municipality' && place.kind === 'major-city');

function statusImage(state: PlaceStatus): ImageData {
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
  const context = canvas.getContext('2d')!;
  context.scale(2, 2); context.lineWidth = 1.5; context.strokeStyle = state === 'due' ? '#855219' : '#226b57'; context.fillStyle = '#226b57';
  context.beginPath();
  if (state === 'mastered') { context.moveTo(3, 8); context.lineTo(6.5, 11.5); context.lineTo(13, 4); }
  else if (state === 'due') { context.arc(8, 8, 5, -2.7, 2.4); context.moveTo(3, 2); context.lineTo(3, 6); context.lineTo(7, 6); }
  else { context.arc(8, 8, 5, 0, Math.PI * 2); }
  context.stroke();
  if (state === 'learning') { context.beginPath(); context.arc(8, 8, 5, -Math.PI / 2, Math.PI / 2); context.closePath(); context.fill(); }
  return context.getImageData(0, 0, 32, 32);
}

export function JapanMap({ places, loadedPrefectures, selected, furigana, progress, onSelect, onView, onNeedPrefectures }: {
  places: Place[]; selected: Place | null; furigana: boolean;
  loadedPrefectures: string[];
  progress: Record<string, Progress>;
  onSelect: (id: string) => void; onView: (ids: string[]) => void;
  onNeedPrefectures: (codes: string[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const callbacks = useRef({ onSelect, onView, onNeedPrefectures });
  callbacks.current = { onSelect, onView, onNeedPrefectures };
  const placesRef = useRef(places); placesRef.current = places;
  const furiganaRef = useRef(furigana); furiganaRef.current = furigana;
  const progressRef = useRef(progress); progressRef.current = progress;
  const refreshStatus = useRef<() => void>(() => {});
  const refreshView = useRef<() => void>(() => {});
  const oldSelection = useRef<string | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let map: maplibregl.Map | undefined;
    const observer = new ResizeObserver(() => map?.resize());
    if (container.current) observer.observe(container.current);
    // Local ideographs must be loaded before MapLibre rasterizes its glyphs.
    document.fonts.load('16px "BIZ UDPGothic"').then(() => {
      if (cancelled || !container.current) return;
      const origin = location.origin;
      map = new maplibregl.Map({
        container: container.current, center: [137.6, 36.3], zoom: 4.6, minZoom: 3, maxZoom: 15,
        bounds: [[122, 24], [146, 46]], fitBoundsOptions: { padding: { top: 70, bottom: 55, left: innerWidth > 760 ? 265 : 25, right: 30 } },
        localIdeographFontFamily: 'BIZ UDPGothic', attributionControl: false,
        style: { version: 8, glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
          sources: {
            prefectures: { type: 'vector', url: `pmtiles://${origin}/data/tiles/prefectures.pmtiles`, promoteId: 'id', attribution },
            cities: { type: 'vector', url: `pmtiles://${origin}/data/tiles/major-cities.pmtiles`, promoteId: 'id' },
            places: { type: 'vector', url: `pmtiles://${origin}/data/tiles/labels.pmtiles`, promoteId: 'id' },
            statuses: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
          }, layers: [
            { id: 'water', type: 'background', paint: { 'background-color': '#e5eff2' } },
            { id: 'land', type: 'fill', source: 'prefectures', 'source-layer': 'boundaries', paint: { 'fill-color': '#f7f8f1' } },
            { id: 'coast', type: 'line', source: 'prefectures', 'source-layer': 'boundaries', paint: { 'line-color': '#9babaa', 'line-width': 0.8 } },
            { id: 'city-boundaries', type: 'line', source: 'cities', 'source-layer': 'boundaries', minzoom: 7,
              paint: { 'line-color': '#b6c3ba', 'line-width': 0.7 } },
            { id: 'selected-place', type: 'circle', source: 'places', 'source-layer': 'labels',
              paint: { 'circle-radius': 5, 'circle-color': '#226b57', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2,
                'circle-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0],
                'circle-stroke-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0] } },
            { id: 'place-labels', type: 'symbol', source: 'places', 'source-layer': 'labels',
              filter: ['==', ['get', 'kind'], 'region'],
              layout: { 'text-field': furiganaRef.current ? ruby : names, 'text-font': ['Noto Sans Regular'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 3, 12, 6, 17, 10, 20],
                'text-line-height': 1.35, 'text-padding': 10, 'text-max-width': 12,
                'symbol-sort-key': ['get', 'priority'], 'text-allow-overlap': false },
              paint: { 'text-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#176349',
                ['match', ['feature-state', 'status'], 'mastered', '#176349', 'due', '#855219', 'learning', '#3f6555', '#263e3c']],
                'text-halo-color': '#f7f8f1', 'text-halo-width': 2 } },
            { id: 'learning-marks', type: 'symbol', source: 'statuses',
              layout: { 'icon-image': ['get', 'status'], 'icon-size': .75, 'icon-offset': [0, furiganaRef.current ? 34 : 23], 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
          ] },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
      map.on('error', event => { console.error(event.error); setError('The map could not load. You can still choose a place from the list.'); callbacks.current.onView(placesRef.current.map(p => p.id)); });
      let lastMarks = '';
      const updateMarks = () => {
        if (!map?.getLayer('place-labels')) return;
        const visible = [...new Map(map.queryRenderedFeatures({ layers: ['place-labels'] }).map(f => [f.properties.id, f])).values()];
        const features = visible.map(feature => ({ type: 'Feature' as const, geometry: feature.geometry,
          properties: { id: feature.properties.id, status: placeStatus(progressRef.current[feature.properties.id]) } }));
        const serialized = JSON.stringify(features);
        if (serialized !== lastMarks) { lastMarks = serialized; (map.getSource('statuses') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features }); }
      };
      refreshStatus.current = () => {
        if (!map?.getLayer('place-labels')) return;
        for (const p of placesRef.current) map.setFeatureState({ source: 'places', sourceLayer: 'labels', id: p.id }, { status: placeStatus(progressRef.current[p.id]) });
        updateMarks();
      };
      let lastView = '', lastNeeds = '', lastTier = '';
      const updateView = () => {
        if (!map?.getLayer('place-labels')) return;
        const tier = tierAt(map.getZoom());
        if (lastTier !== tier) {
          map.setFilter('place-labels', tier === 'municipality' ? ['in', ['get', 'kind'], ['literal', ['major-city', 'municipality']]] : ['==', ['get', 'kind'], tier]);
          lastTier = tier;
        }
        const bounds = map.getBounds();
        const ids = placesRef.current.filter(p => bounds.contains(p.label_point) && inTier(p, tier)).map(p => p.id);
        if (JSON.stringify(ids) !== lastView) { lastView = JSON.stringify(ids); callbacks.current.onView(ids); }
        if (tier === 'municipality') {
          const codes = [...new Set(map.querySourceFeatures('places', { sourceLayer: 'labels' })
            .filter(f => f.geometry.type === 'Point' && bounds.contains(f.geometry.coordinates as [number, number]) &&
              ['municipality', 'major-city'].includes(f.properties.kind))
            .map(f => String(f.properties.id).slice(3, 5)))].sort();
          if (JSON.stringify(codes) !== lastNeeds) { lastNeeds = JSON.stringify(codes); callbacks.current.onNeedPrefectures(codes); }
        }
      };
      refreshView.current = updateView;
      map.on('load', () => {
        for (const state of ['unseen', 'learning', 'mastered', 'due'] as const) map!.addImage(state, statusImage(state), { pixelRatio: 2 });
        setReady(true); updateView(); refreshStatus.current();
      });
      map.on('idle', () => { updateView(); updateMarks(); });
      map.on('moveend', updateView);
      map.on('click', 'place-labels', event => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === 'string') callbacks.current.onSelect(id);
      });
      map.on('mouseenter', 'place-labels', () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'place-labels', () => { if (map) map.getCanvas().style.cursor = ''; });
    }).catch((cause) => { console.error(cause); setError('The map could not start. Reload to try again, or use the places list.'); });
    return () => { cancelled = true; observer.disconnect(); map?.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (ready && map?.getLayer('place-labels')) {
      map.setLayoutProperty('place-labels', 'text-field', furigana ? ruby : names);
      map.setLayoutProperty('learning-marks', 'icon-offset', [0, furigana ? 34 : 23]);
    }
  }, [furigana, ready]);
  useEffect(() => {
    if (ready) { refreshStatus.current(); refreshView.current(); }
  }, [places, progress, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const code of loadedPrefectures) {
      const id = `municipalities-${code}`;
      if (map.getSource(id)) continue;
      map.addSource(id, { type: 'vector', url: `pmtiles://${location.origin}/data/tiles/${code}.pmtiles`, promoteId: 'id' });
      map.addLayer({ id, type: 'line', source: id, 'source-layer': 'boundaries', minzoom: 9,
        paint: { 'line-color': '#b6c3ba', 'line-width': 0.7 } }, 'selected-place');
    }
  }, [loadedPrefectures, ready]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (oldSelection.current) map.setFeatureState({ source: 'places', sourceLayer: 'labels', id: oldSelection.current }, { selected: false });
    oldSelection.current = selected?.id ?? null;
    if (!selected) return;
    map.setFeatureState({ source: 'places', sourceLayer: 'labels', id: selected.id }, { selected: true });
    map.flyTo({ center: selected.label_point, zoom: ({ region: 4.8, prefecture: 6.1, 'major-city': 8, municipality: 9.5 })[selected.kind],
      offset: innerWidth > 760 ? [-60, 0] : [0, -100],
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850 });
  }, [selected?.id, ready]);
  return <><div ref={container} className="map" role="region" aria-label="Interactive map of Japan" />
    {!ready && !error && <p className="map-message" role="status">Opening the map of Japan…</p>}
    {error && <p className="map-message error" role="alert">{error}</p>}</>;
}
