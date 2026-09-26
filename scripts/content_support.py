"""Pinned JMdict lookup and conservative sentence-reading validation.

No place reading is obtained from Sudachi. Its readings only validate ordinary
sentence words. A flagged draft is never published by the content builder.
"""
import gzip
import hashlib
import json
import re
import sqlite3
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from data_build import ROOT, CACHE, kana, save

JMDICT_ID = 'jmdict-20260924'
INDEX = CACHE / 'derived/jmdict.sqlite3'
KANJI = re.compile(r'[\u3400-\u9fff々]')


def index_dictionary():
    source = next(s for s in json.loads((ROOT / 'data/sources.lock.json').read_text())['sources'] if s['id'] == JMDICT_ID)
    path = ROOT / source['local_path']
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if digest != source['sha256']:
        raise ValueError('JMdict snapshot bytes changed; review before updating.')
    INDEX.parent.mkdir(parents=True, exist_ok=True)
    if INDEX.exists():
        with sqlite3.connect(INDEX) as db:
            if db.execute('SELECT hash FROM metadata').fetchone() == (digest,):
                return
    temporary = INDEX.with_suffix('.building.sqlite3')
    temporary.unlink(missing_ok=True)
    db = sqlite3.connect(temporary)
    db.executescript('CREATE TABLE metadata(hash TEXT); CREATE TABLE gloss(head TEXT, reading TEXT, entry TEXT, sense INTEGER, data TEXT);')
    entries = rows = restricted = 0
    with gzip.open(path, 'rb') as stream:
        for _, entry in ET.iterparse(stream, events=['end']):
            if entry.tag != 'entry':
                continue
            ident = entry.findtext('ent_seq')
            if not ident or not entry.findall('r_ele') or not entry.findall('sense'):
                raise ValueError('Unexpected JMdict entry schema')
            heads = [k.findtext('keb') for k in entry.findall('k_ele')]
            for reading in entry.findall('r_ele'):
                original_reading = reading.findtext('reb')
                restrictions = [r.text for r in reading.findall('re_restr')]
                if not set(restrictions).issubset(heads):
                    raise ValueError(f'Unknown JMdict reading restriction: {ident}')
                allowed = [None] if reading.find('re_nokanji') is not None or not heads else restrictions or heads
                restricted += bool(restrictions)
                for head in allowed:
                    pos = []
                    for number, sense in enumerate(entry.findall('sense'), start=1):
                        pos = [p.text for p in sense.findall('pos')] or pos
                        stagk = [s.text for s in sense.findall('stagk')]
                        stagr = [s.text for s in sense.findall('stagr')]
                        if (stagk and head not in stagk) or (stagr and original_reading not in stagr):
                            continue
                        glosses = [g.text for g in sense.findall('gloss') if g.get('{http://www.w3.org/XML/1998/namespace}lang', 'eng') == 'eng']
                        if not glosses:
                            continue
                        data = json.dumps({'entry_id': ident, 'sense': number, 'headword': head or original_reading,
                            'reading': original_reading, 'glosses': glosses, 'pos': pos,
                            'restrictions': {'headwords': stagk, 'readings': stagr},
                            'source': JMDICT_ID, 'license': 'CC-BY-SA-4.0'}, ensure_ascii=False)
                        for key in set([kana(original_reading), kana(head)] if head else [kana(original_reading)]):
                            db.execute('INSERT INTO gloss VALUES (?,?,?,?,?)', (key, kana(original_reading), ident, number, data))
                            rows += 1
            entries += 1
            entry.clear()
    db.executescript('CREATE INDEX lookup ON gloss(head, reading);')
    db.execute('INSERT INTO metadata VALUES (?)', (digest,))
    db.commit(); db.close()
    temporary.replace(INDEX)
    save(ROOT / 'reports/jmdict-index.json', {'status': 'passed', 'source': JMDICT_ID,
        'sha256': digest, 'entries': entries, 'lookup_rows': rows, 'restricted_readings': restricted,
        'reading_and_sense_restrictions_preserved': True})


def lookup(db, lemma, reading):
    rows = db.execute('SELECT data FROM gloss WHERE head=? AND reading=? ORDER BY entry,sense', (kana(lemma), kana(reading)))
    # Small learner-facing excerpt; each original entry/sense remains identifiable.
    result, seen = [], set()
    for row in rows:
        item = json.loads(row[0]); key = (item['entry_id'], item['sense'])
        if key not in seen:
            result.append(item); seen.add(key)
        if len(result) == 5:
            break
    return result


