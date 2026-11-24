# Agentic SDLC Pipeline

A nine-agent Claude Code pipeline that takes a Jira story key from trigger to merged PR. One orchestrator drives eight stage agents in sequence. Each agent is a self-contained system prompt defined in `.claude/agents/`.

---

## Quick Start

```
run pipeline for KT-19
```

The orchestrator (`sdlc-orchestrator`) handles everything from there. To run a single stage independently:

```
run requirements stage for KT-19
run architecture stage
run design review stage
```

To resume after a pause:

```
resume pipeline for KT-19
```

---

## How the Orchestrator Works

**File:** `.claude/agents/00-orchestrator.md`  
**Tools:** `Read`, `Write`, `Bash`, `Agent`, `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`

The orchestrator is the only agent the user speaks to directly. It does not implement anything — it coordinates.

### Startup sequence

1. Asks for the Jira story key if not provided.
2. Creates one `TaskCreate` entry per stage (8 total) before running anything, with each task blocked by the previous one. This gives visible dependency-ordered progress tracking.
3. Runs stages 1–8 in sequence, spawning each stage agent via the `Agent` tool and passing the story key as context.
4. After each stage completes, reads the output artifact, confirms it was written to `docs/agentic-sdlc/artifacts/`, and shows the user a one-paragraph summary.
5. At four approval gates, **stops and waits** for the user to type `proceed` before continuing.

### Approval gates

The pipeline pauses at these four points regardless of how cleanly a stage ran:

| After Stage | Condition to continue | Prompt |
|---|---|---|
| Stage 3 — Design Review | `design-review.md` shows **Go** | Shows verdict; waits for `proceed` or `stop` |
| Stage 4 — Impl Plan | User reviews task list | Shows artifact path; waits for `proceed` or `stop` |
| Stage 6 — Code Review | `review-findings.md` shows **Go** | Shows verdict; waits for `proceed` or `stop` |
| Stage 7 — Verify | All automated checks pass | Shows check counts; waits for `proceed` or `stop` |

If a gate shows **No-Go**, the orchestrator lists the blocking findings and halts. It does not continue until the user resolves the issues and re-runs that stage.

### Resume logic

When asked to resume, the orchestrator checks which artifact files already exist in `docs/agentic-sdlc/artifacts/`. It skips every stage whose artifact is present and picks up from the first missing one.

---

## Artifact Chain

Each stage reads the prior stage's output and writes the next one. All artifacts live in `docs/agentic-sdlc/artifacts/`.

```
Jira story key
      │
      ▼
Stage 1 ──► requirements.md
      │
      ▼
Stage 2 ──► architecture.md
      │
      ▼
Stage 3 ──► design-review.md  ◄── GATE: Go/No-Go
      │
      ▼
Stage 4 ──► impl-plan.md  ◄── GATE: user approves task list
      │
      ▼
Stage 5 ──► implementation-log.md
      │
      ▼
Stage 6 ──► review-findings.md  ◄── GATE: Go/No-Go
      │
      ▼
Stage 7 ──► verification-report.md  ◄── GATE: all checks pass
      │
      ▼
Stage 8 ──► pr-description.md + GitHub PR
```

---

## Stage Reference

### Stage 1 — Requirements

**Agent:** `sdlc-01-requirements`  
**Role:** Requirements analyst  
**Tools:** `Read`, `Write`, `WebFetch`, `Glob`, `Grep`

**What it does:**

