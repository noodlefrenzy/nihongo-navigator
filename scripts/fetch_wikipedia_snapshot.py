"""Explicit ingestion of full Wikipedia extracts, with page revision IDs.

Outputs must be inspected and hash-pinned before ordinary builds consume them.
"""
import json
import subprocess
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
places = [p for name in ['regions', 'prefectures', 'major-cities'] for p in json.loads((ROOT / f'public/data/places/{name}.json').read_text())]
# Hokkaido's administrative entity has no jawiki sitelink. Inspect the article
# with its exact official name explicitly; do not infer a different QID/reading.
titles = sorted({p.get('ja_wiki_title') or p['name_kanji'] for p in places})
limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(titles)
out = ROOT / '.data-cache/wikipedia-readers'; out.mkdir(exist_ok=True)
for i, title in enumerate(titles[:limit]):
    path = out / f'{i:03}.json'
    if path.exists():
        continue
    query = urllib.parse.urlencode({'action': 'query', 'prop': 'extracts|info|pageprops', 'titles': title,
        'redirects': '1', 'explaintext': '1', 'format': 'json', 'formatversion': '2'})
    subprocess.run(['curl', '-L', '--max-time', '60', '--fail', '--silent', '--show-error',
                    '-o', str(path), 'https://ja.wikipedia.org/w/api.php?' + query], check=True)
    response = json.loads(path.read_text())
    if response.get('error') or response.get('warnings'):
        raise ValueError(f'Wikipedia API schema/warning requires review: {response}')
    pages = response['query']['pages']
    if len(pages) != 1 or pages[0].get('missing') or not pages[0].get('extract') or not pages[0].get('lastrevid'):
        raise ValueError(f'Missing article/extract/revision for {title}')
    print(f'{i+1}/{len(titles)} {title}: revision {pages[0]["lastrevid"]}, {len(pages[0]["extract"])} characters', flush=True)
print('Ingestion complete. Inspect and pin source bytes before use.')
