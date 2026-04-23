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
  lib/            # api.ts (axios instance), gpx.ts, exif.ts
  routes/         # TanStack Router — __root.tsx, _authenticated.tsx, index.tsx, login.tsx, register.tsx
  pages/          # LoginPage, RegisterPage, HomePage
  store/          # auth.ts (Zustand)
  types/          # index.ts (Trip, JournalDay, Photo, GearItem, Loadout), auth.ts
  components/
  hooks/
```

### Backend
```
server/
  src/
    models/       # Trip.ts, Loadout.ts, GearItem.ts (Mongoose schemas)
    routes/       # trips.ts, loadouts.ts, gearItems.ts (CRUD)
    index.ts      # Express app, MongoDB connect
  .env            # PORT=8000, MONGODB_URI=mongodb://localhost:27017/ridgeline
```

### API Endpoints
| Method         | Path                              | Description                                                        |
|----------------|-----------------------------------|--------------------------------------------------------------------|
| GET/POST       | `/api/trips`                      | List / create trips                                                |
| GET/PUT/DELETE | `/api/trips/:id`                  | Read / update / delete trip (populates loadout). PUT accepts `gpxPlanned` (GeoJSON LineString, persisted via `doc.set()` + `markModified`) and `gpxTracks` (array of `{ id, label, track }` entries, persisted via raw `collection.updateOne` + `$set` to bypass Mongoose casting of nested GeoJSON `type` keys). |
| GET/POST       | `/api/journal-days?tripId=`       | List entries for a trip (sorted by dayNumber) / create entry       |
| PUT/DELETE     | `/api/journal-days/:id`           | Update / delete a journal entry                                    |
| GET/POST       | `/api/loadouts`                   | List / create loadouts (populates items)                           |
| GET/PUT/DELETE | `/api/loadouts/:id`               | Read / update / delete loadout                                     |
| GET/POST       | `/api/gear-items`                 | List / create gear items                                           |
| GET/PUT/DELETE | `/api/gear-items/:id`             | Read / update / delete gear item                                   |


### Todo
1. **DONE** Auth — JWT login/register, persisted token in Zustand, axios interceptor that attaches it to every request. Nothing else works without this.
2. **DONE** MongoDB + Express API — Set up your backend first with the three core collections: trips, loadouts, gearItems. Get basic CRUD endpoints working before touching the frontend data layer.
3. **DONE** Trip CRUD — The sidebar trip list, the 2create/edit modal, and delete confirm. This is your first full end-to-end feature and will validate your API, Tanstack Query setup, and Zustand integration all at once.
4. **DONE** Journal entries — Day selector, the conditions template form, and the narrative field. Use react-hook-form + zod for the template — it maps perfectly to the structured condition fields.
5. **DONE** GPX import + map — Parse the GPX file on upload (the gpx.ts util), store the track as a GeoJSON LineString in MongoDB, render it with Mapbox GL JS or Leaflet. This is your most technically interesting piece so save it until the foundation is solid.
6. **DONE** Upgrade `gpxTrack` (single) to `gpxTracks` (array) so a multi-day trip can store one GPS track per day. Schema: `[Schema.Types.Mixed]` array of `{ id, label, track }` entries. UI: GPS Tracks panel with per-entry color-coded rows (8-color palette, cycles), per-entry kabob (replace/remove), "+ Add" button that appends a new day entry. Map renders each track in its assigned color; legend shows all visible tracks.
7. Photo upload + EXIF — Use the exif-js or exifr library to parse EXIF in the browser before uploading. Extract GPS coordinates, camera settings, and timestamp client-side, store them alongside the photo reference in MongoDB.
8. Gear loadouts — Straightforward CRUD once the pattern is established from trips. Weight calculations are pure frontend math in Zustand.
9. **DONE** Put Planned Routes and Tracks inside the same box, stacked on top of each other. When multiple Tracks are added it gets out of balance and doesn't look right.
10. **DONE** Break Temperature into distinct Low and High input fields, add another column to the journal section to accommodate it and adjust the data model on the backend to support it. Ensure save is done onFocusChange same as the other fields.
11. Add WILDLIFE, COMPANIONS panels to Journal
12. Add "FIELD NOTES" label on Horizontal rule above the description section. 
13. Add hover text for each day button that says the title of the entry if it exists, or some prompt for TODO if it doesn't.
14. **DONE** Instead of having all of this as a single column layout for the trip, adjust it to be three columns like in inspiration/ridgeline-fixed_1.html with the Trip Log being in column 1, the Journal entry to be in column 2 and the Route Map, elevation profile, and Loadout in a fixed drawer column on the right side of the page. Adjust the trip summary stats to be in a header more like the header for a trip in the inspiration/ridgeline-fixed_1.html file
15. Share / Export PDF — The Share button in the trip hero opens a dialog with two options:
    - **Copy link** — copies the current page URL to clipboard (implemented, shows a "Copied" confirmation).
    - **Export as PDF** — generates a styled PDF trip report matching the app's visual design. TODO: implement using a headless print stylesheet or a library like `@react-pdf/renderer`. The PDF should include: trip hero (title, location, dates, stats), journal entries (each day with conditions grid and narrative), GPX map screenshot or SVG export, gear loadout weight summary, and photos with EXIF metadata. Style it to match the dark amber/mono aesthetic of the app.
16. Waypoints — right-pane summary list of named points of interest on a trip. Two types:
    - **Campsites** — name, night number, coordinates. Clicking navigates to the Map tab and highlights the campsite pin on the trip map.
    - **Photo spots** — name, coordinates, optional link to a specific photo. Clicking navigates to either the Map tab (to show the location) or the Photos tab (to open the associated photo). Consider a toggle or dual-action affordance for spots that have both a GPS pin and a linked photo.
    - TODO: data model — add a `waypoints` array to the Trip schema: `[{ id, type ('campsite'|'photo-spot'), label, lat, lon, nightNumber? (campsite), photoId? (photo-spot) }]`
    - TODO: map integration — render campsites as amber tent pins and photo spots as sky-blue camera pins on the trip map, matching the legend style from inspiration/ridgeline-fixed_1.html
    - TODO: right-pane list — compact rows grouped by type, each row shows color-coded dot + label + small coordinate chip; clicking routes to the appropriate tab
17. Add summary stats to the Hero banner stats for total Weight Carried, and Max Elevation. These should be included as manual entries when the trip is created. 

##### Todo Sidebar nav — planned page contents
- **Map** (`/map`) — Global map showing all GPX tracks and planned routes across every trip. Clicking a track opens the associated trip or plan detail.
- **Photos** (`/photos`) — Collage/grid of all photos across all trips, with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata.
- **Gear** (`/gear`) — Categorized lists of the user's gear inventory. Eventually links to loadouts attached to trips and supports weight calculations.

### Notes
- GET /api/loadouts/:id — automatically populates the full GearItem documents so the frontend doesn't need a second request
- GET /api/trips/:id — populates the full Loadout (but not the loadout's items — you'd need a second populate for that; we can address it when you hook up the frontend)
- Auth middleware isn't wired in yet — that's the next natural step once you connect the frontend data layer
- Find out if OnX Backcountry offer any integrations for personal app projects to import data and items from them, brainstorm ideas to integrate this app into theirs


