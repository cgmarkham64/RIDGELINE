# Ridgeline

An outdoor/hiking trip tracking app with a React frontend and Express/MongoDB backend.

## Tech Stack

### Frontend (`/src`)
- **Framework**: React 19 + TypeScript
- **Build**: Vite 8
- **Routing**: TanStack Router (code-based, auth guard via `_authenticated` layout route)
- **Data fetching**: TanStack Query + Axios
- **State**: Zustand (auth persisted to localStorage under key `ridgeline-auth`)
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS v4

### Backend (`/server`)
- **Runtime**: Node.js + Express 4
- **Database**: MongoDB 8 (local) via Mongoose
- **Language**: TypeScript compiled with tsx (dev) / tsc (prod)
- **API base**: `http://localhost:8000/api`

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Type-check + build
npm run lint     # Run ESLint
npm run preview  # Preview production build
npm run api:dev  # runs the API and dev
npm run dev:all  # runs concurrently which runs frontend and backend
npm run mongodb:start  # starts mongodb-community@8.0 via homebrew
npm run mongodb:stop   # stops mongodb-community@8.0 via homebrew
```

## Project Structure

### Frontend
```
src/
  lib/            # api.ts (axios instance), gpx.ts, exif.ts, journalDays.ts, trips.ts, mockAuth.ts
  routes/         # TanStack Router — __root.tsx, _authenticated.tsx, index.tsx, login.tsx, register.tsx,
                  #   map.tsx, photos.tsx, gear.tsx
  pages/          # LoginPage, RegisterPage, HomePage, MapPage, PhotosPage, GearPage
  store/          # auth.ts (Zustand)
  types/          # index.ts (Trip, JournalDay, Photo, GearItem, GearCategory, Loadout,
                  #            GpxTrack, GpxTrackEntry, Waypoint, WaypointType), auth.ts
  components/
    journal/      # DaySelector.tsx, JournalSection.tsx
    layout/       # IconRail.tsx
    map/          # MapTab.tsx, MapHelpers.tsx, MapEmptyState.tsx, WaypointIcon.tsx,
                  #   WaypointForm.tsx, WaypointChip.tsx, constants.ts
    trip/         # TripDetail.tsx, TripHero.tsx, TripSidebar.tsx, TripModal.tsx,
                  #   TripRightPanel.tsx, GpxMapSection.tsx, ShareDialog.tsx, DeleteConfirm.tsx
    ui/           # HikerOverlay.tsx, sayings.ts
  hooks/          # useTrips.ts, useJournalDays.ts
  router.tsx      # TanStack Router instance
```

### Backend
```
server/
  src/
    models/       # Trip.ts, Loadout.ts, GearItem.ts, JournalDay.ts (Mongoose schemas)
    routes/       # trips.ts, loadouts.ts, gearItems.ts, journalDays.ts, journalScan.ts (CRUD)
    index.ts      # Express app, MongoDB connect
  .env            # PORT=8000, MONGODB_URI=mongodb://localhost:27017/ridgeline, ANTHROPIC_API_KEY
