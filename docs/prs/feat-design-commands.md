# feat/design-commands: D4 terminal command spec

Author: creative-director. Branch: `feat/design-commands`. Base: `main`. Docs only, no code. Review: Architect only (design branch). The lead merges via `gh`.

## What changed
- `docs/design/terminal-commands.md` (new): the exact command spec the Frontend Engineer (F4) builds from.
  - 11 visible commands (`help about agents build status guestbook whoami login logout clear diagnostics`) plus alias `ledger`; `guestbook` carries the `before`, `sign`, and operator `rm` subcommands. Up to 3 hidden slots are reserved for D5, so the total stays within the 14-command cap.
  - Prompt strings (transient `4f2a@zerojance ~ $`, operator `operator@zerojance ~ #`), the masked password label, the engine's `TerminalText` strings, and one shared table mapping every contract error code, offline, timeout, and garbled response to an exact line.
  - Per command: syntax, auth, contract call, exact success and error output, `help <command>` detail blocks, registry fields, and a sample session for test fixtures.
  - Line-tone rules that map the engine's `output`/`error`/`system` kinds to the D2 styles, and a rule that visitor or server text never starts a line, so it cannot imitate a tag or commentary.

## Constraints from the Architect, and where they are met
1. Public `status` shows only the `GET /api/health` fields (status, version, contract, time) plus client-measured latency; uptime, counts, and session numbers are only in operator `diagnostics` (5.5, 5.11).
2. "the attempt was logged" appears only on `invalid_credentials`, backed by the B4 log-line criterion (2.5, 5.9).
3. `whoami` "seen from here" is client-side and read-only; the closing line says the station does not send or store it, and F4 must test that (2.5, 5.8).
4. Guestbook errors cover `validation_error`, `rate_limited` (with Retry-After seconds), `origin_rejected`, and the hidden-character rules, including the England, Scotland and Wales flag emoji note in `help guestbook` (5.7, 5.12, section 4).

## Contract check
Every server-backed command maps to an existing endpoint (contract section 7). Preflight limits use the shared constants (handle 2 to 24, message 1 to 280, username 1 to 64, password 1 to 256, UTF-16 units). No new endpoint or field is needed. Requests to Architect: none.

## Verification lists for later
- **`build` claims to verify against the finished repo before release** (F4, then D6): React, Vite and TypeScript web app; Fastify, SQLite and zod API; a shared schema package used by both sides; scrypt hashing, server-side sessions and rate limits; unit, API and independent QA suites exist; five agents all Claude Sonnet 5; changes reviewed by pull request. The `source` line stays a placeholder until the owner supplies a repository URL.
- **`about` fields** are all `[PLACEHOLDER: ...]` except the name Jansen Fleming and `[withheld]`. A test should fail if any placeholder text is replaced by an invented fact.

## Note on voice
System sentences start lowercase (a refinement of `concept.md` 4.3 "sentence case"; stated in the spec). I will align the concept doc in a later amendment if the Architect agrees.

## Not verified
Docs only; nothing was run or rendered. Line lengths inside fenced blocks were checked with a script (all at most 72 characters). Wrapping in a browser is D6's review.
