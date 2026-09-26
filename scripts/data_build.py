"""Phase 0 authoritative join. No geocoding, inferred readings or network fallback.

Run with .venv/bin/python scripts/data_build.py (pnpm data:build).
Source bytes are pinned by SHA-256. Outputs are split by tier and prefecture.
"""
from __future__ import annotations

import collections
import hashlib
import json
import re
import subprocess
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from shapely.validation import explain_validity

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / '.data-cache'
OUT = ROOT / 'public/data'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def source_files():
    manifest = json.loads((ROOT / 'data/sources.lock.json').read_text())
    CACHE.mkdir(exist_ok=True)
    files = {}
    for source in manifest['sources']:
        path = ROOT / source['local_path'] if source.get('local_path') else CACHE / source['file']
        if source.get('local_path') and not path.exists():
            raise ValueError(f"Missing pinned snapshot: {path}")
        if not path.exists():
            temporary = path.with_suffix(path.suffix + '.partial')
            subprocess.run(['curl', '--fail', '--location', '--retry', '2', '--max-time', '300',
                            '--output', str(temporary), source['url']], check=True)
            temporary.rename(path)
        with path.open('rb') as stream:
            checksum = hashlib.file_digest(stream, 'sha256').hexdigest()
        if checksum != source['sha256']:
            raise ValueError(f"Source bytes changed: {source['id']}. Stop and review; never silently refresh pins.")
        files[source['id']] = path
    return manifest, files


def kana(value):
    normalized = unicodedata.normalize('NFKC', value)
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in normalized)


