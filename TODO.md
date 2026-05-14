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

## Trips + Plan Wizard unification

Every trip in Ridgeline starts as a plan. The Plan Wizard IS how trips are created. The "Trip Log" becomes "Trips" — a unified list of everything from active plans through completed expeditions, each with a status chip. This work retires the old New Trip dialog and tightly couples the Plan model to the Trip model so journals, gear, and the wizard all share one record.

### Phase 1 — Quick wins (rename + status field)

1. **Rename "Trip Log" → "Trips"** — update the `NavLink` title in `IconRail.tsx` (line ~68), the page heading in `HomePage.tsx`, and any copy in `TripSidebar.tsx` and `TripDetail.tsx`.

2. **Add `status` to the Trip model** — `server/src/models/Trip.ts`:
   ```
   status: { type: String, enum: ['planning','ready','on-trail','wrap-up','complete'], default: 'complete' }
   ```
   Use `'complete'` as the default so all existing trips (created via the old dialog) get a sensible status without a migration. The enum names map to display labels:
   | Value | Display label | When |
   |-------|--------------|------|
   | `planning` | Planning | Wizard is in progress |
   | `ready` | Ready to Go | Plan locked, departure upcoming |
   | `on-trail` | On Trail | Trip actively happening |
   | `wrap-up` | Wrap Up | Trip ended, journal incomplete |
   | `complete` | Complete | Fully done |

3. **Surface status chips in the Trips list** — `TripSidebar.tsx` / `HomePage.tsx`: show a small tone-coded chip next to each trip card. Use the same Pill atom from `src/components/plan/Pill.tsx`. Tones: `planning` → amber, `ready` → sky, `on-trail` → pine, `wrap-up` → amber, `complete` → neutral.

4. **Add status to the filter popover** — `TripSidebar.tsx` already has ownership/miles/date filters. Add a "Status" multi-select filter group.

### Phase 2 — Data model unification (Plan → Trip)

Currently `Plan` and `Trip` are separate MongoDB models with no link. The goal is to make the wizard create and edit a Trip directly, retiring the standalone Plan model.

**Approach**: Extend `Trip` with the wizard's stage data and link the wizard to Trip instead of Plan.

1. **Add `planStages` (Mixed) and `planMeta` to Trip model** — mirror the `stages` and `meta` fields from `Plan.ts`. The Trip's own `title`, `location`, `startDate`, `endDate` serve as the canonical trip identity and eventually supersede `planMeta`.

2. **Migrate `/api/plans` → use Trip** — when the Plan Wizard creates a "plan", it should `POST /api/trips` with `status: 'planning'` and `planStages: {}`. Update `src/lib/plans.ts` and `src/hooks/usePlans.ts` to target `/api/trips` filtered by status. The `PlanRecord` type can be replaced by the existing `Trip` type extended with `planStages`.
   - Alternatively (lower risk): add a `tripId` foreign key to `Plan` and keep both models temporarily, then merge in a follow-up. Choose whichever feels safer at implementation time.

3. **Journal attachment stays on Trip** — `JournalDay.tripId` already references the Trip `_id`. No change needed here; when a planning trip transitions to "on-trail" the journal just starts populating against the same record.

4. **Remove the Plan model** (after migration is verified) — delete `server/src/models/Plan.ts` and `server/src/routes/plans.ts`, remove from `index.ts`, archive `src/lib/plans.ts` and `src/hooks/usePlans.ts` or absorb into trips equivalents.

### Phase 3 — New Trip flow

1. **"New Trip" button → opens Plan Wizard** — in `HomePage.tsx`, replace the `TripModal` open handler with `navigate({ to: '/plan' })` (which auto-creates a planning trip via `PlanPage`). The `?id=` search param will carry the new trip's ID.

2. **Remove `TripModal.tsx`** — the dialog that collects title/location/dates is no longer the entry point. Delete `src/components/trip/TripModal.tsx` and remove its import and usage from `HomePage.tsx`. The wizard's Stage 1 (Route) and trip metadata collected during planning replace this.