```

### API Endpoints
| Method         | Path                        | Description                                                                                                                                                                                                                                                                                                       |
|----------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GET/POST       | `/api/trips`                | List / create trips                                                                                                                                                                                                                                                                                               |
| GET/PUT/DELETE | `/api/trips/:id`            | Read / update / delete trip (populates loadout). PUT accepts `gpxPlanned` (GeoJSON LineString, persisted via `doc.set()` + `markModified`) and `gpxTracks` (array of `{ id, label, track }` entries, persisted via raw `collection.updateOne` + `$set` to bypass Mongoose casting of nested GeoJSON `type` keys). |
| GET/POST       | `/api/journal-days?tripId=` | List entries for a trip (sorted by dayNumber) / create entry                                                                                                                                                                                                                                                      |
| PUT/DELETE     | `/api/journal-days/:id`     | Update / delete a journal entry                                                                                                                                                                                                                                                                                   |
| GET/POST       | `/api/loadouts`             | List / create loadouts (populates items)                                                                                                                                                                                                                                                                          |
| GET/PUT/DELETE | `/api/loadouts/:id`         | Read / update / delete loadout                                                                                                                                                                                                                                                                                    |
| GET/POST       | `/api/gear-items`           | List / create gear items                                                                                                                                                                                                                                                                                          |
| GET/PUT/DELETE | `/api/gear-items/:id`       | Read / update / delete gear item                                                                                                                                                                                                                                                                                  |
| POST           | `/api/journal-scan`         | AI-powered journal image scan — sends base64 image to Claude, returns structured JSON (title, body, milesCovered, elevationGainFt, tempLowF, tempHighF, weatherNotes)                                                                                                                                             |


### Todo

##### Done
1. **DONE** Three-column trip layout — Hero header with gradient, mountain silhouette, and stat pill strip. Trip Log sidebar (col 1), Journal center pane (col 2), persistent right panel (col 3) with Route Map, Elevation Profile, Waypoints, Weight Breakdown, and OSM/CARTO attribution. Tab row (Journal / Map / Photos / Gear) between hero and content.
2. **DONE** Auth — JWT login/register, persisted token in Zustand, axios interceptor that attaches it to every request. Nothing else works without this.
3. **DONE** MongoDB + Express API — Set up your backend first with the three core collections: trips, loadouts, gearItems. Get basic CRUD endpoints working before touching the frontend data layer.
4. **DONE** Trip CRUD — The sidebar trip list, the create/edit modal, and delete confirm. This is your first full end-to-end feature and will validate your API, Tanstack Query setup, and Zustand integration all at once.
5. **DONE** Journal entries — Day selector, the conditions template form, and the narrative field. Use react-hook-form + zod for the template — it maps perfectly to the structured condition fields.
6. **DONE** GPX import + map — Parse the GPX file on upload (the gpx.ts util), store the track as a GeoJSON LineString in MongoDB, render it with Mapbox GL JS or Leaflet. This is your most technically interesting piece so save it until the foundation is solid.
7. **DONE** Upgrade `gpxTrack` (single) to `gpxTracks` (array) so a multi-day trip can store one GPS track per day. Schema: `[Schema.Types.Mixed]` array of `{ id, label, track }` entries. UI: GPS Tracks panel with per-entry color-coded rows (8-color palette, cycles), per-entry kabob (replace/remove), "+ Add" button that appends a new day entry. Map renders each track in its assigned color; legend shows all visible tracks.
8. **DONE** Put Planned Routes and Tracks inside the same box, stacked on top of each other. When multiple Tracks are added it gets out of balance and doesn't look right.
9. **DONE** Break Temperature into distinct Low and High input fields, add another column to the journal section to accommodate it and adjust the data model on the backend to support it. Ensure save is done onFocusChange same as the other fields.
10. **DONE** Waypoints — click-to-place waypoints on the Map tab with 7 types (campsite, wildlife, viewpoint, no-water, some-water, lots-of-water, other). Each type has a custom SVG icon and color. Stored as a `waypoints` array on the Trip. Chip list sorted east→west, north→south. Clicking a map marker or chip opens the inline edit form; clicking again closes it. Custom Leaflet DivIcon markers with color-matched glow-pulse animation.

##### Up next
1. Photo upload + EXIF — Use the exif-js or exifr library to parse EXIF in the browser before uploading. Extract GPS coordinates, camera settings, and timestamp client-side, store them alongside the photo reference in MongoDB.
2. Gear loadouts — Straightforward CRUD once the pattern is established from trips. Weight calculations are pure frontend math in Zustand.
3. Add WILDLIFE, COMPANIONS panels to Journal.
4. Add "FIELD NOTES" label on horizontal rule above the description section.
5. Add hover text for each day button that says the title of the entry if it exists, or some prompt if it doesn't.
6. Share / Export PDF — The Share button in the trip hero opens a dialog with two options:
    - **Copy link** — copies the current page URL to clipboard (implemented, shows a "Copied" confirmation).
    - **Export as PDF** — generates a styled PDF trip report matching the app's visual design. TODO: implement using a headless print stylesheet or a library like `@react-pdf/renderer`. The PDF should include: trip hero (title, location, dates, stats), journal entries (each day with conditions grid and narrative), GPX map screenshot or SVG export, gear loadout weight summary, and photos with EXIF metadata. Style it to match the dark amber/mono aesthetic of the app.
7. Add summary stats to the Hero banner stats for total Weight Carried, and Max Elevation. These should be included as manual entries when the trip is created for now with a plan to link the fields to map and loadout data later.
8. Add search function to Trips list (by name OR state (acronym or long, CA or California))
9. Add filter function to Trips list (finite by state, distance, elevation gain, etc.)

##### Todo Sidebar nav — planned page contents
- **Map** (`/map`) — Global map showing all GPX tracks and planned routes across every trip. Clicking a track opens the associated trip or plan detail.
- **Photos** (`/photos`) — Collage/grid of all photos across all trips, with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata.
- **Gear** (`/gear`) — Categorized lists of the user's gear inventory. Eventually links to loadouts attached to trips and supports weight calculations.

### Notes
- GET /api/loadouts/:id — automatically populates the full GearItem documents so the frontend doesn't need a second request
- GET /api/trips/:id — populates the full Loadout (but not the loadout's items — you'd need a second populate for that; we can address it when you hook up the frontend)
- Auth middleware isn't wired in yet — that's the next natural step once you connect the frontend data layer
- Find out if OnX Backcountry offer any integrations for personal app projects to import data and items from them, brainstorm ideas to integrate this app into theirs


