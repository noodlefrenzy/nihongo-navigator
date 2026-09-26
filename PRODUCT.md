# 地図で学ぶ · Chizu

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The user selected Vite, React, TypeScript, MapLibre with PMTiles, Zustand,
Dexie, WanaKana and FSRS as defaults. Python handles authoritative data.

## Users

Japanese learners practising place-name readings and the geography of Japan,
on phones and desktop browsers. Sentence levels range from N5–N4 to N2+.

## Product Purpose

The map is the curriculum: tap a label, read its name, unlock a graded place
card, translate sentences, and move to a nearby unlearned or due item.

## Capabilities and Constraints

Readings and facts must be sourced. Every place keeps a stable source identity
and field provenance. The basemap must reveal no answers. Progress stays local
with an interface that can support later sync. Source failures block dependent
work; guessed data must never enter the curriculum. Complete each acceptance
gate before advancing to the next phase. Do not publish externally.

## Brand Commitments

Working title Chizu; Japanese title 地図で学ぶ. Calm Japanese cartography,
restrained palette, legible Japanese typography, labels as the main content.

## Evidence on Hand

The user supplied a detailed functional brief and matcher acceptance table.
MIC's 2024-01-01 workbook has been downloaded and inspected. MLIT's matching
2024 Gunma archive contains GeoJSON with N03_007 administrative codes.
No place facts or generated reader content have been approved yet.

## Product Principles

- Valid romanization must be accepted; mistakes must be explained.
- Geography, readings and facts carry traceable provenance.
- A session should flow from one place to the next with little navigation.
- The map and its labels lead; interface controls stay quiet.

## Accessibility & Inclusion

WCAG AA contrast, keyboard-accessible places list, Japanese language tags,
semantic ruby, visible status beyond color, mobile bottom sheets and inputs
that remain reachable with the software keyboard open.
