"""Integration checks against the pinned dictionary, not invented dictionary rows."""
import json
import sqlite3
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from content_support import INDEX, index_dictionary, lookup, validate


class ContentSupportTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        index_dictionary()

    def test_actual_jmdict_reading_restriction(self):
        with sqlite3.connect(INDEX) as db:
            self.assertTrue(lookup(db, 'ＣＤプレーヤー', 'シーディープレーヤー'))
            self.assertFalse(lookup(db, 'ＣＤプレーヤー', 'シーディープレイヤー'))

    def test_canonical_place_overrides_analyzer_and_glosses_inflection(self):
        places = json.loads(Path('public/data/places/10.json').read_text())
        place = next(p for p in places if p['id'] == 'jp:10426')
        draft = {'known_places': [place], 'card': {'sentences': [{'id': 'fixture', 'text': '草津町にあります。', 'segments': [
            {'text': '草津町', 'reading': 'くさつちょう', 'place_id': place['id']},
            {'text': 'にあります。', 'reading': '', 'place_id': None}]}]}}
        result = validate(draft)
        self.assertEqual(result['flags'], [])
        self.assertEqual(result['card']['sentences'][0]['segments'][0]['reading'], 'くさつまち')
        self.assertEqual(len(result['canonical_corrections']), 1)
        tokens = result['card']['sentences'][0]['segments'][1]['tokens']
        self.assertTrue(next(t for t in tokens if t['lemma'] == 'ある')['glosses'])

    def test_grammar_and_numbers_do_not_receive_homophone_glosses(self):
        result = validate({'known_places': [], 'card': {'sentences': [{'id': 'fixture',
            'text': '人口は約1426万人です。となりと接しています。', 'segments': [
                {'text': '人口', 'reading': 'じんこう', 'place_id': None},
                {'text': 'は', 'reading': '', 'place_id': None},
                {'text': '約', 'reading': 'やく', 'place_id': None},
                {'text': '1426', 'reading': '', 'place_id': None},
                {'text': '万', 'reading': 'まん', 'place_id': None},
                {'text': '人', 'reading': 'にん', 'place_id': None},
                {'text': 'です。となりと', 'reading': '', 'place_id': None},
                {'text': '接し', 'reading': 'せっし', 'place_id': None},
                {'text': 'ています。', 'reading': '', 'place_id': None},
            ]}]}})
        self.assertEqual(result['flags'], [])
        tokens = [t for s in result['card']['sentences'][0]['segments'] for t in s['tokens']]
        surfaces = {t['text'] for t in tokens}
        self.assertTrue({'人口', '人', '接し'}.issubset(surfaces))
        self.assertTrue(surfaces.isdisjoint({'は', '1426', '万', 'です', 'と', 'て', 'い', 'ます', '。'}))
        counter = next(t for t in tokens if t['text'] == '人')
        self.assertEqual(counter['reading'], 'にん')
        self.assertTrue(counter['glosses'])
        self.assertTrue(all(g['reading'] == 'にん' for g in counter['glosses']))

    def test_mismatch_is_flagged_for_review(self):
        result = validate({'known_places': [], 'card': {'sentences': [{'id': 'fixture', 'text': '東',
            'segments': [{'text': '東', 'reading': 'にし', 'place_id': None}]}]}})
        self.assertTrue(result['flags'])

    def test_counter_reading_uses_sentence_context(self):
        result = validate({'known_places': [], 'card': {'sentences': [{'id': 'fixture', 'text': '1426万人です。', 'segments': [
            {'text': '1426', 'reading': '', 'place_id': None}, {'text': '万', 'reading': 'まん', 'place_id': None},
            {'text': '人', 'reading': 'にん', 'place_id': None}, {'text': 'です。', 'reading': '', 'place_id': None}]}]}})
        self.assertEqual(result['flags'], [])


if __name__ == '__main__':
    unittest.main()
