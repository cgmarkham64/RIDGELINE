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
# Local dev (requires Homebrew MongoDB)
npm run dev      # Start Vite dev server (frontend only)
npm run build    # Type-check + build
npm run lint     # Run ESLint
npm run preview  # Preview production build
npm run api:dev  # Start Express API only
npm run dev:all  # Frontend + backend concurrently (localhost:5173 / :8000)
npm run mongodb:start  # Start mongodb-community@8.0 via Homebrew
npm run mongodb:stop   # Stop mongodb-community@8.0 via Homebrew

# Docker (full stack — frontend nginx :3000, API :8000, MongoDB, Keycloak :8080)
docker compose up --build   # Build images and start all services
docker compose up           # Start without rebuilding
docker compose down         # Stop all containers
docker compose down -v      # Stop and wipe volumes (clears DB)
```

## Project Structure

### Frontend
```
src/
  lib/            # api.ts (axios instance), auth.ts (login/register/avatar API calls),
                  #   gpx.ts, exif.ts, journalDays.ts, trips.ts (+ unshareTrip, leaveTrip),
                  #   users.ts (searchUsers by name/email, shareTrip),
                  #   notifications.ts (fetchNotifications, acceptInvite, declineInvite, markAllRead, dismissNotification),
                  #   utils.ts (initials, extractApiError — shared across components)
  routes/         # TanStack Router — __root.tsx, _authenticated.tsx, index.tsx, login.tsx, register.tsx,
                  #   map.tsx, photos.tsx, gear.tsx
  pages/          # LoginPage, RegisterPage, HomePage, MapPage, PhotosPage, GearPage
  store/          # auth.ts (Zustand — token, user {id, email, name, avatarUrl}, updateUser, clearAuth)
  types/          # index.ts (Trip [+ ownerSub, sharedWith: {sub,name}[]], JournalDay [+ wildlife?, companions?],
                  #            AppNotification, Photo, GearItem, GearCategory, Loadout,
                  #            GpxTrack, GpxTrackEntry, Waypoint, WaypointType), auth.ts (User, AuthResponse)
  components/
    journal/      # DaySelector.tsx, JournalSection.tsx (wildlife + companions panels;
                  #   companions always searches Ridgeline users as you type; amber chip = user; auto-shares on save)
    layout/       # IconRail.tsx (nav rail + notification bell + account avatar + sign-out),
                  #   AccountDialog.tsx (edit name, change password, upload/remove avatar),
                  #   NotificationBell.tsx (badge + popover; accept/decline invites, dismiss, mark all read)
    map/          # MapTab.tsx, MapHelpers.tsx, MapEmptyState.tsx, WaypointIcon.tsx,
                  #   WaypointForm.tsx, WaypointChip.tsx, constants.ts
    trip/         # TripDetail.tsx, TripHero.tsx (owner-gated Share/Delete; "Shared trip" badge for non-owners),
                  #   TripSidebar.tsx (search + filter popover: ownership, miles range, elev range, date range),
                  #   TripModal.tsx, TripRightPanel.tsx, ElevationProfile.tsx, GpxMapSection.tsx,
                  #   ShareDialog.tsx (People with access + Invite someone + utilities; optimistic collaborator list),
                  #   ConfirmDialog.tsx (reusable confirm modal base),
                  #   DeleteConfirm.tsx, LeaveConfirm.tsx (use ConfirmDialog)
    ui/           # HikerOverlay.tsx, MoonLoader.tsx (inline moon/mountain loading animation), sayings.ts
  hooks/          # useTrips.ts (+ useUnshareTrip, useLeaveTrip), useJournalDays.ts,
                  #   useNotifications.ts (useNotifications polls 30s, useAcceptInvite, useDeclineInvite, useMarkAllRead, useDismissNotification),
                  #   useDebounce.ts (generic debounce hook used in search inputs)
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
                  #   GearItem.ts (+ ownerSub), JournalDay.ts (+ wildlife[], companions[]),
                  #   Notification.ts (toSub, fromSub, fromName, type, tripId, tripTitle, read, status)
    routes/       # auth.ts (register, login, GET/PUT /me, PUT/DELETE /me/avatar),
                  #   trips.ts, loadouts.ts, gearItems.ts, journalDays.ts, journalScan.ts,
                  #   users.ts (GET /search?q=), notifications.ts (GET, POST accept/decline, DELETE, PATCH read-all)
    index.ts      # Express app, MongoDB connect; /api/auth public, all other routes behind requireAuth
  .env            # PORT=8000, MONGODB_URI, ANTHROPIC_API_KEY, JWT_SECRET, CORS_ORIGIN
  .env.example    # committed template — copy to .env and fill in secrets
  Dockerfile      # multi-stage: tsc build → node:22-alpine runtime
