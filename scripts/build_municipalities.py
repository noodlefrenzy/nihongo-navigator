"""Join every MIC municipality/ward to the pinned nationwide N03 geometry."""
import collections
import json
import subprocess
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from data_build import ROOT, CACHE, OUT, source_files, read_mic, stream_geojson, suffix_fields, simplify_land, save
from build_curriculum import REGIONS, interior

# Inspected disagreement in the pinned official snapshots, joined by exact code.
# Names/readings still come exclusively from MIC; retain N03's spelling below.
NAME_VARIANTS = {'39405': ('檮原町', '梼原町')}

def build():
    _, files = source_files()
    mic = read_mic(files['mic-20240101'])
    targets = {code: row for code, row in mic.items() if not code.endswith('000')}
    if len(targets) != 1918:
        raise ValueError('MIC municipality/ward count changed; review the source.')
    by_name = {(r['prefecture'], r['name']): code for code, r in mic.items() if r['sheet'] == 1}
    regions = {f'{n:02}': f'region:{q}' for q, start, end in REGIONS for n in range(start, end + 1)}
    majors = {p['id']: p for p in json.loads((OUT / 'places/major-cities.json').read_text())}
    grouped = collections.defaultdict(list)
    ward_parents, source_names = {}, {}
    unassigned = collections.Counter()
    print('Joining every municipality and designated-city ward…', flush=True)
    for f in stream_geojson(files['n03-20240101'], 'N03-20240101.geojson'):
        p = f['properties']; code = p['N03_007']
        if code is None or (code in mic and code.endswith('000')):
            unassigned[(p['N03_001'], p['N03_004'])] += 1
            continue
        if code not in targets:
            raise ValueError(f'N03 code absent from MIC: {p}')
        row = targets[code]
        name = p.get('N03_005') or p['N03_004']
        expected_name = (p['N03_004'] + p['N03_005']) if p.get('N03_005') else p['N03_004']
        if expected_name != row['name'] and NAME_VARIANTS.get(code) != (expected_name, row['name']):
            raise ValueError(f'Official name/code disagreement: {code} {expected_name} / {row["name"]}')
        source_names[code] = name
        geometry = shape(f['geometry'])
        grouped[code].append(geometry)
        if p.get('N03_005'):
            parent = by_name.get((p['N03_001'], p['N03_004']))
            if not parent:
                raise ValueError(f'Designated-city parent missing: {p}')
            ward_parents[code] = parent
            grouped[parent].append(geometry)
    missing = sorted(set(targets) - set(grouped))
    if missing:
        raise ValueError(f'MIC units missing N03 geometry: {[(code, targets[code]["name"]) for code in missing]}')
    chunks, geometries, checks = collections.defaultdict(list), collections.defaultdict(list), []
    names_readings = collections.defaultdict(list)
    kinds = collections.Counter()
    for code, row in sorted(targets.items()):
        original = unary_union(grouped.pop(code))
        if not original.is_valid:
            raise ValueError(f'Invalid original geometry: {code}')
        simplified = simplify_land(original, .0005, code)
        ident = f'jp:{code}'
        point = interior(original, simplified, ident)
        name, reading = row['name'], row['reading']
        parents = [regions[code[:2]], f'jp:{code[:2]}000']
        reading_transform = 'NFKC; katakana to hiragana'
        if code in ward_parents:
            parent = mic[ward_parents[code]]
            if not name.startswith(parent['name']) or not reading.startswith(parent['reading']):
                raise ValueError(f'Ward reading cannot be partitioned from official city prefix: {code}')
            name, reading = name[len(parent['name']):], reading[len(parent['reading']):]
            if name != source_names[code]:
                raise ValueError(f'Ward name partition disagrees with N03: {code}')
            parents.append(f'jp:{parent["code"]}')
            reading_transform += f'; remove exact canonical city prefix ({parent["full_code"]})'
            kinds['designated_city_wards'] += 1
        else:
            kinds['municipal_units_including_special_wards_and_source_northern_units'] += 1
        place = {'id': ident, 'kind': 'municipality', 'name_kanji': name, 'reading_kana': reading,
                 **suffix_fields(name, reading), 'parent_ids': parents, 'label_point': point,
                 'geometry_ref': f'/data/tiles/{code[:2]}.pmtiles#boundaries/{ident}',
                 'population_or_prominence': None, 'min_zoom': 9, 'priority': 0,
                 'wikidata_id': None, 'ja_wiki_title': None, 'flags': [],
                 'sources': {'id': {'dataset': 'mic-20240101', 'code': row['full_code']},
                             'name_kanji': {'dataset': 'mic-20240101', 'sheet': row['sheet'], 'row': row['row'], 'field': 'C', 'n03_name': source_names.get(code)},
                             'reading_kana': {'dataset': 'mic-20240101', 'sheet': row['sheet'], 'row': row['row'], 'field': 'E', 'transform': reading_transform},
                             'suffix_reading': {'derived': 'partition of canonical official reading'},
                             'geometry_ref': {'dataset': 'n03-20240101', 'join': 'N03_007; designated-city parent dissolved from source wards'},
                             'label_point': {'derived': 'interior representative point', 'inside_source': True, 'inside_output': True}}}
        if ident in majors:
            # Keep one identity and the richer major-city tier metadata.
            place = {**majors[ident], 'label_point': point, 'geometry_ref': place['geometry_ref'],
                     'sources': {**majors[ident]['sources'], 'geometry_ref': place['sources']['geometry_ref']}}
        chunks[code[:2]].append(place)
        geometries[code[:2]].append({'type': 'Feature', 'properties': {'id': ident}, 'geometry': mapping(simplified)})
        checks.append({'id': ident, 'inside_source': True, 'inside_output': True, 'valid_polygon': True})
        names_readings[name].append({'id': ident, 'reading': reading, 'parent_ids': parents})
        if len(checks) % 100 == 0:
            print(f'Validated {len(checks)}/{len(targets)} municipal units', flush=True)
    multi = {name: rows for name, rows in names_readings.items() if len({r['reading'] for r in rows}) > 1}
    for pref, places in sorted(chunks.items()):
        for p in places:
            if p['name_kanji'] in multi:
                p['flags'].append('multi-reading')
        converted = subprocess.run(['node', '--experimental-strip-types', 'scripts/enrich-readings.ts'],
                                   input=json.dumps(places), text=True, capture_output=True, cwd=ROOT, check=True)
        save(OUT / f'places/{pref}.json', json.loads(converted.stdout))
        save(OUT / f'geometry/{pref}.geojson', {'type': 'FeatureCollection', 'features': geometries[pref]})
    # Major-city label points use the same geometries as the full municipal tier.
    save(OUT / 'places/major-cities.json', [p for places in chunks.values() for p in places if p['kind'] == 'major-city'])
    save(OUT / 'places/manifest.json', {'prefectures': [{'code': pref, 'url': f'/data/places/{pref}.json', 'count': len(places)} for pref, places in sorted(chunks.items())]})
    save(ROOT / 'reports/multiple-readings.json', multi)
    save(ROOT / 'reports/municipality-validation.json', {'status': 'passed', 'snapshot': '2024-01-01',
        'count': {'expected_mic_units': 1918, 'actual': len(checks), **dict(kinds)},
        'hiragana_only': True, 'duplicate_ids': [], 'unmatched_codes': [], 'label_point_checks': checks,
        'unassigned_geometry': [{'prefecture': pref, 'name': name, 'parts': n} for (pref, name), n in unassigned.items()],
        'source_policy': 'Preserve source territories; unassigned polygons remain in the prefecture base.',
        'source_name_variants': [{'code': c, 'n03': a, 'mic': b, 'join': 'exact N03_007 = MIC code[:5]'} for c, (a, b) in NAME_VARIANTS.items()],
        'multiple_reading_names': len(multi), 'duplicate_name_groups': sum(len(rows) > 1 for rows in names_readings.values())})
    print(f'PASS: {len(checks)} municipal units, including {len(ward_parents)} wards, in 47 chunks.', flush=True)


if __name__ == '__main__':
    build()
