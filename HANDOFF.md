# Handoff — Trailhead palette (Direction A)

**Status: not started.** Decision made, scope scouted, nothing implemented yet. Session ran low on tokens before work began — this doc is the pickup point.

## Decision

Went with **Direction A — "Trailhead"** from the palette review (three directions were mocked up and compared; see chat history / the published artifact if you need the other two for reference). Thesis: change as little as possible, fix only what's measurably broken.

- **Amber stays** the brand color and the "do this" color — primary buttons, wordmark, CTAs, focus states. Unchanged.
- **Pine takes over "you are here"** — active/selected states — freeing amber from double duty.
- **`--color-text-dim` gets recolored** — it fails WCAG AA today (3.93:1, needs 4.5:1) and is used well beyond captions.

## Fix 1 — text-dim contrast (small, safe, do this first)

One line in `src/index.css`:

```css
--color-text-dim: #836c58;   /* current — 3.93:1 on --color-bg, fails AA */
--color-text-dim: #8f7862;   /* fixed — 4.65:1, passes AA */
```

This is a CSS custom property, so every one of the ~148 files using the `text-text-dim` Tailwind utility (Tailwind v4 auto-generates `text-{name}` from `@theme` color tokens) is fixed at once — no component edits required. Verify with a contrast checker against `--color-bg` (#0f0d0b) before committing to the exact hex; #8f7862 was computed by hand during the review and should be spot-checked.

Optional follow-up, **not required to close Finding 01**: some `text-text-dim` usages are real reading copy (e.g. `.trip-description` in `src/index.css` itself) rather than labels/captions, and would read better on `text-text-mid` (already 5.7:1) regardless of the dim fix. Worth a pass if there's time, but the variable fix alone clears the AA bar everywhere — don't block on this.

## Fix 2 — pine takes over "selected" (bigger than it looked in the pitch)

The mockup only showed three shared CSS classes in `src/index.css` — `.rail-btn.active`, `.tab-btn.active`, `.day-btn.active` — swapping their amber for pine is mechanical and low-risk. **But the Plan Wizard (most of the app's actual surface area — see "Trips + Plan Wizard Unification" in the Active Work section above) has its own separate, bespoke "active/selected" patterns that also use amber and weren't part of that mockup.** Confirmed during scouting, not yet touched:

- `src/components/plan/StageRail.tsx` — the wizard's own nav rail (`isActive ? 'bg-amber-glow border-l-amber' : ...`, plus the "Plan overview" row and stage label coloring). This is the most direct real-world analog of "you are here" in the whole app — arguably more important to fix than the top-level icon rail.
- `src/components/plan/JumpChip.tsx` — cross-stage navigation links, hardcoded amber (`bg-amber-glow border-amber-border ... text-amber`).
- `src/components/plan/Ring.tsx` — progress ring highlight state, `var(--color-amber)` / `var(--color-amber-glow)`.
- `src/components/plan/Pill.tsx` — has an `amber` tone option in its tone map. Need to check call sites: if `tone="amber"` is being used to mean "this is the current/selected one" anywhere, that's in scope; if it's just a semantic label color (e.g. a status tag) unrelated to selection, leave it.

`grep -rln "amber" src --include="*.tsx"` currently hits **104 files**. Most of those are legitimate (buttons, brand, CTAs) and should stay amber — the task is finding the subset that means "selected/active/current," not touching all 104. Recommend starting from the four files above, then grepping each stage folder (`src/components/plan/stages/*/`) for `amber` used on the currently-selected item in a list/grid (permit type picker, gear category card, etc. — anywhere the UI shows "this one, not those" using the same color as "click to submit").

## Ground rules (same as prior cleanup rounds — still true)

- This is a "confirm current state before starting" scan, not a guaranteed file list — amber usage will have drifted by the time you pick this up. Re-run the greps above first.
- Fix 1 (index.css variable) is safe to do standalone, no visual check needed beyond a glance — it only moves a color closer to itself.
- Fix 2 touches user-facing "what's selected" state across the whole Plan Wizard. Get a live browser check across at least: top nav rail, a trip's tab row, the day selector, the wizard's StageRail (both a mid-stage state and the "Plan overview" row), and one JumpChip click-through. Don't just trust the diff.
- If the Fix 2 audit turns up more than ~8-10 files needing edits beyond the four already identified, that's expected (StageRail/JumpChip/Ring are used everywhere) — not a signal to stop, just note it's the real bulk of this task, not scope creep.
- Semantic colors (red for danger/delete) are untouched by any of this — only amber's "active/selected" role moves to pine. Sky and pine's *existing* semantic uses (btn-sky, btn-pine, weather risk banners, etc.) also stay as-is; only pine's total footprint grows.

## Not in scope for this round

Directions B (Contour) and C (Alpenglow) — bigger palette changes, not chosen. Revisit only if Trailhead ships and still feels dated after the hierarchy fix.
