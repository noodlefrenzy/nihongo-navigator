"""Manual ingestion step, not an automatic refresh of pinned curriculum sources.

Reads the inspected SPARQL responses from /tmp and snapshots the selected
entities with revision IDs. The build reads pinned snapshots, never live queries.
"""
import collections
import json
import subprocess
import urllib.parse
from pathlib import Path
from data_build import read_mic

root = Path(__file__).resolve().parent.parent
out = root / 'data/snapshots'
out.mkdir(exist_ok=True)
rows = lambda name: json.loads(Path(f'/tmp/chizu-wikidata-{name}.json').read_text())['results']['bindings']
mic = read_mic(root / '.data-cache/mic-20240101.xlsx')
mic6 = {p['full_code']: p for p in mic.values()}
by_qid = collections.defaultdict(list)
for row in rows('codes'):
    if row['code']['value'] in mic6:
        by_qid[row['item']['value'].split('/')[-1]].append(mic6[row['code']['value']]['code'])
classes = collections.defaultdict(set)
for row in rows('admin-classes'):
    classes[row['class']['value'].split('/')[-1]].add(row['item']['value'].split('/')[-1])
capitals = [row for row in rows('current-capitals') if row['code']['value'] in mic6 and row['code']['value'][2:5] == '000']
capital_ids = {row['capital']['value'].split('/')[-1] for row in capitals}
# Q7473516 is Tokyo as a city/urban concept without a current MIC code.
# Q179645 (Shinjuku) is the other capital statement and is an actual MIC unit.
excluded = capital_ids - set(by_qid)
if excluded != {'Q7473516'}:
    raise ValueError(f'Unexpected unjoinable capital entities: {excluded}')
major = (classes['Q1137833'] | classes['Q1749269'] | capital_ids) - excluded
if len(classes['Q1137833']) != 62 or len(classes['Q1749269']) != 20 or len(major) != 86:
    raise ValueError('Major-city count changed; review sources before updating the snapshot.')
pref_qids = {row['pref']['value'].split('/')[-1] for row in capitals}
selection = {'snapshot': '2026-09-25', 'major_qids': sorted(major),
             'prefecture_qids': sorted(pref_qids),
             'qids_to_codes': {q: by_qid[q] for q in sorted(major | pref_qids)},
             'capital_qids': sorted(capital_ids - excluded), 'core_qids': sorted(classes['Q1137833']),
             'designated_qids': sorted(classes['Q1749269']),
             'excluded': [{'qid': 'Q7473516', 'reason': 'Tokyo urban concept, not a current MIC municipality; retain Shinjuku Q179645.'}]}
for q in selection['qids_to_codes']:
    if len(selection['qids_to_codes'][q]) != 1:
        raise ValueError(f'Ambiguous MIC join for {q}')
(out / 'major-selection.json').write_text(json.dumps(selection, ensure_ascii=False, indent=2) + '\n')
entities = {}
qids = sorted(major | pref_qids)
for start in range(0, len(qids), 35):
    query = urllib.parse.urlencode({'action': 'wbgetentities', 'ids': '|'.join(qids[start:start+35]),
                                   'props': 'info|claims|labels|sitelinks', 'languages': 'ja|en',
                                   'sitefilter': 'jawiki', 'format': 'json'})
    path = root / f'.data-cache/wikidata-entities-{start}.json'
    subprocess.run(['curl', '--fail', '-L', '--max-time', '60', '-sS', '-o', str(path),
                    'https://www.wikidata.org/w/api.php?' + query], check=True)
    data = json.loads(path.read_text())
    for q, entity in data['entities'].items():
        if 'missing' in entity or not entity.get('lastrevid'):
            raise ValueError(f'Missing revision or entity: {q}')
    entities.update(data['entities'])
    print(f'Fetched {len(entities)} / {len(qids)} Wikidata entities', flush=True)
(out / 'wikidata-admins.json').write_text(json.dumps({'entities': entities}, ensure_ascii=False, separators=(',', ':')) + '\n')
for name in ['codes', 'admin-classes', 'current-capitals', 'regions-verified']:
    (out / f'wikidata-{name}.json').write_bytes(Path(f'/tmp/chizu-wikidata-{name}.json').read_bytes())
for name in ['region-intros', 'shikoku']:
    (out / f'wikipedia-{name}.json').write_bytes(Path(f'/tmp/chizu-wikipedia-{name}.json').read_bytes())
print('Snapshot saved. Verify and hash these files before accepting them in the build.')
