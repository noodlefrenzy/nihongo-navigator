# Data attributions

The root [MIT license](LICENSE) covers original project code and documentation.
It does not relicense the third-party material below or its derivatives. This
includes source snapshots under `data/snapshots/`, source-derived fields in
`data/facts/` and `public/data/`, dictionary glosses, and bundled fonts. Preserve
these source notices when redistributing those files.

This source release excludes `public/data/` outputs, `data/facts/`, and map
reports pending GSI redistribution clearance. The source descriptions below
also document the local rebuild pipeline; they do not indicate that the N03
data or its derivatives are included in the public repository.

Only verified sources used by an output may appear as its provenance. Future
sources are not licensed or ingested merely by being named in the product brief.

## MIC · 全国地方公共団体コード

- Publisher: 総務省 (Ministry of Internal Affairs and Communications).
- Landing page: https://www.soumu.go.jp/denshijiti/code.html
- Inspected file: https://www.soumu.go.jp/main_content/000925835.xlsx
- Snapshot: 2024-01-01; retrieved 2026-09-24.
- Fields: administrative codes, full Japanese names, half-width katakana readings.
- Terms: 公共データ利用規約（第1.0版）, as linked by MIC's current copyright page:
  https://www.soumu.go.jp/menu_kyotsuu/policy/tyosaku.html
- Attribution for the UI: 「全国地方公共団体コード」（総務省、2024年1月1日）を加工して作成。
- Changes: removal of check digit for joins, kana NFKC/hiragana conversion,
  derived Hepburn and suffix separation. The source has not endorsed these changes.

## MLIT · 国土数値情報（行政区域データ）

- Publisher: 国土交通省 (Ministry of Land, Infrastructure, Transport and Tourism).
- Landing page: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html
- Snapshot: 2024-01-01; retrieved 2026-09-24.
- Fields: polygons, administrative hierarchy and five-digit N03_007 codes.
- License: CC BY 4.0 / Government Standard Terms of Use 2.0.
- Terms: https://nlftp.mlit.go.jp/ksj/other/agreement_01.html
- Attribution for the UI: 「国土数値情報（行政区域データ）」（国土交通省、2024年）を加工して作成。
- Changes: dissolution, simplification, derived interior label points,
  tiling, joining official readings. Boundary and remote-territory shapes follow
  the source. Preserve the source's provisional-boundary caveat in the data notes.
