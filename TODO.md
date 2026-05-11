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

### Trip planning (`/plan` or integrated into trips)
Pre-trip planning workflow — compile everything before going out, then transition into the execution/journal flow.

Planning checklist items:
- Maps and route overview
- Permit info
- Number of days + itinerary
- Weather forecasts
- Local wildlife info
- Leave No Trace considerations
- Campsite planning: mileage/elevation per day, contingency sites
- Water availability by mile marker (drought conditions, flash flood risk)
- Fires permissible?
- Drones permissible?
- Nearest emergency services and how to contact them

AI assist: use Claude to help compile the above from a trailhead name or coordinates.

Flow: plan → execution → post-trip journal (what's already built).

### Global map (`/map`)
Display all GPX tracks and planned routes across every trip on a single map. Clicking a track opens the associated trip or plan detail.

### Photos (`/photos`)
Collage/grid of all photos across all trips with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata in a panel.

### Gear (`/gear`)
Categorized gear inventory management. Eventually links to loadouts attached to trips and supports weight calculations per trip.

---

## Ideas / Research

- Investigate OnX Backcountry integration options for personal app projects — import tracks, waypoints, or gear lists.