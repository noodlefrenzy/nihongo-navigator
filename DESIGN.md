---
name: "地図で学ぶ · Chizu"
description: "Pale Japanese cartography with place names at the center."
colors:
  ink: "#263e3c"
  muted: "#526761"
  accent: "#226b57"
  selected-ink: "#176349"
  focus: "#247863"
  paper: "#fafbf6"
  water: "#e5eff2"
  land: "#f7f8f1"
  line: "#d0dcd4"
  coast: "#9babaa"
  municipality-line: "#b6c3ba"
  action-hover: "#eaf0e7"
  row-active: "#e7efe5"
  status-ground: "#e1ecdf"
  status-ink: "#315b40"
  error: "#8e3430"
  action-hover-deep: "#17543f"
  action-text: "#fff"
  input-ground: "#fffef9"
  input-border: "#9aac9f"
  learning-ink: "#3f6555"
  review-ink: "#855219"
  correction: "#934932"
  difference-removed: "#923b34"
  input-error: "#973d32"
typography:
  headline:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "38px"
    fontWeight: 400
    lineHeight: 1.8
  headline-mobile:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.7
  settings-title:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.8
  brand:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "21px"
    fontWeight: 400
    letterSpacing: "0.03em"
  title:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
  title-mobile:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.5
  difference:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "18px"
    fontWeight: 400
  input:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "17px"
    fontWeight: 400
  feedback:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "16px"
    fontWeight: 400
  place:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "15px"
    fontWeight: 400
  brand-subtitle:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "14px"
    fontWeight: 400
  romanization-mobile:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "13px"
    fontWeight: 400
  body:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "11px"
    fontWeight: 400
  metadata:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "10px"
    fontWeight: 400
  status:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "9px"
    fontWeight: 400
  reading:
    fontFamily: '"BIZ UDPGothic", sans-serif'
    fontSize: "0.55em"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  panel: "3px"
  mobile-sheet: "16px 16px 0 0"
  scrollbar: "5px"
spacing:
  compact: "8px"
  control-gap: "10px"
  small: "12px"
  medium: "16px"
  panel-inset: "20px"
  sheet-inset: "24px"
  section-gap: "28px"
components:
  toolbar-action:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "8px 12px"
  toolbar-action-hover:
    backgroundColor: "{colors.action-hover}"
  status-tag:
    backgroundColor: "{colors.status-ground}"
    textColor: "{colors.status-ink}"
    rounded: "{rounded.panel}"
    padding: "5px"
  place-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "17px 20px"
    width: "100%"
  place-row-selected:
    backgroundColor: "{colors.row-active}"
  place-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px 24px 24px"
    width: "345px"
  place-sheet-mobile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.mobile-sheet}"
    padding: "12px 22px 20px"
    width: "100%"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.action-text}"
    rounded: "{rounded.panel}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover-deep}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "10px"
  reading-input:
    backgroundColor: "{colors.input-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "10px 12px"
    width: "100%"
    height: "48px"
  settings-select:
    backgroundColor: "{colors.input-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "8px"
  progress-status:
    textColor: "{colors.muted}"
  progress-status-mastered:
    textColor: "{colors.accent}"
  progress-status-review:
    textColor: "{colors.review-ink}"
  feedback-exact:
    textColor: "{colors.accent}"
  feedback-close:
    textColor: "{colors.accent}"
  feedback-correction:
    textColor: "{colors.correction}"
  icon-action:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  map-message:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "15px 20px"
  source-link:
    textColor: "{colors.accent}"
---


# Design System: 地図で学ぶ · Chizu

## Overview

**Creative North Star: "Pale Japanese Cartography"**

Chizu treats Japanese place names as the main content. Pale blue water, chalk land, green ink, and precise boundary lines establish a quiet cartographic surface. Clear Japanese lettering and a restrained paper interface keep the geography legible while a learner selects a name and practises its reading.

