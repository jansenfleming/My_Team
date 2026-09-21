#!/usr/bin/env python3
"""Contrast checker for docs/design/tokens.css (standard library only).

Reads the color tokens from tokens.css, computes WCAG 2.x contrast ratios for
every foreground/background pair the design actually uses, prints a Markdown
table, and exits non-zero if any pair misses its threshold.

  python3 docs/design/tools/check-contrast.py            # print table, check
  python3 docs/design/tools/check-contrast.py --quiet    # only failures

Thresholds: text = 4.5:1, large text and UI/graphics = 3:1.
Formula: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
Add a row to PAIRS whenever a new color pairing is used in the UI.
"""
import re
import sys
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "tokens.css"
MARKER = "/* == prefers-contrast: more =="

TEXT, UI, DECOR = 4.5, 3.0, None

# (foreground token, background token, threshold, where it is used)
PAIRS = [
    ("--zj-bone", "--zj-ink", TEXT, "Output data, visitor input echo"),
    ("--zj-bone", "--zj-ink-raised", TEXT, "Text in status rail and chips"),
    ("--zj-bone", "--zj-ink-fault", TEXT, "Text inside a fault block"),
    ("--zj-slate", "--zj-ink", TEXT, "Commentary `// `, T+ clock"),
    ("--zj-slate", "--zj-ink-raised", TEXT, "Rail chrome, chip hints"),
    ("--zj-slate", "--zj-ink-fault", TEXT, "Commentary inside a fault block"),
    ("--zj-amber", "--zj-ink", TEXT, "Prompt, links, [warn] tag"),
    ("--zj-amber", "--zj-ink-raised", TEXT, "Chip labels, rail clearance, [warn]"),
    ("--zj-amber", "--zj-ink-fault", TEXT, "[warn] inside a fault block"),
    ("--zj-verdigris", "--zj-ink", TEXT, "[ ok ] tag"),
    ("--zj-verdigris", "--zj-ink-raised", TEXT, "[ ok ] tag in rail"),
    ("--zj-vermilion", "--zj-ink", TEXT, "[fail] tag, rejected input"),
    ("--zj-vermilion", "--zj-ink-raised", TEXT, "Uplink lost text in rail"),
    ("--zj-vermilion", "--zj-ink-fault", TEXT, "[fail] inside a fault block"),
    ("--zj-ink", "--zj-amber", TEXT, "Selected text, pressed chip"),
    ("--zj-amber", "--zj-ink", UI, "Focus ring, block cursor"),
    ("--zj-amber", "--zj-ink-raised", UI, "Focus ring on a chip or the rail"),
    ("--zj-amber", "--zj-ink", UI, "Hazard tape stripes vs their gaps"),
    ("--zj-verdigris", "--zj-ink", UI, "Sweep glyph, uplink healthy"),
    ("--zj-verdigris", "--zj-ink-raised", UI, "Sweep glyph in the rail"),
    ("--zj-vermilion", "--zj-ink-raised", UI, "Sweep glyph, uplink down (rail)"),
    ("--zj-rule-strong", "--zj-ink", UI, "Chip border on the page"),
    ("--zj-rule-strong", "--zj-ink-raised", UI, "Chip border on raised surface"),
    ("--zj-rule", "--zj-ink", DECOR, "Decorative dividers only (exempt, carries no meaning)"),
]

# Tokens overridden inside `@media (prefers-contrast: more)`; rechecked.
MORE_PAIRS = [
    ("--zj-slate", "--zj-ink", TEXT, "Commentary"),
    ("--zj-slate", "--zj-ink-raised", TEXT, "Rail chrome"),
    ("--zj-slate", "--zj-ink-fault", TEXT, "Commentary in a fault block"),
    ("--zj-rule-strong", "--zj-ink", UI, "Chip border"),
    ("--zj-rule-strong", "--zj-ink-raised", UI, "Chip border on raised surface"),
    ("--zj-rule", "--zj-ink", DECOR, "Dividers (decorative)"),
]


def parse(block: str) -> dict:
    return dict(re.findall(r"(--zj-[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;", block))


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    chans = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in chans]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def run(pairs, colors, title, quiet):
    failures = 0
    if not quiet:
        print(f"\n### {title}\n")
        print("| Foreground | Background | Ratio | Needs | Result | Used for |")
        print("|---|---|---|---|---|---|")
    for fg, bg, need, use in pairs:
        r = ratio(colors[fg], colors[bg])
        if need is None:
            result, needs = "exempt", "n/a"
        else:
            ok = r >= need
            result, needs = ("pass" if ok else "FAIL"), f"{need}:1"
            failures += 0 if ok else 1
        if not quiet or result == "FAIL":
            print(f"| `{fg[5:]}` {colors[fg]} | `{bg[5:]}` {colors[bg]} | "
                  f"{r:.2f}:1 | {needs} | {result} | {use} |")
    return failures


def main() -> int:
    quiet = "--quiet" in sys.argv
    text = TOKENS.read_text()
    base_text, _, more_text = text.partition(MARKER)
    colors = parse(base_text)
    more = {**colors, **parse(more_text)}
    failures = run(PAIRS, colors, "Default", quiet)
    failures += run(MORE_PAIRS, more, "prefers-contrast: more (overrides applied)", quiet)
    if not quiet:
        print(f"\nfailures: {failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
