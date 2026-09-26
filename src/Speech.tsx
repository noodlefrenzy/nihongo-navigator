import { useEffect, useState } from 'react';
import { useLearning } from './store';

export function useJapaneseVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => setVoices(speechSynthesis.getVoices().filter(voice => /^ja(?:-|_|$)/i.test(voice.lang)));
    update(); speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

export function SpeakButton({ text, onPlay }: { text: string; onPlay?: () => void }) {
  const voices = useJapaneseVoices();
  const { settings } = useLearning();
  const [error, setError] = useState('');
  useEffect(() => () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); }, []);
  const play = () => {
    const voice = voices.find(v => v.voiceURI === settings.ttsVoice) || voices[0];
    if (!voice) return;
    onPlay?.(); setError(''); speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; utterance.voice = voice; utterance.rate = settings.ttsRate;
    utterance.onerror = e => { if (!['interrupted', 'canceled'].includes(e.error)) setError('Audio could not play. Try again.'); };
    speechSynthesis.speak(utterance);
  };
  return <div className="speech-control"><button className="quiet" onClick={play} disabled={!voices.length} aria-label="Listen to the reading"
    title={voices.length ? 'Play Japanese audio' : 'A Japanese speech voice is not installed in this browser'}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>Listen</button>
    {!voices.length && <span className="speech-note">Japanese voice unavailable</span>}{error && <span role="status" className="speech-note">{error}</span>}</div>;
}
