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
- **Styling**: Tailwind CSS v4 — always prefer Tailwind utility classes over inline `style={{}}` props or custom CSS. Use `hover:`, `focus:`, `group`/`group-hover:` pseudo-classes instead of JS event handlers for style changes. Only use inline styles for truly dynamic/computed values (e.g. colors from variables/props) or SVG-specific attributes.

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
  lib/            # api.ts (axios instance), auth.ts (login/register/avatar API calls),
                  #   gpx.ts, exif.ts, journalDays.ts, trips.ts
  routes/         # TanStack Router — __root.tsx, _authenticated.tsx, index.tsx, login.tsx, register.tsx,
                  #   map.tsx, photos.tsx, gear.tsx
  pages/          # LoginPage, RegisterPage, HomePage, MapPage, PhotosPage, GearPage
  store/          # auth.ts (Zustand — token, user {id, email, name, avatarUrl}, updateUser, clearAuth)
  types/          # index.ts (Trip, JournalDay, Photo, GearItem, GearCategory, Loadout,
                  #            GpxTrack, GpxTrackEntry, Waypoint, WaypointType), auth.ts (User, AuthResponse)
  components/
    journal/      # DaySelector.tsx, JournalSection.tsx
    layout/       # IconRail.tsx (nav rail + account avatar button + sign-out button),
                  #   AccountDialog.tsx (edit name, change password, upload/remove avatar)
    map/          # MapTab.tsx, MapHelpers.tsx, MapEmptyState.tsx, WaypointIcon.tsx,
                  #   WaypointForm.tsx, WaypointChip.tsx, constants.ts
    trip/         # TripDetail.tsx, TripHero.tsx, TripSidebar.tsx, TripModal.tsx,
                  #   TripRightPanel.tsx, ElevationProfile.tsx, GpxMapSection.tsx,
                  #   ShareDialog.tsx, DeleteConfirm.tsx
    ui/           # HikerOverlay.tsx, sayings.ts
  hooks/          # useTrips.ts (query key scoped by user sub), useJournalDays.ts (query key scoped by user sub)
  router.tsx      # TanStack Router instance
```

### Backend
```
server/
  src/
    middleware/   # auth.ts (requireAuth — extracts Bearer JWT, populates req.user.sub/email/name;
                  #           verifyToken() is isolated for easy Keycloak swap)
    models/       # User.ts (sub UUID, email, name, passwordHash, avatarUrl),
                  #   Trip.ts (+ ownerSub, sharedWith[]), Loadout.ts (+ ownerSub),
                  #   GearItem.ts (+ ownerSub), JournalDay.ts
    routes/       # auth.ts (register, login, GET/PUT /me, PUT/DELETE /me/avatar),
                  #   trips.ts, loadouts.ts, gearItems.ts, journalDays.ts, journalScan.ts
    index.ts      # Express app, MongoDB connect; /api/auth public, all other routes behind requireAuth
  .env            # PORT=8000, MONGODB_URI, ANTHROPIC_API_KEY, JWT_SECRET
```

### API Endpoints

**Auth (public)**
| Method     | Path                    | Description                                                                                  |
|------------|-------------------------|----------------------------------------------------------------------------------------------|
| POST       | `/api/auth/register`    | Create account — hashes password, stores User with UUID sub, returns signed 7-day JWT + user |
| POST       | `/api/auth/login`       | Verify credentials, return JWT + user (including `avatarUrl`)                                |
| GET        | `/api/auth/me`          | Return current user profile (requires JWT)                                                   |
| PUT        | `/api/auth/me`          | Update name and/or password (requires JWT); re-signs token when name changes                 |
| PUT        | `/api/auth/me/avatar`   | Upload avatar as base64 data URL (max 5 MB raw); stores on User doc (requires JWT)           |
| DELETE     | `/api/auth/me/avatar`   | Remove avatar from User doc (requires JWT)                                                   |

**Trips (all require JWT; scoped to ownerSub or sharedWith)**
| Method         | Path             | Description                                                                                                                                                                                                                                                                                                       |
|----------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GET/POST       | `/api/trips`     | List owned+shared trips / create trip (ownerSub set server-side)                                                                                                                                                                                                                                                  |
| GET/PUT/DELETE | `/api/trips/:id` | Read (owner or shared) / update (owner only) / delete (owner only). PUT accepts `gpxPlanned` (GeoJSON LineString, persisted via `doc.set()` + `markModified`) and `gpxTracks` (array of `{ id, label, track }` entries, persisted via raw `collection.updateOne` + `$set` to bypass Mongoose casting of nested GeoJSON `type` keys). |

**Journal days (all require JWT; read gated by trip access, writes owner-only)**
| Method         | Path                        | Description                                           |
|----------------|-----------------------------|-------------------------------------------------------|
| GET/POST       | `/api/journal-days?tripId=` | List entries for a trip / create entry                |
| PUT/DELETE     | `/api/journal-days/:id`     | Update / delete a journal entry                       |

**Loadouts & gear (all require JWT; scoped to ownerSub)**
| Method         | Path                  | Description                                    |
|----------------|-----------------------|------------------------------------------------|
| GET/POST       | `/api/loadouts`       | List / create loadouts (populates items)       |
| GET/PUT/DELETE | `/api/loadouts/:id`   | Read / update / delete loadout                 |
| GET/POST       | `/api/gear-items`     | List / create gear items                       |
| GET/PUT/DELETE | `/api/gear-items/:id` | Read / update / delete gear item               |

**Other**
| Method | Path                | Description                                                                                                                   |
|--------|---------------------|-------------------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/journal-scan` | AI-powered journal image scan — sends base64 image to Claude, returns structured JSON (title, body, milesCovered, elevationGainFt, tempLowF, tempHighF, weatherNotes) |


