import { useEffect, useRef, useState, type FormEvent } from 'react';
import { matchReading, type ReadingResult } from './reading/matcher';
import type { Place } from './types';
import { useLearning } from './store';
import { PlaceName, Icon } from './ui';
import { SpeakButton } from './Speech';

export function ReadingCard({ place, places, visible, onClose, onNext, hasNext }: {
  place: Place; places: Place[]; visible: boolean; onClose: () => void; onNext: () => void; hasNext: boolean;
}) {
  const { settings, answer } = useLearning();
  const input = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState('');
  const hintUsed = useRef(settings.labelFurigana === 'always');
  const completed = result !== null || revealed;
  useEffect(() => { if (settings.labelFurigana === 'always') hintUsed.current = true; }, [settings.labelFurigana]);
  useEffect(() => {
    if (visible) (completed ? feedback.current : input.current)?.focus({ preventScroll: true });
  }, [visible, completed]);
  useEffect(() => {
    const keepInputVisible = () => {
      if (document.activeElement === input.current) input.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    };
    window.visualViewport?.addEventListener('resize', keepInputVisible);
    return () => window.visualViewport?.removeEventListener('resize', keepInputVisible);
  }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (completed) return;
    if (!value.trim()) { setMessage('Type a reading, or choose Reveal.'); return; }
    const checked = matchReading(value, place, settings);
    setResult(checked); setMessage(''); answer(place.id, checked, hintUsed.current);
  };
  const reveal = () => { if (!completed) { setRevealed(true); setMessage(''); answer(place.id, null, true); } };
  const readingSource = place.sources.reading_kana as { url?: string } | undefined;
  const hierarchy = place.parent_ids.map(id => places.find(p => p.id === id)?.name_kanji).filter(Boolean).join(' › ');
  return <section className="place-sheet reading-sheet" aria-labelledby="place-title">
    <div className="sheet-topline"><SpeakButton text={place.reading_kana} onPlay={() => { if (!completed) hintUsed.current = true; }} /><button className="icon-button" onClick={onClose} aria-label="Close place card"><Icon kind="close" /></button></div>
    <h2 id="place-title"><PlaceName place={place} reading={completed || settings.labelFurigana === 'always'} /></h2>
    <p className="hierarchy" lang="ja">{hierarchy}</p>
    {!completed ? <form onSubmit={submit} className="reading-form">
      <label htmlFor="reading-input">How do you read this name?</label>
      <input id="reading-input" ref={input} value={value} onChange={e => setValue(e.target.value)} maxLength={150}
        onKeyDown={e => { if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229)) e.preventDefault(); }}
        placeholder={settings.inputMode === 'romaji' ? 'Type in romaji' : 'ひらがな・カタカナ'}
        lang={settings.inputMode === 'kana' ? 'ja' : 'en'} autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go" />
      <p className="input-note">{settings.requireSuffix && place.suffix ? `Include ${place.suffix} in your answer.` : 'The base name is enough. Kana works too.'}</p>
      {message && <p role="alert" className="input-error">{message}</p>}
      <div className="answer-actions"><button className="primary" type="submit">Check reading <Icon kind="arrow" /></button><button className="quiet" type="button" onClick={reveal}>Reveal</button></div>
    </form> : <div ref={feedback} tabIndex={-1} className="reading-feedback" role="status" aria-live="polite">
      <h3 className={result?.accepted ? 'correct' : 'correction'}>{revealed ? 'Here is the reading.' : result?.grade === 'exact' ? 'Exactly right.' : result?.accepted ? 'Close — a long vowel to keep.' : 'A reading to practise.'}</h3>
      <p className="answer-kana" lang="ja">{place.reading_kana}</p><p className="romanization">{place.reading_hepburn}</p>
      {result && <p className="your-answer">Your answer: <span>{value}</span></p>}
      {result?.diff.length ? <div className="kana-diff" aria-label="Reading differences" lang="ja">{result.diff.map((part, i) => <span key={i} className={part.status} title={`${part.status}: ${part.actual || 'missing'} → ${part.expected || 'extra'}`}>{part.status === 'same' ? part.expected : <><del>{part.actual || '·'}</del><ins>{part.expected || '·'}</ins></>}</span>)}</div> : null}
      {result?.notes.map(note => <p className="feedback-note" key={note}>{note}</p>)}
      {hintUsed.current && <p className="feedback-note">You used a reading aid. Try without it next time.</p>}
      <button className="primary next-button" onClick={onNext} disabled={!hasNext}>Next place <Icon kind="arrow" /></button>
    </div>}
    <div className="card-provenance"><span>{place.kind === 'major-city' ? (place.suffix === '区' ? 'Special ward' : 'City') : place.kind[0].toUpperCase() + place.kind.slice(1)}</span>
      <a href={readingSource?.url ?? 'https://www.soumu.go.jp/denshijiti/code.html'}>Reading source</a></div>
  </section>;
}