1. Fetches the Jira story via the REST API using credentials from `.env.local` (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`). Falls back to a pre-saved story file in `docs/agentic-sdlc/stories/`, then asks the user to paste the story directly.
2. Reads project context: `README.md`, `lib/types.ts`, `lib/store.ts`, `manual-tests/test-cases.md`.
3. Asks the user to resolve any ambiguities before writing.
4. Writes `requirements.md` with eight numbered sections.

**Output sections:**

| Section | Contents |
|---|---|
| Jira Story | Key + full URL |
| Problem Statement | One paragraph describing the user pain |
| Goals | What this story achieves |
| Non-Goals | Explicit exclusions to bound scope |
| Functional Requirements | Numbered FR-01, FR-02 … each with a pass/fail criterion |
| Non-Functional Requirements | Performance, backward compatibility, security |
| Risks and Assumptions | What we assume; what could go wrong |
| Open Questions | Anything requiring human approval before coding begins |

**Guardrails applied:**
- No breaking changes to existing API routes or `data-testid` attributes
- Any new Task field must be optional
- Seed tasks `t1`–`t5` must remain unchanged

---

### Stage 2 — Architecture

**Agent:** `sdlc-02-architecture`  
**Role:** Senior software architect  
**Tools:** `Read`, `Write`, `Glob`, `Grep`

**What it does:**

Reads `requirements.md` and all seven key source files (`lib/types.ts`, `lib/store.ts`, both API routes, `TaskCard.tsx`, `TaskForm.tsx`, `dashboard/page.tsx`) before designing anything. Maps every FR to a concrete code change.

**Output sections:**

| Section | Contents |
|---|---|
| Impacted Files | Table: file path, change type (Add/Modify/None), reason |
| Data Model Changes | TypeScript snippet showing only new/changed fields, all marked `optional` |
| API Contract Changes | Updated request/response shapes per route; explicit "no existing fields removed" statement |
| Store Logic Changes | Filter, create, and update logic changes in `lib/store.ts` |
| UI Changes | Per-component change descriptions with new `data-testid` values |
| Backward Compatibility Statement | One sentence per changed file confirming existing behaviour is preserved |
| Rollback Strategy | Which files to restore and what command to run |

**Guardrails applied:**
- Every new field must be optional with defaults handled in the store
- Existing `data-testid` attributes not touched — only new ones added
- No new npm dependencies unless the story explicitly requires them

---

### Stage 3 — Design Review

**Agent:** `sdlc-03-design-review`  
**Role:** Senior technical reviewer  
**Tools:** `Read`, `Write`

**What it does:**

Reviews `requirements.md` and `architecture.md` against a ten-area checklist. Finds problems *before any code is written*. Issues a Go/No-Go verdict. Only Low-severity findings are deferred; anything Medium or High blocks the pipeline.

**Review checklist areas:**

| Area | Question |
|---|---|
| Completeness | Does the architecture cover every FR? |
| Correctness | Does each change behave exactly as the FR specifies? |
| Backward Compatibility | Is every changed file covered by a credible compatibility statement? |
| Optional Fields | Are all new fields marked optional with store defaults? |
| API Contract | Are existing paths, verbs, and response shapes preserved? |
| UI Consistency | Are new `data-testid` attributes named consistently? |
| Error Handling | Are invalid inputs and boundary values handled? |
| Security | Is user input validated server-side? No secrets exposed? |
| DRY / Clarity | Any duplicated logic that should be extracted? |
| Scope Creep | Does the architecture include anything not in requirements? |

**Output structure — each finding:**
```
Finding DR-01
- Severity: High | Medium | Low
- Location: <file or section>
- Issue: <what the problem is>
- Resolution: <what must change before coding begins>
```

Verdict is either **Go** (all findings Low/resolved) or **No-Go** (any Medium/High finding unresolved). The orchestrator's gate checks this verdict before allowing Stage 4 to start.

---

### Stage 4 — Implementation Plan

**Agent:** `sdlc-04-impl-plan`  
**Role:** Technical project lead  
**Tools:** `Read`, `Write`, `TaskCreate`, `TaskUpdate`

**What it does:**

1. Checks that `design-review.md` shows **Go** — stops immediately if not.
2. Reads `architecture.md` and every source file in the impacted-files table.
3. Builds a dependency-ordered task list following the canonical order for this codebase: `lib/types.ts` → `lib/store.ts` → API routes → `TaskForm.tsx` → `TaskCard.tsx` → `dashboard/page.tsx`.
4. Creates a real `TaskCreate` entry for each TASK-XX with `blockedBy` dependencies, so Stage 5 can track progress.

**Output sections:**

| Section | Contents |
|---|---|
| Task List | `TASK-ID \| File \| Effort (S/M/L) \| Exact change description` |
| Blocked Tasks | Which tasks cannot start until another finishes, and why |
| Validation Plan | One line per task stating how to confirm it is done |
| Out-of-Scope Reminder | Non-Goals from `requirements.md` copied verbatim |

Task descriptions must be precise enough that Stage 5 can implement without re-reading `architecture.md`.

**Effort sizing:** `S` = under 30 min · `M` = 30–60 min · `L` = over 60 min

---

### Stage 5 — Implementation

**Agent:** `sdlc-05-implementation`  
**Role:** TypeScript developer  
**Tools:** `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `TaskUpdate`, `TaskGet`, `TaskList`

**What it does:**

Executes every task in `impl-plan.md` in TASK-ID order, respecting `blockedBy` dependencies. Uses `TaskList` to find all tasks, marks each `in_progress` before starting and `completed` after finishing.

**Per-task steps:**

1. Mark task `in_progress` via `TaskUpdate`
2. Read the current file state with `Read` (never assumes state from memory)
3. Apply the minimal change using `Edit` — never `Write`, which would overwrite the whole file
4. Run `npx tsc --noEmit` after every types or store change
5. Append a log entry to `implementation-log.md`
6. Mark task `completed`

**After all tasks:** runs `npm run lint` and `npm run build` and records exact output in `implementation-log.md`. If either fails, fixes the errors before declaring Stage 5 done.

**Failure handling:** if any task fails, the agent stops immediately, appends a blocked log entry, and reports the blocker to the user. It does not skip ahead.

**Strict rules:**
- `Edit` only — never `Write` for source files
- Never remove or rename existing fields, routes, or `data-testid` attributes
- New fields must be optional
- Do not change any file not listed in `impl-plan.md`
- Seed tasks `t1`–`t5` untouched

---

### Stage 6 — Code Review

**Agent:** `sdlc-06-review`  
**Role:** Peer code reviewer  
**Tools:** `Read`, `Write`, `Bash`, `Grep`

**What it does:**

Reads `implementation-log.md` to find every changed file, reads each file, and runs `git diff main` to see the exact diff. Maps every FR from `requirements.md` to the specific file and line that implements it.

**Review checklist areas:**

| Area | Question |
|---|---|
| Correctness | Does each change deliver exactly what the FRs specify? |
| Backward Compatibility | Are all existing fields, routes, and `data-testid` attrs preserved? |
| Optional Fields | Are new fields optional in the TypeScript interface AND defaulted in the store? |
| Error Handling | Are invalid inputs and boundary values handled in API routes? |
| Security | Input validated server-side? No tokens or secrets in source files? |
| Test Coverage Gap | Which FRs have no test case in `manual-tests/test-cases.md`? (Low severity) |
| Code Clarity | Are identifiers self-explanatory? Is logic easy to follow? |
| DRY Principle | Is there duplicated logic that could be shared? |
| Seed Data Integrity | Greps `lib/store.ts` to confirm `t1`–`t5` are unchanged |

**Explicit verifications recorded in output:**
- Seed tasks t1–t5 unchanged — confirmed
- All existing `data-testid` attributes preserved — confirmed
- No new npm dependencies added — confirmed

**Output structure — each finding:** same format as Stage 3, with IDs `RV-01`, `RV-02`, etc. Verdict is **Go** (no High/Medium findings) or **No-Go**. The orchestrator's gate checks this verdict before allowing Stage 7.

---

### Stage 7 — Verification

**Agent:** `sdlc-07-verify`  
**Role:** QA engineer  
**Tools:** `Read`, `Write`, `Bash`, `WebFetch`

**What it does:**

1. Checks that `review-findings.md` shows **Go** — stops immediately if not.
2. Runs `npm run lint` and `npm run build`. Stops if either fails.
3. Starts the local dev server (`npm run dev`) and polls `localhost:3000` for up to 15 seconds. All checks run against `localhost:3000`, not the deployed app.
4. Obtains a bearer token via `POST /api/auth/login`.
5. Runs 5 feature checks and 8 regression checks.
6. Stops the dev server.
7. Writes `verification-report.md` including a manual UI smoke checklist for human sign-off.

**Feature checks (F-01–F-05):** test the new field/feature end-to-end — create with new field, create without it, update it, list and filter, fetch by ID.

**Regression checks (R-01–R-08):** auth (valid login, wrong password, no token), seed tasks, status filter, missing required field, logout.

**Output sections:**

| Section | Contents |
|---|---|
| Lint and Build | Exact terminal output + pass/fail |
| API Verification | All F-XX and R-XX results with HTTP status and response body |
| Manual UI Smoke Checklist | Human-fillable checklist with tester name and date fields |
| Summary | Counts and final verdict |

The orchestrator's final gate checks that all automated checks pass before allowing Stage 8.

---

### Stage 8 — Pull Request

**Agent:** `sdlc-08-pr`  
**Role:** Developer completing a pull request  
**Tools:** `Read`, `Write`, `Bash`

**What it does:**

1. Checks that `verification-report.md` shows all automated checks passing — stops if not.
2. Reads all seven prior artifacts to build a complete PR description.
3. Runs `git log main..HEAD --oneline` and `git diff main --stat` to ground the PR in the actual diff.
4. Writes `pr-description.md`.
5. Pushes the branch if it has no upstream, then creates the GitHub PR via `gh pr create`.
6. Commits all artifact files to the branch.

**PR description sections:**

| Section | Contents |
|---|---|
| Summary | 2–3 sentences: what was built, why, which story it closes |
| Changes Made | Bulleted list of every file changed with a one-line reason |
| Test Evidence | Key results from `verification-report.md` |
| Known Limitations | Non-Goals + any unresolved Low-severity review items |
| Reviewer Checklist | 8 standard checklist items |

---

## Cross-Cutting Guardrails

These rules are enforced by every stage agent:

| Guardrail | Enforced by |
|---|---|
| No changes to existing API route paths or HTTP verbs | Stages 2, 3, 6 |
| No removal or renaming of existing `data-testid` attributes | Stages 2, 3, 5, 6 |
| All new Task fields must be optional | Stages 1, 2, 3, 4, 5, 6 |
| Seed tasks `t1`–`t5` in `lib/store.ts` must not be modified | Stages 1, 2, 5, 6 |
| No new npm dependencies unless the story explicitly requires them | Stages 2, 3, 6 |
| Use `Edit` not `Write` for source file changes | Stage 5 |
| Build must pass before Stage 5 is declared done | Stage 5 |
| All automated checks must pass before Stage 8 can run | Stages 7, 8 |

---

## Agent Files

```
.claude/agents/
  00-orchestrator.md       ← coordinates all stages; the only agent the user talks to
  01-requirements.md       ← requirements analyst
  02-architecture.md       ← software architect
  03-design-review.md      ← technical reviewer (Go/No-Go)
  04-impl-plan.md          ← project lead; creates real TaskCreate entries
  05-implementation.md     ← TypeScript developer; uses Edit + TaskUpdate
  06-review.md             ← peer code reviewer (Go/No-Go)
  07-verify.md             ← QA engineer; tests against localhost
  08-pr.md                 ← runs gh pr create; commits artifacts
```

## Output Artifacts

```
docs/agentic-sdlc/artifacts/
  requirements.md          ← Stage 1
  architecture.md          ← Stage 2
  design-review.md         ← Stage 3
  impl-plan.md             ← Stage 4
  implementation-log.md    ← Stage 5
  review-findings.md       ← Stage 6
  verification-report.md   ← Stage 7
  pr-description.md        ← Stage 8
```
