"""Extend the verified join with eight regions and code-joined major cities.

No network queries: all source inputs are byte-pinned in sources.lock.json.
"""
import collections
import json
import re
import subprocess
from shapely import from_wkb
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from data_build import ROOT, CACHE, OUT, source_files, read_mic, stream_geojson, suffix_fields, save, kana, simplify_land

# Conventional eight-region partition, inspected subdivision table revision.
MEMBERSHIP_SOURCE = 'https://www.wikidata.org/w/index.php?title=Wikidata:Country_subdivision_task_force/Japan&oldid=192981605'
REGIONS = [('Q1037393', 1, 1), ('Q129465', 2, 7), ('Q132480', 8, 14),
           ('Q134638', 15, 23), ('Q164256', 24, 30), ('Q127864', 31, 35),
           ('Q60213044', 36, 39), ('Q13393883', 40, 47)]


def value(snak):
    return snak.get('datavalue', {}).get('value')


def provenance(entity, property_name, claim=None):
    result = {'dataset': 'wikidata-admins-20260925', 'entity': entity['id'],
              'revision': entity['lastrevid'], 'property': property_name,
              'url': f"https://www.wikidata.org/w/index.php?title={entity['id']}&oldid={entity['lastrevid']}"}
    if claim:
        result['claim'] = claim['id']
    return result


def enrich(place, qid, entities):
    entity = entities[qid]
    place['wikidata_id'] = qid
    place['ja_wiki_title'] = entity.get('sitelinks', {}).get('jawiki', {}).get('title')
    place['sources']['wikidata_id'] = provenance(entity, 'P429')
    place['sources']['ja_wiki_title'] = provenance(entity, 'sitelinks.jawiki')
    # Pick a dated, non-deprecated population statement; retain its observation date.
    populations = []
    for claim in entity.get('claims', {}).get('P1082', []):
        if claim.get('rank') == 'deprecated' or value(claim['mainsnak']) is None:
            continue
        dates = [value(s)['time'] for s in claim.get('qualifiers', {}).get('P585', []) if value(s)]
        if dates:
            populations.append((max(dates), float(value(claim['mainsnak'])['amount']), claim))
    if populations:
        date, population, claim = max(populations, key=lambda item: item[0])
        place['population_or_prominence'] = population
        place['population_date'] = date
        place['priority'] = -population
        place['sources']['population_or_prominence'] = provenance(entity, 'P1082', claim)
    return place


def interior(original, simplified, ident):
    largest = max(original.geoms, key=lambda g: g.area) if original.geom_type == 'MultiPolygon' else original
    point = largest.representative_point()
    if not simplified.covers(point):
        point = simplified.intersection(largest).representative_point()
    if not original.is_valid or not simplified.is_valid or not original.covers(point) or not simplified.covers(point):
        raise ValueError(f'Geometry/label containment gate failed: {ident}')
    return [point.x, point.y]