The interface is sparse around the map and compact within its controls. Paper sheets carry the reading question, answer feedback, and source link. The same world now supports browser-persisted progress and practice settings. This record describes the built Phase 1 interface in `src/App.tsx`, `src/Map.tsx`, `src/ReadingCard.tsx`, `src/Settings.tsx`, `src/ui.tsx`, and `src/styles.css`. The direction contract in `index.html` retains seed `c53ed443`. The Phase 1 desktop and mobile captures in `.impeccable/review/` show input and feedback states; source code is authoritative for focus and navigation behavior.

**Key Characteristics:**

- Pale geographic fields with dark green lettering.
- Japanese names, readings, and a single reading question lead the hierarchy.
- Quiet paper sheets, thin rules, and one ambient shadow.
- Progress uses recognizable shapes and text alongside restrained color.
- Reading input gives way to explanatory feedback and a clear Next action.
- The phone sheet follows the visible viewport and preserves attempts while Places is open.

## Colors

Cool water and chalk land remain the main fields. Greens carry ink, selection, accepted answers, and primary actions; muted brown and red distinguish review and correction. The frontmatter records the canonical values.

### Primary

- **Cartographic Green** (`accent`): primary buttons, source links, input caret and checkbox accent, accepted feedback, inserted kana, mastered list states, and the selected map point.
- **Deep Action Green** (`action-hover-deep`): primary-button hover.
- **Selected Green Ink** (`selected-ink`): selected and mastered map names.
- **Focus Green** (`focus`): keyboard-focus outlines on controls and links.

### Secondary

- **Learning Green Gray** (`learning-ink`): map names in the Learning state.
- **Review Brown** (`review-ink`): map names and marks needing review, and Review statuses in the places list.
- **Correction Clay** (`correction`): wrong-answer and reveal headings.
- **Removed Reading Red** (`difference-removed`): struck-through kana in the comparison.
- **Input Error Red** (`input-error`): the empty-answer prompt. **Error Red** (`error`) remains the map, data, and storage alert color.

### Neutral

- **Green Ink** (`ink`) and **Quiet Green Gray** (`muted`): primary and supporting interface text. New map names use Green Ink; New and Learning list statuses use Quiet Green Gray.
- **Paper** (`paper`): rails, sheets, source panels, and status notices.
- **Pale Water** (`water`) and **Chalk Land** (`land`): map fields; Chalk Land also forms the label halo.
- **Panel Rule** (`line`): dividers and rail borders. **Coast Gray** (`coast`) and **Municipality Gray** (`municipality-line`): geographic boundaries.
- **Action Tint** (`action-hover`) and **Row Tint** (`row-active`): toolbar hover and place-row hover/current states.
- **Status Tint** (`status-ground`) and **Status Ink** (`status-ink`): the furigana ON/OFF tag.
- **Input Paper** (`input-ground`) and **Input Border** (`input-border`): reading inputs and native selects.
- **Action White** (`action-text`): text and arrows on filled primary buttons.

**The Label Contrast Rule.** Keep map names over a Chalk Land halo, with boundaries subordinate. Selection and progress may tint the name, but a distinct marker and the places list also communicate state.

## Typography

**Interface and Japanese Font:** locally served BIZ UDPGothic, with a sans-serif fallback. `/fonts/chizu-japanese.woff2` declares weights 400–700 and uses `font-display: swap`. Headings and body text use regular weight; only the compact furigana state tag uses a stronger `strong` treatment. There is no separate display or monospace face.

### Hierarchy

The scale is role-based, without a fixed ratio. The frontmatter records the reusable roles. Current responsive values and specialized uses are:

