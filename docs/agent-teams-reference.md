# Agent Teams — Master Reference

Working reference for designing, launching, and steering Claude Code agent teams. Written so a future Claude session can read it cold and build a better team on the first try.

- **Source:** https://code.claude.com/docs/en/agent-teams (fetched 2026-09-21; page describes behavior as of **v2.1.178**, with notes up to v2.1.257)
- **Status:** Experimental. Behavior, flags, and limits change between versions. Re-fetch the source page before relying on version-specific details.
- **Convention:** Plain statements come from the docs. Anything marked **[Inference]** is my own judgment or extrapolation and is not documented.

---

## 1. Ten rules to remember

1. **Default to not using a team.** A team costs far more tokens than one session. Use it only when parallel, independent work beats sequential work.
2. **Independent work only.** Teams shine on research, review, debugging with competing theories, new modules, and cross-layer work. They are weak on sequential tasks, same-file edits, and heavily dependent work.
3. **Each teammate owns its own files.** Two teammates editing one file overwrite each other.
4. **Teammates don't see the lead's conversation.** They get CLAUDE.md, MCP servers, skills, and the spawn prompt, nothing else. Put every task-specific fact in the spawn prompt.
5. **Start with 3–5 teammates.** Three focused ones often beat five scattered ones.
6. **Aim for 5–6 tasks per teammate**, each a self-contained deliverable (a function, a test file, a review).
7. **Name teammates in the spawn instruction** so you can address them later ("ask `security` to…").
8. **Pre-approve common permissions before spawning.** Teammate prompts bubble up to the lead and cause friction.
9. **Monitor and steer.** Unattended teams waste effort. The lead can also declare victory early or start doing the work itself; tell it to wait.
10. **Plan-mode "approval" is not a review gate.** The lead's session auto-approves teammate plans without reviewing them (see §6).

---

## 2. Pick the right tool

| Need | Use |
|---|---|
| Focused helper, only the result matters | **Subagent** (lower token cost, result returns to caller) |
| Workers that must debate, share findings, self-coordinate | **Agent team** |
| Separate sessions you run yourself that pass findings | **Cross-session messaging** |
| Parallel sessions with no automated coordination | **Git worktrees** |
| Sequential, same-file, or many-dependency work | **Single session** |

| | Subagents | Agent teams |
|---|---|---|
| Context | Own window; result returns to caller | Own window; fully independent |
| Communication | Report to caller (named subagents can also message each other) | Teammates message each other directly |
| Coordination | Main agent manages everything | Self-coordination + shared task list |
| Token cost | Lower | Higher (each teammate is a full Claude instance) |

**Decision test [Inference]:** Ask "would these workers need to talk to each other or challenge each other's output?" If no, subagents are almost always the cheaper answer.

### Strongest use cases (documented)
- **Research and review** — different aspects investigated simultaneously, findings shared and challenged.
- **New modules or features** — each teammate owns a separate piece.
- **Debugging with competing hypotheses** — parallel theories, adversarial debate, faster convergence.
- **Cross-layer coordination** — frontend / backend / tests, one owner each.

---

## 3. Enabling and configuring

### Turn it on
Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in the shell or in a settings file:

