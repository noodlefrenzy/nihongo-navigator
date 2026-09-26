# Nihongo Navigator · 地図で学ぶ

**Chizu** turns a map of Japan into Japanese reading practice. Explore regions,
prefectures, and municipalities, type their readings in kana or romaji, and get
feedback on long vowels and administrative suffixes. Furigana, spoken readings,
and an accessible places list support practice at your own pace. Progress and
settings stay in your browser.

The local prototype covers 1,973 places. Nationwide place-name practice
works; sentence readers and translation exercises are still in development.
Spaced repetition and offline support are planned. See [PHASES.md](PHASES.md)
for current progress, [PRODUCT.md](PRODUCT.md) for the brief, and
[CONTRIBUTING.md](CONTRIBUTING.md) to contribute.

**Source release:** generated map assets are omitted while their GSI
redistribution conditions are being resolved. The repository includes the app,
rebuild scripts, independently licensed source snapshots, fonts, and tests.
A fresh checkout needs a local data build before the map can run. See
[publication status](docs/PUBLISHING.md) and the [GSI inquiry draft](docs/GSI-INQUIRY.md).

## Run locally

Requires Node 24 and pnpm 11.11.0. CI uses Node 24.3.0 (`.nvmrc`).

```sh
corepack enable
corepack prepare pnpm@11.11.0 --activate
pnpm install --frozen-lockfile
```

You can run `pnpm test` and `pnpm build` immediately. The build compiles the
source; a usable map also needs the generated assets below. `pnpm dev` checks
for those assets and explains how to create them if they are missing.

The map requires WebGL. If Edge shows “The map could not start,” enable graphics
acceleration in Edge's system settings and restart the browser. The places list
remains available if map rendering fails.

## Build local map data

Requires Python 3.12, uv, and curl. Use Linux, macOS, or WSL. Review the source
terms in [ATTRIBUTIONS.md](ATTRIBUTIONS.md) before using the datasets. Generated
outputs remain excluded from the public repository pending distribution clearance.

```sh
uv venv .venv
uv pip install --python .venv/bin/python -r requirements.txt
pnpm data:build
pnpm data:validate
pnpm dev
```

The pipeline fetches hash-pinned MIC and MLIT files, verifies schemas, joins
five-digit administrative codes, validates interior label points, and emits
PMTiles. The first build downloads about 586 MB; raw files stay in ignored
`.data-cache/`. Changed source bytes fail the build.

Open http://localhost:5173. No model connection is required for map practice.
The generated assets, fact bundles, reader outputs, and map reports stay local;
do not force-add them to Git or publish a `dist/` build containing them while
clearance is unresolved. Existing local data can continue to be used without
rebuilding it on every checkout.

## Verify

```sh
pnpm check:publication
pnpm test
pnpm build
pnpm check:dependency-policy
```

The publication check examines tracked/staged files and upstream input hashes.
CI runs these source checks without map data or model credentials. After a
local data build, also run:

```sh
pnpm data:validate
pnpm exec playwright install chromium
pnpm exec playwright test
```

Playwright starts the dev server when needed and uses its matching Chromium
build. On Linux, `pnpm exec playwright install --with-deps chromium` also installs
required system libraries. An existing browser can be selected explicitly with
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Headless tests enable software WebGL.
The dependency check reads official npm publication timestamps and fails closed.
pnpm also enforces the 72-hour quarantine during resolution and frozen installs.
Normal tests do not invoke a live model. Map/data/browser verification and
Python dictionary checks are local maintainer tasks for this source release.

