# Plan a Trip — Design Handoff

This package is the spec for one screen of **Ridgeline**: the `Plan a Trip` flow. It is built around the **V3 — Stages Wizard** direction and the **list-first + auto-suggest** pattern for Permits, with **Map view as a supplemental affordance**.

Hand this folder to Claude Code (or another engineer) and start with this README.

---

## TL;DR — what to build

A six-stage wizard (`Route → Days → Permits → Food → Gear → Depart`) with:

- A persistent **left rail** showing all stages with progress indicators, and a **persistent right rail** with stage-scoped checklists.
- A **trip hero band** at the top that summarizes the trip and never changes between stages.
- A **Permits stage** that is primarily a list of permit cards with auto-suggestions, with a `List ⇄ Map` toggle in the section header and per-card "View on map" affordances for spatial context.
- **Cross-stage jump chips** — small clickable references to other stages (e.g. "pulled from Days") so users can navigate without losing context.
- A **locked/blocked state** for Gear that still shows a usable preview loadout.

The whole UI is responsive within a desktop-first layout (1200–1400px target).

---

## What's in this folder

```
design_handoff_plan_a_trip/
├── README.md              ← this file
└── prototypes/            ← reference HTML/JSX (DO NOT ship — use as design source)
    ├── Plan a Trip.html   ← entry point; loads everything below
    ├── ridgeline-tokens.css  ← design tokens (colors, type, spacing, radii)
    ├── prototype.css         ← base prototype styling
    ├── rdgln-shared.jsx      ← shared atoms (Icon, Pill, Field, ProgressBar, etc.)
    ├── v3-stages.jsx         ← THE primary reference — wizard shell + 6 stages
    ├── permits-flow.jsx      ← list-first + map-first Permits components
    ├── app.jsx               ← outer host (variant toggling, not needed in product)
    ├── design-canvas.jsx     ← exploration harness (IGNORE for production)
    ├── v1-brief.jsx          ← rejected variant (IGNORE)
    └── v2-spine.jsx          ← rejected variant (IGNORE)
```

**Files to port:** `ridgeline-tokens.css`, `prototype.css`, `rdgln-shared.jsx`, `v3-stages.jsx`, `permits-flow.jsx`.
**Files to ignore:** `app.jsx`, `design-canvas.jsx`, `v1-brief.jsx`, `v2-spine.jsx`. They are exploration scaffolding.

To preview locally, open `prototypes/Plan a Trip.html` in a browser.

---

## Tokens

All visual values come from `ridgeline-tokens.css`. Names worth knowing:

- **Type:** `--font-heading` (display/UI), `--font-body`, `--font-mono` (kickers, IDs, measurements)
- **Surfaces:** `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-surface-3`, `--color-border`, `--color-border-mid`
- **Accents:** `--color-amber` (primary action / in-progress), `--color-pine` (success / locked-complete), `--color-sky` (informational / travel), `--color-red` (emergency)
- Each accent has matching `*-dim` (tinted background) and `*-border` variants.

**Do not invent new colors.** All states are tonally derived from the four accent families.

---

## Layout shell (V3 — Stages Wizard)

```
┌────────────────────────────────────────────────────────────────┐
│  Top bar — Ridgeline · trip name · party · save state           │
├──────┬─────────────────────────────────────────┬───────────────┤
│      │                                         │               │
│ Left │  Trip Hero Band (always visible)        │  Right        │
│ Rail │  ────────────────────────────────────   │  Rail         │
│      │                                         │  (stage-      │
│ 6    │  Stage content (varies per stage)       │   scoped      │
│ stage│                                         │   checklist,  │
│ links│                                         │   sidecar     │
│      │                                         │   cards)      │
└──────┴─────────────────────────────────────────┴───────────────┘
```

- **Left rail** (~220px): stage list with status dots (`done` pine · `active` amber · `locked` muted). Active stage gets an amber accent bar.
- **Hero band**: route name, dates, party size, jump-to-summary, "30% planned" pill — same on every stage.
- **Main column**: stage body (varies — see each stage below).
- **Right rail** (~320px): per-stage checklist, progress bar, and helper sidecar.

