# Publication scope

Repository: [noodlefrenzy/nihongo-navigator](https://github.com/noodlefrenzy/nihongo-navigator),
public source release, default branch `main`.

## Included in this release

- Original application, server, tests, and rebuild scripts under MIT.
- Documentation, source URLs/revisions/hashes, and dependency lockfiles.
- Independently licensed Wikidata, Wikipedia, and JMdict snapshots, plus fonts
  and their notices. See [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).
- Dependency-age verification reports.

## Kept local pending GSI clearance

The public tree excludes generated files in `public/data/` (apart from its
README), `data/facts/`, map/content validation reports, map screenshots, and all
raw downloads and caches. This includes boundary and label PMTiles, place JSON
with derived coordinates, geometry, and generated reader output.

These files are preserved in the maintainer's working directory and ignored by
Git. `pnpm check:publication` checks the Git index for excluded paths and verifies
vendored input hashes. CI runs this check, unit/server tests, dependency-age
verification, and a source build. Data validation and browser tests require a
local data build and are documented in [CONTRIBUTING.md](../CONTRIBUTING.md).

A fresh checkout can compile and run unit tests. It needs the
[local data build](../README.md#build-local-map-data) before running the map.
`dist/` generated on a machine with local map files contains those files, so
publishing that directory remains subject to the same unresolved conditions.
No hosted application is deployed by publishing this repository.

## Map-data redistribution

**Open before publishing map assets or a hosted map.** The 2024 MLIT N03 snapshot
is CC BY 4.0, but its [source page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html)
also carries GSI reproduction approval `R 5JHf 357` and a secondary-use notice.
That approval belongs to the source product. This project has no recorded GSI
approval or confirmed exemption for public distribution of its derivatives.

The [GSI secondary-use FAQ, Q1-24](https://www.gsi.go.jp/LAW/2930-qa.html)
directs reuse of reproduction-approved products through its usage procedure.
The [coordinate question](https://service.gsi.go.jp/onestop/navi/nav5-3/)
puts coordinate-bearing public maps on the application path. Our interpretation
is that the proposed PMTiles/JSON distribution needs review under that process;
GSI must confirm whether Article 29 or Article 30 applies and any conditions for
downstream redistribution. Official guidance was checked on 2026-09-26.

The [Japanese inquiry and English explanation](GSI-INQUIRY.md) describe the
specific processing and GitHub distribution we intend to ask about. No inquiry
or application has been sent on the maintainer's behalf.

Before including map outputs in a release:

1. Obtain and record the applicable approval or confirmed exemption, including
   public download, forks, modified redistribution, and hosted display.
2. Follow its terms, update credits in the app and [ATTRIBUTIONS.md](../ATTRIBUTIONS.md),
   and submit the required product evidence where applicable.
3. Review which assets can be published, then deliberately update `.gitignore`
   and the publication check. Restore hosted data/browser CI only when suitable.
4. Run the full data and browser checks against the exact assets to be released.

## Verification record

On 2026-09-26, the local prototype passed 67 frontend tests, 11 server tests,
8 desktop/mobile browser scenarios using the pinned Playwright Chromium,
production build, and validation of 1,973 places. The official npm timestamp
check passed for all 230 locked resolutions. The build retains its existing
large-bundle warning. These local map checks are distinct from the source-only
GitHub workflow; generated validation reports remain local.

Review the staged file list and commit identity before publication. Keep
credentials, `.env` files, `RECOVERY.md`, screenshots of the map, and caches out
of Git. Enable private vulnerability reporting and GitHub's available secret
scanning protections. See [SECURITY.md](../SECURITY.md).
