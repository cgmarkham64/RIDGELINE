# Handoff — code-quality cleanup

Last commit: `d7a1b24` — "Refactor FoodStage and DayMealDialog to zero warnings (complexity 30 -> 0, 13 warnings -> 0)"
Working tree: one unrelated uncommitted change — `weather/WeatherStage.tsx` has a `gap-[18px]` → `gap-4.5` Tailwind class normalization made by the environment's auto-lint/format hook, not part of this work. Otherwise clean. Not pushed (branch is ahead of `origin/main` by several commits).

## Status: complexity/max-lines-per-function cleanup is IN PROGRESS

This session continued the `complexity`/`max-lines-per-function` backlog from the prior handoff, working top-down through the worst offenders by complexity score.

`npm run lint` warning count: **127 → 105** (all remaining warnings are `complexity`/`max-lines-per-function`; `no-magic-numbers` stays at 0). Frontend build (`npm run build`) is clean after every commit.

### What happened, in order

1. **`2c09b07`** — `RouteMapCard.tsx` (complexity **77**, 534 lines — biggest item in the repo) split into ~20 files: presentational subcomponents for the header, canvas, all marker/overlay layers, draw-mode step rail, context menu, and empty state; hooks for GPX import/drag-drop, waypoint placement, and zone overlays; a shared types file. 127 → 125.
2. **`cace3fe`** — `WeatherStage.tsx` (complexity **77**, 618 lines — tied for biggest) split into ~20 files: location banner, historical-climate card, forecast card (+ pagination/day-grid/sun-times), departure-risk card, notes, right rail; hooks for data fetching (geocode/climate/forecast with stale-closure-safe effects), checklist, forecast paging, derived risk/loading flags. Also simplified `WmoConditionIcon`'s `classify()` from an if-chain to a range-lookup table. 125 → 118.
3. **`d7a1b24`** — `FoodStage.tsx` (complexity 30, 9 warnings — worst warning-count concentration in the repo) split into `TargetsCard`, `MealGrid`+`MealGridRow`, `ResupplySection`+`SegmentStrip`+`ResupplyStopCard`, `BearCanNeedCard`, `FoodRightRail`, `FoodDayDialog`, plus helpers/hooks/types. The closely-related `DayMealDialog.tsx` (4 more warnings, same folder) was split too: header, `MealSlotsList`/`SlotSection`, `ItemRow`+`ItemMacroFields`+`NutritionCandidates`, `CopyToDaysPicker`, `DayTotalsBar`. 118 → 105.

### Process this session added: independent review after every big split

For each of the three files above, after reaching zero lint warnings, a **fresh subagent with no context from the refactoring work** was given the full diff and asked to hunt specifically for behavior changes the mechanical extraction could have introduced (stale closures, dependency-array drift, ref-safety violations, threshold/precedence changes in extracted pure functions, props silently widened/narrowed). This is worth continuing — it caught one real bug:

- **`FoodStage.tsx`**: `useFoodPersist(onChange, s)` was passed the *entire* `useFoodState()` return value (including `macroDefaults`, `activeDayIdx`, and setter functions) instead of the narrow `{meals, mealsLocked, resupplyStops, bearCanNeed, targets}` shape the persist hook expects. TypeScript's excess-property check doesn't fire on a variable (only on object literals), so this compiled clean and would have silently leaked those extra fields into `Trip.planStages.food` on every autosave. Fixed by passing an explicit narrow object literal, and `FoodDayDialog`'s props were tightened from `{state: ReturnType<typeof useFoodState>}` to named fields to prevent the same class of bug recurring.

**Lesson for future splits**: never pass a hook's full return object to another hook/component expecting a narrower shape — TypeScript won't catch the excess properties unless you construct an object literal at the call site. Grep for `useXState(...)` results being passed wholesale (`useYPersist(onChange, s)` style) as a smell.

### Reusable patterns/infrastructure from this session

