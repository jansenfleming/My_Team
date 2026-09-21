# ZeroJance Terminal Command Spec (D4)

Owner: Creative Director. Task D4 (`feat/design-commands`). Builds on `concept.md` (world, voice, rules) and `docs/architecture/api-contract.md` (section 7 mapping; the contract wins on any API detail).
For the Frontend Engineer (F4): every string below is exact. `{braces}` are variables defined in section 2. Copy strings into `apps/web/src/content/`; do not paraphrase. Where a line is shown, "the line" means the whole line including any leading spaces.

Personal facts: only the name Jansen Fleming is real. Every other fact about the owner is a `[PLACEHOLDER: ...]` that must reach the screen unchanged until the owner supplies the value.

---

## 1. Scope and inventory

MVP cap: 14 commands. This spec defines **11 visible commands**; **up to 3** hidden slots are reserved for D5 (easter eggs). Guessed shell commands (`sudo`, `ls`, and so on) are answered by a small quip table owned by D5 inside the unknown-command path; they are not registered commands, not in `help`, and not counted.

| Command | Aliases | Auth | API call (contract section 7) | Kind |
|---|---|---|---|---|
| `help [command]` | none | anyone | none | static |
| `about` | none | anyone | none | static |
| `agents` | none | anyone | none | static |
| `build` | none | anyone | none | static |
| `status` | none | anyone | `GET /api/health` | server |
| `guestbook [before <id>]` | `ledger` | anyone | `GET /api/guestbook?limit=10[&before=<id>]` | server |
| `guestbook sign <handle> <message>` | via `guestbook` | anyone | `POST /api/guestbook` | server |
| `whoami` | none | anyone | `GET /api/auth/me` | server |
| `login <username>` | none | anyone | `POST /api/auth/login` | server |
| `logout` | none | anyone | `POST /api/auth/logout` | server |
| `clear` | none | anyone | none | static |
| `diagnostics` | none | operator | `GET /api/admin/diagnostics` | server |
| `guestbook rm <id>` | via `guestbook` | operator | `DELETE /api/admin/guestbook/:id` | server |

`guestbook` is one registered command with subcommands (`before`, `sign`, `rm`). Registered names: `help about agents build status guestbook whoami login logout clear diagnostics` (11) plus alias `ledger`. Nothing here needs an endpoint outside the contract. Requests to Architect: **none**.

Command names are matched case-insensitively (the engine lowercases). Arguments are case-sensitive. Empty input prints nothing but a fresh prompt. Ctrl+L and `clear` are the same action.

## 2. Conventions

### 2.1 Voice and form
- System sentences start lowercase and end with a period; identifiers (`ZEROJANCE`, `TRANSIENT-4F2A`), tags, and placeholders keep their case. This is a deliberate refinement of `concept.md` 4.3 ("sentence case") for the station's quiet register; the concept doc will be aligned in a later amendment.
- No exclamation marks, no emoji. Lines are written to wrap under 72 characters.
- The station never claims something that is not true. Every "was logged" or "not sent" statement is backed by behavior (see 2.5).

### 2.2 Line tones (how a string is presented)
The engine has three output kinds (`output`, `error`, `system`). Presentation follows:

| Kind | Text rule | Style (`style-guide.md`) |
|---|---|---|
| `output` | anything else | data: `--zj-fg`. A leading tag `[ ok ]` or `[ .. ]` is colored `--zj-fg-ok` (ok) or `--zj-fg-dim` (`[ .. ]`) |
| `system` | always starts with `// ` | commentary: `--zj-fg-dim` |
| `error` | always starts with `[fail] ` or `[warn] `, continuation lines start with 7 spaces | `[fail]`: fault block (`--zj-bg-fault`, 2px `--zj-fg-fault` left border, tag `--zj-fg-fault`). `[warn]`: no block, tag `--zj-fg-warn` |

