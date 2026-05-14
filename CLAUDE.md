# Ridgeline

An outdoor/hiking trip planning and logging app with a React frontend and Express/MongoDB backend.

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
                  #   plans.ts (fetchPlans, fetchPlan, createPlan, updatePlan, deletePlan; PlanRecord type),
                  #   utils.ts (initials, extractApiError — shared across components)
  routes/         # TanStack Router — __root.tsx, _authenticated.tsx, index.tsx, login.tsx, register.tsx,
                  #   map.tsx, photos.tsx, gear.tsx,
                  #   plan.tsx (validateSearch for ?id= param)
  pages/          # LoginPage, RegisterPage, HomePage, MapPage, PhotosPage, GearPage,
                  #   PlanPage (auto-creates a plan if no ?id= then renders PlanWizard)
  store/          # auth.ts (Zustand — token, user {id, email, name, avatarUrl}, updateUser, clearAuth)
  types/          # index.ts (Trip [+ ownerSub, sharedWith: {sub,name}[]], JournalDay [+ wildlife?, companions?],
                  #            AppNotification, Photo, GearItem, GearCategory, Loadout,
                  #            GpxTrack, GpxTrackEntry, Waypoint, WaypointType), auth.ts (User, AuthResponse)
  components/
    icons.tsx     # Shared SVG icon library for the whole app — import from here, never define icons inline.
                  #   Generic: IconCheck, IconPlus, IconX, IconSearch, IconList, IconLayers,
                  #     IconChevronLeft/Right (size param), IconArrowLeft/Right, IconSparkle, IconMap,
                  #     IconPackage, IconDroplets, IconPencil, IconLock, IconGear, IconBell (size param),
                  #     IconDownload, IconFile, IconCircle.
                  #   Waypoint/contextual (amber-colored): IconTent, IconMountain, IconWater, IconSun.
    journal/      # DaySelector.tsx, JournalSection.tsx (wildlife + companions panels;
                  #   companions always searches Ridgeline users as you type; amber chip = user; auto-shares on save)
    layout/       # IconRail.tsx (nav rail + notification bell + account avatar + sign-out),
                  #   AccountDialog.tsx (edit name, change password, upload/remove avatar),
                  #   NotificationBell.tsx (badge + popover; accept/decline invites, dismiss, mark all read)
    map/          # MapTab.tsx, MapHelpers.tsx, MapEmptyState.tsx, WaypointIcon.tsx, leafletIcons.ts,
                  #   WaypointForm.tsx, WaypointChip.tsx, constants.ts
    plan/         # PlanWizard.tsx (loads plan from API, debounced autosave, saveState indicator;
                  #     accepts planId: string — PlanPage creates one if absent),
                  #   StageRail.tsx (left 280px rail), StageHeader.tsx (shared header + save indicator),
                  #   PlanOverview.tsx (2×3 stage card grid + critical path timeline),
                  #   Ring.tsx, Pill.tsx, JumpChip.tsx, ProgressBar.tsx, CheckItem.tsx (shared atoms),
                  #   types.ts (PlanMeta, PlanData + per-stage slices, StageBodyProps with plan/onChange),
                  #   constants.ts (STAGES metadata, createStages(), stageState()),
                  #   stages/ RouteStage.tsx ✅, DaysStage.tsx ✅, PermitsStage.tsx ✅,
                  #           FoodStage.tsx ✅, GearStage.tsx ✅, DepartStage.tsx ✅
    trip/         # TripDetail.tsx, TripHero.tsx (owner-gated Share/Delete; "Shared trip" badge for non-owners),
                  #   TripSidebar.tsx (search + filter popover: ownership, miles range, elev range, date range),
                  #   TripModal.tsx, TripRightPanel.tsx, ElevationProfile.tsx, GpxMapSection.tsx,
                  #   ShareDialog.tsx (People with access + Invite someone + utilities; optimistic collaborator list),
                  #   ConfirmDialog.tsx (reusable confirm modal base),
                  #   DeleteConfirm.tsx, LeaveConfirm.tsx (use ConfirmDialog)
    ui/           # HikerOverlay.tsx, MoonLoader.tsx (inline moon/mountain loading animation), sayings.ts
  hooks/          # useTrips.ts (+ useUnshareTrip, useLeaveTrip), useJournalDays.ts,
                  #   useNotifications.ts (useNotifications polls 30s, useAcceptInvite, useDeclineInvite, useMarkAllRead, useDismissNotification),
                  #   useDebounce.ts (generic debounce hook used in search inputs),
                  #   usePlans.ts (usePlans, usePlan, useCreatePlan, useUpdatePlan, useDeletePlan)
  router.tsx      # TanStack Router instance