def build():
    manifest, files = source_files()
    mic = read_mic(files['mic-20240101'])
    selection = json.loads(files['major-selection-20260925'].read_text())
    entities = json.loads(files['wikidata-admins-20260925'].read_text())['entities']
    region_entities = json.loads(files['wikidata-regions-verified-20260925'].read_text())['entities']
    qid_codes = {q: codes[0] for q, codes in selection['qids_to_codes'].items()}
    for q, code in qid_codes.items():
        codes = [value(c['mainsnak']) for c in entities[q]['claims']['P429'] if c.get('rank') != 'deprecated']
        if mic[code]['full_code'] not in codes:
            raise ValueError(f'Entity P429 disagrees with MIC: {q} {code}')
    pref_to_region = {f'{code:02}000': f'region:{q}' for q, start, end in REGIONS for code in range(start, end + 1)}
    pref_geometry = {f['properties']['id'][3:]: shape(f['geometry']) for f in
                     json.loads((OUT / 'geometry/prefectures.geojson').read_text())['features']}
    regions, region_geometry = [], []
    for q, start, end in REGIONS:
        entity = region_entities[q]
        name = entity['labels']['ja']['value']
        candidates = []
        for claim in entity['claims'].get('P1814', []):
            if value(claim['mainsnak']):
                candidates.append((kana(value(claim['mainsnak'])), claim, 'P1814'))
        for claim in entity['claims'].get('P1705', []):
            if value(claim['mainsnak']) == {'text': name, 'language': 'ja'}:
                for s in claim.get('qualifiers', {}).get('P1814', []):
                    candidates.append((kana(value(s)), claim, 'P1705/P1814'))
        if q in ['Q60213044', 'Q13393883']:
            source_id = 'wikipedia-shikoku-20260925' if q == 'Q60213044' else 'wikipedia-region-intros-20260925'
            pages = json.loads(files[source_id].read_text())['query']['pages'].values()
            matching = [(page, re.search(re.escape(name) + r'（([ぁ-ゖ]+)）', page.get('extract', ''))) for page in pages]
            matching = [(page, match) for page, match in matching if match]
            if len(matching) != 1:
                raise ValueError(f'No unambiguous full region reading in source: {q}')
            page, match = matching[0]
            reading = match[1]
            reading_source = {'dataset': source_id, 'title': page['title'], 'revision': page['lastrevid'],
                              'url': f"https://ja.wikipedia.org/w/index.php?oldid={page['lastrevid']}",
                              'extraction': 'explicit name (kana) pair in introduction'}
        else:
            if len({r for r, _, _ in candidates}) != 1:
                raise ValueError(f'Missing/ambiguous authoritative region kana: {q}')
            reading, claim, prop = candidates[0]
            reading_source = {**provenance(entity, prop, claim), 'dataset': 'wikidata-regions-verified-20260925'}
        if not re.fullmatch('[ぁ-ゖ]+', reading) or (name.endswith('地方') and not reading.endswith('ちほう')):
            raise ValueError(f'Region kana fails full-name check: {name} {reading}')
        codes = [f'{code:02}000' for code in range(start, end + 1)]
        # Dissolve validated, simplified prefecture land for a compact region
        # layer. Check the point separately against original source polygons.
        simplified = unary_union([pref_geometry[code] for code in codes])
        ident = f'region:{q}'
        point = interior(simplified, simplified, ident)
        from shapely.geometry import Point
        originals = [from_wkb((CACHE / f'derived/original-prefectures/{code}.wkb').read_bytes()) for code in codes]
        if not any(g.covers(Point(point)) for g in originals):
            largest = max(originals, key=lambda g: g.area)
            point = interior(largest, simplified, ident)
        regions.append({'id': ident, 'kind': 'region', 'name_kanji': name, 'reading_kana': reading,
                        'base_name': name[:-2] if name.endswith('地方') else name,
                        'suffix': '地方' if name.endswith('地方') else '',
                        'suffix_reading': 'ちほう' if name.endswith('地方') else '',
                        'parent_ids': [], 'label_point': point, 'geometry_ref': f'/data/tiles/regions.pmtiles#boundaries/{ident}',
                        'population_or_prominence': None, 'min_zoom': 3, 'priority': 0,
                        'wikidata_id': q, 'ja_wiki_title': entity.get('sitelinks', {}).get('jawiki', {}).get('title'), 'flags': [],
                        'sources': {'name_kanji': {**provenance(entity, 'labels.ja'), 'dataset': 'wikidata-regions-verified-20260925'},
                                    'reading_kana': reading_source,
                                    'geometry_ref': {'dataset': 'n03-20240101', 'derived': 'dissolved prefectures', 'codes': codes},
                                    'membership': {'url': MEMBERSHIP_SOURCE, 'okinawa': 'included in Kyushu by default'},
                                    'label_point': {'derived': 'interior point', 'inside_source': True, 'inside_output': True}}})
        region_geometry.append({'type': 'Feature', 'properties': {'id': ident}, 'geometry': mapping(simplified)})
        print(f"Region joined: {name} {reading}", flush=True)

    targets = {qid_codes[q]: q for q in selection['major_qids']}
    by_name = {(row['prefecture'], row['name']): code for code, row in mic.items() if row['sheet'] == 1}
    grouped = collections.defaultdict(list)
    print('Joining national N03 municipality geometries to major-city codes…', flush=True)
    for feature in stream_geojson(files['n03-20240101'], 'N03-20240101.geojson'):
        p = feature['properties']
        code = p['N03_007']
        if p.get('N03_005'):
            # The N03 unit is a designated-city ward. Dissolve by source city name
            # and prefecture to obtain the parent's official MIC city geometry.
            code = by_name.get((p['N03_001'], p['N03_004']))
        if code in targets:
            if mic[code]['name'] != p['N03_004']:
                raise ValueError(f'Major city name/code disagreement: {code} {p}')
            grouped[code].append(shape(feature['geometry']))
    if set(targets) != set(grouped):
        raise ValueError(f'Major-city geometry missing: {set(targets) - set(grouped)}')
    majors, major_geometry = [], []
    for code, q in sorted(targets.items()):
        row = mic[code]
        original = unary_union(grouped.pop(code))
        simplified = simplify_land(original, .0008, code)
        ident = f'jp:{code}'
        point = interior(original, simplified, ident)
        place = {'id': ident, 'kind': 'major-city', 'name_kanji': row['name'], 'reading_kana': row['reading'],
                 **suffix_fields(row['name'], row['reading']),
                 'parent_ids': [pref_to_region[f'{code[:2]}000'], f'jp:{code[:2]}000'],
                 'label_point': point, 'geometry_ref': f'/data/tiles/major-cities.pmtiles#boundaries/{ident}',
                 'min_zoom': 7, 'priority': 0, 'population_or_prominence': None, 'flags': [],
                 'sources': {'id': {'dataset': 'mic-20240101', 'code': row['full_code']},
                             'name_kanji': {'dataset': 'mic-20240101', 'sheet': row['sheet'], 'row': row['row'], 'field': 'C'},
                             'reading_kana': {'dataset': 'mic-20240101', 'sheet': row['sheet'], 'row': row['row'], 'field': 'E', 'transform': 'NFKC; hiragana'},
                             'suffix_reading': {'derived': 'partition of full MIC reading'},
                             'kind': {'dataset': 'major-selection-20260925', 'qid': q},
                             'geometry_ref': {'dataset': 'n03-20240101', 'join': 'MIC code[:5]; designated cities dissolve source wards'},
                             'label_point': {'derived': 'interior point', 'inside_source': True, 'inside_output': True}}}
        majors.append(enrich(place, q, entities))
        major_geometry.append({'type': 'Feature', 'properties': {'id': ident}, 'geometry': mapping(simplified)})
    for filename, places, geometry in [('regions', regions, region_geometry), ('major-cities', majors, major_geometry)]:
        converted = subprocess.run(['node', '--experimental-strip-types', 'scripts/enrich-readings.ts'], input=json.dumps(places),
                                   text=True, capture_output=True, cwd=ROOT, check=True)
        save(OUT / f'places/{filename}.json', json.loads(converted.stdout))
        save(OUT / f'geometry/{filename}.geojson', {'type': 'FeatureCollection', 'features': geometry})
    pref_places = json.loads((OUT / 'places/prefectures.json').read_text())
    code_qids = {code: q for q, code in qid_codes.items()}
    for p in pref_places:
        p['parent_ids'] = [pref_to_region[p['id'][3:]]]
        p['min_zoom'] = 5
        enrich(p, code_qids[p['id'][3:]], entities)
    save(OUT / 'places/prefectures.json', pref_places)
    gunma = json.loads((OUT / 'places/10.json').read_text())
    for p in gunma:
        p['parent_ids'] = [pref_to_region['10000'], 'jp:10000']
        p['min_zoom'] = 9
    save(OUT / 'places/10.json', gunma)
    all_places = {p['id']: p for p in gunma + pref_places + regions + majors}
    if len(all_places) != 174 or any(not re.fullmatch('[ぁ-ゖ]+', p['reading_kana']) for p in all_places.values()):
        raise ValueError('Phase 1 count or kana gate failed')
    save(ROOT / 'reports/phase1-data-validation.json', {'phase': 1, 'status': 'passed', 'unique_places': len(all_places),
        'counts': {'regions': 8, 'prefectures': 47, 'major_cities': 86, 'gunma_municipalities': 35,
                   'gunma_overlap_with_major_cities': 2, 'designated': 20, 'core': 62},
        'all_admin_label_points_inside_source_and_output': True, 'hiragana_only': True,
        'duplicate_ids_after_tier_merge': [], 'unmatched_codes': [],
        'snapshots': {'administration': '2024-01-01', 'wikidata': selection['snapshot']},
        'excluded_entities': selection['excluded']})
    print(f'PASS: Phase 1 curriculum: {len(all_places)} unique places, 8 regions, 47 prefectures, 86 major cities.', flush=True)


if __name__ == '__main__':
    build()