```

### Docker
```
Dockerfile          # Frontend: node:22 Vite build → nginx:alpine; VITE_API_URL='' (relative paths)
server/Dockerfile   # Backend: tsc build → node:22-alpine; runs node dist/index.js
nginx.conf          # Serves SPA (try_files fallback) + reverse-proxies /api/* → ridgeline-api:8000
docker compose.yml  # Four services on ridgeline-net:
                    #   mongodb (mongo:8, named volume mongo-data)
                    #   keycloak (quay.io/keycloak/keycloak:26.0, start-dev, port 8080)
                    #   ridgeline-api (env_file: server/.env, overrides MONGODB_URI + CORS_ORIGIN)
                    #   ridgeline-frontend (nginx, port 3000)
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
| GET/PUT/DELETE | `/api/trips/:id` | Read (owner or shared) / update (owner or shared) / delete (owner only). GET and PUT responses populate `sharedWith` as `{ sub, name }[]`. PUT accepts `gpxPlanned` and `gpxTracks`; non-owners cannot overwrite `sharedWith`. |
| POST           | `/api/trips/:id/share` | Send a collaboration invite notification to a user by `sub` (owner only); idempotent; does not add to `sharedWith` directly. |
| DELETE         | `/api/trips/:id/share/:sub` | Remove a collaborator (owner only); also cancels any pending invite notification for that user. |

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

**Users (all require JWT)**
| Method | Path                    | Description                                                                                                      |
|--------|-------------------------|------------------------------------------------------------------------------------------------------------------|
| GET    | `/api/users/search?q=`  | Search users by name or email (min 2 chars, case-insensitive, excludes caller, rate-limited 20 req/min). Returns up to 8 `{ sub, name }` results — email intentionally omitted. |

**Notifications (all require JWT)**
| Method | Path                            | Description                                                                                                   |
|--------|---------------------------------|---------------------------------------------------------------------------------------------------------------|
| GET    | `/api/notifications`            | List latest 50 notifications for the current user, newest first                                               |
| POST   | `/api/notifications/:id/accept` | Accept a pending trip invite — adds caller to `sharedWith`, notifies owner, marks notification read            |
| POST   | `/api/notifications/:id/decline`| Decline a pending trip invite — notifies owner, marks notification read                                        |
| DELETE | `/api/notifications/:id`        | Dismiss (delete) a notification                                                                                |
| PATCH  | `/api/notifications/read-all`   | Mark all non-pending notifications as read (called on panel open)                                              |

**Other**
| Method | Path                | Description                                                                                                                   |
|--------|---------------------|-------------------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/journal-scan` | AI-powered journal image scan — sends base64 image to Claude, returns structured JSON (title, body, milesCovered, elevationGainFt, tempLowF, tempHighF, weatherNotes) |


### Todo
1. **Unit tests** — Add Vitest unit tests for pure logic:
   - `src/lib/utils.ts` — `initials()` (empty string, undefined, single-word, multi-word) and `extractApiError()` (typed error, plain Error, null)
   - Sidebar filter predicates — date overlap logic, min/max range edge cases, ownership filtering
   - `useDebounce` hook — verify value only updates after delay, and cancels on rapid changes
2. **E2E tests** — Add a Playwright baseline covering golden paths:
   - Register → login → create trip → view trip
   - Share trip → accept invite as second user → view shared trip
   - Add journal entry → save → verify persistence
   - Leave trip / delete trip
3. Photo upload + EXIF — Use the exif-js or exifr library to parse EXIF in the browser before uploading. Extract GPS coordinates, camera settings, and timestamp client-side, store them alongside the photo reference in MongoDB.
4. Gear loadouts — Straightforward CRUD once the pattern is established from trips. Weight calculations are pure frontend math in Zustand.
5. Add hover text for each day button that says the title of the entry if it exists, or some prompt if it doesn't.
6. Share / Export PDF — The Share button in the trip hero opens a dialog with two options:
    - **Copy link** — copies the current page URL to clipboard (implemented, shows a "Copied" confirmation).
    - **Export as PDF** — generates a styled PDF trip report matching the app's visual design. TODO: implement using a headless print stylesheet or a library like `@react-pdf/renderer`. The PDF should include: trip hero (title, location, dates, stats), journal entries (each day with conditions grid and narrative), GPX map screenshot or SVG export, gear loadout weight summary, and photos with EXIF metadata. Style it to match the dark amber/mono aesthetic of the app.
7. Add summary stats to the Hero banner stats for total Weight Carried, and Max Elevation. These should be included as manual entries when the trip is created for now with a plan to link the fields to map and loadout data later.
8. Shared trip acceptance flow — for a future invite-token model (email link):
   - Generate a signed, expiring invite token (`crypto.randomUUID()` stored on the trip + expiry timestamp) when the owner shares.
   - Email the token to the invitee (requires a mail integration — Sendgrid, Resend, etc.).
   - Add a `POST /api/trips/:id/accept?token=` endpoint: verify token, verify not expired, add caller's `sub` to `sharedWith`, clear the token.
   - Frontend: a `/accept-invite` route that reads the token from the URL, calls the endpoint, and redirects to the trip on success.
9. Implement Keycloak security — steps to migrate from the current JWT system:
   1. **Stand up Keycloak** — ✅ DONE. Keycloak 26.0 in `docker compose.yml` (`start-dev`, port 8080). After `docker compose up`, visit http://localhost:8080, log in as `admin/admin`, create realm `Ridgeline`, client `ridgeline-app` (public, PKCE enabled), and set redirect URIs to `http://localhost:3000/*`.
   2. **Add `jwks-rsa` to server** — ✅ DONE. `jwks-rsa` installed; `verifyToken()` now uses JWKS when `KEYCLOAK_JWKS_URI` is set (RS256), falls back to `JWT_SECRET` (HS256) for local dev without Docker. `KEYCLOAK_JWKS_URI` and `KEYCLOAK_ISSUER` are live in `docker-compose.yml`.
   3. **Swap frontend auth flow** — ✅ DONE. `keycloak-js` installed; `src/lib/keycloak.ts` singleton created. `main.tsx` inits Keycloak (`check-sso` + PKCE S256) before rendering — populates Zustand on success, clears stale tokens otherwise. `onTokenExpired` refreshes silently. `_authenticated` route calls `keycloak.login()` when unauthenticated. `LoginPage`/`RegisterPage` redirect to `keycloak.login()`/`keycloak.register()`. Sign-out calls `keycloak.logout()`. Keycloak URL/realm/clientId configurable via `VITE_KEYCLOAK_*` build args (defaults: `localhost:8080`, `Ridgeline`, `ridgeline-app`).
   4. **Remove local auth routes** — ✅ DONE. Removed `POST /register` and `POST /login` from `server/src/routes/auth.ts`; `/me` endpoints kept (still needed for avatarUrl until 9.6). `requireAuth` moved to mount level in `index.ts`. Dead `login()`/`register()` helpers removed from `src/lib/auth.ts`. Password change section removed from `AccountDialog` (Keycloak owns passwords now).
   5. **Migrate existing users** — ✅ DONE. `server/scripts/migrate-to-keycloak.ts` — idempotent script that creates each MongoDB User in Keycloak (via Admin REST API) with `requiredActions: ['UPDATE_PASSWORD']`, then rewrites `sub` in User, Trip (ownerSub + sharedWith[]), Loadout, GearItem, and Notification (toSub + fromSub). Run with `npx tsx scripts/migrate-to-keycloak.ts` from `server/`. All 3 existing users migrated 2026-05-08.
   6. **Drop the `User` model** — ✅ DONE. Replaced with `server/src/models/UserProfile.ts` (`{ sub, name, email, avatarUrl }`). `GET /me` upserts name/email from the Keycloak token on every login so the profile stays in sync; `PUT /me` removed (Keycloak owns name/password). `trips.ts` and `users.ts` updated to query `UserProfile`. `AccountDialog` name field made read-only. `server/scripts/migrate-user-profiles.ts` copies avatarUrl from the old `users` collection into `userprofiles`.