```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

Without it: no team is set up at session start, no team directories are written, and Claude doesn't spawn or propose teammates.

### Side effect to know about
With teams enabled, **any subagent Claude names launches as a teammate**, even if you never asked for a team. Claude names subagents on its own so it can message them later, so teams can appear during ordinary delegation. Claude Code doesn't ask you to confirm the launch.

To get plain subagents back, set the variable to `"0"`. Saving a settings-file `env` change applies to the running session with no restart; the next named subagent launches as a subagent.

### Settings precedence
user < project < local < `--settings` payload < managed. A `1` in a higher source beats a `0` in a lower one. Managed settings win over everything.

### Interactive sessions only
With `-p` (non-interactive), including Agent SDK sessions, Claude does not spawn teammates. A named subagent runs as an ordinary subagent.

### Display mode (`teammateMode`)
| Value | Behavior |
|---|---|
| `"in-process"` (default) | All teammates inside the main terminal. Works anywhere. |
| `"auto"` | Split panes if already inside tmux, or in iTerm2 with `it2` installed; otherwise in-process |
| `"tmux"` | Split panes; auto-detects tmux vs iTerm2 |
| `"iterm2"` (v2.1.186+) | iTerm2 native panes; errors with an install hint if `it2` is missing |

Set persistently in `~/.claude/settings.json`: `{ "teammateMode": "auto" }`. Per session: `claude --teammate-mode auto` (experimental flag, not in `claude --help`).

- Split panes need **tmux** or **iTerm2 + `it2` CLI** (enable iTerm2 → Settings → General → Magic → Enable Python API).
- Split panes are **not supported** in VS Code's integrated terminal, Windows Terminal, or Ghostty.
- `tmux -CC` inside iTerm2 is the suggested tmux entry point; tmux works best on macOS.

### Related settings and env vars
| Name | Purpose |
|---|---|
| `CLAUDE_CODE_SUBAGENT_MODEL` | Default model for teammates when nothing more specific applies (`inherit` = ignore) |
| `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` | Ignore spawn-prompt and definition models; use `CLAUDE_CODE_SUBAGENT_MODEL` (v2.1.257+) |
| `subagentPromptCacheTtl` | Set `"1h"` to keep in-process teammate cache for an hour (default 5 min; 1-hour writes cost more) |
| `cleanupPeriodDays` | Retention for transcripts and the persisted task-list directory |
| `teammateDefaultModel` | **Removed in v2.1.234.** Ignored. Name the model in the prompt instead. |

---

## 4. Architecture

| Component | Role |
|---|---|
| **Team lead** | The main session. Spawns teammates, coordinates, synthesizes. Fixed for the session's life. |
| **Teammates** | Separate Claude Code instances, each with its own context window |
| **Task list** | Shared work items teammates claim and complete |
| **Mailbox** | Message passing between agents |

### On-disk layout
Team name is `session-` + the first 8 characters of the session ID.

| Path | Notes |
|---|---|
| `~/.claude/teams/{team-name}/config.json` | Runtime state (session IDs, tmux pane IDs, `members` array). **Never edit or pre-author** — overwritten on next update. Removed when the session ends. |
| `~/.claude/teams/{team-name}/inboxes/{agent-name}.json` | Each agent's mailbox. Malformed entries are reported and removed (v2.1.207+); valid ones still deliver. |
| `~/.claude/tasks/{team-name}/` | Task list. **Persists** after the session; never uploaded. Resumed sessions keep tasks. |

- The `members` array holds each member's name and agent ID. The lead's type is `team-lead`. Teammates can read the file to discover each other.
- There is **no project-level team config.** `.claude/teams/teams.json` in a project is not recognized.
- A message counts as "sent" only if the write to the recipient's mailbox succeeds; otherwise the sender gets an error.
- Reusable roles belong in **subagent definitions**, not team config (§6).

### Task mechanics
- States: `pending` → `in progress` → `completed`.
- Tasks can depend on other tasks. A task with unresolved dependencies cannot be claimed. Completing a task automatically unblocks its dependents.
- Claiming uses **file locking**, so simultaneous self-claims don't collide.
- Only agents that have the Task tools use the shared list; others coordinate by messages.
- The lead can assign explicitly, or teammates self-claim the next unassigned, unblocked task.

### Context and communication
- Teammates load CLAUDE.md, MCP servers, and skills, plus the spawn prompt. **No lead history.**
- Messages are delivered automatically; the lead doesn't poll.
- A teammate that finishes sends an idle notification to the lead with its final answer. If its turn ends on an API error, the lead is told and gets the error text.
- Messaging is one recipient per message. To reach everyone, send one message per recipient.
- The lead names every teammate at spawn; any teammate can message any other by name.

---

## 5. Running a team

### Starting
Describe the task and the teammates in natural language. Claude spawns and coordinates.

If Claude uses subagents instead of a team, the agent panel looks the same. Ask again and explicitly request an **agent team**.

### Panel controls (in-process mode)
| Key | Action |
|---|---|
| Up / Down | Select a teammate |
| Enter | Open the teammate's transcript and message it |
| Esc | Clear selection; while viewing a transcript, interrupts that teammate's current turn |
| `x` (on selected) | Stop the teammate |
| Ctrl+T | Toggle the task list |

- While viewing a teammate, plain text and skills go to it; **built-in commands still run in the lead's session.**
- A teammate's **model and fast mode are fixed at spawn.** `/model` and `/fast` change only the lead (v2.1.199+ shows a notice). `/effort` does apply to the viewed teammate's later turns.
- Teammates inherit the lead's effort level (split-pane too, from v2.1.186).
- Idle rows: hidden 30 s after the whole panel goes idle (v2.1.199+), reappear on the next turn. Hidden ≠ stopped. More than 3 idle teammates collapse into an `N idle agents` row; Enter expands, Esc collapses. Working and failed teammates always keep their rows.

### Shutting down
Ask by name: "Ask the researcher teammate to shut down." The teammate may approve or reject with an explanation. Shutdown waits for the current request or tool call to finish. Team directories are cleaned up automatically when the session exits (config removed, tasks kept).

### Quality gates via hooks
| Hook | Fires | Exit code 2 does |
|---|---|---|
| `TeammateIdle` | Teammate about to go idle | Sends feedback, keeps the teammate working |
| `TaskCreated` | Task being created | Blocks creation, sends feedback |
| `TaskCompleted` | Task being marked complete | Blocks completion, sends feedback |

The `team_name` field in these hook payloads is now the session-derived name and is deprecated.

---

## 6. Spawn-time decisions

### Model selection (first match wins)
1. The model your spawn prompt names for that teammate
2. The subagent definition's `model` (`inherit` = lead's model)
3. `CLAUDE_CODE_SUBAGENT_MODEL`, if set and not `inherit`
4. The lead's current model

With `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`, steps 1–2 are skipped. (Before v2.1.251, step 3 came first.)

The chosen model is checked against the org `availableModels` allowlist. A blocked family alias (e.g. `opus`) maps to the newest permitted version on the Anthropic API; any other blocked value falls back to the lead's model.

**Example:** "Spawn 4 teammates to refactor these modules in parallel. Use Sonnet for each teammate."

**[Inference]:** Cheaper models for well-scoped, mechanical teammates; keep the strongest model for the lead and for adversarial or architectural roles.

### Permissions
- Teammates start with the lead's permission mode, **except `dontAsk`**, which they don't inherit.
- `--dangerously-skip-permissions` on the lead applies to all teammates.
- You can change one teammate's mode after spawning, but **not per-teammate at spawn**.
- Teammate permission prompts appear **in the lead's session**; approve them there.
- A message from another agent is never treated as user consent. A teammate can't approve a prompt for you, and can't relay a denied action to another teammate to get around it.
- In **auto mode**, the classifier treats relayed approval claims as untrusted and reviews every inter-agent message before delivery; a blocked message never arrives.

### Plan-before-implement
Put the lead in **plan mode first**, then ask for the teammate. A teammate spawned while the lead is in plan mode stays read-only until its plan is ready, then sends an approval request to the lead.

> **Caveat:** Claude Code approves the plan in the lead's session as soon as it arrives, **without the lead reviewing it.** The teammate's later edits and commands still hit normal permission prompts. Do not rely on this as a human-review checkpoint. If you need one, tell the teammate to report its plan and wait for explicit go-ahead (an instruction in the prompt, not a mechanism). **[Inference on the workaround]**

### Reusing roles: subagent definitions
Define a role once (project, user, or managed scope), then name it when spawning: "Spawn a teammate using the security-reviewer agent type to audit the auth module."

| Definition field | Effect on the teammate |
|---|---|
| `tools` | Restricts the teammate to that list. In-process teammates also get `SendMessage`, plus `TaskCreate/Get/List/Update` in sessions with Task tools. |
| `model` | Used in either display mode if the spawn prompt names no model |
| Body | In-process: **appended** to the default system prompt. Split-pane: **replaces** the default system prompt. |
| `skills` | **Not applied** in either mode. Teammate loads skills from project and user settings. |
| `mcpServers` | Split-pane: applied. In-process: **ignored**; loads MCP servers from project and user settings. |

- If Claude messages an in-process teammate that has stopped, Claude Code revives it in the same session, restores its saved conversation, and delivers the message as the next prompt. This does **not** happen after `/resume`.
- On revival, a definition from a project's `.claude/agents/` or an `--add-dir` directory is re-applied **only if you trusted that exact folder** (trusting a parent doesn't count). Otherwise the teammate returns with no definition tools or instructions.

---

## 7. Design playbook

### Team sizing
- Start at **3–5**. No hard cap, but tokens scale linearly, coordination overhead grows, and returns diminish.
- 15 independent tasks → start with 3 teammates.
- Scale up only if the work truly benefits from simultaneity.

### Task sizing
- **Too small:** coordination cost exceeds the benefit.
- **Too large:** teammates run long without check-ins, so wasted effort compounds.
- **Right:** a self-contained unit with a clear deliverable.
- If the lead makes too few tasks, ask it to split further.

### Ownership map (do this before spawning)
Write down, for every teammate: **name, role, files/dirs it owns, deliverable, what it must not touch.** No overlap in owned files. Shared files (configs, lockfiles, index/barrel files) go to exactly one owner or to the lead.

### Anatomy of a strong spawn prompt
1. **Name and role** ("You are `security`, reviewing…")
2. **Scope** — exact paths, PR number, or question
3. **Context the teammate can't know** — stack, constraints, decisions already made, what's been ruled out
4. **Deliverable and format** — severity ratings, a findings doc section, a passing test file
5. **Boundaries** — files it must not edit; who to message for what
6. **Done criteria** — how it knows to stop and report

### Sequencing advice
- **First time with teams?** Begin with read-only work: PR review, library research, bug investigation. You learn the mechanics without parallel-write conflicts.
- Move to parallel implementation only after ownership boundaries are clean.

### Keeping the lead honest
If the lead starts doing the work itself, send: `Wait for your teammates to complete their tasks before proceeding`.
If the lead declares the team finished with tasks open, tell it to keep going.

---

## 8. Prompt templates

Fill the `<…>` slots. Keep names short and stable.

### Parallel code review
```text
Spawn three teammates to review <PR #/branch>:
- `security`: security implications
- `perf`: performance impact
- `tests`: test coverage and gaps
Each reviews independently and reports findings with severity and file/line
references. Do not edit code. Wait for all three, then synthesize one report.
```

### Competing hypotheses (debugging)
```text
<Symptom and how to reproduce.>
Spawn 5 teammates, one per hypothesis: <H1>, <H2>, <H3>, <H4>, <H5>.
Each investigates its own theory and tries to disprove the others' by messaging
them, like a scientific debate. Record the consensus, and the evidence for it,
in <findings file>. Wait for all five before concluding.
```
*Why it works:* sequential investigation anchors on the first plausible theory; adversarial investigators make the surviving theory more likely to be right.

### Multi-angle design exploration
```text
I'm designing <thing>. Spawn three teammates to explore it from different
angles: `ux`, `architecture`, and `skeptic` (devil's advocate). Each returns a
recommendation plus its strongest objection to the others. Then synthesize.
```

### New feature, split by module
```text
Spawn <N> teammates, one per module, using <model>:
- `<name>` owns <paths>; deliverable: <what>
- `<name>` owns <paths>; deliverable: <what>
Shared interface: <contract>. Nobody edits files they don't own; message the
owner instead. Run <test command> before reporting done.
```

### Cross-layer change
```text
Spawn `frontend`, `backend`, and `tests` teammates for <feature>.
Backend defines the API contract first and messages it to the other two.
Frontend and tests build against that contract. Each owns only its own layer.
```

---

## 9. Checklists

### Before spawning
- [ ] Is a team justified, or would a subagent or single session do?
- [ ] Work is genuinely parallel and independent?
- [ ] Ownership map written; no shared files between teammates?
- [ ] Permissions pre-approved for the commands teammates will run?
- [ ] Models chosen per teammate; names chosen?
- [ ] Lead in plan mode if plan-first behavior is wanted?
- [ ] Reusable roles defined as subagent definitions (and the folder trusted)?
- [ ] Explicitly asked for an **agent team** (not "subagents")?

### While running
- [ ] Check the panel/task list regularly (Ctrl+T)
- [ ] Watch for stuck tasks: teammates sometimes don't mark tasks complete, which blocks dependents
- [ ] Redirect failing approaches early; message the teammate directly
- [ ] Confirm the lead is waiting rather than implementing

### After
- [ ] Verify deliverables actually exist; don't trust idle notifications alone
- [ ] Ask teammates to shut down by name if they're still running
- [ ] Kill orphaned tmux sessions if using split panes
- [ ] Note what worked or failed in the lessons log (§15)

---

## 10. Limitations

- **No session resumption for in-process teammates.** `/resume` and `/rewind` don't restore them; the lead may try to message teammates that no longer exist. Tell it to spawn new ones.
- **Task status can lag.** Stuck tasks: check whether the work is done, then update the status manually or have the lead nudge.
- **Shutdown can be slow.** Teammates finish the current request first.
- **One team per session.** No additional named teams; no sharing a team across sessions.
- **No nested teams.** Teammates can't spawn teammates.
- **No background subagents from in-process teammates.** Their subagents run in the foreground. A subagent definition with `background: true` errors when spawned by a teammate; `run_in_background: true` either errors or silently runs in the foreground.
- **Lead is fixed.** No promoting a teammate or transferring leadership.
- **No per-teammate permission mode at spawn.**
- **Split panes need tmux or iTerm2**, not VS Code's terminal, Windows Terminal, or Ghostty.
- **Model and fast mode fixed at spawn.**

---

## 11. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Teammates don't appear | In-process: look in the agent panel below the prompt; Up/Down then Enter. A vanished idle row is hidden, not stopped; message it by name to bring it back. The task may also not have looked complex enough — ask explicitly. Split panes: check `which tmux`; for iTerm2 confirm `it2` and the Python API. |
| Claude used subagents, not a team | Panel looks identical. Re-ask, explicitly requesting an **agent team**. |
| Claude spawns teammates when you wanted subagents | Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to `"0"` (check higher-precedence settings and managed settings that may re-enable it). |
| Too many permission prompts | Pre-approve common operations in permission settings before spawning. |
| Teammate stopped early | Open its transcript; give more instructions, or spawn a replacement. A message wakes a teammate that is waiting to retry a failed API call. |
| Lead stopped early | Tell it to keep going. |
| Lead is doing the work | "Wait for your teammates to complete their tasks before proceeding." |
| Tasks stuck / dependents blocked | Verify the work; mark complete manually or nudge the teammate. |
| Lead messages a dead teammate after resume | Known limitation; have the lead spawn new teammates. |
| Message not delivered / inbox error | Mailbox write failed (disk full, directory not writable). See the docs' "Failed to write to a teammate's inbox" error page. |
| Teammate came back without its tools/instructions | Definition folder not trusted; trust the exact folder containing the agent file. |
| Orphaned tmux session | `tmux ls`, then `tmux kill-session -t <session-name>` |
| `/model` or `/fast` didn't change a teammate | Expected; only the lead changes. Model is fixed at spawn. |

---

## 12. Cost notes

- Token use scales with the number of active teammates; each is a full Claude instance with its own context.
- In-process teammate requests use a separate cache bucket: **5-minute TTL by default**, even on a Claude subscription. Set `subagentPromptCacheTtl` to `1h` to extend it (1-hour cache writes bill at a higher rate).
- The docs' cost page has agent-team guidance: https://code.claude.com/docs/en/costs#agent-team-token-costs
- **[Inference]** Cheapest wins: fewer teammates, narrower scopes, cheaper models for mechanical roles, and finishing the team promptly rather than leaving idle teammates around.

---

## 13. Version notes

| Version | Change |
|---|---|
| Before 2.1.178 | Team was created and named first via `TeamCreate` / `TeamDelete`. |
| 2.1.178 | No setup step; cleanup automatic on exit. `TeamCreate`/`TeamDelete` removed. `team_name` on the Agent tool is accepted but ignored. |
| 2.1.181–2.1.198 | Idle row hid 30 s after its own turn, even while others worked |
| 2.1.186 | `"iterm2"` mode added; lead's effort level now passed to split-pane teammates |
| 2.1.199 | Idle rows persist while any agent works; `/model` and `/fast` show a "applies to the lead" notice |
| 2.1.207 | Malformed mailbox entries are removed instead of blocking delivery |
| 2.1.234 | `teammateDefaultModel` removed |
| 2.1.251 | Model-selection order changed (`CLAUDE_CODE_SUBAGENT_MODEL` no longer first) |
| 2.1.257 | `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` added |

---

## 14. Workspace notes (My_Team)

- Agent teams are enabled in both `~/.claude/settings.json` (all projects) and `My_Team/.claude/settings.json` (this project). Project settings outrank user settings, so a `"0"` at user level would not turn them off here.
- **[Inference]** This session runs in the VS Code extension. The docs say split panes don't work in VS Code's integrated terminal, so expect in-process mode. Whether the extension's UI exposes the agent panel the same way as the terminal CLI is **not documented** and hasn't been tested here. Verify on first use and record the result below.

## 15. Lessons log

Add an entry after each real team run. Keep it short and factual.

| Date | Task | Team shape | What worked | What didn't | Change next time |
|---|---|---|---|---|---|
| 2026-09-22 to 2026-09-25 | ZeroJance MVP: repo pivot from a prior project, then a full 3-role build (brand, tokens, 12 products + hidden egg, catalog/product/lookbook/about pages, mock cart/checkout, 3 easter eggs, a11y/polish pass, readiness report) — 67 PRs total | 3 roles (architect, creative-director, engineer), never all three parallel at once; up to 2 same-role instances in parallel for independent files (e.g. two creative-director spawns for D2+D3 simultaneously; two engineer spawns for E3+E5). Every code/design task got its own Architect-review subagent rather than one long-lived Architect. | Parallel same-role spawns worked well when files were genuinely disjoint (D2/D3, D3/D4/D5, E3/E5) — real wall-clock savings with no coordination overhead, since each instance only touched its own files. The review-cycle pattern (worker branch -> spawn a fresh Architect reviewer -> relay specific feedback -> worker fixes -> re-spawn/resume same reviewer) caught real, substantive issues every time it found something (a mislabeled git-blame format, a missing keyboard test, a slug mismatch between two already-merged branches, a real keyboard-focus-trap bug) — reviewers that re-ran checks themselves instead of trusting the PR file's claimed output consistently found more. Resuming a rate-limited or already-finished agent via SendMessage (by name) worked cleanly and preserved full context, cheaper than respawning. | Parallel branches from the same base that both touch shared files (`Layout.tsx`, `App.tsx`, `index.css`) reliably produced real rebase conflicts once the first branch merged — the CSS conflict in particular was a genuine trap: git's diff aligned on repeated `}` lines and silently misattributed which branch's closing braces were whose, producing a brace-imbalanced file that *looked* clean until checked by hand. Caught only because of an explicit open-vs-close brace count check before shipping. Also let two separate `docs/board-<task>-done` bookkeeping flips slip through unflipped mid-run (E1's flip was missed entirely until a final read-through after the very last task). | For CSS/generatively-similar files with foreseeable overlap, tell parallel branches up front to use distinct, clearly-delimited comment-block boundaries (already good practice here) and, when resolving the eventual conflict, extract each side's addition by that boundary/marker rather than trusting a raw line-diff — verify with an open/close-brace (or bracket/tag) count before trusting the result, every time, not just when something looks off. Add a periodic full-board read-through (not just per-task flips) as a standing habit before declaring a wave or the whole project done, to catch missed bookkeeping. |
| | | | | | |

---

## Related docs
- Subagents: https://code.claude.com/docs/en/sub-agents
- Cross-session messaging: https://code.claude.com/docs/en/cross-session-messaging
- Git worktrees: https://code.claude.com/docs/en/worktrees
- Hooks (`TeammateIdle`, `TaskCreated`, `TaskCompleted`): https://code.claude.com/docs/en/hooks
- Permission modes: https://code.claude.com/docs/en/permission-modes
- Settings reference (`teammateMode`): https://code.claude.com/docs/en/settings-reference
- Model config: https://code.claude.com/docs/en/model-config
- Costs: https://code.claude.com/docs/en/costs
- Full doc index: https://code.claude.com/docs/llms.txt