- **Pull loading/derived-boolean computations into the data-fetching hook's own return value** rather than computing them in the orchestrator — e.g. `useWeatherFetching` now returns `geoLoading`/`climateLoading`/`forecastLoading` directly (computed via extracted `computeGeoLoading`/etc. pure functions), which is what got `WeatherStage`'s complexity from 16 down under 10.
- **Move a conditional render's null-check inside the component being conditionally rendered** instead of gating at the call site — e.g. `WeatherDepartureCard` now does `if (!risk || !riskStyle || !factors) return null` internally rather than the caller writing `{computedRisk && risk && riskStyle && <WeatherDepartureCard .../>}`. Removes branches from the parent for free.
- **Range-lookup tables beat if-chains for classify-by-threshold functions** — see `WmoConditionIcon.tsx`'s `CLASS_RANGES: {max, cls}[]` + `.find()`, replacing a 9-branch if-chain. Only valid when the input domain is a known discrete set (documented in a comment) — a true continuous range needs the if-chain's exact boundary semantics preserved.
- **A generic `sumField(items, field)` helper replaces repeated per-macro `.reduce()` blocks** (kcal/protein/fat/carbs/weight, each `* (i.qty ?? 1)`) — see `foodStage.helpers.ts`'s `sumField`/`rowKcalAndOz` and `dayMealDialog.helpers.ts`'s `sumDayField`. Same pattern is likely duplicated in `RouteTable.tsx`/`routeStage.helpers.ts` (mile/gain reduces) if you're in there for the sweep.
- **`react-hooks/preserve-manual-memoization`** (React Compiler's ESLint rule) can force a `useMemo` dependency array to depend on a whole object (`trip`) even when the code only reads one field (`trip?.startDate`), if the compiler's inferred dependency is "less specific than the source." When you see "Could not preserve existing manual memoization," widen the dep to match the compiler's inferred one rather than fighting it — this is a correctness-neutral, mechanical fix, not a real bug.

### Two non-obvious lint-tool findings from the prior session (still true, still relevant)

1. **`eslint-plugin-react-hooks` v7's ref-safety analysis** flags `ref={someObject.someRefField}` as "Cannot access ref value during render" specifically when the ref is threaded through a custom hook's *returned object* and consumed via `ref=` in a **different component** than the one that called the hook. It does NOT fire when the hook is called and the ref is consumed in the same component (confirmed empirically this session with `gpx.fileInputRef`). **Fix pattern**: keep the `useRef()`-owning hook call and the `<input ref={...}>`/`<div ref={...}>` JSX in the same component; if you need to split that component further, keep the ref+its element together and pass everything else down as props.
2. **The `complexity` rule counts optional-chaining (`?.`) and nullish-coalescing (`??`) as branches**, same as `&&`/`||`/ternaries/`if`. Guard once on the parent being undefined, then access non-optional fields directly instead of chaining `?.`/`??` per field.

### Recurring decomposition pattern used across every file this session

For each God component: pull out (a) an orchestrator that just composes children and holds top-level state, (b) presentational subcomponents per visually-distinct section (each gets `show`/data props, not raw `&&` conditionals wrapping them in the parent), (c) one or more custom hooks for state+handlers that belong together (data fetching, derived values, checklist/progress), and (d) a `*.helpers.ts`/`*.types.ts` pair for pure functions and shared types. When a single component is still over budget after one level of extraction, extract again — e.g. `RouteMapCard` → `RouteMapCardBody` → `RouteMapCanvas` → `RouteMapLayers` → `RouteMapMarkers`, each removing one layer of JSX/props from the one above. Don't be afraid of 15-20 files for a single "God component" — that's the expected shape here, not a sign you've gone too far.

## What's next

Live list: `npx eslint . 2>&1 | grep "complexity of" | sort`

Worst by complexity remaining:
- **`PermitCard.tsx`** — complexity 43, 183 lines.
- **`PermitsListView.tsx`** — complexity 42, 274 lines (plus a nested 58-line arrow function).
- **`routeStage.helpers.ts`'s `buildMergedRows`** — complexity 31, 81 lines (limit 30 — it's a `.ts` file). *(pre-existing, not touched — RouteMapCard's refactor added other functions to this file but left this one alone)*
- **`JournalEntryForm.tsx`** — complexity 31, 315 lines (also contains `entryToDefaults`, complexity 25).
- **`RouteTable.tsx`'s `SortableCampRow`** — complexity 31, 108 lines.
- **`DrawConfirmTray.tsx`** — complexity 30, 175 lines. *(in `route/`, untouched — RouteMapCard's refactor didn't touch this sibling file)*
- **`RouteStage.tsx`'s `handleConfirmSegment`** (async) — complexity 30, 61 lines.
- **`PermitsStage.tsx`** — complexity 28, 295 lines (plus `runZoneDetection`, complexity 21/56 lines).
- **`RouteStage.tsx`** (main component) — complexity 26, 430 lines, 8 total warnings in the file.
- **`PlanWizard.tsx`** — complexity 23, 194+ lines.
- **`GearStage.tsx`** — complexity 21, 214 lines.
- **`routeMapCard.helpers.tsx`'s `ContextMenuLayer`** — 56 lines (limit 50, barely over). *(pre-existing, untouched — the whole file was left as-is except one import cleanup)*
- **`routeStage.helpers.ts`'s `fetchRoutePreview`** — 52 lines (limit 30, it's a `.ts` file). *(pre-existing, untouched)*

