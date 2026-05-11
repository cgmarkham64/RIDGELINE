# Ridgeline — TODO

## Tests

### Unit tests (Vitest)
- `src/lib/utils.ts`
  - `initials()` — empty string, undefined, single-word, multi-word
  - `extractApiError()` — typed API error, plain Error, null
- Sidebar filter predicates — date overlap logic, min/max range edge cases, ownership filtering
- `useDebounce` hook — value updates only after delay, cancels on rapid changes

### E2E tests (Playwright)
- Register → login → create trip → view trip
- Share trip → accept invite as second user → view shared trip
- Add journal entry → save → verify persistence
- Leave trip / delete trip

---

## Features

### Photo upload + EXIF
Use `exifr` to parse EXIF in the browser before uploading. Extract GPS coordinates, camera settings, and timestamp client-side. Store alongside the photo reference in MongoDB.

### Gear loadouts
CRUD gear inventory with categories. Weight calculations as pure frontend math in Zustand. Link loadouts to trips. The API routes (`/api/loadouts`, `/api/gear-items`) are already implemented — this is frontend work.

### Journal day hover text
Add a tooltip to each day button in DaySelector showing the entry title if one exists, or a prompt to write one if it doesn't.

### Trip hero stats — Weight Carried + Max Elevation
Add Weight Carried and Max Elevation as manual input fields when creating/editing a trip. Surface them in the hero stat strip. Future: derive Weight from the linked loadout and Max Elevation from the GPX track.

### PDF export
The Share dialog has a Copy Link option already. Add Export as PDF:
- Library: `@react-pdf/renderer` or a print stylesheet
- Content: trip hero (title, location, dates, stats), journal entries (each day with conditions grid + narrative), GPX map screenshot or SVG export, gear loadout weight summary, photos with EXIF metadata
- Style: match the dark amber/mono aesthetic of the app

### Email invite flow
Replace the current in-app notification invite with a signed email link:
1. Generate a `crypto.randomUUID()` token stored on the trip + expiry timestamp when the owner shares
2. Email the token to the invitee (Sendgrid or Resend)
3. Add `POST /api/trips/:id/accept?token=` — verify token + expiry, add caller to `sharedWith`, clear the token
4. Add `/accept-invite` frontend route — reads token from URL, calls endpoint, redirects to trip on success

### Real-time collaboration
Allow simultaneous and deconflicted/merged edits of a trip and its journal entries by multiple owners. Requires a conflict resolution strategy (last-write-wins, OT, or CRDTs).

---

## Pages (sidebar nav)

### Plan a Trip — six-stage wizard

Design handoff: `inspiration/design_handoff_plan_a_trip/`. Reference the prototype at `prototypes/Plan a Trip.html` (open in browser, keep on V3). Port only: `ridgeline-tokens.css`, `prototype.css`, `rdgln-shared.jsx`, `v3-stages.jsx`, `permits-flow.jsx`. Ignore: `app.jsx`, `design-canvas.jsx`, `v1-brief.jsx`, `v2-spine.jsx`.