def validate(draft):
    from sudachipy import dictionary, tokenizer
    index_dictionary()
    tokenize = dictionary.Dictionary().create().tokenize
    places = {p['id']: p for p in draft['known_places']}
    card = draft['card']
    flags, corrections = [], []
    with sqlite3.connect(INDEX) as db:
        for sentence in card['sentences']:
            if ''.join(s['text'] for s in sentence['segments']) != sentence['text']:
                raise ValueError('Sentence segments do not reconstruct the text')
            offset = 0
            spans = []
            contextual_tokens = list(tokenize(sentence['text'], tokenizer.Tokenizer.SplitMode.C))
            previous_by_start = {right.begin(): left for left, right in zip(contextual_tokens, contextual_tokens[1:])}
            for segment in sentence['segments']:
                text = segment['text']; start = offset; spans.append((offset, offset + len(text), segment)); offset += len(text)
                segment['tokens'] = []
                if segment['place_id']:
                    place = places.get(segment['place_id'])
                    if not place or text != place['name_kanji']:
                        raise ValueError('Unknown place ID or noncanonical place surface')
                    if segment['reading'] != place['reading_kana']:
                        corrections.append({'sentence': sentence['id'], 'text': text, 'from': segment['reading'], 'to': place['reading_kana'], 'source': place['sources']['reading_kana']})
                    segment['reading'] = place['reading_kana']
                    continue
                tokens = [t for t in contextual_tokens if t.begin() >= start and t.end() <= offset]
                contextual = ''.join(t.surface() for t in tokens) == text
                if not contextual:
                    tokens = list(tokenize(text, tokenizer.Tokenizer.SplitMode.C))
                predicted = ''.join(kana(t.reading_form()) for t in tokens)
                if KANJI.search(text) and (predicted != segment['reading'] or any(t.is_oov() for t in tokens)):
                    flags.append({'sentence': sentence['id'], 'text': text, 'draft_reading': segment['reading'], 'analyzer_reading': predicted, 'reason': 'reading mismatch or unknown word'})
                if KANJI.search(text) and not re.fullmatch('[ぁ-ゖー]+', segment['reading']):
                    flags.append({'sentence': sentence['id'], 'text': text, 'reason': 'missing or invalid hiragana reading'})
                for token in tokens:
                    pos = token.part_of_speech()
                    # Grammar words need a grammar-specific lookup. Unrestricted
                    # kana lookup otherwise gives は=歯, ます=升, etc. Numeric
                    # analyzer readings are digit labels, not spoken numbers.
                    if pos[0] in {'助詞', '助動詞', '補助記号', '記号', '空白'} or pos[1] == '数詞':
                        continue
                    position = token.begin() if contextual else start + token.begin()
                    previous = previous_by_start.get(position)
                    if (pos[:2] == ('動詞', '非自立可能') and previous is not None
                            and previous.part_of_speech()[:2] == ('助詞', '接続助詞')):
                        continue
                    lemma = token.dictionary_form()
                    lemma_reading = (token.reading_form() if lemma == token.surface() else
                        ''.join(t.reading_form() for t in tokenize(lemma, tokenizer.Tokenizer.SplitMode.C)))
                    segment['tokens'].append({'text': token.surface(), 'lemma': lemma,
                        'reading': kana(token.reading_form()), 'glosses': lookup(db, lemma, lemma_reading)})
            # Place occurrences cannot be split or silently assigned analyzer kana.
            # Ignore shorter names nested inside a correctly identified full name.
            for place in places.values():
                for match in re.finditer(re.escape(place['name_kanji']), sentence['text']):
                    covering = [s for start, end, s in spans if start <= match.start() and end >= match.end() and s['place_id']]
                    if not covering:
                        flags.append({'sentence': sentence['id'], 'text': place['name_kanji'], 'reason': 'place name lacks a canonical place segment'})
    return {'card': card, 'flags': flags, 'canonical_corrections': corrections,
        'validator': {'sudachipy': '0.6.11', 'sudachidict_core': '20260723', 'jmdict': JMDICT_ID}}


if __name__ == '__main__':
    if sys.argv[1:] == ['index']:
        index_dictionary()
        print(INDEX)
    else:
        print(json.dumps(validate(json.load(sys.stdin)), ensure_ascii=False))
