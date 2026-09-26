# Delivery gates

These milestones describe local development. The public source release omits
generated map assets, fact bundles, readers, and map reports pending GSI
clearance. Run the [local data setup](README.md#build-local-map-data) before trying
the demos. See [publication status](docs/PUBLISHING.md) for the release scope.

## Phase 0 · complete

- [x] Reading matcher: 60 tests, including every requested table case.
- [x] Join: 47 prefectures and all 35 Gunma municipalities.
- [x] Validation: canonical hiragana, unique IDs, matching codes, points inside
  source and simplified polygons, list of names with multiple readings.
- [x] Compact PMTiles boundaries and symbol labels.
- [x] Desktop and phone browser tests: rendering, furigana toggle, actual canvas
  tap opening a stub card, no JavaScript or network errors, no page overflow.
- [x] Independent finish review: three fixes resolved; DESIGN.md and sidecar written.

### Demo

Run `pnpm dev`, open http://localhost:5173, and toggle **Furigana**. Choose
**Explore Gunma’s municipalities**, close the card, then tap **草津町** on the
map. On a phone, **Places** opens the accessible list. **Sources & credits**
shows the dataset attribution text.

## Phase 1 · complete

- [x] 8 regions, 47 prefectures and 86 major-city units; 174 unique records with
  the retained Gunma municipality spike (two cities overlap tiers).
- [x] Hash-pinned knowledge snapshots and per-field provenance; full data rebuild
  validates hiragana, geometry, label points and code joins.
- [x] Exact / Close / Wrong feedback, kana-aligned diff, source-specific suffix
  feedback, strictness settings, IME composition handling and reveal.
- [x] Always/Never furigana; IndexedDB settings and progress; visible status
  colors and shapes; nearest eligible Next within the current tier.
- [x] 67 unit tests and six browser scenarios across desktop/phone, including
  actual canvas taps, tier zoom, reload persistence and shortened phone viewport.
- [x] Independent review scored all navigation/focus fixes resolved; design record updated.

### Demo

Run `pnpm dev` and open http://localhost:5173. Select a region, type its reading,
and press Enter; **Next place** continues the session. Zoom to see prefectures,
then major cities. **Explore Gunma’s municipalities** opens 草津町: `kusatsu`
is exact, while `kusatsuchou` explains the town's actual まち suffix.
Try `hokkaido` for 北海道 to see long-vowel feedback. Turn on **Require long
vowels** in Settings and repeat to see the stricter acceptance rule. Reload to
check saved preferences and practice. On phones, **Places** opens the list;
the focused reading input stays in the bottom sheet above a reduced viewport.

The Phase 1 mastery schedule is provisional (Decision 012); FSRS remains Phase 3.

## Phase 2 · in progress

- [x] 1,918 MIC municipal records, including 171 designated-city wards and all
  23 Tokyo special wards; 1,973 unique records across all current tiers.
- [x] All municipal label points inside original and simplified polygons;
  source-name variant recorded; 47 lazy-loaded JSON chunks and PMTiles archives.
- [x] Canonical-kana speech, hint accounting, saved voice and speed preferences.
- [x] Pinned JMdict index (218,807 entries) with reading/sense restrictions;
  Sudachi validator that overrides place readings from authoritative records.
- [x] Server endpoints and pluggable model interface, reference-match fast path,
  strict response validation, disk caches and explicitly approximate offline scorer.
- [x] Authenticated Codex CLI connection; Tokyo beginner reader passed reading
  and live grounding checks, plus reference/paraphrase/wrong-region judging.
- [ ] Source historical/cultural/landmark facts; current bundles contain basic
  geography only. Generate and validate all 423 build-tier readers (141 × 3 levels).
- [ ] Integrate unlocked sentence cards, translation feedback, word glosses and
  sentence playback into the UI. One validated Tokyo beginner proof exists locally.

### Current demo (partial phase)

Run `pnpm dev`. Zoom beyond the major-city tier to load municipalities anywhere
in Japan. Use the list to reach Tokyo's special wards or designated-city wards;
each has its own code and parent breadcrumb. **Listen** uses the official kana
when a Japanese voice is available. Playing it before answering counts as a hint.
Voice/speed settings persist. `pnpm data:build` rebuilds the entire joined map.

The server uses the existing authenticated Codex CLI (see README). The next gate
is sourced fact enrichment, complete reader coverage and the sentence UI.
Phase 2 is not accepted, so Phases 3 and 4 have not started.

## Phase 3 · not started

FSRS, review, choropleth, Find-it, stats, additional furigana modes and layers.

## Phase 4 · not started

Offline PWA, accessibility and performance, progress portability, Japanese UI.