Worst by warning-count-per-file: `RouteStage.tsx` (8), `RouteTable.tsx` (6), `JournalEntryForm.tsx` (5), `PermitsStage.tsx`/`GearStage.tsx` (4 each), `RouteRightRail.tsx` (2, in `route/`).

Also untouched, smaller: `CriticalDatesCard.tsx` (135 lines), `PermitAtoms.tsx`'s `PermitTypeIcon` (complexity 11, barely over — probably a quick `switch`→lookup-table fix).

Suggested order: `RouteStage.tsx` next — it's the worst by warning-density (8 warnings in one file) and lives in the `route/` folder already full of the small helper components from this session's `RouteMapCard` split, so some of its logic (draw-mode handlers, segment confirm/split) may already have natural homes to move into. Then `PermitCard.tsx`/`PermitsListView.tsx` since `permits/` is otherwise clean from a prior session. `DrawConfirmTray.tsx` is a good quick-ish win since it's already isolated and self-contained (175 lines, complexity 30, no cross-file coupling to untangle).

Still-open non-complexity items from the original code-quality audit (untouched, carried over from prior handoffs):
- **Thin route handlers**: `notifications.ts` accept-invite, `auth.ts` `GET /me`, `trips.ts` `PUT /:id` still have multi-step business logic written inline instead of delegated to a service.
- **Remaining unchecked `as`/`as never` casts**: `ZonesOverlay.tsx:68`, `PlanWizard.tsx` (`savedPlan.planStages as PlanData`, 3 call sites), `permits/zone-product` route body cast. (`WeatherStage.tsx`'s `r.json() as Promise<ApiClimateRow>` from the prior list has moved to `weatherStage.helpers.ts`'s `fetchClimateNormals` this session — still present, still unchecked, not fixed.)

## Notes / decisions worth knowing before continuing

- Rule severity is `warn` everywhere, not `error` — intentional, so the backlog doesn't block `npm run lint`. Don't ratchet `complexity`/`max-lines-per-function` to `error` until this item is fully closed (still 105 warnings out).
- `VISUAL_RENDERING_FILES` and `TRANSCRIBED_FORMULA_FILES` in `eslint.config.js` are unrelated to this item (magic-numbers only) — not touched, still accurate per prior handoffs.
- `Modal.tsx` still has no focus trap / Escape-to-close / focus restoration, per prior user decision — unchanged, still worth knowing for accessibility work.
- Every file taken to zero this session was verified with `npx eslint <file>` (targeted) plus a full `npm run build` after each change, **plus an independent cold-review subagent pass on the full diff** for the three big files — no known regressions. The IDE/hook setup in this environment runs lint+build automatically on every `Write`/`Edit`, catching most issues (missing imports, ref-safety, off-by-a-few-lines misses) immediately.
- Could **not** manually exercise any of the changed UI in a browser this session — `npm run mongodb:start` still fails with `Error: Refusing to load formula mongodb/brew/mongodb-community@8.0 from untrusted tap mongodb/brew` on this machine (pre-existing, needs `brew trust`, a system config change, not fixed). All verification was build + lint + type-check + independent-agent-review. If you get MongoDB running, a manual pass over the route map (GPX upload/drag-drop, waypoint placement, draw-and-split segments), the weather stage (forecast pagination, departure-risk banner), and the food stage (meal grid warnings, resupply stop ordering, day-meal dialog copy-to-days) would be worth doing — these three are this session's highest behavioral-risk refactors.
- The commit history has diverged from `origin/main` (ahead by several commits, not yet pushed) — confirm with the user before pushing.
