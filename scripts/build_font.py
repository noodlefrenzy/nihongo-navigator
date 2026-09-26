"""Self-host a WOFF2 subset covering all MIC names, kana, Latin and UI copy."""
from pathlib import Path
import json
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
chars = ''.join(chr(i) for start, end in [(32, 383), (0x3000, 0x3100), (0xff00, 0xfff0)] for i in range(start, end))
for path in (root / 'src').rglob('*'):
    if path.suffix in ['.tsx', '.ts']:
        chars += path.read_text()
for path in (root / 'public/data/places').glob('*.json'):
    if path.name == 'manifest.json':
        continue
    for place in json.loads(path.read_text()):
        chars += place['name_kanji'] + place['reading_kana']
font = TTFont(root / '.data-cache/BIZUDPGothic-Regular.ttf')
options = subset.Options()
options.flavor = 'woff2'
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=chars)
subsetter.subset(font)
font.flavor = 'woff2'
font.save(root / 'public/fonts/chizu-japanese.woff2')
