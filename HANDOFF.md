# Handoff — code-quality cleanup

Last commit: `2c7835c` — "Continue magic-number audit cleanup: 5 files to zero, formula files exempted"
Working tree: **dirty** — the full magic-number sweep completion (below) is uncommitted. Not pushed.

## Status: magic-number cleanup is DONE

`@typescript-eslint/no-magic-numbers` warning count: **238 → 0** across the whole codebase (frontend + backend). Verified with `npm run lint 2>&1 | grep -c no-magic-numbers` → `0`. Frontend build (`npm run build`) and backend typecheck (`npx tsc --noEmit` in `server/`) both pass clean.

`npm run lint` now reports 190 warnings, 0 errors — all remaining warnings are `max-lines-per-function`/`complexity`, a different audit item (see below), not magic numbers.

### What happened, in order

**Committed as `2c7835c`** (first half of this session):
1. `routeStage.helpers.ts`, `weatherStage.helpers.ts`, `AccountDialog.tsx`, `PlanWizard.tsx`, `server/src/routes/auth.ts` taken to zero — see that commit message for detail. Fixed two duplicated `3.28084` m→ft conversions to use the shared `mToFt()` helper.
2. Extracted `PlanWizard`'s inline "bear in jail" error-state SVG into `src/components/plan/PlanAccessError.tsx`, added to `VISUAL_RENDERING_FILES` in `eslint.config.js`.
3. `sun.ts`/`units.ts` — added a `TRANSCRIBED_FORMULA_FILES` exemption list (sibling to `VISUAL_RENDERING_FILES`, kept separate since these are math formulas, not SVG geometry) and turned the rule off for both, per explicit user decision — naming every NOAA/Meeus coefficient or conversion factor would fragment formulas meant to be read as a whole.

**Uncommitted (second half of this session)** — worked top-down through every remaining file by warning count:
- **7→0**: `server/src/services/scanService.ts` (avatar-byte-limit pattern, base64→bytes ratio)
- **6→0 each**: `NotificationItem.tsx` (relative-time buckets), `DaySelector.tsx` (calendar-grid math), `server/src/services/permitService.ts` (GPX simplify target, 12-hour clock conversion, short-stay threshold)
- **5→0 each**: `zoneDetection.helpers.ts` (ISO date/year slicing, route-signature coord decimals), `server/src/routes/localAuth.ts` (rate-limit windows, bcrypt salt rounds)
- **4→0 each**: `zoneGeometry.ts`, `waterSources.ts`, `geo.ts` — **checked for the sun.ts/units.ts formula-fragmentation exception, but none needed it.** `geo.ts`'s `180` was one repeated degree→radian divisor (`Math.PI/180`), not a wall of distinct coefficients — named it `DEG_TO_RAD` and exported it (real DRY win, also killed a second Math.PI/180 duplicate in `zoneGeometry.ts`'s `distToRingMeters`). Also: `ZonesOverlay.tsx` (4→0, added to `VISUAL_RENDERING_FILES` — pure Leaflet stroke/opacity tuning), `PermitsStage.tsx`, `GearStage.tsx` (oz↔lb conversion), `server/src/middleware/auth.ts` (JWKS cache TTL, Bearer-prefix length)
- **3→0 each**: `TripSidebar.tsx`, `routeMapCard.helpers.tsx`, `RouteStage.tsx`, `JournalSection.tsx`, `JournalEntryForm.tsx`
- **2→0 each**: `WaypointList.tsx`, `TripHero.tsx`, `ShareDialog.tsx`, `PermitCard.tsx`, `PartnersCard.tsx`, `WaypointForm.tsx`, `WaypointChip.tsx`, `CompanionTagInput.tsx`, `server/src/services/foodMacrosService.ts`
- **1→0 each**: `RegisterPage.tsx`, `main.tsx`, `lib/plans.ts`, `hooks/usePlans.ts`, `TripDetail.tsx`, `GpxImportPanel.tsx`, `RouteTable.tsx`, `RouteRightRail.tsx`, `DrawConfirmTray.tsx`, `DepartStage.tsx`, `TripSetupDialog.tsx`, `ProgressBar.tsx`, `MapControlsBar.tsx`, `NotificationBell.tsx`, `server/src/routes/users.ts`, `server/src/routes/notifications.ts`, `server/src/index.ts`

