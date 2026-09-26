import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JapanMap } from './Map';
import { ReadingCard } from './ReadingCard';
import { SettingsPanel } from './Settings';
import { useLearning } from './store';
import { placeStatus } from './storage';
import { nextPlace } from './learning';
import { Icon, PlaceName, StatusIcon, statusNames } from './ui';
import type { Place } from './types';

export function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadedPrefectures, setLoadedPrefectures] = useState<string[]>([]);
  const requests = useRef(new Map<string, Promise<void>>());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState('');
  const { settings, progress, ready, storageError, load, setSettings } = useLearning();
  const furigana = settings.labelFurigana === 'always';
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let active = true;
    Promise.all(['regions', 'prefectures', 'major-cities'].map(async tier => {
      const response = await fetch(`/data/places/${tier}.json`);
      if (!response.ok) throw new Error('Could not load the place data. Reload to try again.');
      return response.json() as Promise<Place[]>;
    })).then(data => { if (active) setPlaces(old => [...new Map([...old, ...data.flat()].map(p => [p.id, p])).values()]); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  const loadPrefecture = useCallback((code: string) => {
    const pending = requests.current.get(code);
    if (pending) return pending;
    if (!/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(code)) return Promise.reject(new Error('Unknown prefecture.'));
    const request = fetch(`/data/places/${code}.json`).then(async response => {
      if (!response.ok) throw new Error('Municipality data could not load. Reload to try again.');
      const chunk = await response.json() as Place[];
      setPlaces(old => [...new Map([...old, ...chunk].map(p => [p.id, p])).values()]);
      setLoadedPrefectures(old => [...new Set([...old, code])]);
    });
    requests.current.set(code, request);
    return request;
  }, []);
  const loadVisiblePrefectures = useCallback((codes: string[]) => {
    for (const code of codes) void loadPrefecture(code).catch(e => setError(e.message));
  }, [loadPrefecture]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => document.documentElement.style.setProperty('--visible-height', `${viewport?.height ?? innerHeight}px`);
    resize(); viewport?.addEventListener('resize', resize);
    return () => viewport?.removeEventListener('resize', resize);
  }, []);
  const selected = places.find(p => p.id === selectedId) ?? null;
  const visible = useMemo(() => places.filter(p => visibleIds.includes(p.id)).sort((a, b) => a.priority - b.priority), [places, visibleIds]);
  const following = nextPlace(selected, places, progress);
  const select = (id: string) => {
    const open = () => { setSelectedId(id); setListOpen(false); setSettingsOpen(false); };
    if (places.some(p => p.id === id)) open();
    else if (/^jp:\d{5}$/.test(id)) void loadPrefecture(id.slice(3, 5)).then(open).catch(e => setError(e.message));
  };
  const practiced = Object.keys(progress).length;
  return <main>
    <a className="skip-link" href="#place-list" onClick={() => setListOpen(true)}>Skip to places in view</a>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Chizu home"><span lang="ja">地図で学ぶ</span><span>Chizu</span></a>
      <p className="tagline">A place to begin. A name to learn.</p>
      <div className="toolbar"><button className="list-toggle" onClick={() => { setListOpen(!listOpen); setSettingsOpen(false); }} aria-expanded={listOpen}>Places</button>
        <button className="furigana-toggle" aria-pressed={furigana} onClick={() => setSettings({ labelFurigana: furigana ? 'never' : 'always' })}><span lang="ja">あ</span> Furigana <strong>{furigana ? 'on' : 'off'}</strong></button>
        <button className="icon-button" aria-label="Settings" aria-expanded={settingsOpen} onClick={() => { setSettingsOpen(!settingsOpen); setListOpen(false); }}><Icon kind="settings" /></button></div>
    </header>
    {places.length > 0 && ready && <JapanMap places={places} loadedPrefectures={loadedPrefectures} selected={selected} furigana={furigana} progress={progress} onSelect={select} onView={setVisibleIds} onNeedPrefectures={loadVisiblePrefectures} />}
    {(error || storageError) && <p role="alert" className="map-message error">{error || storageError}</p>}
    <aside className={`places-panel ${listOpen ? 'open' : ''}`} aria-label="Places in view" id="place-list" tabIndex={-1}>
      <div className="panel-intro"><h1>Read your way<br />across Japan.</h1><p>{practiced ? `${practiced} ${practiced === 1 ? 'name' : 'names'} practised. Keep exploring.` : 'Choose a name. Try its reading.'}<br />Zoom in to discover more.</p></div>
      <div className="list-heading"><h2>Places in view</h2><span>{visible.length}</span></div>
      <div className="places-list">{visible.map(p => { const status = placeStatus(progress[p.id]); return <button key={p.id} onClick={() => select(p.id)} aria-current={selectedId === p.id ? 'true' : undefined}>
        <PlaceName place={p} reading={furigana} /><span className={`place-status ${status}`}><StatusIcon state={status} /><span>{statusNames[status]}</span></span>
      </button>; })}{!visible.length && <p className="empty">Move or zoom out to find more places.</p>}</div>
      <div className="status-legend" aria-label="Learning status legend">{(['unseen', 'learning', 'mastered', 'due'] as const).map(state => <span key={state}><StatusIcon state={state} />{statusNames[state]}</span>)}</div>
      <button className="gunma-link" onClick={() => select('jp:10426')}>Explore Gunma’s municipalities <Icon kind="arrow" /></button>
    </aside>
    {selected && !settingsOpen && <div hidden={listOpen}><ReadingCard key={selected.id} visible={!listOpen} place={selected} places={places} onClose={() => setSelectedId(null)} onNext={() => following && select(following.id)} hasNext={!!following} /></div>}
    {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    <footer className="map-footer"><span>8 regions · 47 prefectures · 1,918 municipal records</span><button onClick={() => setSourcesOpen(!sourcesOpen)} aria-expanded={sourcesOpen}>Sources & credits</button></footer>
    {sourcesOpen && <section className="sources-panel" aria-label="Sources and credits"><button className="icon-button" onClick={() => setSourcesOpen(false)} aria-label="Close sources"><Icon kind="close" /></button>
      <h2>Sources & credits</h2><p lang="ja">「全国地方公共団体コード」（総務省、2024年1月1日）を加工して作成。</p>
      <p><a href="https://www.soumu.go.jp/denshijiti/code.html">MIC names and readings</a> · Public Data License 1.0</p>
      <p lang="ja">「国土数値情報（行政区域データ）」（国土交通省、2024年）を加工して作成。</p>
      <p><a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html">MLIT administrative boundaries</a> · CC BY 4.0</p>
      <p><a href="https://www.wikidata.org/wiki/Wikidata:Licensing">Wikidata contributors</a> · CC0 1.0. Region readings, city classifications, capitals, population and article links; snapshot 25 September 2026.</p>
      <p>Japanese Wikipedia contributors: <a href="https://ja.wikipedia.org/w/index.php?oldid=111032101">四国</a> and <a href="https://ja.wikipedia.org/w/index.php?oldid=110477212">九州</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Full region name/reading pairs extracted as facts.</p>
      <p>Boundaries follow the 2024 source, including provisional boundaries and remote territories. Municipalities and designated-city wards load as you explore.</p>
      <p>BIZ UDPGothic © 2022 The BIZ UDGothic Project Authors · <a href="/fonts/OFL.txt">SIL Open Font License 1.1</a></p>
      <p>Noto Sans Regular map glyphs, distributed by MapLibre / OpenMapTiles · <a href="/fonts/Noto%20Sans%20Regular/LICENSE">SIL Open Font License 1.1</a></p>
      <p>This application uses the JMdict/EDICT dictionary files, the property of the Electronic Dictionary Research and Development Group, under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. <a href="/licenses/jmdict-license.html">Dictionary licence</a>. Gloss extraction is prepared; Japanese readers are still in development.</p>
      <p>SudachiDict by Works Applications Co., Ltd. is licensed under the <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache License, Version 2.0</a>. Used to validate sentence readings.</p>
    </section>}
  </main>;
}
