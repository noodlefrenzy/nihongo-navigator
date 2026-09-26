# Local map outputs

This source release omits generated map files while GSI redistribution
conditions are being resolved. See [publication status](../../docs/PUBLISHING.md).

For local development, follow the [data setup](../../README.md#build-local-map-data)
and run `pnpm data:build`. The build creates place JSON, geometry, PMTiles, and
source metadata here, with fact bundles under `data/facts/`. These outputs stay
ignored by Git. Keep reader output and map screenshots local as well.

The original source archives remain in `.data-cache/`. Original code is MIT;
generated data retains its upstream terms. Publication of the source code does
not establish permission to redistribute generated map assets.