- A tag is styled only at column 0 of a line the app authored. **Visitor or server text must never start a line**: guestbook messages are indented five spaces, handles follow a `#id`, and everything else that echoes visitor text is inside quotes or after a label. This keeps visitor text from imitating a tag or commentary.
- All text is rendered as text nodes, never HTML. Server and visitor strings are inert data.
- The tag itself is the non-color cue; do not rely on color alone.

### 2.3 Variables
| Variable | Definition |
|---|---|
| `{id}` | 4 uppercase hex chars, random per page load (`TRANSIENT-{id}`); lowercase in the prompt. Client-side, never sent or stored |
| `{name}` | the visitor-typed command name, first 32 characters, `...` appended if cut |
| `{n}` | a number computed from a real value (count, length, id, ms) |
| `{retry}` | from `Retry-After` seconds `s`: `s` at most 120 gives `{s} s`; above 120 gives `{ceil(s/60)} min`. Header missing gives `shortly` |
| `{requestId}` | `error.requestId` from the API error body (opaque, safe to show) |
| `{stamp}` | `createdAt` shown as `YYYY-MM-DD HH:MMZ`, cut from the ISO string (characters 0-9 and 11-15, no locale or timezone math). If the string does not match `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}` show `[unknown]` |
| `{dur}` | seconds as `{s}s` under 60, `{m}m {s}s` under 3600, `{h}h {m}m` under 86400, else `{d}d {h}h` |
| `T+` clock | time since page load: `T+MM:SS`, or `T+H:MM:SS` from one hour |
| `{ms}` | client-measured latency in whole milliseconds: `performance.now()` at response parsed minus at request start, rounded |

Server-provided strings (`version`, `contract`, `time`, `nodeVersion`, `db`, `username`, `handle`, `message`) are printed as plain text. Cap every one except `handle` and `message` at 32 characters (`...` if cut).

