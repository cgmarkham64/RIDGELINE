# Handoff — code-quality cleanup

Last commit: `fd73a39` — "Address code-quality audit: security fix, DRY cleanup, shared Modal, lint tuning"
Working tree: **dirty** — magic-number cleanup below is uncommitted. Not pushed.

## What happened this session (most recent)

Continued the magic-number sweep from the previous handoff. `@typescript-eslint/no-magic-numbers` warning count: **238 → 113**.

Files taken to zero magic-number warnings:
1. **`src/components/plan/stages/route/routeStage.helpers.ts`** (21→0) — imported `mToFt()` from `lib/units.ts` instead of re-deriving `3.28084`; named the rest (`ELEV_GAIN_ROUND_TO_FT`, `COORD_DISPLAY_DECIMALS`, `DEFAULT_SPLIT_RATIO`, `MINUTES_PER_HOUR`/`MINUTES_PER_DAY`, `SUN_API_COORD_DECIMALS`, `ISO_TIME_SLICE_START/END`).
2. **`src/components/plan/stages/weather/weatherStage.helpers.ts`** (21→0) — same `mToFt()` fix (killed its own local `M_TO_FT = 3.28084` duplicate); named cache-TTL hour counts, wind-direction bucketing (`DEGREES_PER_CIRCLE`, step derived from `CARDINAL_DIRS.length` instead of magic `8`), precip/snow thresholds, lapse-rate unit.
3. **`src/components/layout/AccountDialog.tsx`** (13→0) — named avatar resize/quality constants, tooltip delay, prefs-saved timeout, avatar max-size (`MAX_AVATAR_MB` × `KB_PER_MB` × `BYTES_PER_KB` instead of inline `5*1024*1024`), and the temp/precip/wind tolerance min/max bounds used by the weather-tolerance form.
4. **`src/components/plan/PlanWizard.tsx`** (13→0) — named ISO-date-slice length, day-ms, autosave debounce, permits-checklist total, HTTP 403. **Extracted the inline "bear in jail" SVG illustration** (used only in the trip-access-error state) into a new file `src/components/plan/PlanAccessError.tsx`, added it to `VISUAL_RENDERING_FILES` in `eslint.config.js` (same treatment as the 7 other pure-geometry files) since its 6-element jail-bar x-position array is decorative pixel geometry, not business data. This also cut `PlanWizard`'s function body from 275→194 lines.
5. **`server/src/routes/auth.ts`** (12→0) — same avatar-byte-limit pattern as `AccountDialog.tsx`; named weather-tolerance validation bounds (`TEMP_TOLERANCE_MIN/MAX_F`, `PERCENT_MIN/MAX`, `WIND_TOLERANCE_MIN/MAX_MPH`) and the base64→byte-size ratio (`0.75`).

**Suppressed via eslint config, not fragmented into named constants — user's explicit call:**
- **`src/lib/sun.ts`** (31 warnings) — NOAA/Meeus sunrise-equation coefficients. Added a comment above `getSunTimes` explaining these are published algorithm constants, not independent magic numbers, plus a link to the reference formula.
- **`src/lib/units.ts`** (12 warnings) — conversion factors (1.60934 km/mi, 3.28084 ft/m, 5/9 + 32 °F↔°C). Same reasoning.
- Both are now in a new `TRANSCRIBED_FORMULA_FILES` list in `eslint.config.js` (`@typescript-eslint/no-magic-numbers: 'off'`) — sibling to `VISUAL_RENDERING_FILES` but kept as a separate constant since these aren't SVG/rendering geometry, they're math formulas. Follow-up ask after the first pass of this handoff — initially left as visible warnings, then suppressed on request.

Both frontend build (`npm run build`) and backend typecheck (`npx tsc --noEmit` in `server/`) pass clean after every change in this session.

## What's next (in rough priority order)

**Magic-number cleanup — files not yet touched**, current counts (re-check with `npx eslint <file>` — these may have drifted):
| File | Count | Notes |
|---|---|---|
| Remaining ~30 files, 1–8 warnings each | — | Lower priority, sweep opportunistically. Run `npm run lint 2>&1 \| grep -c no-magic-numbers` for the live total (113 as of this handoff), or `npx eslint . 2>&1 \| grep -B2 no-magic-numbers` to find the next-worst files. |

**Other open audit findings (not started):**
- **Thin route handlers**: `notifications.ts` accept-invite, `auth.ts` `GET /me`, `trips.ts` `PUT /:id` all have multi-step business logic written inline instead of delegated to a service.
- **Abstraction mixing / oversized functions**: surfaced as `max-lines-per-function`/`complexity` warnings, not `no-magic-numbers`. Notable ones seen this session: `routeStage.helpers.ts`'s `fetchRoutePreview` (52 lines) and `buildMergedRows` (81 lines, complexity 31); `weatherStage.helpers.ts`'s `calcDepartureRisk` (57 lines, complexity 18); `AccountDialog.tsx`'s main component (303 lines, complexity 16) and its tolerance-row-render arrow function (46 lines); `PlanWizard.tsx`'s main component (194 lines, complexity 23) and its `useMemo` stage-progress callback (31 lines, complexity 19); `auth.ts`'s `validateTimePref`/`validatePreferences` (complexity 15 each).
- **Remaining unchecked `as`/`as never` casts**: `ZonesOverlay.tsx:68` (`as never as {...}` double-cast), `PlanWizard.tsx` (`savedPlan.planStages as PlanData` at 3 call sites, no runtime validation), `permits/zone-product` route body cast, `WeatherStage.tsx`'s `r.json() as Promise<ApiClimateRow>`.

## Notes / decisions worth knowing before continuing

- Rule severity is `warn` everywhere, not `error` — intentional, so the huge pre-existing backlog doesn't block `npm run lint`. Consider ratcheting specific rules to `error` once a file/area is fully clean.
- `VISUAL_RENDERING_FILES` in `eslint.config.js` is the established pattern for "this file is pure decorative geometry, naming every pixel adds no value" — now 8 files. Use it again if another purely-decorative SVG/map/chart file surfaces, but don't reach for it on files that mix business logic with a bit of geometry (extract the geometry into its own file first, as done with `PlanAccessError.tsx`).
- `sun.ts`/`units.ts` are now fully suppressed via `TRANSCRIBED_FORMULA_FILES` in `eslint.config.js` — confirmed with user rather than assumed. Don't revert this later without checking in again; the tension (formula readability vs. rule compliance) is real and was a deliberate call, not an oversight.
- `Modal.tsx` was deliberately kept dependency-free (no Headless UI / Radix / native `<dialog>`) per user's call — it has **no focus trap, no Escape-to-close, no focus restoration**. None of the original hand-rolled dialogs had that either, so this isn't a regression, but worth knowing if accessibility work comes up later.
- Nothing from this session has been committed yet — working tree is dirty. Ask before committing/pushing.