| Role | Desktop | At or below 760px | Treatment |
| --- | --- | --- | --- |
| Selected Japanese name | 38px / 1.8 | 28px / 1.7 | Regular weight; ruby appears after an answer or when hints are enabled |
| Settings title | 22px / 1.8 | 22px / 1.8 | Regular weight |
| Japanese brand | 21px | 16px | Letter spacing 0.03em |
| Places introduction | 20px / 1.6 | 19px / 1.5 | The desktop line break is suppressed on phones |
| Answer kana | 20px | 20px | Uncompressed Japanese reading |
| Source title / kana comparison | 18px | 18px | Removed kana in the comparison is 12px |
| Reading input | 17px | 17px | Remains legible during entry |
| Feedback heading | 16px | 16px | Accepted or correction ink with explicit wording |
| Place rows / romanization | 15px | 15px / 13px | List names retain their size; only romanization shrinks |
| Latin brand subtitle | 14px | Hidden | Muted text after a vertical rule |
| Labels, primary actions, settings | 12px | 12px | Source body text uses line height 1.9 |
| Feedback notes, submitted answer | 11px | 11px | Feedback notes use line height 1.9; long answers wrap |
| Input/settings help, hierarchy | 10px | 10px / 9px | Help and hierarchy use line height 1.8 |
| List progress, legend, provenance | 9px | 9px | Supporting information only |
| Toolbar text | 12px | 10px | The furigana cue is 20px, then 16px |
| Footer action / summary | 10px | 9px / 7px | Current dense footer treatment; not a general reading size |

The mobile 7px footer summary is an observed compact edge case, not a reusable type token. Unused legacy selectors in the stylesheet do not establish current roles: the earlier 32px sheet heading is overridden by the reading and settings rules.

**The Two Label Surfaces Rule.** Render DOM names with `lang="ja"` and semantic `<ruby>`, `<rt>`, and `<rp>` when a reading is shown. Canvas labels use a formatted reading line at 0.55 of the name size; they are a visual approximation, not semantic HTML. Keep the keyboard-accessible places list as the DOM route to selecting a place.

DOM ruby is centered with muted annotations at 0.55em and line height 1.4. The map waits for the local Japanese face before rasterizing ideographs, uses the `Noto Sans Regular` glyph stack and BIZ UDPGothic for local ideographs, and interpolates name size from 12px at zoom 3 to 17px at zoom 6 and 20px at zoom 10. Map labels use line height 1.35, a 2px land-colored halo, 10px collision padding, and no overlap. Furigana defaults to hidden on map and list labels. The completed reading card reveals semantic ruby independently of that preference.

## Layout

Desktop uses the full dynamic viewport (`100dvh`) with a 440px minimum height. The map fills the space between a 64px top rail and a 36px footer. At 24px from the left and 88px from the top, the 232px places index overlays the map. The reading or settings sheet sits symmetrically on the right, 345px wide. Both cap at `calc(100dvh - 145px)` and scroll internally. Interior spacing is compact, with 20px list insets and 24px desktop sheet insets.

At `max-width: 760px`, the header is 60px and the footer 40px. The Latin subtitle and tagline disappear; Places and the settings icon remain in the toolbar. The reading and settings sheets span the width above the footer with 16px upper corners, internal scrolling, and padding of `12px 22px 20px`. Their current cap is `calc(var(--visible-height,100dvh) - 118px)`, replacing the original half-height cap for these two sheets.

The mobile main surface follows `--visible-height`, updated from the Visual Viewport API, with a 280px minimum. The index caps at `calc(var(--visible-height,100dvh) - 136px)` and sits 12px from either edge. A map ResizeObserver updates the canvas when its container changes. A focused reading input scrolls into view when the visible viewport resizes. These mechanisms implement the keyboard-aware layout; static captures alone do not prove every device keyboard configuration.

Opening Places closes settings and temporarily hides the mounted reading card. Its typed answer or completed feedback remains in memory. Closing Places restores the card and focuses its input or feedback according to its current state. Selecting another place closes the index and begins that place's card. The skip link also opens the index. Settings occupy the same sheet position and replace the reading card while open; attempt preservation is specifically implemented for the Places detour.

