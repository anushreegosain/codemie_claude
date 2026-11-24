---
name: architecture-context
description: Skill for Stage 2. Invoked by the architecture agent to load a structured snapshot of the current codebase — data model, API contract, component tree — before designing the solution.
---

## Purpose

This skill builds a structured codebase snapshot for the architecture agent so every architectural decision is grounded in the actual current state of the app, not assumptions.

## What to Read and Extract

### 1 — Data Model (`lib/types.ts`)
Read the file and extract:
- The current `Task` interface — every field name, type, and whether it is optional
- The current `User` interface
- The `ApiResponse<T>` wrapper shape

Record as a reference table:
| Field | Type | Optional? |
|---|---|---|
| id | string | no |
| ... | ... | ... |

### 2 — Store Logic (`lib/store.ts`)
Read and note:
- Seed tasks `t1`–`t5`: their field values (these must never change)
- The in-memory store structure
- Existing filter/query logic (any `filter()` or `find()` calls on the tasks array)
- Existing create/update helpers

### 3 — API Contract
Read `app/api/tasks/route.ts` and `app/api/tasks/[id]/route.ts` and record:
- Each route: method, path, auth required, request body shape, response shape
- Which fields are read from the request body
- Which fields are included in the response

### 4 — Component Tree
Read `components/TaskCard.tsx`, `components/TaskForm.tsx`, and `app/dashboard/page.tsx` and note:
- Every `data-testid` attribute currently in use (these must not be removed or renamed)
- Form inputs: their names, labels, and current state variable bindings
- Filter controls currently on the dashboard and their state shape

## Output

Summarise the snapshot in a short context block at the top of your architectural thinking:

```
=== Codebase Snapshot ===
Task fields: id, title, description?, status, priority?, assignee?, createdAt, updatedAt
Seed tasks: t1–t5 (must not change)
API routes: GET /api/tasks, POST /api/tasks, GET|PUT|DELETE /api/tasks/:id
Existing data-testid: [list them]
Existing filters: status filter on dashboard
=========================
```

Use this snapshot as the authoritative source when deciding which files to change and which fields to add.
