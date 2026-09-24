# Review: `feat/design-products` (D3 — product concepts and copy)

Reviewer: Architect. Branch base: `main` @ `acd3482`. Branch head: `51bcb8f` (1 commit,
not pushed). Files touched: `docs/design/products.md` (new), `docs/prs/feat-design-products.md`
(new). Reviewed 2026-09-24.

## Verdict: changes requested (not approved yet)

One real technical-accuracy error, per D1's own hard rule ("every technical claim ...
must be actually correct, not just plausible-sounding" — and D1 names `git blame`'s
output format specifically as an example that has to be right). Everything else checked
out. This is a small, mechanical fix, not a rework — should be quick to turn around.

## 1. Count / structure — pass

- Section 0 states the split plainly: 12 main-catalog products (within the 6-12 range)
  + 1 additional hidden 13th, explicitly **not** counted toward the 6-12 and explicitly
  excluded from grid/listing-data/sitemap/"all products" loops and from direct/guessed-URL
  navigation. Section 3 repeats the constraint in bold, addressed directly to the
  Engineer. Section 4's summary table also marks product 13 as hidden and separates the
  category totals ("visible catalog, 12" vs. "Including the hidden product: ... 13
  total"). This satisfies the board's D3 requirement and D1's egg spec precondition.
- Category count verified by hand: shirts 1,2,3,4,5 (5) + hidden 13 = 6 shirts total;
  sweatshirts 6,7,8,9 (4); hats 10,11,12 (3). 5+4+3 = 12 in the visible catalog, matches
  the brief's 6-12 range. No accessories anywhere — every item is a tee/hoodie/crewneck
  or cap.

## 2. Voice / technical-accuracy spot-check

Checked every real-format claim named in the PR's own "How to review" list.

- **`crontab -l` 5-field syntax** (product 6, "cron Crewneck"): minute/hour/
  day-of-month/month/day-of-week, `*` = "every" — correct, and the example fields are
  syntactically valid.
- **TCP three-way handshake** (product 11, "TCP Handshake Cap"): SYN -> SYN/ACK -> ACK
  — correct sequence and direction.
- **HTTP 403 vs. 404 semantics** (product 4, "403 / 404 Tee"): "One means it exists and
  you can't have it. The other won't even confirm that much" — correct, standard
  distinction (403 = access denied to a resource whose existence is implied; 404 =
  no claim made either way).
- **Exit code 0 = success** (product 1, "Exit Code 0 Tee"): correct.
- **HTTP 200 OK** (hidden product 13): correct, and the description line intentionally
  reuses the back half of D1's own do/don't example. Minor: it drops D1's leading
  clause ("Two hundred okay.") and keeps only "Everything you asked for, nothing you
  didn't," so calling it "verbatim" in the PR description slightly overstates it — but
  this is a wording nitpick, not a technical-accuracy problem, not blocking.
- **Common Log Format** (product 4 hangtag): field order (host, ident, authuser,
  [timestamp], "request", status, bytes) and the `-` convention for unavailable fields
  are correct. Minor: the request field normally includes the protocol
  (`"GET /path HTTP/1.1"`); the example uses `"GET /this-shirt"` with no protocol.
  Real-world CLF lines essentially always include it. Small enough that I wouldn't block
  on it alone, but worth tightening — flagging alongside the item below since both are
  in the same product's hangtag.
- **`git blame` "porcelain" output** (product 2, "git blame Tee") — **incorrect claim,
  required fix.** The doc (and the PR's own "Checks run" section) labels the hangtag
  format as `git blame`'s *porcelain* output: "abbreviated hash, author, date, time, UTC
  offset, line number." I ran both to check:
  ```
  $ git blame f.txt
  ^e3d4aee (Test 2026-09-24 18:53:46 -0400 1) sized true. no exceptions.

  $ git blame --porcelain f.txt
  e3d4aee261578863d073e6f11e96eade38ddf32f 1 1 1
  author Test
  author-mail <a@b.com>
  author-time 1790290426
  author-tz -0400
  committer Test
  ...
  	sized true. no exceptions.
  ```
  The hangtag's format (`a3f9c21 (you  2026-01-01 09:14:02 -0500  1) sized true. no
  exceptions.`) is real — but it's `git blame`'s **default** human-readable output, not
  `--porcelain`. Porcelain output is a completely different multi-line, machine-readable
  format (full 40-char hash, one `key value` pair per line, tab-indented content line).
  This is exactly the failure mode D1 calls out by name ("a wrong status code or a
  made-up command breaks the joke and breaks trust with the one audience that will
  notice immediately") — `git blame --porcelain` is a real, specific term, and an
  engineer who actually runs it will immediately see the tag doesn't match. The
  displayed line itself doesn't need to change; only the label does.
  **Fix:** in `docs/design/products.md` product 2 and in the PR file's "How to review"
  and "Checks run" sections, replace "porcelain output" with "default output" (or drop
  the word "porcelain" entirely and just describe the fields, which the parenthetical
  already does correctly).

## 3. Ownership — pass

`git diff main..feat/design-products --stat` shows exactly two new files:
`docs/design/products.md` and `docs/prs/feat-design-products.md`. Both are Creative
Director-owned paths (`docs/design/**`, `docs/prs/<branch-slug>.md`) per
`ownership-map.md`. Nothing under `apps/**`, `.claude/**`, or any Engineer/Architect path
is touched.

## 4. Hard-rule check — pass

- No fabricated facts about the owner or brand founding story anywhere in the doc (none
  were needed for product copy); no placeholders required either, correctly.
- Prices are explicitly labeled mock USD display values (Section 2 preamble); no copy
  implies a real transaction, shipping, or payment. Checked every description and
  special-copy block for stray commerce language — none found.

## 5. Hygiene

Run against the branch commit (`51bcb8f`), via a detached worktree at that commit (the
branch itself is checked out in another active worktree):
- `npm install` — succeeds, 0 vulnerabilities (only pre-existing engine-version warnings
  unrelated to this branch).
- `npm run scan-secrets` — `scan-secrets [working-tree]: 93 files scanned, 0 skipped, 0
  error(s), 0 warning(s) -> PASS`.
- `npm audit` — `found 0 vulnerabilities`.
- `grep -noE 'https?://...'` over both new files — no matches; no external URLs or asset
  references in the copy.

## Required changes before approval

1. `docs/design/products.md`, product 2 ("git blame Tee"): relabel the special-copy note
   from "styled as `git blame` porcelain output" to "styled as `git blame`'s default
   output" (the shown fields/format are correct; only the name is wrong).
2. `docs/prs/feat-design-products.md`: same fix in the "How to review" step 4 and the
   "Checks run" section, wherever "porcelain" is used to describe this format.

Everything else is approved as written. Once these two label fixes land, this is a fast
re-review — no other content changes needed.

## Optional, non-blocking

- CLF hangtag (product 4): consider adding `HTTP/1.1` to the quoted request line for
  full real-world fidelity. Not required.
- PR description's "verbatim" claim about the HTTP-200 reuse: accurate in spirit, just
  drops D1's first clause. No action needed.
