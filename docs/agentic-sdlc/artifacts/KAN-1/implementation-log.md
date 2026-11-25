# Implementation Log — KAN-1: Filter Dashboard by Assignee

**Stage**: 5 — Implementation
**File modified**: `app/dashboard/page.tsx`
**Date**: 2026-11-25

---

## Tasks

TASK-01 | app/dashboard/page.tsx | Changed `useState<string>("")` to `useState<string>("all")` for assigneeFilter state initialisation. The "all" value is used as the sentinel for "no filter active", consistent with how the status filter works.

TASK-02 | app/dashboard/page.tsx | Changed `if (assignee) params.set("assignee", assignee)` to `if (assignee && assignee !== "all") params.set("assignee", assignee)` in the fetchTasks useCallback body. This ensures the "all" sentinel is treated as an absent filter and no assignee param is appended to the API request URL.

TASK-03 | app/dashboard/page.tsx | Verified — useEffect already calls `fetchTasks(filter, assigneeFilter)` with dep array `[filter, assigneeFilter, fetchTasks, router]`. No change required.

TASK-04 | app/dashboard/page.tsx | Verified — handleCreate, handleUpdate, and handleDelete all already call `fetchTasks(filter, assigneeFilter)`. No change required.

TASK-05 | app/dashboard/page.tsx | Replaced the `<select data-testid="assignee-filter">` block and its `<div className="flex items-center gap-4">` wrapper with a pill-button row placed after the closing `</div>` of the status-filter/actions bar. The new element is `<div className="flex flex-wrap gap-2 mb-6 items-center" data-testid="assignee-filter">` containing three pill buttons with data-testid values `assignee-filter-all`, `assignee-filter-admin`, and `assignee-filter-user1`. The original layout of the actions bar (status-filter div as direct child of the flex justify-between container) is restored.

TASK-06 | app/dashboard/page.tsx | Updated the task-count four-branch ternary to use `assigneeFilter !== "all"` checks instead of truthiness checks. Both-active branch now shows ` with status "${filter}" assigned to ${assigneeFilter}`; only-assignee branch shows ` assigned to ${assigneeFilter}` (no extra quotes around the value interpolation). The `data-testid="task-count"` attribute is unchanged.

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
  /dashboard                             3.61 kB        90.9 kB
```

Result: passed
