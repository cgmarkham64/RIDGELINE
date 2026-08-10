# Handoff — code-quality cleanup, round 2

Prior effort (see `git log` for the full history) took the repo-wide `complexity`/`max-lines-per-function` warning count from 127 → 35 across several sessions, most recently closing out `GearStage.tsx` and `PlanWizard.tsx`. That effort was deliberately stopped there. This round reopens it, explicitly, to clear out what's left for completeness.

**Status: Batches 1-6 done and committed (repo-wide warning count 35 → 8, all remaining in `server/`). Batch 7 (`server/`) not started — explicitly deferred, see below.**

Each of Batches 1-6 is its own commit on `main` (search `git log --oneline` for "Clear Batch"). Every batch was independently code-reviewed by a fresh subagent with no shared context and verified live in a browser before committing; two batches (3 and 6) had real bugs/nits caught and fixed as a result — see individual commit messages for specifics. One incidental fix worth knowing about: `App.tsx` (Batch 1) turned out to be dead Vite boilerplate never wired into the app, and was deleted rather than decomposed, along with its unused assets.

Only Batch 7 remains. Working tree should be clean before starting; commit after, not folded into anything else.

## Ground rules (same as last round — still true)

- Treat `complexity`/`max-lines-per-function` as a readability proxy, not the goal. Stop extracting once comfortably under the threshold; don't manufacture a split just to hit zero.
- If a single file's decomposition is trending past ~8-10 new files, pause and check in before continuing.
- For files with real state/effects (not just markup), get an independent cold-review pass on the diff and a live browser check before calling it done. For pure one-line-over-budget files, `tsc`+`eslint`+`build` is enough.
- Verify current warning counts with `npm run lint` before starting each batch — this doc is a snapshot, not a guarantee; file line numbers will drift as earlier batches land.

## Batches 1-6 — done ✅

All frontend batches complete and committed. See `git log --oneline` for "Clear Batch N" commits. Nothing left to do here unless new warnings are introduced later.

## Batch 7 — `server/` (6 files, 8 warnings — not started, needs user sign-off before starting)

Different conventions from the frontend work: these are route handlers/scripts, not React components, so the decomposition pattern will look different — service functions and smaller helpers, not hooks/subcomponents. Confirm current line numbers with `npm run lint` before starting; this snapshot is from 2026-08-09.

- `server/scripts/migratePlans.ts` — `main` 57 lines + complexity 16 (limit 30 / 15)
- `server/src/utils/crudFactory.ts` — `makeOwnerCrudRouter` 39 lines (limit 30), plus an unused `eslint-disable` directive to clean up
- `server/src/services/scanService.ts` — `scanJournalImage` 43 lines (limit 30)
- `server/src/services/permitService.ts` — `lookupPermit` 39 lines (limit 30)
- `server/scripts/migrate-to-keycloak.ts` — `main` 42 lines (limit 30)
- `server/scripts/remove-stale-route-checklist-items.ts` — `main` 31 lines (limit 30, 1 over) — likely a quick win, listed here only because it's a server file

**After Batch 7: expect 0 warnings repo-wide** (aside from anything newly introduced in the meantime). At that point it's worth asking the user whether to ratchet `complexity`/`max-lines-per-function` from `warn` to `error` in `eslint.config.js` to prevent regressions — don't do this unilaterally, it changes CI/build behavior.