### 2.4 Prompt
- Transient: `{id-lowercase}@zerojance ~ $` (example `4f2a@zerojance ~ $`)
- Operator: `operator@zerojance ~ #`
- Masked password prompt label: `password` (the UI shows `password: ` and shows no characters as typed beyond the browser's masking).
- The prompt host is `zerojance`. The user segment for the operator is the literal word `operator`, not the server's username.

### 2.5 Truth rules for claims
- "logged": on `invalid_credentials` the API writes a structured log line (requestId and IP only; contract and B4 done-criteria). Do not add claims about what else is logged.
- "not sent" in `whoami`: F4 must not transmit or persist any of the "seen from here" values. Test it.
- `build` lists what the project actually contains. F4 and D6 verify each line against the built repo before release (list in the D4 PR file).
- Numbers are never invented; anything that looks like a reading comes from the response, the browser, or the clock.

### 2.6 Session state
At load the app calls `GET /api/auth/me` (boot, specified in D3) and holds one of `transient`, `operator`, or `unknown` (uplink failed). Commands gate on this state first for `diagnostics` and `guestbook rm`; the server stays authoritative and any `401 unauthenticated` flips the state to `transient`. Login success sets `operator`; logout success sets `transient`.

## 3. Engine strings (`TerminalText`)

| Key | Exact string |
|---|---|
| `unknownCommand(name)` | `[fail] no such command: "{name}". help lists what exists.` (kind `error`) |
| `inputTooLong(max)` | `[fail] input too long. the limit is {max} characters.` |
| `unterminatedQuote` | `[fail] unterminated quote. close it or drop it.` |
| `trailingEscape` | `[fail] the line ends with a lone backslash. finish it or drop it.` |
| `commandFailed` | `[fail] that command failed. try again.` |
| `interrupted` | `// interrupted.` (kind `system`) |
| `regionLabel` | `ZEROJANCE terminal` |
| `logLabel` | `Terminal output` |
| `inputLabel` | `Command input` |

## 4. Shared error lines (used by every server-backed command unless a command overrides them)

| Condition | Lines |
|---|---|
| Network failure, timeout (8 s), or aborted request | `[fail] uplink lost. i can still read you; i cannot reach the ledger.` then `       retry: status.` |
| Response is not the contract's JSON (garbled, HTML, empty) | `[fail] the uplink returned noise.` then `       retry: status.` |
| `unavailable` (503) | `[warn] the station answers, but its ledger does not. retry in a minute.` |
| `rate_limited` (429), no command override | `[warn] slow down. retry in {retry}.` |
| `origin_rejected` (403) | `[fail] the station does not recognize where that request came from.` then `       reload the page and try again.` |
| `unauthenticated` (401), state flips to `transient` | `[fail] clearance lost. the session has ended.` then `       login <username> to continue.` |
| `forbidden` (403) | `[fail] clearance insufficient.` |
| `payload_too_large`, `unsupported_media_type` | `[fail] the station could not read that request. reload the page and try again.` |
| `not_found` (no command override) | `[fail] not found.` |
| `internal_error`, or any unrecognized error code | `[fail] station fault. request {requestId}.` then `       try again.` (if no `requestId`: `[fail] station fault. try again.`) |
| `validation_error`, no command override | `[fail] the station refused that input.` |

Never print `error.message` from the server and never print raw response bodies. Never reveal whether a username exists.

## 5. Commands

### 5.1 `help`
- Usage: `help [command]`. No API.
- `help` output, exact (the same for every clearance):

```
commands
  help [command]       list commands, or explain one
  about                the dossier
  agents               the five watchstanders
  build                how this station is made
  status               uplink and version
  guestbook            read the ledger; help guestbook to sign
  whoami               who the station thinks you are
  login <username>     request operator clearance
  logout               end the operator session
  clear                clear the screen (ctrl+l)
back room (operator clearance)
  diagnostics          station internals
  guestbook rm <id>    remove a mark
// up and down for history. ctrl+c cancels.
```
The first line `commands` and `back room (operator clearance)` are `output` lines; the last line is `system`. Column: two spaces, name padded to 20, two spaces, summary.
- `help <command>` prints that command's detail block (section 5.12). An alias resolves to its command (`help ledger` is `help guestbook`).
- `help <unknown>`: `[fail] no such command: "{name}". help lists what exists.`

### 5.2 `about`
No API. Same output for every clearance. Exact, with placeholders kept literally:

```
dossier open.
  subject    Jansen Fleming
  role       [PLACEHOLDER: current role or focus]
  focus      [PLACEHOLDER: areas of security and engineering focus]
  contact    [PLACEHOLDER: public contact method]
  links      [PLACEHOLDER: code, profile, or write-up links]
  origin     [withheld]
// fields in brackets are waiting on the operator.
// the station does not guess.
```
Owner content replaces the `[PLACEHOLDER: ...]` values later; the `[withheld]` line stays.

### 5.3 `agents`
No API. Exact:

```
watch roster. five on duty.
  ARCHITECT
    chart room. plans the watch and decides what ships.
  CREATIVE DIRECTOR
    signal room. decides how the station looks and misbehaves.
  FRONTEND ENGINEER
    deck. builds what you are looking at.
  BACKEND ENGINEER
    engine room. keeps the ledger, the doors and the uplink.
  SECURITY / QA ENGINEER
    armory. assumes everything is hostile, including the other four.
    signs off nothing it wrote.
// all five run on Claude Sonnet 5. the key stays with the operator.
```

### 5.4 `build`
No API. Exact:

```
build notes.
  web        React, Vite, TypeScript
  api        Fastify, SQLite, zod
  contract   one shared schema package used by both sides
  auth       scrypt hashing, server-side sessions, rate limits
  tests      unit, API, and an independent QA suite
  built by   five AI agents, all Claude Sonnet 5
  reviewed   by pull request; nobody signs off its own work
  source     [PLACEHOLDER: repository URL, once public]
// status and diagnostics read the real api. nothing here is theater.
```

### 5.5 `status`
`GET /api/health`. Public. Latency `{ms}` measured client-side. Threshold: `{ms}` under 1000 is ok; 1000 or more is slow (the status rail's sweep uses the same threshold).

Success, ok (`status` field is `ok`):
```
[ ok ] uplink ok. {ms} ms.
       version   {version}
       contract  {contract}
       server    {time}
       watch     {T+ clock}
// neighbors: picket-01 to picket-06 do not answer.
```
Success, slow: first line is `[warn] uplink slow. {ms} ms.`; the remaining lines are identical.
Failure: shared errors (section 4). For the network-failure case the neighbors line is not printed.
Public `status` shows only these health fields plus the latency; no uptime, counts, or session numbers.

### 5.6 `guestbook` (list) and `guestbook before <id>`
`GET /api/guestbook?limit=10` and, with `before`, `&before={id}`. `{id}` must match `^[1-9][0-9]{0,9}$`; otherwise `[fail] usage: guestbook before <id>`.

Success with entries (`{n}` = items returned; `1 mark` singular):
```
the ledger. {n} marks, newest first.
#{id}  {handle}  {stamp}
     {message}
#{id}  {handle}  {stamp}
     {message}
```
When `nextBefore` is not null, one more line follows: `// older marks: guestbook before {nextBefore}`.
Empty (no items and no `before`): `the ledger is empty. you would be the first mark.`
Empty with `before` (past the end): `no older marks.`
Unknown subcommand or extra arguments: `[fail] usage: guestbook [before <id>]` then continuation lines `       guestbook sign <handle> <message>` and, for an operator, `       guestbook rm <id>`.
Failure: shared errors.

### 5.7 `guestbook sign <handle> <message>`
`POST /api/guestbook` with `{ handle, message }`. Message is the remaining arguments joined by one space (`guestbook sign ghost_42 hello grid` signs `hello grid`; use quotes to keep punctuation or spacing safe). The parser collapses runs of spaces outside quotes.

Client preflight (same limits as the contract, in UTF-16 code units; the server is authoritative):
| Check | Line |
|---|---|
| missing handle or message | `[fail] usage: guestbook sign <handle> <message>` then `       example: guestbook sign ghost_42 hello grid` |
| handle not 2 to 24 chars of letters, digits, `_`, `-` | `[fail] handle: 2 to 24 characters. letters, digits, _ and - only.` |
| message empty after trim | `[fail] message: write something. 1 to 280 characters.` |
| message over 280 | `[fail] message: 1 to 280 characters. yours is {n}.` |

Server results:
| Result | Lines |
|---|---|
| `201` | `[ ok ] mark {entry.id} entered as {entry.handle}. the ledger keeps it.` |
| `validation_error` with a `handle` detail path | the handle line above |
| `validation_error` with a `message` detail path (or any other) | `[fail] message: one line of visible text, 1 to 280 characters.` then `       control, hidden and bidi characters are refused.` |
| `rate_limited` | `[warn] you are writing faster than the ledger can be read. retry in {retry}.` |
| network failure | `[fail] uplink lost. the mark was not entered.` then `       retry: status.` |
| other | shared errors |

### 5.8 `whoami`
`GET /api/auth/me` (never `401`). Then read the local values below. All local reads are wrapped so a missing API prints `[unavailable]` for that value.

Transient:
```
TRANSIENT-{id}
  clearance  none
  session    none
seen from here
  language   {navigator.language}
  timezone   {Intl.DateTimeFormat().resolvedOptions().timeZone}
  viewport   {innerWidth}x{innerHeight}
  color      {dark | light}
  motion     {full | reduced}
  contrast   {standard | more}
// read in this browser. the station does not send or store any of it.
```
Operator (`user` returned):
```
{user.username}
  clearance  operator
  session    open
seen from here
  ...same six lines as above...
// read in this browser. the station does not send or store any of it.
```
Uplink failed: first `[warn] uplink lost. clearance unknown; showing what this browser knows.` then the transient block with `clearance  unknown` and `session    unknown`.
Mapping: `color` from `prefers-color-scheme`, `motion` from `prefers-reduced-motion` (`reduced` when it matches, else `full`), `contrast` from `prefers-contrast: more`. These values are never transmitted, logged, or stored (2.5).

### 5.9 `login <username>`
Flow, all on the client:
1. No username: `[fail] usage: login <username>`.
2. Already operator (state `operator`): `[warn] already at clearance operator. logout first to switch.`
3. Username over 64 characters: `[fail] username: 1 to 64 characters.`
4. Ask for the password with `readSecret("password")`. The value goes only into the request body: never into history, scrollback, state, storage, URLs, or logs. If the visitor cancels (Ctrl+C or Escape): `// login cancelled.`
5. Password empty or over 256 characters: `[fail] password: 1 to 256 characters.` (no request is made)
6. `POST /api/auth/login`.

Results:
| Result | Lines |
|---|---|
| `200` | `[ ok ] credential accepted. clearance: operator. the back room is open.` then `// diagnostics and guestbook rm are now available.` State becomes `operator`; the prompt becomes `operator@zerojance ~ #` |
| `invalid_credentials` | `[fail] credentials rejected. the attempt was logged.` Identical for an unknown username and a wrong password; never hint which |
| `rate_limited` | `[warn] too many attempts. the door is closed. retry in {retry}.` |
| network failure | `[fail] uplink lost. cannot reach the door.` then `       retry: status.` |
| other | shared errors |
Do not print the password, its length, or the username the server holds. Do not add an example username anywhere in help text.

### 5.10 `logout`
`POST /api/auth/logout` (idempotent, `204`).
| State and result | Lines |
|---|---|
| operator, `204` | `[ ok ] session closed. clearance: none.` State becomes `transient`; the prompt reverts |
| transient, `204` | `no session was open. clearance is already none.` |
| network failure | `[warn] uplink lost. the session could not be closed here; it expires on its own.` State stays as it was |
| other | shared errors |

### 5.11 `clear`, `diagnostics`, `guestbook rm`

**`clear`**: empties the scrollback (`ctx.clear()`), then prints one line: `// screen cleared. the ledger is untouched.`

**`diagnostics`** (operator): transient state: `[fail] not for transients.` then `       login <username> requests clearance.` No request is made. Operator state: `GET /api/admin/diagnostics`.
```
[ ok ] diagnostics
       uptime    {dur of uptimeSeconds}
       started   {startedAt}
       node      {nodeVersion}
       database  {db}
       marks     {guestbookCount}
       sessions  {activeSessions}
// sessions accounted for: {activeSessions}. session zero: not counted.
```
If `db` is not `ok`, the first line's tag is `[warn]`. The numbers and strings are the real response; only the last line is fiction, marked as commentary. `401` is the shared clearance-lost line. Failure: shared errors.

**`guestbook rm <id>`** (operator): transient state: `[fail] not for transients.` then `       login <username> requests clearance.` No request. Operator state: validate `<id>` against `^[1-9][0-9]{0,9}$`, else `[fail] usage: guestbook rm <id>`. `DELETE /api/admin/guestbook/{id}`:
| Result | Lines |
|---|---|
| `204` | `[ ok ] mark {id} removed.` |
| `not_found` | `[fail] no mark {id}.` |
| `unauthenticated` | shared clearance-lost line |
| other | shared errors |
Removal is immediate; there is no confirmation prompt in the MVP.

### 5.12 `help <command>` detail blocks (exact)

Each block is `output` lines. The registry `usage` and `summary` fields equal the first usage line and the help-list summary.

`help help`
```
usage: help [command]
lists the commands, or explains one.
```
`help about`
```
usage: about
the dossier. bracketed fields are waiting on the operator.
```
`help agents`
```
usage: agents
the five automated watchstanders that build and maintain this station.
```
`help build`
```
usage: build
how this station is made, stated plainly.
```
`help status`
```
usage: status
asks the uplink for its health and times the answer. public.
```
`help guestbook` (and `help ledger`)
```
usage: guestbook [before <id>]
       guestbook sign <handle> <message>
       guestbook rm <id>   (operator)
the ledger is public and read by people and machines. do not sign
anything you would not want strangers to read. only the operator can
remove a mark.
a mark is one line of visible text, 1 to 280 characters. handles are
2 to 24 characters: letters, digits, _ and -. control, hidden and bidi
characters are refused, and so are the England, Scotland and Wales flag
emoji.
```
`help whoami`
```
usage: whoami
shows your clearance, and what this browser reveals to any page.
```
`help login`
```
usage: login <username>
asks for a password at a masked prompt. the password is sent once
and is never shown or kept.
```
`help logout`
```
usage: logout
ends the operator session.
```
`help clear`
```
usage: clear
clears the screen. ctrl+l does the same.
```
`help diagnostics`
```
usage: diagnostics
station internals: uptime, database, counts. operator clearance only.
```

### 5.13 Registry fields (`CommandInfo`) for F4

| name | aliases | usage | summary (equals the help-list text) |
|---|---|---|---|
| `help` | none | `help [command]` | `list commands, or explain one` |
| `about` | none | `about` | `the dossier` |
| `agents` | none | `agents` | `the five watchstanders` |
| `build` | none | `build` | `how this station is made` |
| `status` | none | `status` | `uplink and version` |
| `guestbook` | `ledger` | `guestbook` | `read the ledger; help guestbook to sign` |
| `whoami` | none | `whoami` | `who the station thinks you are` |
| `login` | none | `login <username>` | `request operator clearance` |
| `logout` | none | `logout` | `end the operator session` |
| `clear` | none | `clear` | `clear the screen (ctrl+l)` |
| `diagnostics` | none | `diagnostics` | `station internals` |

`guestbook rm <id>` appears in the help list under "back room" as a subcommand line, not as its own registry entry. Help output is a fixed string, not built from the registry, so the two-section layout is exact.

## 6. Sample first session (fixture for F4 tests)

```
4f2a@zerojance ~ $ guestbook sign ghost_42 hello grid
[ ok ] mark 13 entered as ghost_42. the ledger keeps it.
4f2a@zerojance ~ $ guestbook
the ledger. 1 mark, newest first.
#13  ghost_42  2026-09-21 17:00Z
     hello grid
4f2a@zerojance ~ $ login op
password:
[ ok ] credential accepted. clearance: operator. the back room is open.
// diagnostics and guestbook rm are now available.
operator@zerojance ~ # guestbook rm 13
[ ok ] mark 13 removed.
operator@zerojance ~ # logout
[ ok ] session closed. clearance: none.
```
(The password line shows no characters; the username `op` is an example only and is not a real account name.)

## 7. Hand-off notes for the Frontend Engineer
- Content lives in `apps/web/src/content/`, keyed as in sections 3 to 5. Tests can assert the exact strings.
- Presentation follows section 2.2 and `style-guide.md` section 8. If you want a typed tone on `OutputLine` instead of deriving it from the first characters, that is fine, as long as the visible text is unchanged.
- The welcome banner, boot lines, the "registered" line, loading states for slow calls, and the status rail are D3, not here.
- Nothing in this spec needs a contract change.

## 8. Not covered here (owned elsewhere)
Boot and banner text, layout, loading and offline screens, keyboard and focus rules (D3). Hidden commands and guessed-command quips (D5). Design review of the built site (D6).

## 9. Verification
Docs only. Not verified: exact wrapping in a browser (D6), and the truth of `build` claims against the finished repo (checked at release; see the list in the D4 PR file).
