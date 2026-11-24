# Implementation Log — KAN-1: Filter Dashboard by Assignee

**Stage**: 5 — Implementation
**File modified**: `app/dashboard/page.tsx`
**Date**: 2026-11-24

---

## Tasks

TASK-01 | app/dashboard/page.tsx | Added `const [assigneeFilter, setAssigneeFilter] = useState<string>("")` immediately after the `filter` state declaration on line 14. No other changes in this task.

TASK-02 | app/dashboard/page.tsx | Extended `fetchTasks` useCallback signature from `async (status?: string)` to `async (status?: string, assignee?: string)`; replaced single-string URL construction with URLSearchParams: `const params = new URLSearchParams(); if (status && status !== "all") params.set("status", status); if (assignee) params.set("assignee", assignee); const qs = params.toString(); const url = qs ? \`/api/tasks?${qs}\` : "/api/tasks";`. Dep array `[token, router]` unchanged.

TASK-03 | app/dashboard/page.tsx | In `useEffect`, changed `fetchTasks(filter)` to `fetchTasks(filter, assigneeFilter)` and updated dep array to `[filter, assigneeFilter, fetchTasks, router]`.

TASK-04 | app/dashboard/page.tsx | Updated all three plain async function call sites — `handleCreate`, `handleUpdate`, and `handleDelete` — from `fetchTasks(filter)` to `fetchTasks(filter, assigneeFilter)`.

TASK-05 | app/dashboard/page.tsx | In `handleStatusChange` useCallback, changed `fetchTasks(filter)` to `fetchTasks(filter, assigneeFilter)` and updated dep array from `[token, filter, fetchTasks]` to `[token, filter, assigneeFilter, fetchTasks]`.

TASK-06 | app/dashboard/page.tsx | Wrapped existing `<div className="flex gap-2" data-testid="status-filter">` in a new `<div className="flex items-center gap-4">` and added sibling `<select data-testid="assignee-filter" aria-label="Filter by assignee" ...>` with options: All Assignees (value ""), Admin (value "admin"), User1 (value "user1"). All existing data-testid attributes (status-filter, filter-all, filter-todo, filter-in-progress, filter-done, add-task-button) remain unchanged.

TASK-07 | app/dashboard/page.tsx | Changed empty-state paragraph text from "No tasks found. Add one to get started!" to "No tasks found". The `data-testid="empty-state"` attribute is unchanged.

TASK-08 | app/dashboard/page.tsx | Replaced single-branch task-count conditional with four-branch expression: both filters active shows `(status: "${filter}", assignee: "${assigneeFilter}")`, only status active shows `with status "${filter}"`, only assignee active shows `assigned to "${assigneeFilter}"`, neither active shows `total`. The `data-testid="task-count"` attribute is unchanged.

---

## Lint

```
> kata-taskmanager@1.0.0 lint
> next lint

No ESLint warnings or errors
```

Result: passed

---

## Build

```
> kata-taskmanager@1.0.0 build
> next build

  Next.js 14.2.35

   Creating an optimized production build ...
 Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (8/8)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
  /                                      1.22 kB        88.5 kB
  /_not-found                            873 B          88.1 kB
  /api/auth/login                        0 B                0 B
  /api/auth/logout                       0 B                0 B
  /api/tasks                             0 B                0 B
  /api/tasks/[id]                        0 B                0 B
  /dashboard                             3.62 kB        90.9 kB
```

Result: passed
