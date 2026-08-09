# Handoff — code-quality cleanup, round 2

Prior effort (see `git log` for the full history) took the repo-wide `complexity`/`max-lines-per-function` warning count from 127 → 35 across several sessions, most recently closing out `GearStage.tsx` and `PlanWizard.tsx`. That effort was deliberately stopped there. This round reopens it, explicitly, to clear out what's left for completeness.

**Status: not started.** Working tree should be clean before starting each batch below; commit after each batch, not all at once, so a bad extraction in one file doesn't get buried under 20 others.

## Ground rules (same as last round — still true)

- Treat `complexity`/`max-lines-per-function` as a readability proxy, not the goal. Stop extracting once comfortably under the threshold; don't manufacture a split just to hit zero.
- If a single file's decomposition is trending past ~8-10 new files, pause and check in before continuing.
- For files with real state/effects (not just markup), get an independent cold-review pass on the diff and a live browser check before calling it done. For pure one-line-over-budget files, `tsc`+`eslint`+`build` is enough.
- Verify current warning counts with `npm run lint` before starting each batch — this doc is a snapshot, not a guarantee; file line numbers will drift as earlier batches land.

## Batch 1 — Quick wins (6 files, all 1 warning each, none need more than 1-2 extractions)

All of these are just barely over budget — expect a single helper/subcomponent extraction each, not a full multi-file decomposition.

- `src/App.tsx` — `App` 90 lines (limit 70)
- `src/pages/RegisterPage.tsx` — `LocalRegisterForm` 80 lines (limit 70)
- `src/components/map/MapControlsBar.tsx` — `MapControlsBar` 71 lines (limit 70, 1 over)
- `src/components/trip/WaypointList.tsx` — `WaypointList` 72 lines (limit 70, 2 over)
- `src/components/map/leafletIcons.ts` — `waypointSvgString` 51 lines (limit 30 — `.ts` files get the stricter budget)
- `src/lib/gpx.ts` — `enrichWithElevation` 36 lines (limit 30)

## Batch 2 — `layout/` (3 files, 4 warnings)

- `src/components/layout/AccountDialog.tsx` — `AccountDialog` 303 lines + complexity 16 (limit 70 / 15). **The big one in this batch** — expect a GearStage-sized decomposition (state hook + per-section subcomponents for edit-name/change-password/avatar-upload).
- `src/components/layout/IconRail.tsx` — `IconRail` 83 lines (limit 70)
- `src/components/layout/NotificationItem.tsx` — `NotificationItem` 80 lines (limit 70)

## Batch 3 — `map/` (4 files, 4 warnings — `MapControlsBar` already covered in Batch 1)

- `src/components/map/MapTab.tsx` — `MapTab` 189 lines (limit 70) — top-level map page, likely needs a state hook + panel split
- `src/components/map/MapArea.tsx` — `MapArea` 143 lines (limit 70)
- `src/components/map/WaypointIcon.tsx` — `WaypointIcon` 90 lines (limit 70)
- `src/components/map/WaypointChip.tsx` — `WaypointChip` 76 lines (limit 70)

## Batch 4 — `plan/` leftovers (6 files, 7 warnings — these were never part of the GearStage/PlanWizard scope)

- `src/components/plan/stages/depart/DepartStage.tsx` — `DepartStage` 155 lines (limit 70) — a full stage component, expect the same treatment as RouteStage/PermitsStage/GearStage got (aggregator hook + section subcomponents)
- `src/components/plan/PlanOverview.tsx` — `PlanOverview` 142 lines (limit 70)
- `src/components/plan/TripSetupDialog.tsx` — `TripSetupDialog` 105 lines (limit 70)
- `src/components/plan/StageHeader.tsx` — `StageHeader` 86 lines + complexity 17 (limit 70 / 15)
- `src/components/plan/StageRail.tsx` — `StageRail` 86 lines (limit 70)
- `src/components/plan/PlanAccessError.tsx` — `PlanAccessError` 83 lines (limit 70)

## Batch 5 — `trip/` (3 files, 3 warnings — `WaypointList` already covered in Batch 1)

- `src/components/trip/ElevationProfile.tsx` — `ElevationProfile` 195 lines (limit 70) — likely chart/SVG-heavy, check `VISUAL_RENDERING_FILES` in `eslint.config.js` before assuming this needs decomposition rather than a magic-numbers-style exemption
- `src/components/trip/GpxMapSection.tsx` — `GpxMapSection` 193 lines (limit 70)
- `src/components/trip/GpxImportPanel.tsx` — `GpxImportPanel` 124 lines (limit 70)

## Batch 6 — `journal/` leftovers (2 files, 2 warnings — explicitly out of scope last round, now candidates)

- `src/components/journal/DaySelector.tsx` — `DaySelector` 133 lines (limit 70)
- `src/components/journal/CompanionTagInput.tsx` — `CompanionTagInput` 127 lines (limit 70)

## Batch 7 — `server/` (6 files, 8 warnings — different conventions from the frontend work; these are route handlers/scripts, not React components, so the decomposition pattern will look different — service functions and smaller helpers, not hooks/subcomponents)

- `server/scripts/migratePlans.ts` — `main` 57 lines + complexity 16 (limit 30 / 15)
- `server/src/utils/crudFactory.ts` — `makeOwnerCrudRouter` 39 lines (limit 30), plus an unused `eslint-disable` directive to clean up
- `server/src/services/scanService.ts` — `scanJournalImage` 43 lines (limit 30)
- `server/src/services/permitService.ts` — `lookupPermit` 39 lines (limit 30)
- `server/scripts/migrate-to-keycloak.ts` — `main` 42 lines (limit 30)
- `server/scripts/remove-stale-route-checklist-items.ts` — `main` 31 lines (limit 30, 1 over) — likely a Batch-1-style quick win, listed here only because it's a server file

## Suggested order

Batch 1 first (fast, builds confidence, clears 6 warnings cheaply). Then whichever of Batches 2-6 the user cares most about seeing clean — they're independent of each other. Batch 7 (server) last, and worth confirming with the user first since server/ was explicitly excluded from the original scope and has different risk characteristics (route handlers, migration scripts) than the frontend component work this pattern was developed against.

**After all 7 batches: expect 0 warnings repo-wide** (aside from anything newly introduced in the meantime). At that point it's worth asking the user whether to ratchet `complexity`/`max-lines-per-function` from `warn` to `error` in `eslint.config.js` to prevent regressions — don't do this unilaterally, it changes CI/build behavior.
