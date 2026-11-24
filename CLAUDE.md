# Kata Task Manager — Claude Code Project

## What This Is

A Next.js task management app used as a hands-on kata for Agentic SDLC pipelines. The same codebase runs two parallel pipelines:
- **GitHub Copilot pipeline** — agents in `.github/agents/`
- **Claude Code pipeline** — agents in `.claude/agents/`

Both pipelines produce identical artifacts in `docs/agentic-sdlc/artifacts/`.

## Running the Claude Pipeline

Start the orchestrator by saying: **"run pipeline for KT-XX"** (e.g. `KT-12`).

The orchestrator (`00-orchestrator`) handles all 8 stages automatically with approval gates.

To run a single stage: "run requirements stage for KT-12", "run architecture stage", etc.

To resume a paused pipeline: "resume pipeline for KT-12".

## Pipeline Stages

| Stage | Agent | Artifact |
|---|---|---|
| 1 — Requirements | `sdlc-01-requirements` | `artifacts/requirements.md` |
| 2 — Architecture | `sdlc-02-architecture` | `artifacts/architecture.md` |
| 3 — Design Review | `sdlc-03-design-review` | `artifacts/design-review.md` |
| 4 — Impl Plan | `sdlc-04-impl-plan` | `artifacts/impl-plan.md` |
| 5 — Implementation | `sdlc-05-implementation` | `artifacts/implementation-log.md` |
| 6 — Code Review | `sdlc-06-review` | `artifacts/review-findings.md` |
| 7 — Verify | `sdlc-07-verify` | `artifacts/verification-report.md` |
| 8 — PR | `sdlc-08-pr` | `artifacts/pr-description.md` |

Artifacts live in: `docs/agentic-sdlc/artifacts/`

## App Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Vercel KV (prod) / in-memory store (local dev)
- **Auth**: Simple bearer token, credentials in `lib/store.ts`
- **Deployment**: Vercel — `https://gh-copilot-usecase1.vercel.app`

## Key Files

| File | Purpose |
|---|---|
| `lib/types.ts` | Task, User, ApiResponse interfaces |
| `lib/store.ts` | In-memory store, seed tasks t1–t5, CRUD helpers |
| `app/api/tasks/route.ts` | GET /api/tasks, POST /api/tasks |
| `app/api/tasks/[id]/route.ts` | GET, PUT, DELETE /api/tasks/:id |
| `components/TaskCard.tsx` | Task card UI |
| `components/TaskForm.tsx` | Add/edit task form |
| `app/dashboard/page.tsx` | Main dashboard, filter bar |

## Guardrails (apply to all pipeline stages)

- Never change existing API route paths or HTTP verbs
- Never remove or rename existing `data-testid` attributes
- All new Task fields must be **optional** — existing records must work without them
- Seed tasks `t1`–`t5` in `lib/store.ts` must not be modified
- No new npm dependencies unless the story explicitly requires them

## Local Dev

```bash
npm install
npm run dev       # starts on http://localhost:3000
npm run lint
npm run build
```

Demo credentials: `admin / password123`, `user1 / test1234`

## Active Jira Stories

- KT-11 — Task Due Dates and Overdue Tracking
- KT-12 — Task Search and Advanced Filtering
- KT-19 — Inline Status Controls
- KT-22 — (see remote branch)
- KT-23 — Safe Delete with Undo