Recurring patterns worth knowing about (same constant name reused across files, not centralized — each file's own module scope):
- `ISO_DATE_LENGTH = 10` — for `.slice(0, 10)` on `YYYY-MM-DD` strings. Appears in ~8 files.
- `DAY_MS = 86_400_000`, `PERCENT_MULTIPLIER = 100`, `HTTP_FORBIDDEN = 403` — each appears in a handful of files.
- Debounce/timeout constants (`SEARCH_DEBOUNCE_MS = 300`, various `*_TIMEOUT_MS`) — named per-file, not shared, since values/purposes differ slightly per usage site.
- These were deliberately **not** hoisted into a shared constants module — each occurrence was small, single-file-scoped, and hoisting would add an import for a one-line constant. Revisit only if a fourth+ file needs the exact same constant and the import cost starts paying for itself.

Build (`npm run build`) and backend typecheck (`npx tsc --noEmit` in `server/`) were run after every file and are clean at the end of this session.

## What's next

The magic-number item from the original code-quality audit is fully closed. Remaining open items from that audit, none started:

- **Thin route handlers**: `notifications.ts` accept-invite, `auth.ts` `GET /me`, `trips.ts` `PUT /:id` all have multi-step business logic written inline instead of delegated to a service.
- **Abstraction mixing / oversized functions**: now the dominant lint category (190 warnings, all `max-lines-per-function`/`complexity`). Worst offenders seen across this session: `PermitsStage.tsx`'s main component (295 lines, complexity 28) and `runZoneDetection` (56 lines, complexity 21); `PermitCard.tsx`'s main component (complexity 43 — highest seen); `PartnersCard.tsx` (204 lines, complexity 34); `TripSidebar.tsx` (300 lines, complexity 33); `RouteStage.tsx` (430 lines, complexity 26) plus several 30+-line handlers inside it; `GearStage.tsx` (214 lines, complexity 21); `zoneGeometry.ts`'s `derivePermitNeeds` (63 lines, complexity 18); `waterSources.ts`'s `fetchDetectedWaterSources` (86 lines, complexity 22). Run `npx eslint . 2>&1 | grep -E "max-lines-per-function|complexity" | sort` for the full list, sorted, to pick the worst first.
- **Remaining unchecked `as`/`as never` casts**: `ZonesOverlay.tsx:68` (`as never as {...}` double-cast), `PlanWizard.tsx` (`savedPlan.planStages as PlanData` at 3 call sites, no runtime validation), `permits/zone-product` route body cast, `WeatherStage.tsx`'s `r.json() as Promise<ApiClimateRow>`.

## Notes / decisions worth knowing before continuing

- Rule severity is `warn` everywhere, not `error` — intentional, so the huge pre-existing backlog doesn't block `npm run lint`. Now that magic-numbers is at 0, consider ratcheting `@typescript-eslint/no-magic-numbers` to `error` to prevent regressions — the other two rules (`complexity`, `max-lines-per-function`) still have 190 warnings and shouldn't be ratcheted yet.
- `VISUAL_RENDERING_FILES` in `eslint.config.js` is the established pattern for "this file is pure decorative geometry, naming every pixel adds no value" — now 9 files (`ZonesOverlay.tsx` added this session). Use it again for another purely-decorative SVG/map/chart file; don't reach for it on files that mix business logic with a bit of geometry (extract the geometry into its own file first, as done with `PlanAccessError.tsx`).
- `TRANSCRIBED_FORMULA_FILES` (separate from `VISUAL_RENDERING_FILES`) holds `sun.ts`/`units.ts` — confirmed suppressed via explicit user decision, not an oversight. `geo.ts` and `zoneGeometry.ts` were checked for the same treatment and did **not** need it — their literals were ordinary reusable constants, not walls of distinct algorithm coefficients. Use that as the judgment call for any future "is this a formula file?" question: one or two repeated conversion factors → name them; a dozen+ distinct unrelated coefficients transcribed from a reference algorithm → exempt the file.
- `Modal.tsx` was deliberately kept dependency-free (no Headless UI / Radix / native `<dialog>`) per user's call — it has **no focus trap, no Escape-to-close, no focus restoration**. None of the original hand-rolled dialogs had that either, so this isn't a regression, but worth knowing if accessibility work comes up later.
- Nothing from the second half of this session has been committed yet — working tree is dirty. Ask before committing/pushing.