#### Todo Sidebar nav — planned page contents
- **TRIP PLANNING FEATURE** - Allow users to plan trips in advance of going out - they will basically compile all their pre trip prep things in one place 
  - Maps
  - Permit info
  - Number of days
  - Weather forecasts
  - Local wildlife info
  - Leave no trace info
  - Campsite planning
    - Mileage per day
    - Elevation per day
  - Campsite contingency
  - Water availability by mile marker and locale (drought? flash flooding?)
  - Fires permissible?
  - Drones permissible?
  - Nearest emergency services and how to reach them?
  - NOTE: we can maybe use AI to help compile all of this information into the pre-trip plan
  - NOTE: after doing some design work and building this, we'd want a flow to take us from plan to execution to post trip report journal (what we've built already)
- **Trips** - Share trips to other users leads to collaboration with other registered users. Add a feature to allow for simultaneous and deconflicted/merged edits of a trip and journal entries.
- **Map** (`/map`) — Global map showing all GPX tracks and planned routes across every trip. Clicking a track opens the associated trip or plan detail.
- **Photos** (`/photos`) — Collage/grid of all photos across all trips, with basic metadata (trip name, date, GPS coords). Clicking a photo navigates to its trip or shows full EXIF metadata.
- **Gear** (`/gear`) — Categorized lists of the user's gear inventory. Eventually links to loadouts attached to trips and supports weight calculations.

### Done
See git log for completed work.

### Notes
- GET /api/loadouts/:id — automatically populates the full GearItem documents so the frontend doesn't need a second request
- GET /api/trips/:id — populates the full Loadout (but not the loadout's items — you'd need a second populate for that; we can address it when you hook up the frontend)
- Auth middleware is wired in — all API routes except `/api/auth` require a valid Bearer JWT. `req.user.sub` is available in every route handler.
- `CORS_ORIGIN` env var controls Express CORS allowed origin (defaults to `http://localhost:5173` for local dev; docker compose sets it to `http://localhost:3000`)
- In Docker, `VITE_API_URL` is built as empty string so axios uses relative paths; nginx proxies `/api/*` to `ridgeline-api:8000` preserving the full path
- Find out if OnX Backcountry offer any integrations for personal app projects to import data and items from them, brainstorm ideas to integrate this app into theirs


