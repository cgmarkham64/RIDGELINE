# Ridgeline — TODO

---

## Active Work

### Trips + Plan Wizard Unification

Every trip in Ridgeline starts as a plan. The Plan Wizard IS how trips are created. The "Trip Log" becomes "Trips" — a unified list of everything from active plans through completed expeditions, each with a status chip. This work retires the old New Trip dialog and tightly couples the Plan model to the Trip model so journals, gear, and the wizard all share one record.

**Phase 1 — Quick wins (rename + status field)**

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

**Phase 2 — Data model unification (Plan → Trip)**

Currently `Plan` and `Trip` are separate MongoDB models with no link. The goal is to make the wizard create and edit a Trip directly, retiring the standalone Plan model.

1. **Add `planStages` (Mixed) and `planMeta` to Trip model** — mirror the `stages` and `meta` fields from `Plan.ts`. The Trip's own `title`, `location`, `startDate`, `endDate` serve as the canonical trip identity and eventually supersede `planMeta`.

2. **Migrate `/api/plans` → use Trip** — when the Plan Wizard creates a "plan", it should `POST /api/trips` with `status: 'planning'` and `planStages: {}`. Update `src/lib/plans.ts` and `src/hooks/usePlans.ts` to target `/api/trips` filtered by status. The `PlanRecord` type can be replaced by the existing `Trip` type extended with `planStages`.
   - Alternatively (lower risk): add a `tripId` foreign key to `Plan` and keep both models temporarily, then merge in a follow-up. Choose whichever feels safer at implementation time.

3. **Journal attachment stays on Trip** — `JournalDay.tripId` already references the Trip `_id`. No change needed here; when a planning trip transitions to `on-trail` the journal starts populating against the same record.

4. **Remove the Plan model** (after migration is verified) — delete `server/src/models/Plan.ts` and `server/src/routes/plans.ts`, remove from `index.ts`, archive `src/lib/plans.ts` and `src/hooks/usePlans.ts` or absorb into trips equivalents.

**Phase 3 — New Trip flow**

1. **"New Trip" button → opens Plan Wizard** — in `HomePage.tsx`, replace the `TripModal` open handler with `navigate({ to: '/plan' })` (which auto-creates a planning trip via `PlanPage`). The `?id=` search param will carry the new trip's ID.

2. **Remove `TripModal.tsx`** — the dialog that collects title/location/dates is no longer the entry point. Delete `src/components/trip/TripModal.tsx` and remove its import and usage from `HomePage.tsx`. The wizard's Stage 1 (Route) and trip metadata collected during planning replace this.

