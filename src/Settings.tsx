import { useLearning } from './store';
import { Icon } from './ui';
import { useJapaneseVoices } from './Speech';
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = useLearning();
  const voices = useJapaneseVoices();
  return <section className="place-sheet settings-sheet" aria-labelledby="settings-title">
    <div className="settings-title"><h2 id="settings-title">Your practice</h2><button className="icon-button" onClick={onClose} aria-label="Close settings"><Icon kind="close" /></button></div>
    <label className="setting-field">Map furigana<select value={settings.labelFurigana} onChange={e => setSettings({ labelFurigana: e.target.value as 'always' | 'never' })}><option value="never">Never</option><option value="always">Always</option></select></label>
    <label className="setting-field">Preferred input<select value={settings.inputMode} onChange={e => setSettings({ inputMode: e.target.value as 'kana' | 'romaji' })}><option value="romaji">Romaji</option><option value="kana">Kana / Japanese IME</option></select></label>
    <label className="setting-check"><input type="checkbox" checked={settings.strictHepburn} onChange={e => setSettings({ strictHepburn: e.target.checked })} /><span>Require long vowels<small>Close answers count as wrong. Hepburn and Kunrei spellings remain valid.</small></span></label>
    <label className="setting-check"><input type="checkbox" checked={settings.requireSuffix} onChange={e => setSettings({ requireSuffix: e.target.checked })} /><span>Require the suffix<small>Include 市, 町, 村 and other administrative endings.</small></span></label>
    <label className="setting-field">Japanese voice<select value={settings.ttsVoice} onChange={e => setSettings({ ttsVoice: e.target.value })} disabled={!voices.length}><option value="">{voices.length ? 'Automatic' : 'Unavailable'}</option>{voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>)}</select></label>
    <label className="setting-field">Speech speed<select value={settings.ttsRate} onChange={e => setSettings({ ttsRate: Number(e.target.value) })}><option value={0.7}>Slower</option><option value={1}>Normal</option><option value={1.2}>Faster</option></select></label>
    <p className="settings-note">Settings and progress stay in this browser.</p>
  </section>;
}
