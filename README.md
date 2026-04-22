# Ridgeline

An outdoor and hiking trip tracking app. Log trips, write journal entries, import GPX tracks, manage gear loadouts, and browse photos — all in one place.

---

## Tech Stack

**Frontend** (`/src`)
- React 19 + TypeScript
- Vite 8
- TanStack Router — code-based routing with auth-guard layout route
- TanStack Query — server state, caching, and mutations
- Axios — HTTP client with JWT interceptor
- Zustand — auth state, persisted to `localStorage`
- React Hook Form + Zod — forms and validation
- Tailwind CSS v4

**Backend** (`/server`)
- Node.js + Express 4
- MongoDB 8 (local) via Mongoose
- TypeScript compiled with `tsx` (dev) / `tsc` (prod)

---

## Prerequisites

- Node.js 20+
- MongoDB Community 8.0 (installed via Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
```

---

## Getting Started

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Start MongoDB
npm run mongodb:start

# Run frontend + backend concurrently
npm run dev:all
```

Frontend: http://localhost:5173  
API: http://localhost:8000

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server (frontend only) |
| `npm run api:dev` | Start the Express API server (backend only) |
| `npm run dev:all` | Run frontend and backend concurrently |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |
| `npm run mongodb:start` | Start MongoDB via Homebrew services |
| `npm run mongodb:stop` | Stop MongoDB via Homebrew services |

---

## Project Structure

```
ridgeline/
├── src/                        # Frontend
│   ├── components/
│   │   ├── journal/            # DaySelector, JournalSection
│   │   ├── layout/             # IconRail
│   │   └── trip/               # TripSidebar, TripModal, DeleteConfirm
│   ├── hooks/                  # useTrips, useJournalDays
│   ├── lib/                    # api.ts (axios), trips.ts, journalDays.ts
│   ├── pages/                  # HomePage, MapPage, PhotosPage, GearPage, LoginPage, RegisterPage
│   ├── routes/                 # TanStack Router route definitions
│   ├── store/                  # auth.ts (Zustand)
│   └── types/                  # Trip, JournalDay, GearItem, Loadout, Photo
│
└── server/                     # Backend
    └── src/
        ├── models/             # Trip.ts, JournalDay.ts, Loadout.ts, GearItem.ts
        └── routes/             # trips.ts, journalDays.ts, loadouts.ts, gearItems.ts
```

---

## API

| Method | Path | Description |
|---|---|---|
| GET / POST | `/api/trips` | List / create trips |
| GET / PUT / DELETE | `/api/trips/:id` | Read / update / delete trip (populates loadout). `PUT` accepts `gpxPlanned` and `gpxTrack` as GeoJSON LineString objects. |
| GET / POST | `/api/journal-days?tripId=` | List entries for a trip (sorted by day) / create entry |
| PUT / DELETE | `/api/journal-days/:id` | Update / delete a journal entry |
| GET / POST | `/api/loadouts` | List / create loadouts (populates gear items) |
| GET / PUT / DELETE | `/api/loadouts/:id` | Read / update / delete loadout |
| GET / POST | `/api/gear-items` | List / create gear items |
| GET / PUT / DELETE | `/api/gear-items/:id` | Read / update / delete gear item |