3. **Trip metadata entry in the wizard** — the trip title, location, and date range currently live in `PlanMeta` (`PlanWizard`'s EMPTY_META). Wire the StageRail header (title + dates) to be editable inline or via a small "Edit trip details" dialog that writes back to `savedPlan.meta` → autosaves. This replaces what the old New Trip dialog collected.

4. **Re-entry behavior** — when a user opens a trip from the Trips list:
   - `planning` or `ready` → open the Plan Wizard at `/plan?id=<tripId>`
   - `on-trail` or `wrap-up` → open Stage 7 (Journal) directly
   - `complete` → open Trip Detail in read-only mode

**Phase 4 — Clear pre-filled demo data**

Remove all Sierra High Route mock data from wizard stages so new plans start blank.

- `RouteStage.tsx` — `SEGMENTS = []`, `SOURCE_FILES = []`, `PARTNERS = []` (already blank for `plan !== undefined`, but confirm)
- `DaysStage.tsx` — `DAYS = []` already triggers empty state; verify the empty-state UI message is correct
- `PermitsStage.tsx` — `INITIAL_PERMITS = []`, `INITIAL_SUGGESTIONS = []`
- `FoodStage.tsx` — `MEAL_PLAN = []` (already blank for `plan !== undefined`)
- `GearStage.tsx` — `DEFAULT_CATEGORIES = []` (already blank for `plan !== undefined`)
- `DepartStage.tsx` — `DEFAULT_REMINDERS = []`, `DEFAULT_CONTACTS = []`, `DEFAULT_MAP_LAYERS = []`, `DEFAULT_CHECKLIST = []`

For each stage, the `plan !== undefined ? [] : MOCK_DATA` guard is already in place. The fix is to pass `plan` consistently from PlanWizard (which already does) and ensure the mock constants serve only as dev-mode fallbacks. Once Phase 2 is complete and the wizard always runs with a real Trip, these constants will never be used in production.

Add empty-state prompts to stages that would otherwise show a blank card with no guidance (PermitsStage suggestions pane already handles this; FoodStage meal grid and GearStage category list need "Add your first…" prompts similar to DaysStage's empty state).

**Phase 5 — Status lifecycle UI**

1. **Status transitions** — add a "Mark as…" control in the trip header (visible to the owner):
   - `planning` → "Mark ready" → sets `ready`
   - `ready` → "Start trip" → sets `on-trail`
   - `on-trail` → "Finish trip" → sets `wrap-up`
   - `wrap-up` → "Complete" → sets `complete` (require at least one journal entry)
   - Any status → "Back to planning" escape hatch (confirm dialog). Selective per-stage retroactive unlock is a future refinement — start with all-or-nothing.

2. **PUT `/api/trips/:id`** already accepts arbitrary body fields — just add `status` to the update payload. No new endpoint needed.

3. **Trips list ordering** — sort by status urgency then by date: `on-trail` and `wrap-up` first, then `planning`/`ready` by departure date, then `complete` by end date descending.

**Phase 6 — Stage 7: Journal**

The existing Journal (currently a separate tab/view) becomes **Stage 7 — Journal** in the wizard, sitting after Depart in the stage rail.

- **Locking**: locked with a "Trip hasn't started yet" hold banner during `planning` and `ready`. Unlocks at `on-trail` so users can journal while the trip is actively happening. Stages 1–6 (Route through Depart) flip to read-only at `on-trail` with a "View only — trip in progress" banner to preserve the plan as a record.
- **Content**: reuse `JournalSection.tsx` / `DaySelector.tsx`. One day panel per trip day (keyed to the Days stage itinerary) with conditions grid, narrative, photo attachments, wildlife and companions. Right rail: days completed count, photo count, "Trip report needed" nudge near `complete` transition.
- **Engineering**: add `'journal'` to the `StageId` union in `plan/types.ts` and a `JournalStage` entry to `STAGE_COMPONENTS`. The stage body wraps `JournalSection` with a status guard. No new API endpoints — journal days already persist via `POST/PUT /api/journal-days`. This stage does not call `onChange` (journal data lives in its own collection, not in `planStages`).
- **Gating**: `wrap-up` → `complete` transition requires at least one journal entry before the "Complete" control is enabled.

---

### Wizard Stage Gaps

All seven stages render with internal state. The items below are UI stubs, disconnected wiring, or hardcoded values that need real data before the wizard is production-ready.

**All stages**
- ⚠ `Stage.done / Stage.total` in `createStages()` are static — `PlanOverview` ring progress never updates regardless of what the user does in any stage. The per-stage right-rail checklists drive local `doneCount` but that value is never written back to the wizard shell.

**Stage 1 — Route**
- ⚠ "Edit" and "Split segment" buttons are stubs — no edit flow.
- ⚠ Right-rail checklist is hard-wired to 6/6 done.
- ⚠ Source files list is mock display only — no GPX/KML upload or parsing.

**Stage 2 — Days**
- ⚠ Time fields (Wake / On-trail / Camp by) use `defaultValue` — edits are not captured in state.
- ⚠ Right-rail checklist is hard-wired to 8/8 done.
- ⚠ Exposure rating chips (Low / Med / High / Extreme) have no tooltip explaining the criteria. Add hover popovers to the column header or chips.
- ⚠ Forecast card is fully hardcoded — no weather API wired.

**Stage 3 — Permits**
- ⚠ "Re-scan" button on the detection banner does nothing.
- ⚠ Party size "override" button on `PermitCard` has no handler.
- ⚠ `partyConfirmed` state is tracked but no UI renders for it once confirmed.

**Stage 4 — Food**
- ⚠ "Bulk edit" button is a stub. Per-meal granularity (more fields than just Breakfast / Lunch / Dinner) and the ability to recover cleared cell content are also needed here.
- ⚠ "Generate label" and "Swap location" buttons on `ResupplyCard` are stubs.
- ⚠ "Add cache" button on `WaterPlanCard` is a stub.
- ⚠ Right-rail totals for food weight, protein, and water are hardcoded strings — not derived from meal state.

**Stage 5 — Gear**
- ⚠ "Add item" button in each `CategoryCard` footer is a stub — no dialog or inline input.
- ⚠ Food weight and water weight in the right-rail stats are hardcoded — not pulled from Food stage state.
- ⚠ The "locked" state is purely visual — the stage is always fully interactive. No actual dependency gate blocks editing.

**Stage 6 — Depart**
- ⚠ "+ Contact" button is a stub — no way to add or edit emergency contacts.
- ⚠ "Download" button for pending map layers fakes completion (local state only).
- ⚠ "PDF" export button is a stub.
- ⚠ "Set" reminder toggle updates local state only — no calendar or notification system is called.
- ⚠ One-pager preview party, entry/exit, and InReach fields are hardcoded strings — not pulled from plan data.

**Open questions**
- **Real permit data**: auto-suggestions use a static mock. Backend needs a service `{route, dates, party_size}` → ranked permit candidates with confidence scores. Consider Claude AI assist.
- **One-pager PDF**: production needs server-side Puppeteer or a templating layer.
- **Mobile**: wizard shell needs a tabbed/drawer treatment under ~900px.

---

## Planned Features

### Tests

**Unit tests (Vitest)**
- `src/lib/utils.ts` — `initials()` (empty string, undefined, single-word, multi-word), `extractApiError()` (typed API error, plain Error, null)
- Sidebar filter predicates — date overlap logic, min/max range edge cases, ownership filtering
- `useDebounce` hook — value updates only after delay, cancels on rapid changes

**E2E tests (Playwright)**
- Register → login → create trip → view trip
- Share trip → accept invite as second user → view shared trip
- Add journal entry → save → verify persistence
- Leave trip / delete trip

### Photo Upload + EXIF
Use `exifr` to parse EXIF in the browser before uploading. Extract GPS coordinates, camera settings, and timestamp client-side. Store alongside the photo reference in MongoDB.

### PDF Export (Trip Report)
Export as PDF from the Share dialog and from the Depart stage one-pager:
- Library: `@react-pdf/renderer` or a print stylesheet
- Content: trip hero (title, location, dates, stats), journal entries (each day with conditions grid + narrative), GPX map screenshot or SVG export, gear loadout weight summary, photos with EXIF metadata
- Style: match the dark amber/mono aesthetic of the app

### Email Invite Flow
Replace the current in-app notification invite with a signed email link:
1. Generate a `crypto.randomUUID()` token stored on the trip + expiry timestamp when the owner shares
2. Email the token to the invitee (Sendgrid or Resend)
3. Add `POST /api/trips/:id/accept?token=` — verify token + expiry, add caller to `sharedWith`, clear the token
4. Add `/accept-invite` frontend route — reads token from URL, calls endpoint, redirects to trip on success

### Real-time Collaboration
Allow simultaneous and deconflicted/merged edits of a trip and its journal entries by multiple owners. Requires a conflict resolution strategy (last-write-wins, OT, or CRDTs).

### Trip Hero Stats — Weight Carried + Max Elevation
Add Weight Carried and Max Elevation as manual input fields when creating/editing a trip. Surface them in the hero stat strip. Future: derive Weight from the linked loadout and Max Elevation from the GPX track.

### Journal Day Hover Text
Add a tooltip to each day button in DaySelector showing the entry title if one exists, or a prompt to write one if it doesn't.

### AI Features (Claude API)

**Permit fill** — wire the Free-form dialog Step 2 to Claude. When the user types a permit name, call Claude to look up key dates, agency info, confirmation steps, and booking links, then show a diff for the user to accept/edit before adding. User can always fill all fields manually — AI is an accelerator, not a gate. Endpoint: new route in `server/src/routes/` + `src/lib/permits.ts`.

**Food suggestions** — (1) autopopulate per-day kcal from food selections entered in the meal grid; (2) recommend foods for each meal slot based on expected calorie needs (mileage, elevation gain, tough-day flags from Days stage). Endpoint: `POST /api/plan/food-suggest`.

### Bear Canister Improvements
- **Permit cross-reference**: flag hard-sided vs soft-sided canister mismatches against permit requirements from the Permits stage (SEKI requires hard-sided; Ursack approved at some but not others). Show amber warning inline on the affected permit card.
- **Rental info**: allow selecting "renting for this trip" with pickup/return location. Surface in Permits stage and Depart checklist.
- **Regulatory agencies**: note which agency approves which canister for Grizzly country (Inter Agency Grizzly Bear Committee and others). Surface when selecting a canister.

---

## Pages (not yet built)

### Global Map (`/map`)
Display all GPX tracks and planned routes across every trip on a single map. Clicking a track opens the associated trip or plan detail. App already uses Leaflet — use that for zone and route rendering.

### Photos (`/photos`)
Collage/grid of all photos across all trips with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata in a panel.

### Gear (`/gear`)
Full gear inventory system:
- System catalog of all gear across Ridgeline users, de-duplicated and AI-augmented (verify weight/specs from manufacturer sites).
- Users build loadouts from the system catalog; gear not in the catalog gets added to it.
- Loadouts selectable per trip; modifiable on a trip-by-trip basis (ask user whether changes update the base loadout or stay trip-specific).
- Loadouts editable from both the `/gear` page and the Gear stage in the Plan Wizard.

---

## Ideas / Research

- Investigate OnX Backcountry integration options for personal app projects — import tracks, waypoints, or gear lists.
- Investigate Garmin API integration — Vo2 max as a metric to inform trip difficulty rating / user readiness.
- Plan Wizard tables: ADD / EDIT / REMOVE buttons with row selection where appropriate. Pop open dialogs rather than editing inline — the table is a truncated view of what's in the dialog.
- Selective retroactive stage unlock: allow users to unlock individual planning stages after `on-trail` for corrections (e.g., gear changes mid-trip). Discourage but don't block. Start with the all-or-nothing "Back to planning" escape hatch in Phase 5, then refine.

---

## Done

- **Plan Wizard shell** — `/plan` route, `StageRail`, `StageHeader`, `PlanOverview` (2×3 card grid + critical path), six stage stubs, `PlanWizard` managing view/stage state.
- **Shared atoms** — `Ring`, `Pill`, `JumpChip`, `ProgressBar`, `CheckItem` in `src/components/plan/`.
- **Shared icons** — `src/components/icons.tsx` consolidates all SVG icon functions app-wide; duplicate inline icons removed from stages, layout, journal, and map components.
- **Stage 1 — Route** — MapTopo SVG, ElevationProfile chart, segments table with JumpChip to Days, locked banner, right rail (checklist + partners + source files).
- **Stage 2 — Days** — stat strip, clickable day list with exposure pills, selected-day detail (time inputs + waypoint timeline), empty-state UI, helper banner with JumpChip to Food.
- **Stage 3 — Permits** — list view + map view toggle + per-row map modal + free-form two-step dialog + permit-free state + SVG zone map.
- **Stage 4 — Food** — daily targets, click-to-edit meal grid with ref-guarded blur (stale-closure fix), resupply card, water plan toggles, bear canister picker with custom entry.
- **Stage 5 — Gear** — hold banner, four interactive category cards (Shelter / Kitchen / Worn / Safety+Nav), live weight stats, unlock checklist.
- **Stage 6 — Depart** — reminders, emergency contacts, offline maps cards, one-pager preview (pulls day rows from plan data), take-it-with-you checklist.
- **Plan persistence** — `Plan` Mongoose model, `/api/plans` CRUD (GET list, POST, GET/:id, PUT/:id, DELETE/:id; ObjectId validation; owner-scoped). Frontend: `src/lib/plans.ts`, `src/hooks/usePlans.ts`. `PlanPage` auto-creates a plan on first visit and stores ID in `?id=` search param.
- **Autosave** — `StageBodyProps.onChange` callback; Permits, Food, Gear, Depart stages fire it on state changes (isMounted + onChangeRef pattern; StrictMode-safe cleanup). `PlanWizard` debounces 800 ms and PUTs to `/api/plans/:id`. `StageHeader` shows live saved / saving… / unsaved indicator.
- **Auto-populate** — `PlanData` type + per-stage slices in `plan/types.ts`. All stages accept `plan?: PlanData` and seed their `useState` initializers from it. `PlanWizard` passes the loaded plan down; new plans start blank.
- **`MOCK_TRIP` replaced** — `StageHeader` and `StageRail` read from `savedPlan.meta`; `EMPTY_META` is shown for new plans.