### Todo
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
10. Trip sharing UI — send a share invite from the Share dialog in the trip hero:
    - Add a new `POST /api/trips/:id/share` endpoint that accepts `{ email: string }`, looks up the target user by email, and adds their `sub` to `trip.sharedWith`. Return 404 if no account with that email exists.
    - In `ShareDialog.tsx`, add an "Invite by email" input below the copy-link button. On submit, call the new endpoint and show confirmation or error inline.
    - Shared trips should appear in the recipient's trip list with a visual indicator (e.g. a small avatar or "Shared by X" label) so they're distinguishable from owned trips.
    - Add a `DELETE /api/trips/:id/share/:sub` endpoint so the owner can revoke access.
11. Shared trip acceptance flow — for a future invite-token model (email link):
    - Generate a signed, expiring invite token (`crypto.randomUUID()` stored on the trip + expiry timestamp) when the owner shares.
    - Email the token to the invitee (requires a mail integration — Sendgrid, Resend, etc.).
    - Add a `POST /api/trips/:id/accept?token=` endpoint: verify token, verify not expired, add caller's `sub` to `sharedWith`, clear the token.
    - Frontend: a `/accept-invite` route that reads the token from the URL, calls the endpoint, and redirects to the trip on success.
12. Implement Keycloak security — steps to migrate from the current JWT system:
    1. **Stand up Keycloak** — run via Docker (`quay.io/keycloak/keycloak`). Create a realm (e.g. `ridgeline`), a client (e.g. `ridgeline-app`, public, PKCE), and configure redirect URIs to `http://localhost:5173/*`.
    2. **Add `jwks-rsa` to server** — `npm install jwks-rsa` in `/server`. Update the `verifyToken()` function in `server/src/middleware/auth.ts` to fetch Keycloak's public key via JWKS instead of using `JWT_SECRET`. Add `KEYCLOAK_JWKS_URI` and `KEYCLOAK_ISSUER` to `server/.env`. No other server files change.
    3. **Swap frontend auth flow** — replace `src/lib/auth.ts` (direct API login/register) with the Keycloak JS adapter (`keycloak-js`) or an OIDC library (`oidc-client-ts`). On app init, check Keycloak session; on login, redirect to Keycloak's login page. On return, extract the access token and store it in the Zustand auth store as before (the Axios interceptor already attaches it).
    4. **Remove local auth routes** — delete `server/src/routes/auth.ts` and the `POST /api/auth` entries in `index.ts`. Keycloak owns login/register/password-reset.
    5. **Migrate existing users** — for each `User` doc in MongoDB, create a matching user in Keycloak (via the Admin REST API) and update the `sub` field in all their documents to the Keycloak-issued UUID. This is the only data migration step; it's a one-time script.
    6. **Drop the `User` model** — once migrated, `server/src/models/User.ts` is no longer needed. User identity comes from the Keycloak token; store only app-specific profile data if needed.
13. Fix `FormEvent` deprecation in `AccountDialog.tsx` — React 19 deprecated the re-export of `FormEvent` from `react` (TS6385 warnings on lines 119 and 138). Import from `react` using `React.FormEvent` or switch to the native `SubmitEvent` type.

