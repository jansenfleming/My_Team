# feat/design-tokens: D2 tokens and style guide

Author: creative-director. Branch: `feat/design-tokens`. Base: `main` (includes the merged ZeroJance concept). Docs and assets only, no application code. Review: Architect only (design branch). The lead merges via `gh`.

## What changed
- `docs/design/tokens.css`: the `--zj-*` custom properties. Exact hex palette (six inks plus two surface tints and two rule colors), semantic aliases, system monospace stack, type scale, spacing scale (4px base, rem), radius and layout sizes, motion durations and easings, sweep timings, z-index scale, hazard-tape gradient. A `prefers-reduced-motion: reduce` block collapses durations to 0ms; a `prefers-contrast: more` block brightens commentary and control borders. No `url(`, no external requests.
- `docs/design/style-guide.md`: usage rules per token, color grammar table (use / never use), the **computed contrast table** (default and `prefers-contrast: more`), meaning-without-color table, typography and spacing rules, motion rules, z-index, component cheat sheet, asset usage, forced-colors and zoom notes, Frontend checklist, verification notes.
- `docs/design/tools/check-contrast.py`: standard-library script that reads the hex values from `tokens.css`, computes WCAG contrast for every pairing the design uses, prints the table, exits non-zero on failure. Design tooling, not application code; it lets the Architect, QA, and D6 re-verify.
- `docs/design/assets/sweep-glyph.svg` (inline, `currentColor`, rotating group `#sweep`) and `favicon.svg` (fixed colors).

## Done-when check (from the board)
"Every text/background pair used is in the contrast table." The script enumerates each pairing (30 rows across both modes); a pairing not in the table is disallowed by the guide. Text pairs are all at least 5.88:1 (lowest: vermilion on ink-raised); UI/graphics pairs are all at least 3.93:1 (lowest: rule-strong on ink-raised). System fonts only, no external assets.

## How to test
```
python3 docs/design/tools/check-contrast.py           # full tables, exit 0
python3 docs/design/tools/check-contrast.py --quiet   # failures only, prints nothing when clean
python3 -c "import xml.dom.minidom as m; [m.parse('docs/design/assets/'+f) for f in ('sweep-glyph.svg','favicon.svg')]"
```
Real output from this branch: full run ends `failures: 0`, exit 0; quiet run prints nothing, exit 0; both SVGs parse as well-formed XML.

## Not verified
Nothing here has been rendered in a browser (no app code yet). `tokens.css` was checked for balanced braces and parentheses only, not by a CSS parser. The `forced-colors` guidance is design intent, untested. D6 reviews the built result.

## Notes for others
- Frontend F5: copy `tokens.css` unchanged to `apps/web/src/styles/tokens.css`; use only `var(--zj-*)`.
- QA: `check-contrast.py` is reusable for the a11y contrast spot checks in Q5.
- No new dependencies. No secrets. No personal facts.