```

### Backend
```
server/
  src/
    middleware/   # auth.ts (requireAuth — extracts Bearer JWT, populates req.user.sub/email/name;
                  #           verifyToken() uses JWKS/RS256 when KEYCLOAK_JWKS_URI is set, else JWT_SECRET/HS256)
    models/       # UserProfile.ts (sub, name, email, avatarUrl — upserted from JWT on every login),
                  #   Trip.ts (+ ownerSub, sharedWith[]), Loadout.ts (+ ownerSub),
                  #   GearItem.ts (+ ownerSub), JournalDay.ts (+ wildlife[], companions[]),
                  #   Notification.ts (toSub, fromSub, fromName, type, tripId, tripTitle, read, status),
                  #   Plan.ts (ownerSub, meta: PlanMeta, stages: Mixed, timestamps)
    routes/       # auth.ts (register + login local-dev only; GET /me, PUT/DELETE /me/avatar),
                  #   trips.ts, loadouts.ts, gearItems.ts, journalDays.ts, journalScan.ts,
                  #   users.ts (GET /search?q=), notifications.ts (GET, POST accept/decline, DELETE, PATCH read-all),
                  #   plans.ts (GET list, POST create, GET/:id, PUT/:id, DELETE/:id — owner-scoped; ObjectId validated)
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
| POST       | `/api/auth/register`    | **Local dev only.** Create account — hashes password, stores UserProfile, returns signed 7-day JWT |
| POST       | `/api/auth/login`       | **Local dev only.** Verify credentials, return JWT + user (including `avatarUrl`)            |
| GET        | `/api/auth/me`          | Return current UserProfile (requires JWT); upserts name/email from token on each call        |
| PUT        | `/api/auth/me/avatar`   | Upload avatar as base64 data URL (max 5 MB); stores on UserProfile (requires JWT)            |
| DELETE     | `/api/auth/me/avatar`   | Remove avatar from UserProfile (requires JWT)                                                |

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

**Plans (all require JWT; scoped to ownerSub)**
| Method         | Path             | Description                                                                                               |
|----------------|------------------|-----------------------------------------------------------------------------------------------------------|
| GET/POST       | `/api/plans`     | List user's plans (newest first) / create plan (`{ meta, stages }`)                                       |
| GET/PUT/DELETE | `/api/plans/:id` | Read / update (`meta` and/or `stages` patched separately, `markModified` called) / delete. 400 on invalid ObjectId, 403 if not owner. |