#### Todo Sidebar nav — planned page contents
- **Map** (`/map`) — Global map showing all GPX tracks and planned routes across every trip. Clicking a track opens the associated trip or plan detail.
- **Photos** (`/photos`) — Collage/grid of all photos across all trips, with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata.
- **Gear** (`/gear`) — Categorized lists of the user's gear inventory. Eventually links to loadouts attached to trips and supports weight calculations.

### Done
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
11. **DONE** Real auth system (pre-Keycloak stepping stone) — `jsonwebtoken` + `bcryptjs` installed on server. `server/src/models/User.ts` stores `sub` (UUID), `email`, `name`, `passwordHash`. `POST /api/auth/register` and `POST /api/auth/login` sign 7-day JWTs. `server/src/middleware/auth.ts` verifies tokens via an isolated `verifyToken()` function (easy Keycloak swap point). All 5 API route groups protected via `requireAuth` in `index.ts`. Frontend `src/lib/mockAuth.ts` deleted; replaced by `src/lib/auth.ts` with real API calls. `sub` (UUID) used as user identifier — not MongoDB ObjectId — for zero-migration Keycloak compatibility.
12. **DONE** Ownership + sharing data model — Trips, Loadouts, and GearItems now carry `ownerSub` (JWT sub string). Trips also carry `sharedWith: string[]` (array of subs). Access rules: `GET /api/trips` returns only trips the caller owns or is in `sharedWith`. Read access to a trip's journal days is gated the same way. All write/delete operations on trips, journal days, loadouts, and gear items are owner-only. `ownerSub` is set server-side on create and cannot be overwritten via PUT.
13. **DONE** Replace `onFocus/onBlur` border mutations with Tailwind `focus:` classes — added `focus:border-border-mid` to the `inputCls` constant in `TripModal.tsx` and `condInputCls` in `JournalSection.tsx`; removed all 14 `onFocus/onBlur` style mutation handlers.
14. **DONE** Replace `onMouseEnter/Leave` hover handlers with Tailwind `hover:` classes — removed `avatarHovered` and `removeHovered` state from `AccountDialog.tsx`; avatar button uses `group` + `group-hover:opacity-100` / `group-hover:text-amber`; remove button uses `hover:text-red`; `IconRail.tsx` avatar button uses `hover:border-amber`. All JS style mutations eliminated.
15. **DONE** Fix bracket-notation Tailwind classes — replaced `gap-[10px]`→`gap-2.5`, `gap-[6px]`→`gap-1.5`, `gap-[14px]`→`gap-3.5`, `gap-[1px]`→`gap-px`, `px-[14px]`→`px-3.5`, `px-[10px]`→`px-2.5`, `py-[14px]`→`py-3.5`, `pb-[14px]`→`pb-3.5`, `py-[5px]`→`py-1.25`, `my-[10px]`→`my-2.5`, `mb-[6px]`→`mb-1.5`, `mb-[5px]`→`mb-1.25`, `text-[24px]`→`text-2xl`, `text-[18px]`→`text-lg`, `text-[16px]`→`text-base`, `text-[14px]`→`text-sm`, `leading-[1.5]`→`leading-normal`, `rounded-[20px]`→`rounded-full` across 14 component files.
16. **DONE** Avatar storage in MongoDB — `avatarUrl: String` added to User model. `PUT /api/auth/me/avatar` accepts a base64 data URL, validates raw size ≤ 5 MB, stores on the User doc. `DELETE /api/auth/me/avatar` clears it. `GET /api/auth/me` returns current profile. Login response now includes `avatarUrl` so avatar is restored automatically on every login. `AccountDialog` calls the API for upload/remove; Zustand stays in sync as a local cache. Account dialog is a full edit form: name, read-only email, change-password flow, avatar upload/remove with client-side size and type validation.

### Notes
- GET /api/loadouts/:id — automatically populates the full GearItem documents so the frontend doesn't need a second request
- GET /api/trips/:id — populates the full Loadout (but not the loadout's items — you'd need a second populate for that; we can address it when you hook up the frontend)
- Auth middleware is wired in — all API routes except `/api/auth` require a valid Bearer JWT. `req.user.sub` is available in every route handler.
- Find out if OnX Backcountry offer any integrations for personal app projects to import data and items from them, brainstorm ideas to integrate this app into theirs