See `<StagesShell>` in `v3-stages.jsx` for the canonical implementation.

---

## Stages — what each one contains

### 1. Route (`RouteStage`)
- **Hero card**: locked route summary + planned-route map placeholder + 4 stat fields (Distance / Gain / Loss / Segments).
- **Elevation profile card**: SVG line chart over 9 points spanning trailheads + camps; min/max labels.
- **Segments table**: 8 rows (`S1`–`S8`) with name, miles, gain, class rating, notes; cross-link chip to **Days**.
- **Locked banner**: explains that edits recompute Days + Permits.
- **Right rail**: 100% complete progress, Partners list (4 with avatar initials and pending/ready state), Source files (GPX/KML/MD).

### 2. Days (`DaysStage`)
- **Header strip**: 4 stat tiles (total miles, total gain, longest day, camp count).
- **Day list**: 8 clickable rows (`D1`–`D8`) with from→to, date, mileage, gain, exposure pill (low/med/high/extreme), and a `tough` flag.
- **Selected-day detail card**: expanded waypoint timeline (wake, on-trail, pass, lunch, camp) for the currently selected day.
- **Helper banner**: cross-links D4/D8 calorie load to **Food**.
- **Right rail**: stage checklist (100%), 10-day forecast preview.

### 3. Permits (`PermitsStage`) — **the focus of this handoff**

This is the merged design the user picked. The section header has a **List + suggest ⇄ Map view** toggle. List is the default.

#### List view (`PermitsListFirst` in `permits-flow.jsx`) — primary
- **Trip profile chip**: shows the auto-detected profile (e.g. `sierra-high-route`) and its date window.
- **Suggested permits** (stack of `SuggestionRow`):
  - Each row shows a recommended permit by name, agency, type chip (lottery / first-come / walk-up), date window, and a confidence indicator.
  - Primary action: **Add to trip**. Secondary actions: **View on map** (opens a focused map modal for that permit zone), **Dismiss**.
- **Added permits** (stack of `PermitCard`): each card shows status (pending / lottery / confirmed), key dates, trailheads, and a per-card **View on map** affordance.
- **Add permit manually** button at the bottom.

#### Map view (`PermitsMapFirst`)
- Same content, but the main column is a **full map** with permit zones drawn as overlays.
- Tapping a zone or list item opens its detail card in a side panel.
- Use this when the user explicitly asks for a spatial overview.

#### Why this merge
- **List-first** matches the dominant interaction (`Add this permit?` is a yes/no decision per row).
- **Map as supplement** preserves spatial reasoning (where does this zone *actually* sit relative to the route?) without burying the primary task.
- The **per-row "View on map"** modal is the right escape hatch for 80% of the cases; the **section-level toggle** covers the 20% where users genuinely want to scan the whole region at once.

#### Engineering notes for the merge
- Lift the `view` state to `PermitsStage` (already done in the prototype).
- Both child components accept the same `profile` prop and emit the same events (`onAdd`, `onDismiss`, `onJump`).
- The per-row "View on map" should open a **modal** centered on the permit's zone, not switch the whole pane to map view.
- Keep the toggle **sticky** if the user changes it — they probably want it for the whole session.

### 4. Food (`FoodStage`)
- **Daily targets card**: 4 fields (kcal/day, protein/day, water/day, pack-out/day) + cross-link to Days.
- **Meal plan grid**: 8 rows × {Breakfast, Lunch, Dinner, Snacks, kcal} — color-coded kcal column (pine ≥ target, amber below).
- **Resupply card**: Kearsarge Pass pickup details + action buttons.
- **Water plan + Bear canister cards** (side by side): water-source checklist with `+ Add cache`, and a 3-option canister picker (BV450 / BV475 / BV500) with recommended state.
- **Right rail**: 33% checklist, totals (kcal / weight / protein / water), heads-up callout.

### 5. Gear (`GearStage`) — **blocked, but useful**
- **Hold banner**: explains why Gear is locked (depends on confirmed permits) and shows when it unlocks (Mar 24).
- **Loadout preview**: three category cards (Shelter / Kitchen / Worn) with checked/unchecked items and per-category weight totals.
- **Action chips**: Check Permits, Confirm Food first, Skip ahead.
- **Right rail**: loadout summary (28 of 47 items owned), base/food/water/total D1 pack weights, unlock-on-Mar-24 checklist, why-locked callout.

