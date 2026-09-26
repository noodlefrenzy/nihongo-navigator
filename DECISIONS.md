# Decisions

## 001 · 2026-09-24 · Pin the administrative snapshot to 2024-01-01

MIC's live code page links 000925835.xlsx, dated 2024-01-01. Use the N03
2024-01-01 archive for the first join so both sides describe the same date.
The workbook has separate municipality and designated-city/ward sheets;
its codes contain a sixth check digit. Join their first five digits to
N03_007. Retain the original code and worksheet/row in provenance.
Gunma is the municipality proof because it includes 草津町 from the matcher
acceptance table. Verify counts from the actual source, never a guessed list.

## 002 · 2026-09-24 · Standalone project and phased gates

The explicit fresh-repository brief makes this directory the standalone app
root rather than creating another app inside the parent workspace. Phase 0
must pass before MVP features begin. No commits or external publication are
implied. Product context is transcribed from the detailed user brief; routine
design choices are delegated by the user's autonomy instruction.

## 003 · 2026-09-24 · Fail closed on dependency age

pnpm 11.11.0 is available. Configure 4321 minutes (strictly more than 72 hours),
missing-timestamp rejection and strict age handling before the first install.
Verify exact direct versions against npm first, and independently audit every
resolved package timestamp before accepting the lockfile. Keep lifecycle
execution restricted to the required esbuild build.

## 004 · 2026-09-24 · Separate reading correctness from acceptance

The matcher returns exact, close or wrong and a separate accepted flag. Strict
Hepburn rejects close answers without losing the useful long-vowel feedback.
Normalize from authoritative kana; no kanji lookup supplies a reading. Preserve
small っ and kana distinctions while accepting Hepburn/Kunrei spelling aliases.

## 005 · 2026-09-24 · Code-first cartography from the pinned visual brief

The Impeccable direction seed c53ed443 was run. Its free-choice assignment is
superseded by the user's explicit GSI-like pale cartography, typography-first
layout and instruction to decide reversible choices autonomously. The visual
proof is the actual MapLibre glyph/collision spike, so build directly in code.
Use a full-canvas pale-water map with ink labels, compact map controls, a
keyboard places list and a reading sheet that docks below the map on phones.
Do not generate raster map imagery: accurate source geometry is the visual.

## 006 · 2026-09-24 · Local N03 spike and source survey conditions

The 2024 N03 page explicitly lists CC BY 4.0 and GSI reproduction approval
R 5JHf 357. It also carries a secondary-reproduction notice. GSI's current
procedure exempts private/internal use with attribution:
https://service.gsi.go.jp/onestop/navi/nav5-2/ . This task builds and tests locally.
Before public distribution, resolve the applicable GSI reproduction/use route;
the local prototype is not evidence of permission to publish derived datasets.
The source's territorial extent and provisional boundaries are preserved.

## 007 · 2026-09-24 · Small Python dependency surface for the join spike

Read the inspected XLSX with standard-library ZIP/XML, excluding Excel's
phonetic annotation nodes. Stream MLIT's line-delimited features; use Shapely
for unions, simplification and point containment. GeoPandas is unnecessary for
this EPSG:6668 geographic-coordinate spike. Pin Shapely and its full dependency
closure (NumPy); the uv resolution ceiling is 2026-09-20T00:00:00Z.

## 008 · 2026-09-25 · Validate nasal positions after normalization

Collapsing n/nn symmetrically is insufficient: it would equate かな with かんな.
After the two symmetric keys, verify that each nasal in the canonical kana
accounts for one or two input n characters while preserving following na/ni
syllables. Kana input preserves distinct homophones such as じ and ぢ. Geminated
Hepburn tch and Kunrei tty normalize to the same retained double consonant.

## 009 · 2026-09-25 · Basemap made from the same authoritative geometry

Render only N03 polygon fill and boundaries beneath our learning labels. This
guarantees no leaked place names, avoids a second map-data license, and allows
the same geography to support progress shading. Shapely performs simplification
for this spike; Tippecanoe 2.72.0 emits PMTiles for browser range requests. The
prefecture archive is about 300 KB and the Gunma archive about 232 KB.
Japanese labels use MapLibre's format expression (reading at 0.55 scale),
local BIZ UDPGothic glyph rasterization and built-in collision detection.
Semantic ruby lives in the keyboard index and cards; canvas labels are backed
by the accessible list. Self-host a 91 KB WOFF2 glyph subset and its OFL license.

## 010 · 2026-09-25 · Pinned knowledge snapshots augment MIC, never replace it

Wikidata P429 is the six-digit local-government code (including the check digit).
Join exact P429 values to MIC and use MIC names/readings throughout. The 2026-09-25
snapshot selects 20 designated cities (Q1749269), 62 core cities (Q1137833), and
current P36 prefectural capitals: 86 unique MIC units. Tokyo's abstract urban
entity Q7473516 has no MIC unit and is excluded; retain the capital statement
for Shinjuku Q179645. Administrative geometry and names remain the coherent
2024-01-01 snapshot; enrichment has a separate explicit date and revision IDs.
Dissolve designated-city wards by N03's prefecture and parent-city fields.
Population sort priority uses the latest dated, non-deprecated P1082 statement;
missing population remains null. Source queries and full entity responses are
vendored, byte-pinned and checked on every data build. Updating is an intentional
ingestion operation, not an implicit live-query side effect.

## 011 · 2026-09-25 · Eight region names with full authoritative readings

