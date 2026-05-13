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
1. ✅ **Tokens + shared atoms** — `Pill`, `Ring`, `JumpChip`, `ProgressBar`, `CheckItem` in `src/components/plan/`. Design tokens already existed in `src/index.css`.
2. ✅ **Wizard shell** — `/plan` route, Plan icon in `IconRail`, left `StageRail`, shared `StageHeader`, `PlanOverview` (2×3 card grid + critical path), six stage stubs. `PlanWizard` manages view/stage state via `useState(createStages)`.
3. ✅ **Stage 1 — Route** — MapTopo SVG, ElevationProfile chart, segments table with JumpChip to Days, locked banner, right rail (checklist + partners + source files).
4. ✅ **Stage 2 — Days** — stat strip, clickable day list with exposure pills, selected-day detail (time inputs + waypoint timeline), helper banner with JumpChip to Food, right rail (checklist + forecast).
5. ✅ **Stage 3 — Permits** — list view + map view toggle + per-row map modal + free-form dialog + permit-free state
6. ✅ **Stage 4 — Food** — daily targets, click-to-edit meal grid with computed kcal, resupply card, water plan toggles, bear canister picker
7. **Stage 5 — Gear** (hold banner + loadout preview with locked styling) ← **next**
8. **Stage 6 — Depart**

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
