# Contributing to Nihongo Navigator

Chizu is an early-stage Japanese reading app built around Japan's geography.
See [PHASES.md](PHASES.md) for working features and unfinished work. Bug fixes,
accessibility improvements, source-backed reading corrections, and clearer
documentation are welcome. Open an issue before starting a large feature so
we can agree on its scope.

## Development setup

Use Node 24 (CI pins 24.3.0) and pnpm 11.11.0. `.nvmrc` records the tested Node
version. Linux, macOS, or WSL is recommended for the Python and tile pipelines.

```sh
corepack enable
corepack prepare pnpm@11.11.0 --activate
pnpm install --frozen-lockfile
```

Unit tests and compilation work immediately. This source release omits generated
map assets pending GSI clearance. Follow the [local data setup](README.md#build-local-map-data),
then run `pnpm dev` and open http://localhost:5173. Existing local map files remain
usable. Map practice does not require model credentials.

## Checks

```sh
pnpm check:publication
pnpm test
pnpm build
pnpm check:dependency-policy
```

The publication check audits Git's index, so stage the files you intend to
contribute before running it. CI runs these source checks. After building map
data locally, also run:

```sh
pnpm data:validate
pnpm exec playwright install chromium
pnpm exec playwright test
```

On Linux, Playwright may need OS libraries: use
`pnpm exec playwright install --with-deps chromium`. Tests use the browser
matched to the pinned Playwright version. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
only when deliberately testing an existing Chrome/Chromium installation.
Headless map tests use software WebGL. The dependency-policy check needs access
to the official npm registry; the unit and browser tests make no model calls.

For dictionary or sentence-reading changes, also set up the Python environment
as described in the README and run:

```sh
.venv/bin/python tests/test_content_support.py
```

Add regression coverage for behavior changes where it can catch a real failure.
For UI changes, check desktop and phone layouts, keyboard navigation, Japanese
IME input, and the places-list fallback. Keep screenshots containing the N03
map local while its redistribution conditions remain unresolved.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/` | React UI, map, reading matcher, local progress |
| `server/` | Optional local content service and model adapters |
| `scripts/` | Source ingestion, validation, tiles, fonts, content |
| `data/snapshots/` | Pinned source snapshots |
| `data/sources.lock.json` | Source URLs, revisions, hashes, and provenance |
| `public/data/` | Ignored local curriculum, tiles, and reader output |
| `reports/` | Local validation reports; only dependency-age reports are published |
| `tests/` | Browser and dictionary integration tests |

## Data and language corrections

Report the place name, five-digit administrative code or place ID, current
reading, proposed correction, and an authoritative source. Preserve canonical
readings; do not replace them with model guesses. Keep source revisions,
hashes, attribution, and license information with any new data.

Generated files should change through their build scripts. Describe the input
change and local validation results; keep generated map/fact/content files and
map reports out of the PR until distribution is cleared. Label-only changes can use
`node scripts/build-tiles.mjs --labels-only` after the Python environment is
installed. Full data rebuilds download about 586 MB into ignored `.data-cache/`.

Read [ATTRIBUTIONS.md](ATTRIBUTIONS.md) before importing or redistributing data.
MIT applies to original code and documentation; upstream data and fonts retain
their own terms. JMdict-derived gloss extracts retain CC BY-SA 4.0. The pending
map-data publication condition is recorded in [docs/PUBLISHING.md](docs/PUBLISHING.md).

Content generation commands invoke the configured model and may consume paid
usage. Run them intentionally with your own credentials, review the output,
and keep prompts containing private information, provider logs, and credentials
out of contributions. Automated grounding checks do not replace editorial review.

## Dependency changes

Every newly added or upgraded direct **and transitive** dependency must have
been published strictly more than 72 hours ago. Verify exact versions and UTC
publication timestamps against the authoritative registry before editing a
manifest or accepting new lockfile resolutions. Missing timestamps fail closed.

Keep versions exact and commit the manifest and lockfile together. Preserve
`pnpm-workspace.yaml`'s minimum release age of 4,321 minutes and strict handling
of missing timestamps. `uv.toml` uses a fixed, conservative publication cutoff
for Python resolution. Do not add age exclusions, bypass flags, or use
unversioned `latest` dependencies. A quarantine exception requires explicit
maintainer approval for the named package and version; a failed install is not
an exception. GitHub Actions should remain pinned to reviewed commit hashes.

## Pull requests and reports

Keep changes focused. Explain the problem, the resulting behavior, and the
checks you ran. Note any unfinished work or relevant limitations. Avoid unrelated
formatting and large regenerated datasets without an input change.

Do not commit `.env` files, tokens, browser profiles, local caches, or recovery
notes. Use the [security reporting process](SECURITY.md) for vulnerabilities.
Keep discussion respectful and focused on the work.

By submitting original code or documentation, you agree to contribute it under
the project's MIT license. Third-party contributions must retain their own
licenses and attribution; only submit material you have the right to share.