The whole stage is interactive even while locked — users can pre-fill, swap items, and weigh things; the lock is informational about when the loadout becomes the source of truth.

### 6. Depart (`DepartStage`)
- **Reminders card**: 6 calendar reminders with date pill, description, and `SET` / `Set` button.
- **Emergency contacts card**: home base, two SAR offices, Garmin IERCC — each with a phone number and tone-coded avatar.
- **Offline maps card**: 4 map layers (CalTopo / Gaia / NOAA / OnX) with size, status icon, and Download button when pending.
- **Right rail**: One-pager preview (an 8.5×11 thumbnail rendered with mono text — auto-generated from upstream stages) with PDF export button; Take-it-with-you checklist (67%).

---

## Cross-stage navigation (Jump Chips)

Throughout the wizard, inline references to other stages render as `<JumpChip to="…" icon="…">…</JumpChip>` — small amber pills that navigate without losing scroll position. Use them liberally to make data dependencies visible:

- "Pulled from **Days** · 8 days" (Food, Permits)
- "Trailheads from **Route**" (Permits)
- "Edit dates in **Permits**" (Gear hold banner)
- "Auto-recompute when **Permits** resolves" (Gear right-rail)

The chip is also a teaching device — it shows the wizard's data flow at a glance.

---

## Stage status model

Every stage is in one of these states:

| State | Visual | Meaning |
|---|---|---|
| `done` | pine dot + check | All checklist items satisfied |
| `active` | amber bar + dot | The user's current stage |
| `pending` | amber dot | Has unfinished checklist items, but reachable |
| `locked` | muted dot + lock glyph | Waiting on an upstream dependency |

Drive these from the per-stage checklist completion + dependency graph (`gear` depends on `permits.resolved === true`).

---

## What to build first

Suggested order in Claude Code:

1. **Tokens + shared atoms** — `ridgeline-tokens.css`, `prototype.css`, `Icon`, `Pill`, `Field`, `ProgressBar`, `Checkmark`, `JumpChip`. These are the load-bearing primitives.
2. **Wizard shell** — left rail, hero band, right rail, stage routing. Just chrome; stub the bodies.
3. **Route** stage — the simplest "all data, no interaction" case. Confirms the layout works.
4. **Days** stage — adds clickable-row interaction and selected-day detail.
5. **Permits — list view** — `PermitsListFirst` first, since it's the primary path.
6. **Permits — map view** — `PermitsMapFirst`, plumb the section-header toggle.
7. **Permits — per-row map modal** — focused zone preview opened from a card or suggestion row.
8. **Food** — meal grid, resupply, water, bear-can.
9. **Gear** — hold banner + loadout preview (locked styling).
10. **Depart** — reminders, contacts, offline maps, one-pager preview.

Each stage is independent; you can ship them iteratively behind feature flags if needed.

---

## Open questions for the engineer (or back to design)

- **Map provider**: the prototype shows a stylized SVG canvas. Real implementation should pick a provider (Mapbox / MapLibre / Leaflet) and define a zone-rendering style that works at both modal and full-pane sizes.
- **Real permit data**: the auto-suggestions use a static `TRIP_PROFILES` mock. Backend needs a service that takes `{route, dates, party_size}` and returns ranked permit candidates with confidence.
- **One-pager PDF**: rendered as a static preview thumbnail in the prototype. Production should generate from the same data model (likely server-side via Puppeteer or a templating layer).
- **Mobile**: the prototype is desktop-first. The wizard shell will need a tabbed/drawer treatment under ~900px.
- **Save state**: stages are stateless in the prototype. Persistence layer + autosave indicator need to be designed.

---

## Open file in the prototype

Open `prototypes/Plan a Trip.html` in a browser. The toolbar in the top right lets you switch between V1 / V2 / V3 — keep it on **V3** for this handoff. Tweaks (toolbar toggle) exposes a few live knobs.