3. **Trip metadata entry in the wizard** — the trip title, location, and date range currently live in `PlanMeta` (`PlanWizard`'s EMPTY_META). Wire the StageRail header (title + dates) to be editable inline or via a small "Edit trip details" dialog that writes back to `savedPlan.meta` → autosaves. This replaces what the old New Trip dialog collected.

4. **Re-entry behavior** — when a user opens a trip from the Trips list:
   - `planning` or `ready` → open the Plan Wizard at `/plan?id=<tripId>`
   - `on-trail` or `wrap-up` → open the Trip Detail / Journal view
   - `complete` → open Trip Detail in read-only mode
   - Implement in `TripDetail.tsx` or as a routing redirect in `HomePage.tsx` click handler.

### Phase 4 — Clear pre-filled demo data

Remove all Sierra High Route mock data from wizard stages so new plans start blank.

- `RouteStage.tsx` — `SEGMENTS = []`, `SOURCE_FILES = []`, `PARTNERS = []` (already blank for `plan !== undefined`, but confirm)
- `DaysStage.tsx` — `DAYS = []` already triggers empty state; verify the empty-state UI message is correct
- `PermitsStage.tsx` — `INITIAL_PERMITS = []`, `INITIAL_SUGGESTIONS = []`
- `FoodStage.tsx` — `MEAL_PLAN = []` (already blank for `plan !== undefined`)
- `GearStage.tsx` — `DEFAULT_CATEGORIES = []` (already blank for `plan !== undefined`)
- `DepartStage.tsx` — `DEFAULT_REMINDERS = []`, `DEFAULT_CONTACTS = []`, `DEFAULT_MAP_LAYERS = []`, `DEFAULT_CHECKLIST = []`

For each stage, the `plan !== undefined ? [] : MOCK_DATA` guard is already in place. The fix is to pass `plan` consistently from PlanWizard (which already does) and ensure the mock constants serve only as dev-mode fallbacks. Once Phase 2 is complete and the wizard always runs with a real Trip, these constants will never be used in production.

Add empty-state prompts to stages that would otherwise show a blank card with no guidance (PermitsStage suggestions pane already handles this; FoodStage meal grid and GearStage category list need "Add your first…" prompts similar to DaysStage's empty state).

### Phase 5 — Status lifecycle UI

1. **Status transitions** — add a "Mark as…" control in the trip header (visible to the owner):
   - `planning` → "Mark ready" → sets `ready`
   - `ready` → "Start trip" → sets `on-trail`
   - `on-trail` → "Finish trip" → sets `wrap-up`
   - `wrap-up` → "Complete" → sets `complete` (require at least one journal entry)
   - Any status → "Back to planning" escape hatch (confirm dialog)

2. **PUT `/api/trips/:id`** already accepts arbitrary body fields — just add `status` to the update payload. No new endpoint needed.

3. **Trips list ordering** — sort by status urgency then by date: `on-trail` and `wrap-up` first, then `planning`/`ready` by departure date, then `complete` by end date descending.

### Phase 6 — Stage 7: Journal

The existing Journal (currently a separate tab/view) becomes **Stage 7 — Journal** in the wizard, sitting after Depart in the stage rail. It is locked during `planning`, `ready`, and `on-trail` statuses and unlocks automatically when the trip transitions to `wrap-up`.

**Locking behaviour**
- Stages 1–6 (Route through Depart): fully editable during `planning` / `ready`; frozen (read-only, "view only" banner) once the trip reaches `on-trail` to preserve the plan as a record.
- Stage 7 — Journal: locked with a hold banner during `planning` / `ready`. Unlocks at `on-trail` so users can journal while the trip is actively happening. The lock is hard (not informational) — the stage renders the hold banner only until the trip starts.

**What the Journal stage contains**
- Reuse the existing `JournalSection.tsx` / `DaySelector.tsx` components that are already built.
- One day panel per trip day (keyed to the Days stage itinerary). Each panel has: conditions grid (temp hi/lo, weather, mileage), narrative text area, photo attachments, wildlife and companions fields.
- Right rail: days completed count, "Trip report needed" reminder if approaching `complete` transition, photo count.

**Engineering notes**
- Add `'journal'` to the `StageId` union in `plan/types.ts` and a `JournalStage` entry to `STAGE_COMPONENTS` in `PlanWizard.tsx`.
- The stage body wraps `JournalSection` with a locked-banner guard that checks `trip.status`. No new API endpoints — journal days already persist via `POST/PUT /api/journal-days`.
- The Journal stage does not call `onChange` (journal data lives in its own collection keyed by `tripId`, not in `trip.planStages`).
- Transition from `wrap-up` → `complete` can be gated: require at least one journal entry (or all days covered) before the "Complete" control is enabled.

---

## Pages (sidebar nav)

### Plan a Trip — seven-stage wizard

Design handoff: `inspiration/design_handoff_plan_a_trip/`. Reference the prototype at `prototypes/Plan a Trip.html` (open in browser, keep on V3). Port only: `ridgeline-tokens.css`, `prototype.css`, `rdgln-shared.jsx`, `v3-stages.jsx`, `permits-flow.jsx`. Ignore: `app.jsx`, `design-canvas.jsx`, `v1-brief.jsx`, `v2-spine.jsx`.

Flow: plan → execution → journal (Stage 7, unlocks at wrap-up) → complete.

#### Layout shell
Three-column layout (desktop-first, 1200–1400px target):
- **Left rail** (~220px): stage list with status dots — `done` pine, `active` amber, `pending` amber, `locked` muted. Active stage gets amber accent bar.
- **Hero band**: route name, dates, party size, "30% planned" pill — always visible across all stages.
- **Main column**: stage body (varies per stage).
- **Right rail** (~320px): per-stage checklist, progress bar, helper sidecar.

Stage status model: `done` / `active` / `pending` / `locked`. Drive from per-stage checklist completion + dependency graph (`gear` locks until `permits.resolved === true`).

**Stage freeze** — Stages 1–6 become read-only once the trip transitions to `on-trail`. The stage rail still shows them and lets users navigate in, but a "View only — trip in progress" banner replaces any editable controls. Stage 7 (Journal) unlocks at `on-trail` so entries can be written mid-trip; it shows a "Trip hasn't started yet" hold banner only during `planning` and `ready`.

**JumpChips** — amber pill links that navigate between stages without losing scroll position. Use them to surface data dependencies inline (e.g. "Pulled from Days · 8 days" in Food).

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

**Free-form add — AI-assisted permit fill:**
The "Free-form" button in the Add section opens a two-step dialog:
1. **Step 1 — Type**: pick permit type from a 9-option grid (lottery, reservation, walk-up, self-issue, zone-nights, hut, parking, fishing, vehicle).
2. **Step 2 — Details**: fill in name, agency/issuer, and notes manually.

Future: wire step 2 to Claude API. When the user types a permit name, call Claude to look up key dates, agency info, confirmation steps, and booking links, then show a diff for the user to accept/edit before adding. The user must always be able to fill in all fields themselves — AI is an accelerator, not a gate. Implemented in `server/src/routes/` (new endpoint) + `src/lib/permits.ts`.

**Engineering notes:**
- `view` state lifted to `PermitsStage`; both child views accept the same permit/suggestion lists and emit `onAccept`, `onReject`, `onViewMap`, `onJump`.
- Per-row "View on map" opens a **modal** (`MapModal`) centered on the permit's zone — does not trigger the full section toggle.
- "Mark as permit-free" sets local `permitFree` state → right-rail checklist shows 5/5 + pine progress bar. Reversible via ✕ button.

#### Stage 4 — Food
- Daily targets card: kcal/day, protein/day, water/day, pack-out/day + JumpChip to Days.
- Meal plan grid: click-to-edit inline cells per meal column; kcal column is a manually-overridable computed total, color-coded (pine ≥ 3800, mid ≥ 3000, amber below); "Lock meals" button drives the "Trail meals locked" checklist item.
- Resupply card: pickup details + action buttons; "Mark shipped" drives the "Resupply confirmed" checklist item.
- Water plan + Bear canister cards side by side: water-source interactive toggles; bear canister click-to-select list (BV450/475/500, Ursack Major/AllMitey, Counter Assault Bear Keg, custom entry).
- Right rail: checklist progress (6 items), totals (kcal computed from meal state / weight / protein / water), heads-up callout.

**Future — AI food features (Claude API):**
Wire Claude API to: (1) autopopulate per-day kcal from food selections entered in the meal grid; (2) recommend foods for each meal slot based on expected calorie needs (computed from Days stage: mileage, elevation gain, tough-day flags). User can always fill or override manually — AI is an accelerator, not a gate. Endpoint: `POST /api/plan/food-suggest`.

**Future — bear canister ↔ permits cross-reference:**
Cross-reference the selected bear canister type against permit requirements pulled from the Permits stage. Hard-sided containers (BV series, Counter Assault Bear Keg) are required at SEKI and some NPS wilderness areas; soft-sided (Ursack Major, Ursack AllMitey) are approved at some but not others. Flag mismatches in the Permits stage with an amber warning inline on the affected permit card.

**Future — bear canister rental info:**
bear canister choice should be linked to YOUR GEAR. You should also be able to select if you're renting one for a single trip - common for some locations. The renting should be on the Permits page I think along with info for where you're picking it up and returning it. Include that info in the Depart stage too.

**Future - bear canister regulating agencies:**
Bear canisters are approved by various different agencies for use in Grizzly country and elsewhere. Include that info in the app since it's important to know which are approved for what location. Inter Agency Grizzly Bear Committee is one I think.

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
- **Auto-populate**: accepts `plan?: PlanData` (same pattern as all prior stages). Seed reminders from `plan?.depart?.reminders`, contacts from `plan?.depart?.contacts`, map layers from `plan?.depart?.mapLayers`. Add `DepartData` to the `PlanData` interface in `plan/types.ts` when building this stage. The `PlanWizard` `plan` prop threads through automatically — no wizard changes needed.

#### Stage completeness — known gaps

All six stages render fully with internal state. The gaps below are UI stubs, disconnected wiring, or hardcoded values that need real data before the wizard is production-ready.

**All stages**
- ⚠ `Stage.done / Stage.total` in `createStages()` are static — `PlanOverview` ring progress never updates regardless of what the user does in any stage. The per-stage right-rail checklists drive local `doneCount` but that value is never written back to the wizard shell.
- ✅ ~~`MOCK_TRIP` hardcoded~~ — `StageHeader` and `StageRail` now read from `savedPlan.meta` (loaded from API).
- ✅ ~~No plan persistence~~ — Plans persist to MongoDB via `/api/plans`; autosave on every stage change.

**Stage 1 — Route**
- ⚠ "Edit" button on the map card and "Split segment" on the table are stubs — no edit flow exists.
- ⚠ Right-rail checklist is hard-wired to 6/6 done; it doesn't reflect whether the user has actually filled anything in.
- ⚠ Source files list is mock display only — no GPX/KML upload or parsing is wired.

**Stage 2 — Days**
- ⚠ Time fields (Wake / On-trail / Camp by) use `defaultValue` — edits are not captured in state and will not persist.
- ⚠ Right-rail checklist is hard-wired to 8/8 done.
- ⚠ Exposure rating chips have no tooltip or popover explaining what Low / Med / High / Extreme mean (see Ideas section).
- ⚠ Forecast card is fully hardcoded (72° / 38°, Aug 15, "Clear · light NW wind") — no weather API wired.

**Stage 3 — Permits**
- ⚠ "Re-scan" button on the detection banner does nothing.
- ⚠ Party size "override" button on `PermitCard` renders but has no handler.
- ⚠ `partyConfirmed` state is tracked but no UI renders for it once confirmed.

**Stage 4 — Food**
- ⚠ "Bulk edit" button is a stub — no dialog.
- ⚠ "Generate label" and "Swap location" buttons on `ResupplyCard` are stubs.
- ⚠ "Add cache" button on `WaterPlanCard` is a stub.
- ⚠ Right-rail totals for food weight (14.2 lb), protein (864 g), and water (32 L) are hardcoded strings — not derived from meal state or targets.

**Stage 5 — Gear**
- ⚠ "Add item" button in each `CategoryCard` footer is a stub — no dialog or inline input.
- ⚠ Food weight (16.4 lb) and water weight (4.4 lb) in the right-rail stats are hardcoded — not pulled from Food stage state.
- ⚠ The "locked" state is purely visual and informational — the stage is always fully interactive. No actual dependency gate blocks editing.

**Stage 6 — Depart**
- ⚠ "+ Contact" button is a stub — no way to add or edit emergency contacts.
- ⚠ "Download" button for pending map layers fakes completion (sets `ok: true` in local state only — no real download).
- ⚠ "PDF" export button is a stub — no generation logic.
- ⚠ "Set" reminder toggle only updates local state — no calendar or notification system is called.
- ⚠ One-pager preview pulls day rows from `plan?.days` if provided, but party, entry/exit, and InReach fields are hardcoded strings in `OnePagerPreview`.

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
- FEATURE: Catalog of all gear in RIDGELINE across users, scrubbed of ownership but with info. De-dup alike entries. Verify stats like weight and such with AI. Augment stats on entry with AI (web crawl look up on manufacturer's website the data?)
- FEATURE: Users build loadouts of gear on a user-by-user basis. They pull from the system catalog, their choices. If they add gear not yet in RIDGELINE, add it to the system catalog with the aforementioned requirements for stats augmentation.
- FEATURE: Loadouts should be able to be selected for trips, as a user I should be able to build a three season backpacking loadout and a winter backpacking loadout.
- FEATURE: Loadouts should be able to be modified on a trip by trip basis - Note that this should be specific to the trip unless the user states they want to update their loadout with the outside-loadout-selections.
- FEATURE: Loadouts should be modifiable within the Plan Wizard menus as well as in the GEAR page. For the Plan Wizard menus, users should be able to add gear to specific trips and, when the gear selection is complete, asked if they would like to update the Loadout with their new additions or keep this as a trip specific setup.  

---

## Ideas / Research / Jot Down For Later
- Investigate OnX Backcountry integration options for personal app projects — import tracks, waypoints, or gear lists.
- Investigate Garmin API integration for users - could use Vo2 maybe as a metric to determine a user's ability to execute on a plan...

- Plan Wizard: Integrate the plan creation wizard flow with the "New Trip" button on the Trip Log page. When you start a plan it should be included in the list of trips. Each trip in the list should have a Status chip (e.g. In Planning, Completed, Ready to go, etc.). This will make it possible to plan over multiple days instead of having to do it in one session. It'll also allow you to update the status when a trip is completed, canceled, postponed or the like.
- Plan Wizard: After we've built out every stage of the wizard I'll need to make each stage blank and populate with info. That info can be manually entered or, as applicable, AI suggested via API./re
- Plan Wizard: Each table in the  needs a header for context - I don't know what "Low", "Medium", "High", and "Extreme" mean on the Days stage for instance. There should be hover popovers for the header or chips (you make the call based on UX best practices) probably that give the criteria explaining the rating.
- Plan Wizard: As applicable, include stylized and icon equipped ADD, EDIT, REMOVE buttons on wizard tables, possibly in combination with row selection if the UX makes sense and is desirable. Have them pop open dialogs instead of editing in the table itself - the table can be a truncated version of what's in the dialog. For the Food stage in particular I want to have more granularity in the fields I'm filling in than just Breakfast, Lunch and Dinner as line items. I also don't like that if I remove the content from a table cell, there's no way for me to get content back if it's lost focus.
- Plan Wizard: Include the Journaling workflow as a stage AFTER the "DEPART" stage and lock everything from the plans with the ability to selectively unlock in the event a user needs to make a change retroactively to a stage. We want to discourage this type of thing, but ultimately allow some retroactive adjustments for things like Gear which can change during a trip. 
- Plan Wizard: When I come back to a trip whether it's in the PLANNING status, READY/DEPARTED, COMPLETED, etc. (use your best judgment and add these if there's no notion yet), the trip on re-entry should default to either the PLAN or JOURNAL as applicable.