def read_mic(path):
    result = {}
    with zipfile.ZipFile(path) as archive:
        # Shared strings include phonetic annotations: read only display text.
        strings = [''.join(t.text or '' for t in item.findall('s:t', NS) + item.findall('s:r/s:t', NS))
                   for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        for sheet in [1, 2]:
            root = ET.fromstring(archive.read(f'xl/worksheets/sheet{sheet}.xml'))
            for row in root.findall('.//s:row', NS):
                cells = {}
                for cell in row.findall('s:c', NS):
                    v = cell.find('s:v', NS)
                    value = v.text if v is not None else ''
                    cells[re.sub(r'\d', '', cell.get('r'))] = strings[int(value)] if cell.get('t') == 's' and value else value
                code = cells.get('A', '')
                if not re.fullmatch(r'\d{6}', code):
                    continue
                expected_check = (11 - sum(int(n) * weight for n, weight in zip(code[:5], [6, 5, 4, 3, 2])) % 11) % 10
                if int(code[-1]) != expected_check:
                    raise ValueError(f'MIC check digit failure at sheet {sheet}, row {row.get("r")}')
                name = cells.get('C') or cells['B']
                reading = kana(cells.get('E') or cells['D'])
                if not re.fullmatch('[ぁ-ゖ]+', reading):
                    raise ValueError(f'Non-hiragana canonical reading: {code} {reading!r}')
                item = {'code': code[:5], 'full_code': code, 'name': name, 'reading': reading,
                        'prefecture': cells['B'], 'sheet': sheet, 'row': int(row.get('r'))}
                if code[:5] in result:
                    old = result[code[:5]]
                    if (old['name'], old['reading']) != (name, reading):
                        raise ValueError(f'Conflicting duplicate MIC code: {code}')
                    continue  # Designated cities are repeated verbatim in sheet 2.
                result[code[:5]] = item
    return result


def stream_geojson(archive_path, member):
    # The inspected MLIT format has one complete feature on each physical line.
    # Fail if the provider changes formatting; avoid loading a 475 MB JSON tree.
    found = 0
    with zipfile.ZipFile(archive_path) as archive:
        with archive.open(member) as stream:
            for line in stream:
                text = line.decode('utf-8').strip().rstrip(',')
                if text.startswith('{ "type": "Feature",'):
                    found += 1
                    yield json.loads(text)
    if not found:
        raise ValueError(f'Unrecognized MLIT GeoJSON encoding: {member}')


def suffix_fields(name, reading):
    if name == '北海道':
        return {'base_name': name, 'suffix': '', 'suffix_reading': ''}
    endings = {'都': ['と'], '府': ['ふ'], '県': ['けん'], '市': ['し'],
               '区': ['く'], '町': ['まち', 'ちょう'], '村': ['むら', 'そん']}
    for ending in endings.get(name[-1], []):
        if reading.endswith(ending):
            return {'base_name': name[:-1], 'suffix': name[-1], 'suffix_reading': ending}
    raise ValueError(f'Suffix cannot be separated from source kana: {name} {reading}')


def simplify_land(original, tolerance, ident):
    simplified = original.simplify(tolerance, preserve_topology=True)
    # GEOS preserves each polygon's topology, but a simplified coastline can
    # enclose a tiny neighbouring island. Union those land parts; never turn a
    # nested island into a water hole with an arbitrary ring repair.
    if not simplified.is_valid and simplified.geom_type == 'MultiPolygon':
        print(f'Normalize simplified land union {ident}: {explain_validity(simplified)}', flush=True)
        simplified = unary_union(list(simplified.geoms))
    if not simplified.is_valid:
        raise ValueError(f'Invalid simplified geometry {ident}: {explain_validity(simplified)}')
    return simplified


def build():
    manifest, files = source_files()
    mic = read_mic(files['mic-20240101'])
    prefectures = {code: p for code, p in mic.items() if code.endswith('000')}
    gunma = {code: p for code, p in mic.items() if code.startswith('10') and not code.endswith('000')}
    if len(prefectures) != 47 or len(gunma) != 35:
        raise ValueError('MIC count gate failed: expected 47 prefectures and 35 Gunma municipalities')
    grouped = collections.defaultdict(list)
    source_counts = collections.Counter()
    print('Reading and grouping source prefecture polygons…', flush=True)
    for feature in stream_geojson(files['n03-20240101'], 'N03-20240101_prefecture.geojson'):
        properties = feature['properties']
        code = properties['N03_007']
        if code not in prefectures or prefectures[code]['name'] != properties['N03_001']:
            raise ValueError(f'Unmatched prefecture code/name: {properties}')
        grouped[code].append(shape(feature['geometry']))
        source_counts['prefecture_parts'] += 1
    for feature in stream_geojson(files['n03-20240101-gunma'], 'N03-20240101_10.geojson'):
        code = feature['properties']['N03_007']
        if code not in gunma:
            raise ValueError(f'Unmatched Gunma geometry: {code}')
        if feature['properties']['N03_004'] != gunma[code]['name']:
            raise ValueError(f'Name disagreement: {code}')
        grouped[code].append(shape(feature['geometry']))
        source_counts['municipality_parts'] += 1
    target = {**prefectures, **gunma}
    if set(grouped) != set(target):
        raise ValueError(f'Unmatched MIC codes: {set(target) - set(grouped)}')
    places = []
    geometries = {'prefecture': [], 'municipality': []}
    point_checks = []
    for code, row in sorted(target.items()):
        print(f"Joining {code} {row['name']} ({len(grouped[code])} parts)", flush=True)
        original = unary_union(grouped.pop(code))
        if not original.is_valid:
            raise ValueError(f'Invalid source polygon after union: {code}')
        kind = 'prefecture' if code in prefectures else 'municipality'
        if kind == 'prefecture':
            (CACHE / 'derived/original-prefectures').mkdir(parents=True, exist_ok=True)
            (CACHE / f'derived/original-prefectures/{code}.wkb').write_bytes(original.wkb)
        simplified = simplify_land(original, 0.008 if kind == 'prefecture' else 0.0005, code)
        largest = max(original.geoms, key=lambda p: p.area) if original.geom_type == 'MultiPolygon' else original
        point = largest.representative_point()
        if not simplified.covers(point):
            point = simplified.intersection(largest).representative_point()
        checked = original.covers(point) and simplified.covers(point)
        if not checked:
            raise ValueError(f'Label outside source or simplified polygon: {code}')
        place_id = f'jp:{code}'
        point_checks.append({'id': place_id, 'inside_source': True, 'inside_output': True})
        geometry_ref = f"/data/tiles/{'prefectures' if kind == 'prefecture' else '10'}.pmtiles#boundaries/{place_id}"
        places.append({
            'id': place_id, 'kind': kind, 'name_kanji': row['name'], 'reading_kana': row['reading'],
            **suffix_fields(row['name'], row['reading']),
            'parent_ids': [] if kind == 'prefecture' else [f'jp:{code[:2]}000'],
            'label_point': [point.x, point.y], 'geometry_ref': geometry_ref,
            'population_or_prominence': None, 'min_zoom': 4.5 if kind == 'prefecture' else 8,
            'priority': 0, 'wikidata_id': None, 'ja_wiki_title': None, 'flags': [],
            'sources': {
                'id': {'dataset': 'mic-20240101', 'code': row['full_code']},
                'name_kanji': {'dataset': 'mic-20240101', 'sheet': row['sheet'], 'row': row['row'], 'field': 'B' if kind == 'prefecture' else 'C'},
                'reading_kana': {'dataset': 'mic-20240101', 'sheet': row['sheet'], 'row': row['row'], 'field': 'D' if kind == 'prefecture' else 'E', 'transform': 'NFKC; katakana to hiragana'},
                'geometry_ref': {'dataset': 'n03-20240101' if kind == 'prefecture' else 'n03-20240101-gunma', 'join': 'N03_007 ↔ MIC code[:5]'},
                'label_point': {'derived': 'interior representative point of largest source polygon', 'validated_against': ['source polygon', 'simplified polygon']},
                'suffix_reading': {'derived': 'partition of canonical MIC kana, validated against full reading'},
            },
        })
        geometries[kind].append({'type': 'Feature', 'id': int(code),
                                'properties': {'id': place_id, 'name_kanji': row['name']}, 'geometry': mapping(simplified)})
    # Conversion delegates to the same tested WanaKana adapter used at runtime.
    converted = subprocess.run(['node', '--experimental-strip-types', 'scripts/enrich-readings.ts'],
                               input=json.dumps(places), text=True, capture_output=True, cwd=ROOT, check=True)
    places = json.loads(converted.stdout)
    name_readings = collections.defaultdict(list)
    for row in mic.values():
        name_readings[row['name']].append({'id': f"jp:{row['code']}", 'reading': row['reading']})
    multiple = {name: rows for name, rows in name_readings.items() if len({r['reading'] for r in rows}) > 1}
    for kind, filename in [('prefecture', 'prefectures'), ('municipality', '10')]:
        save(OUT / f'places/{filename}.json', [p for p in places if p['kind'] == kind])
        save(OUT / f'geometry/{filename}.geojson', {'type': 'FeatureCollection', 'features': geometries[kind]})
    save(OUT / 'sources.json', manifest)
    save(ROOT / 'reports/multiple-readings.json', multiple)
    save(ROOT / 'reports/data-validation.json', {
        'phase': 0, 'snapshot': '2024-01-01', 'status': 'passed',
        'counts': {'prefectures': {'expected': 47, 'actual': len(prefectures)},
                   'gunma_municipalities': {'expected': 35, 'actual': len(gunma)}},
        'count_sources': ['mic-20240101', 'https://www.pref.gunma.jp/page/14523.html'],
        'source_features': dict(source_counts), 'hiragana_only': True,
        'duplicate_ids': [], 'unmatched_codes': [], 'label_point_checks': point_checks,
        'multiple_reading_names': len(multiple),
        'limitation': 'Phase 0: only prefectures and Gunma municipality geometries are emitted.'
    })
    print(f'PASS: {len(places)} joined places; 47 prefectures, 35 Gunma municipalities; every label inside.', flush=True)
    subprocess.run([str(ROOT / '.venv/bin/python'), 'scripts/build_curriculum.py'], cwd=ROOT, check=True)
    subprocess.run([str(ROOT / '.venv/bin/python'), 'scripts/build_municipalities.py'], cwd=ROOT, check=True)
    subprocess.run([str(ROOT / '.venv/bin/python'), 'scripts/build_facts.py'], cwd=ROOT, check=True)
    subprocess.run(['node', 'scripts/build-tiles.mjs'], cwd=ROOT, check=True)
    subprocess.run([str(ROOT / '.venv/bin/python'), 'scripts/build_font.py'], cwd=ROOT, check=True)


if __name__ == '__main__':
    build()