- The snapshot carries GSI reproduction approval R 5JHf 357 and a notice about
  secondary reproduction. Private/internal use with attribution is covered by
  https://service.gsi.go.jp/onestop/navi/nav5-2/ . Public redistribution must
  resolve the appropriate GSI procedure before publication (Decision 006).
  See [the publication record](docs/PUBLISHING.md#map-data-redistribution) for
  the current review and affected outputs.

## BIZ UDPGothic · Japanese typeface

- Copyright 2022 The BIZ UDGothic Project Authors.
- Publisher repository: https://github.com/googlefonts/morisawa-biz-ud-gothic
- Pinned revision: 18934af56b9c003ca58c54bffbf226848cb11032.
- License: SIL Open Font License 1.1, distributed at `/fonts/OFL.txt`.
- Source TTF SHA-256: 258d7156c165f2ff774b6efee637c22c3b950de0d8a10e501137061bc8085d01.
- Changes: glyph subset for the verified curriculum and interface, WOFF2 encoding.
- UI credit: BIZ UDPGothic © 2022 The BIZ UDGothic Project Authors · SIL Open Font License 1.1.

## Gunma Prefecture · municipality count cross-check

- https://www.pref.gunma.jp/page/14523.html
- Used only to cross-check the factual total: 35 municipalities (12 cities,
  15 towns, 8 villages). No prose or artwork copied into the curriculum.

## Wikidata · regions, city tiers and enrichment

- Publisher: Wikidata contributors; structured data is CC0 1.0.
- License: https://www.wikidata.org/wiki/Wikidata:Licensing
- Retrieved 2026-09-25. Pinned raw query results and entity responses live in
  `data/snapshots`; hashes are in `data/sources.lock.json`.
- Fields: P429 code join, P31 designated/core-city classes, current P36 capitals,
  dated P1082 population, Japanese labels, P1814 readings (including qualifiers
  on native name P1705), and Japanese Wikipedia sitelinks.
- Each emitted fact retains entity and claim IDs and entity revision ID.
- UI credit: Wikidata contributors · CC0 1.0. Region readings, city
  classifications, capitals, population and article links; snapshot 25 September 2026.
- Eight-region membership cross-check:
  https://www.wikidata.org/w/index.php?title=Wikidata:Country_subdivision_task_force/Japan&oldid=192981605
  (project-page prose is CC BY-SA; only the factual code grouping is used).

## Japanese Wikipedia · explicit region readings

- 四国, revision 111032101:
  https://ja.wikipedia.org/w/index.php?oldid=111032101
- 九州, revision 110477212:
  https://ja.wikipedia.org/w/index.php?oldid=110477212
- Publisher: Japanese Wikipedia contributors. CC BY-SA 4.0; author histories
  remain accessible from each article's history page.
- License: https://creativecommons.org/licenses/by-sa/4.0/
- Changes: extract the explicit full region name/kana pair as a factual datum.
  No source sentence is reproduced in the curriculum.
- UI credit: Japanese Wikipedia contributors: 四国 and 九州 · CC BY-SA 4.0.
  Full region name/reading pairs extracted as facts.

## Noto Sans Regular · map glyph fallback

- Font PBF distributed by MapLibre, generated from OpenMapTiles' source fonts:
  https://github.com/maplibre/demotiles (font-generation note).
- Vendored range: `public/fonts/Noto Sans Regular/0-255.pbf`, pinned to demotiles
  commit `601ae60796ceceda2cbd2ed3d2ea92d17a84be4b`; exact URL and SHA-256 are in
  `data/sources.lock.json`. Japanese glyphs still use local BIZ UDPGothic.
- The ASCII range also serves furigana line-break requests, so the map no longer
  depends on the external demo font server.
- License: SIL Open Font License 1.1, copied from `noto-sans/LICENSE` at
  OpenMapTiles/fonts commit `d48c5fce2fc58b55c98d353558d807cac45e7262` and
  distributed at `/fonts/Noto%20Sans%20Regular/LICENSE`.
- UI credit: Noto Sans Regular map glyphs, distributed by MapLibre / OpenMapTiles
  · SIL Open Font License 1.1.

## JMdict / EDICT · token glosses

- Publisher/copyright: James William Breen and the Electronic Dictionary Research
  and Development Group (EDRDG).
- Project: https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html
- Official file URL: http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz
- Verified XML snapshot: 2026-09-24; retrieved 2026-09-25; SHA-256
  b64fa2c4abbfd3ce77331c189b75dfcd091f4f98fdc7982f54f4ce676adbc9d3.
- License: CC BY-SA 4.0; current authoritative statement supersedes older 3.0
  references: https://www.edrdg.org/edrdg/licence.html
- Local copy of the full statement: `/licenses/jmdict-license.html`.
- The original daily snapshot is vendored as compressed XML so a future rebuild
  never substitutes the current day's mutable download for the pinned bytes.
- Derived gloss extracts retain entry IDs, reading/headword and sense restrictions;
  those extracts remain under CC BY-SA 4.0. No ownership of EDRDG data is claimed.
- UI credit: This application uses the JMdict/EDICT dictionary files, the property
  of the Electronic Dictionary Research and Development Group, under CC BY-SA 4.0.
- Maintenance: refresh the pinned snapshot and regenerate extracts at least monthly
  before distributing an updated dictionary service; retain prior snapshots for
  reproducibility. An explicit update procedure must verify the new header/date,
  schema, licence and hash instead of silently changing build input.

## SudachiPy / SudachiDict · sentence reading validation

- Works Applications Co., Ltd.; Apache License 2.0.
- https://github.com/WorksApplications/sudachi.rs
- https://github.com/WorksApplications/SudachiDict
- SudachiPy 0.6.11 and SudachiDict-core 20260723, exact PyPI artifacts verified
  older than 72 hours. Used offline to check sentence readings; canonical place
  names always override analyzer output with the authoritative source reading.
- Dictionary attribution: SudachiDict by Works Applications Co., Ltd. is licensed
  under the Apache License, Version 2.0.