Flow: plan → execution → post-trip journal (what's already built).

#### Layout shell
Three-column layout (desktop-first, 1200–1400px target):
- **Left rail** (~220px): stage list with status dots — `done` pine, `active` amber, `pending` amber, `locked` muted. Active stage gets amber accent bar.
- **Hero band**: route name, dates, party size, "30% planned" pill — always visible across all stages.
- **Main column**: stage body (varies per stage).
- **Right rail** (~320px): per-stage checklist, progress bar, helper sidecar.

Stage status model: `done` / `active` / `pending` / `locked`. Drive from per-stage checklist completion + dependency graph (`gear` locks until `permits.resolved === true`).

**JumpChips** — amber pill links that navigate between stages without losing scroll position. Use them to surface data dependencies inline (e.g. "Pulled from Days · 8 days" in Food).

#### Build order
1. **Tokens + shared atoms** — `ridgeline-tokens.css`, `prototype.css`, `Icon`, `Pill`, `Field`, `ProgressBar`, `Checkmark`, `JumpChip`. Load-bearing primitives first.
2. **Wizard shell** — left rail, hero band, right rail, stage routing. Stub the stage bodies.
3. **Stage 1 — Route** (simplest, all data no interaction — confirms layout works)
4. **Stage 2 — Days** (adds clickable-row + selected-day detail interaction)
5. **Stage 3 — Permits list view** (`PermitsListFirst` — primary path)
6. **Stage 3 — Permits map view** (`PermitsMapFirst` + section-header toggle)
7. **Stage 3 — per-row map modal** (focused zone preview from a card/suggestion row)
8. **Stage 4 — Food**
9. **Stage 5 — Gear** (hold banner + loadout preview with locked styling)
10. **Stage 6 — Depart**

#### Stage 1 — Route
- Hero card: locked route summary, planned-route map placeholder, 4 stat fields (Distance / Gain / Loss / Segments).
- Elevation profile card: SVG line chart over 9 points (trailheads + camps), min/max labels.
- Segments table: rows with name, miles, gain, class rating, notes; JumpChip to Days.
- Locked banner: edits recompute Days + Permits.
- Right rail: 100% progress, Partners list (avatar initials + pending/ready state), Source files (GPX/KML/MD).

#### Stage 2 — Days
- Header strip: 4 stat tiles (total miles, total gain, longest day, camp count).
- Day list: clickable rows with from→to, date, mileage, gain, exposure pill (low/med/high/extreme), tough flag.
- Selected-day detail card: waypoint timeline (wake, on-trail, pass, lunch, camp).
- Helper banner: JumpChip to Food for calorie load.
- Right rail: stage checklist, 10-day forecast preview.

#### Stage 3 — Permits *(focus of the handoff)*
Section header has a **List ⇄ Map** toggle (sticky per session). List is the default.

**List view** (`PermitsListFirst`):
- Trip profile chip: auto-detected profile (e.g. `sierra-high-route`) + date window.
- Suggested permits: `SuggestionRow` per permit — name, agency, type chip (lottery / first-come / walk-up), date window, confidence indicator. Actions: Add to trip, View on map (opens focused zone modal — does NOT switch whole pane to map view), Dismiss.
- Added permits: `PermitCard` per added permit — status (pending / lottery / confirmed), key dates, trailheads, View on map.
- Add permit manually button.

**Map view** (`PermitsMapFirst`):
- Full-pane map with permit zones as overlays. Tapping a zone or list item opens its detail card in a side panel.

**Engineering notes:**
- Lift `view` state to `PermitsStage`; both child components accept the same `profile` prop and emit `onAdd`, `onDismiss`, `onJump`.
- Per-row "View on map" opens a **modal** centered on the permit zone — does not trigger the full section toggle.

#### Stage 4 — Food
- Daily targets card: kcal/day, protein/day, water/day, pack-out/day + JumpChip to Days.
- Meal plan grid: rows × {Breakfast, Lunch, Dinner, Snacks, kcal} — kcal column color-coded (pine ≥ target, amber below).
- Resupply card: pickup details + action buttons.
- Water plan + Bear canister cards side by side: water-source checklist, 3-option canister picker with recommended state.
- Right rail: checklist progress, totals (kcal / weight / protein / water), heads-up callout.

#### Stage 5 — Gear *(blocked, but still interactive)*
- Hold banner: explains lock (depends on confirmed permits), shows unlock date. JumpChips: Check Permits, Confirm Food first, Skip ahead.
- Loadout preview: category cards (Shelter / Kitchen / Worn) with checked/unchecked items + per-category weight.
- Right rail: items owned count, base/food/water/total pack weights, unlock checklist, why-locked callout.
- Lock is informational — users can pre-fill and swap items while locked.

#### Stage 6 — Depart
- Reminders card: calendar reminders with date pill, description, Set button.
- Emergency contacts card: home base, SAR offices, Garmin IERCC — phone numbers, tone-coded avatars.
- Offline maps card: map layers (CalTopo / Gaia / NOAA / OnX) with size, status, Download button.
- Right rail: one-pager preview thumbnail (auto-generated from upstream stages) + PDF export button; Take-it-with-you checklist.

#### Open questions (design / backend)
- **Map provider**: prototype uses stylized SVG. Pick Mapbox / MapLibre / Leaflet; define zone-rendering style that works at both modal and full-pane sizes. (App already uses Leaflet — use that.)
- **Real permit data**: auto-suggestions use a static `TRIP_PROFILES` mock. Backend needs a service `{route, dates, party_size}` → ranked permit candidates with confidence scores. Consider Claude AI assist.
- **One-pager PDF**: prototype renders a static thumbnail. Production: server-side Puppeteer or a templating layer. (Relates to PDF export feature above.)
- **Mobile**: wizard shell needs a tabbed/drawer treatment under ~900px.
- **Save state**: stages are stateless in prototype. Need a persistence layer + autosave indicator.

### Global map (`/map`)
Display all GPX tracks and planned routes across every trip on a single map. Clicking a track opens the associated trip or plan detail.

### Photos (`/photos`)
Collage/grid of all photos across all trips with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata in a panel.

### Gear (`/gear`)
Categorized gear inventory management. Eventually links to loadouts attached to trips and supports weight calculations per trip.

---

## Ideas / Research

- Investigate OnX Backcountry integration options for personal app projects — import tracks, waypoints, or gear lists.