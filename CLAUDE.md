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
                  #   gpx.ts, exif.ts, journalDays.ts, trips.ts,
                  #   users.ts (searchUsers by name/email, shareTrip)
  routes/         # TanStack Router — __root.tsx, _authenticated.tsx, index.tsx, login.tsx, register.tsx,
                  #   map.tsx, photos.tsx, gear.tsx
  pages/          # LoginPage, RegisterPage, HomePage, MapPage, PhotosPage, GearPage
  store/          # auth.ts (Zustand — token, user {id, email, name, avatarUrl}, updateUser, clearAuth)
  types/          # index.ts (Trip, JournalDay [+ wildlife?: string[], companions?: string[]],
                  #            Photo, GearItem, GearCategory, Loadout,
                  #            GpxTrack, GpxTrackEntry, Waypoint, WaypointType), auth.ts (User, AuthResponse)
  components/
    journal/      # DaySelector.tsx, JournalSection.tsx (wildlife + companions tag panels;
                  #   companions supports @ to mention a Ridgeline user — auto-shares trip on save)
    layout/       # IconRail.tsx (nav rail + account avatar button + sign-out button),
                  #   AccountDialog.tsx (edit name, change password, upload/remove avatar)
    map/          # MapTab.tsx, MapHelpers.tsx, MapEmptyState.tsx, WaypointIcon.tsx,
                  #   WaypointForm.tsx, WaypointChip.tsx, constants.ts
    trip/         # TripDetail.tsx, TripHero.tsx, TripSidebar.tsx, TripModal.tsx,
                  #   TripRightPanel.tsx, ElevationProfile.tsx, GpxMapSection.tsx,
                  #   ShareDialog.tsx (copy link + invite-to-collaborate with debounced user search),
                  #   DeleteConfirm.tsx
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
                  #   GearItem.ts (+ ownerSub), JournalDay.ts (+ wildlife[], companions[])
    routes/       # auth.ts (register, login, GET/PUT /me, PUT/DELETE /me/avatar),
                  #   trips.ts, loadouts.ts, gearItems.ts, journalDays.ts, journalScan.ts,
                  #   users.ts (GET /search?q=)
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
| POST           | `/api/trips/:id/share` | Add a user to `sharedWith` by their `sub` (owner only). Validates target user exists; idempotent. Returns `{ ok, name }`. |

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
| GET    | `/api/users/search?q=`  | Search users by name or email (min 2 chars, case-insensitive, excludes caller). Returns up to 8 `{ sub, name, email }` results. |

**Other**
| Method | Path                | Description                                                                                                                   |
|--------|---------------------|-------------------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/journal-scan` | AI-powered journal image scan — sends base64 image to Claude, returns structured JSON (title, body, milesCovered, elevationGainFt, tempLowF, tempHighF, weatherNotes) |


### Todo
1. Photo upload + EXIF — Use the exif-js or exifr library to parse EXIF in the browser before uploading. Extract GPS coordinates, camera settings, and timestamp client-side, store them alongside the photo reference in MongoDB.
2. Gear loadouts — Straightforward CRUD once the pattern is established from trips. Weight calculations are pure frontend math in Zustand.
3. Add hover text for each day button that says the title of the entry if it exists, or some prompt if it doesn't.
4. Share / Export PDF — The Share button in the trip hero opens a dialog with two options:
    - **Copy link** — copies the current page URL to clipboard (implemented, shows a "Copied" confirmation).
    - **Export as PDF** — generates a styled PDF trip report matching the app's visual design. TODO: implement using a headless print stylesheet or a library like `@react-pdf/renderer`. The PDF should include: trip hero (title, location, dates, stats), journal entries (each day with conditions grid and narrative), GPX map screenshot or SVG export, gear loadout weight summary, and photos with EXIF metadata. Style it to match the dark amber/mono aesthetic of the app.
5. Add summary stats to the Hero banner stats for total Weight Carried, and Max Elevation. These should be included as manual entries when the trip is created for now with a plan to link the fields to map and loadout data later.
6. Add search function to Trips list (by name OR state (acronym or long, CA or California))
7. Add filter function to Trips list (finite by state, distance, elevation gain, etc.)
8. Trip sharing UI — ✅ core sharing implemented; remaining work:
   - ✅ `POST /api/trips/:id/share` — adds user to `sharedWith` by sub; validates user exists
   - ✅ `ShareDialog.tsx` — "Invite to collaborate" card with debounced name/email search and inline feedback
   - ✅ Journal companions — typing `@` triggers user search; selecting a user auto-shares the trip on save
   - Shared trips should appear in the recipient's trip list with a visual indicator (e.g. a small avatar or "Shared by X" label) so they're distinguishable from owned trips.
   - Add a `DELETE /api/trips/:id/share/:sub` endpoint so the owner can revoke access.
   - Add a notification bell icon to the bottom part of IconRail above the account element. Include a popover menu that scrolls with notifications. A notification in this context will be there when another user shares a trip and journal entries with you. The notification should allow you to accept or decline the invite to collaborate. Another notification should be available for the original author of the trip when the invited user accepts or declines the collaboration invitation.
9. Shared trip acceptance flow — for a future invite-token model (email link):
   - Generate a signed, expiring invite token (`crypto.randomUUID()` stored on the trip + expiry timestamp) when the owner shares.
   - Email the token to the invitee (requires a mail integration — Sendgrid, Resend, etc.).
   - Add a `POST /api/trips/:id/accept?token=` endpoint: verify token, verify not expired, add caller's `sub` to `sharedWith`, clear the token.
   - Frontend: a `/accept-invite` route that reads the token from the URL, calls the endpoint, and redirects to the trip on success.
10. Implement Keycloak security — steps to migrate from the current JWT system:
    1. **Stand up Keycloak** — run via Docker (`quay.io/keycloak/keycloak`). Create a realm (e.g. `ridgeline`), a client (e.g. `ridgeline-app`, public, PKCE), and configure redirect URIs to `http://localhost:5173/*`.
    2. **Add `jwks-rsa` to server** — `npm install jwks-rsa` in `/server`. Update the `verifyToken()` function in `server/src/middleware/auth.ts` to fetch Keycloak's public key via JWKS instead of using `JWT_SECRET`. Add `KEYCLOAK_JWKS_URI` and `KEYCLOAK_ISSUER` to `server/.env`. No other server files change.
    3. **Swap frontend auth flow** — replace `src/lib/auth.ts` (direct API login/register) with the Keycloak JS adapter (`keycloak-js`) or an OIDC library (`oidc-client-ts`). On app init, check Keycloak session; on login, redirect to Keycloak's login page. On return, extract the access token and store it in the Zustand auth store as before (the Axios interceptor already attaches it).
    4. **Remove local auth routes** — delete `server/src/routes/auth.ts` and the `POST /api/auth` entries in `index.ts`. Keycloak owns login/register/password-reset.
    5. **Migrate existing users** — for each `User` doc in MongoDB, create a matching user in Keycloak (via the Admin REST API) and update the `sub` field in all their documents to the Keycloak-issued UUID. This is the only data migration step; it's a one-time script.
    6. **Drop the `User` model** — once migrated, `server/src/models/User.ts` is no longer needed. User identity comes from the Keycloak token; store only app-specific profile data if needed.

#### Todo Sidebar nav — planned page contents
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
- Find out if OnX Backcountry offer any integrations for personal app projects to import data and items from them, brainstorm ideas to integrate this app into theirs


