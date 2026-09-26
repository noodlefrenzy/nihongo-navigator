"""Extract basic facts mechanically from pinned place/entity provenance.

These bundles do not claim landmark, historical or cultural coverage. That
editorial enrichment must be sourced and reviewed before Phase 2 is complete.
"""
import collections
import json
from data_build import ROOT, OUT, save, source_files
from build_curriculum import value, provenance


def build():
    _, files = source_files()
    manifest = json.loads((OUT / 'places/manifest.json').read_text())
    names = ['regions', 'prefectures', 'major-cities'] + [p['code'] for p in manifest['prefectures']]
    places = {p['id']: p for name in names for p in json.loads((OUT / f'places/{name}.json').read_text())}
    entities = json.loads(files['wikidata-admins-20260925'].read_text())['entities']
    # Q1037393 also represents the Hokkaido region; prefer an administrative ID
    # when resolving a Wikidata administrative relation.
    qmap = {p['wikidata_id']: p['id'] for p in places.values() if p.get('wikidata_id') and p['kind'] != 'region'}
    children = collections.defaultdict(list)
    for p in places.values():
        if p['kind'] == 'prefecture':
            for parent in p['parent_ids']:
                children[parent].append(p['id'])
    counts = collections.Counter()
    for p in places.values():
        facts = []
        def add(predicate, datum, source):
            source = dict(source)
            source.setdefault('dataset', 'wikidata-region-membership-revision-192981605')
            source.setdefault('url', 'https://www.soumu.go.jp/denshijiti/code.html' if source.get('dataset', '').startswith('mic-') else 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html')
            facts.append({'id': f"{p['id']}:f{len(facts)+1}", 'subject_id': p['id'], 'predicate': predicate, 'value': datum, 'source': source})
        add('canonical_name_reading', {'name': p['name_kanji'], 'reading': p['reading_kana']}, p['sources']['reading_kana'])
        for parent_id in p['parent_ids']:
            parent = places[parent_id]
            if parent['name_kanji'] == p['name_kanji']:
                continue
            source = parent['sources'].get('membership', p['sources']['geometry_ref']) if parent['kind'] == 'region' else p['sources']['geometry_ref']
            add('located_in', {'place_id': parent_id, 'name': parent['name_kanji']}, source)
        if children[p['id']]:
            add('contains_prefectures', [{'place_id': c, 'name': places[c]['name_kanji']} for c in children[p['id']]], p['sources']['membership'])
        if p.get('population_or_prominence') is not None:
            date = p['population_date']
            if date > '+2026-09-25T23:59:59Z':
                raise ValueError(f'Future population observation: {p["id"]}')
            add('population', {'people': p['population_or_prominence'], 'observation_date': date}, p['sources']['population_or_prominence'])
        entity = entities.get(p.get('wikidata_id'))
        if entity:
            for prop, predicate in [('P47', 'shares_border_with'), ('P36', 'capital')]:
                for claim in entity.get('claims', {}).get(prop, []):
                    datum = value(claim['mainsnak'])
                    if claim.get('rank') == 'deprecated' or not datum or claim.get('qualifiers', {}).get('P582'):
                        continue
                    target = qmap.get(datum.get('id'))
                    if target and target != p['id']:
                        add(predicate, {'place_id': target, 'name': places[target]['name_kanji']}, provenance(entity, prop, claim))
        save(ROOT / f'data/facts/{p["id"].replace(":", "-")}.json', {'place_id': p['id'], 'facts': facts})
        counts[p['kind']] += 1
    save(ROOT / 'reports/fact-extraction.json', {'status': 'basic_geography_only', 'places': len(places), 'counts': dict(counts),
        'limitation': 'Historical, cultural, landmark and fun facts still require verified editorial extraction.'})
    print(f'Extracted traceable basic facts for {len(places)} places.')


if __name__ == '__main__':
    build()