Use the conventional eight-region partition, with Okinawa in Kyushu, from the
inspected Wikidata subdivision table (revision 192981605). Direct P1814 and
P1705/P1814 qualifiers provide six full readings. For 四国地方 and 九州地方,
Wikidata's P1814 only names the shorter island form. Extract the explicit full
name/reading pair from Japanese Wikipedia revisions 111032101 and 110477212;
do not synthesize the missing kana. Region polygons dissolve validated generalized N03
prefectures and validate label points against original and simplified geometry.
地方 is an optional suffix, partitioned from the verified full reading.

## 012 · 2026-09-25 · Local practice and visible progress in Phase 1

Dexie stores settings and practice records behind a repository interface;
Zustand coordinates the UI. Default furigana is hidden so the first answer is
an unaided attempt; Always is available in the toolbar and preferences.
A temporary Phase 1 mastery rule requires exact unaided answers on three
separate UTC days; missed/revealed readings restart that run. Review becomes
due after 24 hours. Phase 3 will replace this scheduling rule with FSRS.
Next prioritizes due, then unseen, then learning items in the same tier, using
geodesic proximity within each group. Keep state distinguishable by outline,
half-filled, check and return-arrow symbols as well as color. Map status marks
are generated only for labels that survived MapLibre's collision detection.

## 013 · 2026-09-25 · Validate polygon collections after simplification

The region gate exposed nested shells in Hyogo's simplified multi-polygon:
a simplified coastline enclosed a separate tiny island, although its source
polygon was valid. After simplification, union overlapping land components and
require a valid result. This preserves land-union semantics instead of turning
nested islands into holes. Regions dissolve these validated simplified
prefectures; every region label is also checked against an original N03
prefecture polygon. This avoids an expensive second union of millions of
unsimplified coastal vertices. No source readings, codes or boundaries in the
raw archive are changed; the output remains explicitly generalized cartography.

## 014 · 2026-09-25 · Dictionary snapshot and compatible validator

Use JMdict_e's 2026-09-24 XML from the HTTP URL actually linked by EDRDG's project
page. The FTP host's HTTPS certificate fails hostname validation; no TLS bypass
was used. EDRDG's current licence page confirms CC BY-SA 4.0. Vendor the compressed
original and retain its header date/hash, because the upstream file changes daily.
An explicit monthly refresh procedure will maintain the dictionary; ordinary
builds remain pinned. Preserve JMdict headword/reading and sense restrictions.
SudachiPy 0.7.0 was published 2026-09-24 and fails the quarantine. Use eligible
0.6.11 with dictionary 20260723 (both exact registry timestamps verified).
Dictionary 20260723.1 has an artifact uploaded 2026-09-24, so use the older fully
eligible release. Do not derive any canonical place reading from the analyzer.

## 015 · 2026-09-25 · Ward identity and unassigned land

MIC sheet 2 spells designated-city wards with the city prefix. Partition the
exact, independently verified city name and kana prefix, then compare the
remaining ward name to N03_005. This gives readable 中区/北区 labels while stable
MIC codes and full parent breadcrumbs keep duplicate names distinct. A mismatch
fails the build. N03 unassigned land can carry a prefecture-only code (e.g. 千葉県
所属未定地, 12000); retain it in the prefecture base and list it in validation,
without creating a guessed municipality or reading.

## 016 · 2026-09-25 · Preserve the one official orthographic disagreement

The full N03/MIC scan found one spelling disagreement: N03 檮原町 and MIC 梼原町,
both code 39405. Join this inspected pair by the exact official code. Display
MIC's name and reading ゆすはらちょう; retain N03's spelling in field provenance
and the validation report. The town's own site also uses 梼原町
(https://www.town.yusuhara.lg.jp/). This is an explicit pair for pinned snapshots,
not a general character replacement or fuzzy join; any new disagreement fails.

## 017 · 2026-09-25 · Nationwide coverage without an initial nationwide payload

Emit 47 municipality JSON chunks and 47 boundary PMTiles archives. A single
tiled label archive supplies collisions and visible IDs; zooming into municipal
labels requests only the corresponding prefecture records and boundaries.
Maintain the same ID for a city at major-city and municipality zooms. The 1,918
source records include 171 designated-city wards and the source's northern
territory units. Including regions and prefectures gives 1,973 unique places.
Build tile archives in the ignored cache and rename completed files into public
outputs so live readers never see Tippecanoe's temporary journal files.

## 018 · 2026-09-25 · Grounded reader pipeline and server-only judging

Use Node's built-in HTTP server behind a replaceable service handler; no new
runtime package is needed. The model interface uses Responses structured JSON
with a configured model ID and a server-only key. Refusals, incomplete output,
unknown fact IDs, broken segments, missing meaning units and invalid spans fail
closed. Sudachi checks ordinary words; explicit place segments take MIC/source
kana. A separate model grounding review must agree before caching a draft.
JMdict extracts preserve headword, reading and sense restrictions and entry IDs.
Basic geography facts are extracted mechanically now; historical and cultural
enrichment remains unfinished and is not implied by this pipeline.

Reference matches receive 100 without a model call. Other judgments are cached
by sentence contents/version and normalized answer. Offline keyword checks are
explicitly approximate, capped at 90, and penalize missed critical units and
negation. Normalization preserves decimal points. The provider connection is
currently absent; no generated reader or live model result has been accepted.

## 019 · 2026-09-25 · Speech preserves canonical readings

Browser speech uses a selected Japanese voice and the authoritative kana for
place names, avoiding the speech engine's own kanji reading guesses. Playing
audio before submitting counts as a hint. Voice and rate persist with existing
preferences. If no Japanese voice is installed, disable playback and say so.
Browser tests stub the speech API to verify text/rate/hint behavior; they do not
claim to evaluate audio quality or install a voice on the learner's device.