**Other**
| Method | Path                | Description                                                                                                                   |
|--------|---------------------|-------------------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/journal-scan` | AI-powered journal image scan — sends base64 image to Claude, returns structured JSON (title, body, milesCovered, elevationGainFt, tempLowF, tempHighF, weatherNotes) |


### Roadmap

See `TODO.md` for detailed task breakdowns. Feature direction:

- **Tests** — Vitest unit tests (`utils.ts`, filter predicates, `useDebounce`) + Playwright E2E golden paths (register → trip → share → journal).
- **Trip planning** *(all six stages complete + persistence)* — Six-stage wizard (`Route → Days → Permits → Food → Gear → Depart`) fully built at `/plan` (`src/components/plan/`). Plans are persisted to MongoDB via `/api/plans` and autosaved (debounced 800 ms) on any stage change. `PlanPage` auto-creates a plan on first visit and stores the ID in `?id=` search param. `StageHeader` shows live save state. Shared atoms: `Ring`, `Pill`, `JumpChip`, `ProgressBar`, `CheckItem`. Icons centralized in `src/components/icons.tsx`. Design handoff: `inspiration/design_handoff_plan_a_trip/`. Stage specs and known gaps in `TODO.md`. Flow: plan → execution → post-trip journal.
- **PDF export** — Trip report from Share dialog: hero stats, journal entries, GPX map, gear summary, photos. Dark amber/mono aesthetic via `@react-pdf/renderer` or print stylesheet.
- **Photo EXIF** — Parse EXIF client-side on upload (exifr): GPS coords, camera settings, timestamp. Store alongside photo in MongoDB.
- **Gear loadouts** — CRUD gear inventory; weight calculations in Zustand; link loadouts to trips.
- **Trip hero stats** — Add Weight Carried and Max Elevation as manual inputs on trip create; later derive from loadout and GPX.
- **Email invites** — Signed expiring invite tokens for share flow (Sendgrid/Resend); `/accept-invite` route.
- **Real-time collaboration** — Deconflicted/merged edits of trips and journal entries for multiple owners.
- **Global map** (`/map`) — All GPX tracks + planned routes across every trip; click to open trip/plan.
- **Photos** (`/photos`) — Grid of all photos across trips with metadata; full EXIF on click.
- **Gear** (`/gear`) — Gear inventory management; links to loadouts and weight calculations.

### Dev vs Docker

|                    | Local dev                                                                | Docker                                                                    |
|--------------------|--------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Frontend           | http://localhost:5173 (Vite HMR)                                         | http://localhost:3000 (nginx)                                             |
| API                | http://localhost:8000 (absolute URL)                                     | relative paths, proxied by nginx → `ridgeline-api:8000`                   |
| Auth               | JWT/HS256 via `JWT_SECRET`; `/login` + `/register` pages work            | Keycloak OIDC/PKCE via `keycloak-js`; login/register redirect to Keycloak |
| Token verification | `verifyToken()` uses `JWT_SECRET` (HS256) when `KEYCLOAK_JWKS_URI` unset | `verifyToken()` fetches JWKS from Keycloak and verifies RS256             |
| MongoDB            | Homebrew `mongodb-community@8.0`                                         | `mongodb` container with named volume `mongo-data`                        |
| Keycloak           | not running                                                              | http://localhost:8080 (admin / admin)                                     |

**Local dev auth** — `KEYCLOAK_JWKS_URI` and `KEYCLOAK_ISSUER` must be absent/commented out in `server/.env` (default in `.env.example`). The frontend detects no Keycloak config and falls back to the `/login` page with `POST /api/auth/login`.

**Docker/Keycloak first-time setup** — after `docker compose up --build`, visit http://localhost:8080, sign in as `admin/admin`, then:
1. Create realm `Ridgeline`
2. Create client `ridgeline-app` (OpenID Connect, public, PKCE S256 enabled)
3. Set valid redirect URIs to `http://localhost:3000/*` and web origins to `http://localhost:3000`

Subsequent `docker compose up` calls don't need the realm re-created if the `keycloak-data` volume persists.

### Notes
- GET /api/loadouts/:id — automatically populates the full GearItem documents so the frontend doesn't need a second request
- GET /api/trips/:id — populates the full Loadout (but not the loadout's items — you'd need a second populate for that; we can address it when you hook up the frontend)
- Auth middleware is wired in — all API routes except `/api/auth` require a valid Bearer JWT. `req.user.sub` is available in every route handler.
- `CORS_ORIGIN` env var controls Express CORS allowed origin (defaults to `http://localhost:5173` for local dev; docker compose sets it to `http://localhost:3000`)
- In Docker, `VITE_API_URL` is built as empty string so axios uses relative paths; nginx proxies `/api/*` to `ridgeline-api:8000` preserving the full path
- Find out if OnX Backcountry offer any integrations for personal app projects to import data and items from them, brainstorm ideas to integrate this app into theirs