Data licenses and exact UI credit text: [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
Implementation decisions and N03 distribution conditions: [DECISIONS.md](DECISIONS.md).

The curriculum build additionally uses pinned Wikidata entity revisions
for region readings, major-city membership and dated population, plus explicit
region reading facts from two attributed Japanese Wikipedia revisions. Those
snapshots are vendored under `data/snapshots`; rebuilding does not query mutable
live knowledge endpoints. `pnpm data:validate` checks the locally generated curriculum,
code hierarchy, canonical readings, provenance and archive headers without
requiring the large original downloads.

The local build contains 1,918 municipal records, including designated-city
wards, in 47 lazy-loaded chunks. Together with prefectures and regions, there are
1,973 unique places. Labels remain tiled and use MapLibre's collision handling.

The overview shows regions; zooming in reveals prefectures, major cities and
municipalities. Tile generation preserves every label from its tier's minimum
zoom instead of sampling points. `node scripts/build-tiles.mjs --labels-only`
rebuilds labels without rebuilding boundaries and decodes zooms 3–10 to check
coverage. `reports/label-tile-validation.json` records the results and input/output
hashes, which `pnpm data:validate` verifies locally. Map fonts, including the small
glyph range needed for furigana line breaks, are served locally.

## Phase 2 content service (Codex CLI)

Reader generation and translation judging use the authenticated Codex CLI by
default, with model settings in `config/llm.json`. The Tokyo beginner proof reader
has passed reading validation and live grounding review; reference, paraphrase
and wrong-region translation checks passed during local development. Results
remain in the maintainer's local reports; generated readers and those reports
are omitted from this source release. This is one of 423 planned readers, so Phase 2
remains open. Sentence cards, translation UI and gloss popovers are unfinished.

Use the existing Codex CLI login; `codex login status` checks it. No API key is
needed for this provider. Optional overrides are documented in `.env.example`.
For the alternative **Responses API** provider, copy that file to `.env`, set
`CHIZU_LLM_PROVIDER=responses`, an exact model ID and a server-only key, and
optionally change the API base URL. `.env*` is ignored except the example. Never
put credentials in a `VITE_` variable or client code.

```sh
pnpm dev:server  # after local map data and Python setup
```

The API listens at http://127.0.0.1:8787; Vite proxies `/place-content/:id` and
`/judge-translation`. The HTTP handler and model `generate()` interface are
separate for deployment adapters or a different provider. Filesystem cache and
Python dictionary validation currently require a Node host with the project's
`.venv`; a serverless deployment needs equivalent storage/validation adapters.

```sh
.venv/bin/python scripts/content_support.py index
.venv/bin/python tests/test_content_support.py
pnpm content:build jp:13000  # three-level proof for Tokyo, using the configured provider
pnpm content:build           # all 423 build-tier readers; invokes the configured model
```

These generation commands make model calls. Basic geography facts are currently
available, but historical/cultural/landmark enrichment is still unfinished.
Reader drafts fail closed on reading or grounding flags; audits are saved under
`.data-cache/content-audits`. A passing automated check is not a completed
editorial coverage review. `reports/content-build.json` distinguishes a partial
proof run from complete generation.

The service uses server-owned sentence records when judging; the browser cannot
supply references or grading rules. Exact reference matches do not call a model.
Unit tests use an injected provider and cover refusals, incomplete results, bad
spans, critical meaning and caches. The recorded live checks cover one reader
and two model judgments; they do not establish quality across the curriculum.

## Dictionary maintenance

Before distributing a monthly dictionary update, inspect EDRDG's current licence
and official download link, save the new compressed XML in `data/snapshots`,
verify its header date and schema, and record the exact SHA-256 in
`data/sources.lock.json`. Update `JMDICT_ID` in `scripts/content_support.py`,
regenerate the index and gloss extracts, rerun dictionary tests, and update
attributions. Keep prior raw snapshots for reproducibility. A changed download
never silently replaces a pinned source during an ordinary build.

## License

Original project code and documentation are licensed under the
[MIT License](LICENSE), copyright © 2026 noodlefrenzy.

Bundled third-party material retains its own licenses. In particular, source
snapshots and generated map/curriculum data are subject to their source terms;
JMdict snapshots and derived glosses retain CC BY-SA 4.0; bundled fonts use the
SIL Open Font License. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for source-specific
terms, transformations, and notices. JavaScript and Python dependencies also
retain their respective licenses.

For vulnerabilities, see [SECURITY.md](SECURITY.md). Maintainer publication
steps are in [docs/PUBLISHING.md](docs/PUBLISHING.md).
