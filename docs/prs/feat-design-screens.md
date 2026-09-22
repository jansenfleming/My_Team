# feat/design-screens: boot, layout, motion spec (D3)

Author: creative-director (WIP commit `44d27b4`, 2026-09-21). This PR file written by the architect on 2026-09-22: the lead paused the creative-director for non-QA work before it could write its own PR file or self-review, so the architect did the review and this write-up directly from the existing draft, per the lead's instruction. No content in `screens.md` was changed.

Branch: `feat/design-screens`. Base: `main` at `6dc6df5` (after PR #11, `feat/design-commands`). Docs only.

## What changed
`docs/design/screens.md` (new file, 322 lines): the D3 deliverable per the board. Covers:
- Section 1-2: single-screen layout rule, and the "real, pacing, or fiction" table that pins down which on-screen values must be real readings (health, latency, session, clock) versus staged pacing versus marked fiction (`// ` lines).
- Section 3: landmark/DOM structure and exact first-paint `index.html` markup (no FOUC, no layout jump before React mounts).
- Section 4: layout, breakpoints (compact/regular/wide in `em`), full desktop (1280x800) and mobile (390x844) ASCII wireframes, touch-only quick-command chips.
- Section 5: boot sequence (exact line strings, typing schedule, skip rule, returning-visitor short boot, reduced-motion path, boot accessibility).
- Section 6-9: rail states, session/prompt transitions, screen states table, keyboard/focus rules (including mobile-keyboard viewport handling).
- Section 10: effects catalog, one row per effect with trigger, duration/easing, reduced-motion fallback, and CPU cost; explicitly lists effects deliberately left out (scanlines, glow, particles, etc.).
- Section 11: acceptance checks written for F5 to test against.
- Section 12: app constants that are not CSS tokens (timeouts, thresholds, storage key).

## Self-review against D1/D2 (architect, standing in for the author's own review)
- **Ownership/scope:** only `docs/design/screens.md` touched; no code, no other design files. Within the Creative Director's owned path.
- **Real-readings-only rule (concept.md rule 1):** restated explicitly as the file's governing rule (line 7) and enforced by the section 2 table for every value shown (display size, motion preference, clock, uplink version/latency, session/clearance). Non-real values are explicitly labeled Pacing, Label, Fiction, or Decorative, and fiction lines are required to carry the `// ` marker. No invented telemetry.
- **Reduced motion:** covered at three levels — boot (5.7: no typing/pacing delays, same content and order for screen readers), a fallback listed per effect in the section 10 catalog (every effect has one, e.g. sweep rotation -> static glyph with color still carrying state), and an explicit acceptance check (11.5) tying it to a test with `matchMedia` mocked. `tokens.css` collapsing durations to 0ms under `reduce` (per `style-guide.md`) is the belt to this spec's suspenders.
- **Mobile and desktop:** both breakpoints get their own wireframe (4.1, 4.2) and rules for what differs (compact rail omits an empty clearance segment, compact prompt drops the host, chips appear only on touch/compact and are absent, not hidden, on desktop so keyboard users never tab through them). Mobile keyboard handling (`interactive-widget=resizes-content`, `visualViewport` resize, safe-area gutters) is specified, and manual checks at 320/390/768/1280px and 200% zoom are listed in the acceptance checks (11.10).
- **Token usage:** spot-checked every custom property referenced in the file (durations, easings, colors, spacing, z-index, radius, tap target, etc.) against `docs/design/tokens.css` — all resolve to tokens that already exist there; nothing invented.
- **No fabricated owner facts:** the file is UI/interaction structure only; it carries no personal content (that lives in `concept.md`/`terminal-commands.md`, already placeholder-gated).
- **Downstream dependency:** every value an engineer would need to guess is pinned (exact strings, exact timings, exact token names); section 13 states plainly what is out of scope (command text is D4's, easter eggs are D5's, and the spec itself is unverified in a real browser until D6).

## Gaps / follow-ups
- This is a docs-only review by the architect standing in for the author. The creative-director has not personally re-read `screens.md` since writing it; when it resumes work it should skim its own draft once for voice/consistency, but the architect found no correctness or scope problems that would block F5 from starting.
- Section 12's health-poll interval is explicitly flagged in the file itself as droppable if the architect judges it not worth the complexity; the architect's call: keep it as specified (it is cheap, a real reading, and gives F5 a concrete interval rather than "TBD").

## How to review
Read the diff (single new file, no code). No tests apply to a docs-only branch per the board rules; this needs architect review only (no QA gate required for `docs/design/**`).

## Status
Ready for architect approval and merge.