The reading flow keeps its heading and parent hierarchy above the changing input/feedback area, with kind and Reading source separated below by a thin rule. Sources remain a separate scrollable paper panel above the footer, constrained to the viewport width and `75dvh`. Map notices sit near the upper map edge. The scale moves from beside the desktop index to the phone's lower left; zoom controls stay lower right.

## Elevation & Depth

Geographic fields, paper surfaces, thin rules, and one ambient shadow create depth. There is no blurred backdrop or dimming scrim. The map remains visible around overlays.

### Shadow Vocabulary

- **Paper lift:** `0 8px 30px #203c3612` (`--shadow`), shared by the places index, reading/settings sheet, source panel, map notices, and map control group.

Layer order is map, places index, rails, reading/settings sheet, notices, and sources. The focused skip link sits above them. Feedback changes content within the existing sheet rather than adding another elevated container.

## Shapes

The radius vocabulary is small: 3px for desktop paper panels, buttons, inputs, selects, state tags, and notices; `16px 16px 0 0` for the mobile sheet; 5px for the scrollbar thumb. List rows are rectangular. A 1px border defines input/select fields and the primary action; thin rules separate panel regions.

Close, arrow, and settings controls use inline 18px SVGs with rounded 1.6px strokes. Progress symbols use 16px inline SVGs with a 1.4px stroke in the list. The map rasterizes equivalent open-circle, half-filled-circle, tick, and return-arrow marks. Icons are decorative where adjacent text or a control's accessible name supplies meaning.

## Components

### Toolbar and places index

The brand remains a plain home link. Transparent toolbar controls use Action Tint on hover. Furigana has a Japanese text cue, an explicit ON/OFF tag, and `aria-pressed`. Places and Settings expose `aria-expanded`. The settings glyph is the pair of adjustment sliders defined in the source SVG.

Places are full-width buttons with optional ruby on the left and a progress icon plus status name on the right. Rows retain a 60px minimum height and a pale current/hover field; the current place also exposes `aria-current`. A two-column status legend sits above the Gunma exploration action. The introductory prose shows the number of practised names when progress exists.

### Progress and map marks

| Stored state | Visible text | Shape | Color treatment |
| --- | --- | --- | --- |
| `unseen` | New | Open circle | Muted list status; Green Ink map name and green map mark |
| `learning` | Learning | Half-filled circle | Muted list status; Learning Green Gray map name and green mark |
| `mastered` | Mastered | Tick | Cartographic Green list status and mark; Selected Green Ink map name |
| `due` | Review | Return arrow | Review Brown list status, map name, and mark |

A separate green selected point with a white stroke distinguishes selection from progress. Marks sit beneath rendered map names, with their offset adjusted when furigana is shown. The visible tier changes from regions below zoom 5, to prefectures below 7, to major cities below 9, then municipalities and major cities together.

Settings and progress persist in this browser and are loaded before the map starts. Current progress derives from recorded attempts: no record is New; a record at least 24 hours old is Review; otherwise three distinct unaided exact-reading days yield Mastered and other records yield Learning. The interface states these outcomes through shapes and labels rather than a percentage, score ring, or animated reward. Storage failures appear as readable alerts.

**The Visible Progress Rule.** Pair learning state with its established shape and text in the places list and legend. Map color supplements the matching shape; selection must remain visually distinct from progress.

### Reading input and actions

The input state shows the selected Japanese name, parent hierarchy, a visible question label, one reading field, a short suffix/input note, Check reading, and Reveal. The field uses Input Paper, a 1px Input Border, 3px corners, 48px height, `10px 12px` padding, and a green caret. Its input mode changes the placeholder and language tag; the preferred mode does not replace the visible field label. Japanese IME composition does not submit on the composition-confirming Enter.

Check reading is a filled green primary action with white text and an SVG arrow. Primary buttons use a 46px minimum height, `12px 16px` padding, a 16px internal gap, and the darker green hover treatment. Reveal is a transparent quiet button with 10px padding. An empty submission displays “Type a reading, or choose Reveal.” as an alert below the input help.

### Reading feedback

Submitting or revealing replaces the form in the same sheet. The heading gains ruby, and the feedback contains the canonical kana and romanization. Submitted answers remain visible and wrap if long. The four outcomes are:

| Outcome | Heading | Treatment |
| --- | --- | --- |
| Exact | Exactly right. | Accepted green |
| Accepted close | Close — a long vowel to keep. | Accepted green plus explanatory notes |
| Wrong or rejected close | A reading to practise. | Correction Clay plus explanatory differences/notes |
| Reveal | Here is the reading. | Correction Clay; the revealed reading is shown without a submitted-answer line |

A kana comparison wraps into short vertical cells: removed kana is struck through in red, expected kana is underlined in green, and matching kana stays plain. A dot represents a missing or extra character in that display. Notes explain the result; a furigana-assisted attempt includes an explicit hint note.

Feedback has `role="status"`, `aria-live="polite"`, and a programmatic focus target. When the form changes to feedback, focus moves to that feedback container. The next keyboard Tab reaches the full-width Next place button; after choosing the next place, focus returns to the new reading input. The Next button is disabled when no candidate exists. It chooses an eligible place of the same kind, prioritizing Review, then New, then Learning, and distance within that priority.

### Settings

The settings sheet is titled Your practice and uses the same paper material and close control. Native selects provide Map furigana (Never/Always) and Preferred input (Romaji/Kana). Checkboxes control required long vowels and suffixes, with help text below each label. Selects have a 44px minimum height, 175px maximum width, and the same field surface, border, and radius as the reading input. Checkboxes are 20px squares with the green native accent. Changes persist immediately; the sheet says that settings and progress stay in this browser.

### Shared control behavior

General buttons have a 44px minimum height. Icon actions normally have a 44px minimum width; the phone toolbar settings action narrows to 36px. Map navigation controls are 42px wide, and footer actions use the footer height. Disabled buttons reduce opacity to 0.5 and use the default cursor. Keyboard focus on buttons, links, inputs, and selects uses a 3px Focus Green outline with a 3px offset. The feedback container uses the same 3px Focus Green outline with a 6px offset and 3px corners on `:focus-visible`, giving the result text breathing room while preserving focus transfer. Source links remain underlined with a 4px offset.

The sheets are labeled sections rather than modal dialogs. No modal focus trap, backdrop, drag handle, or swipe gesture is implemented. Map loading uses a status notice; map, data, and storage errors use an alert. The places index has a plain-text empty state.

### Motion

Place selection uses an 850ms map flight, reduced to zero for reduced motion. Its destination zoom depends on the selected kind, and offsets are `[-60, 0]` on desktop and `[0, -100]` on phones. The input's viewport-resize scroll is immediate. Reduced-motion CSS forces automatic scrolling. Ordinary hover, sheet opening, and feedback replacement have no decorative transitions.

## Do's and Don'ts

### Do:

- **Do** keep map names stronger than boundaries and pale geographic fields.
- **Do** retain semantic Japanese ruby and the accessible places index alongside canvas labels.
- **Do** pair progress colors with the established shapes and readable status names.
- **Do** keep the question, answer feedback, and Next action within the same paper sheet.
- **Do** move focus to feedback after an answer, then let Tab reach Next and return to the input for the next place.
- **Do** preserve the current attempt during the Places detour and keep the input reachable as the visible viewport changes.
- **Do** use the existing thin rules, restrained radius scale, and single ambient shadow.

### Don't:

- **Don't** treat canvas labels or colored marks as replacements for the DOM places list and text legend.
- **Don't** shrink primary questions, answer input, or feedback to the compact provenance/footer scale.
- **Don't** expose the canonical reading in an unanswered card when furigana hints are hidden.
- **Don't** add nested feedback cards or decorative motion that obscures the map or the next action.
- **Don't** describe a saved progress state as a completed answer for the currently open card; the card's input/feedback state is separate.
