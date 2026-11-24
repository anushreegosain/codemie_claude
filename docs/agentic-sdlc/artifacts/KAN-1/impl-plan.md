# Implementation Plan — KAN-1: Filter Dashboard by Assignee

**Story**: KAN-1 — "As a task manager user, I want to filter the dashboard by assignee, so that I can quickly see work assigned to me or another team member"
**Design Review Verdict**: Go (all findings Low severity, no blockers)
**Single file modified**: `app/dashboard/page.tsx`

---

## Pre-Implementation Verification Notes

**DR-01 resolved**: The existing `[data-testid="empty-state"]` element (line 218 of `app/dashboard/page.tsx`) currently renders "No tasks found. Add one to get started!". The text contains "No tasks found" (FR-07 pass criterion), but the suffix "Add one to get started!" is misleading when tasks exist but are filtered out. TASK-07 trims the text to exactly "No tasks found".

**DR-02 resolved**: `handleCreate` (line 62), `handleUpdate` (line 79), and `handleDelete` (line 97) are plain `async function` declarations — not `useCallback` wrappers. They re-capture `assigneeFilter` on every render, so no dependency arrays need updating on those three functions. Only `handleStatusChange` (line 111) uses `useCallback` and requires `assigneeFilter` added to its dep array (covered in TASK-05).

**DR-03 acknowledged**: The existing `<div data-testid="status-filter">` (line 162) is currently a direct child of the actions-bar `<div className="flex items-center justify-between">`. TASK-06 inserts a new `<div className="flex items-center gap-4">` as its parent, grouping it with the new assignee select. No existing test relies on the DOM parent of `status-filter` — all selectors in the test suite are `data-testid`-based.

---

## Task List

```
TASK-01 | File: app/dashboard/page.tsx | S | Add `const [assigneeFilter, setAssigneeFilter] = useState<string>("")` immediately after the existing `filter` state declaration (line 14). No other changes in this task.

TASK-02 | File: app/dashboard/page.tsx | S | Replace the `fetchTasks` useCallback body: change the signature from `async (status?: string)` to `async (status?: string, assignee?: string)`; replace the single-string URL construction with URLSearchParams: `const params = new URLSearchParams(); if (status && status !== "all") params.set("status", status); if (assignee) params.set("assignee", assignee); const qs = params.toString(); const url = qs ? `/api/tasks?${qs}` : "/api/tasks";`. The useCallback dep array `[token, router]` is unchanged (status and assignee are args, not closures).

TASK-03 | File: app/dashboard/page.tsx | S | In the `useEffect` block, change the `fetchTasks(filter)` call to `fetchTasks(filter, assigneeFilter)` and add `assigneeFilter` to the dependency array: `[filter, assigneeFilter, fetchTasks, router]`.

TASK-04 | File: app/dashboard/page.tsx | S | In each of the three plain async functions — `handleCreate` (one call site), `handleUpdate` (one call site), `handleDelete` (one call site) — change `fetchTasks(filter)` to `fetchTasks(filter, assigneeFilter)`. These are not useCallback wrappers so no dep arrays are involved.

TASK-05 | File: app/dashboard/page.tsx | S | In `handleStatusChange` useCallback: change the `fetchTasks(filter)` call inside the function body to `fetchTasks(filter, assigneeFilter)` and add `assigneeFilter` to the dep array so it reads `[token, filter, assigneeFilter, fetchTasks]`.

TASK-06 | File: app/dashboard/page.tsx | S | In the actions bar JSX: wrap the existing `<div className="flex gap-2" data-testid="status-filter">...</div>` in a new `<div className="flex items-center gap-4">`, then add the new assignee select as a sibling inside that wrapper: `<select data-testid="assignee-filter" aria-label="Filter by assignee" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="border border-gray-300 text-sm rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">All Assignees</option><option value="admin">Admin</option><option value="user1">User1</option></select>`. The `data-testid="status-filter"` attribute, all four filter buttons, and the add-task button must remain unchanged.

TASK-07 | File: app/dashboard/page.tsx | S | Change the empty-state paragraph text from "No tasks found. Add one to get started!" to "No tasks found". The `data-testid="empty-state"` attribute must remain unchanged.

TASK-08 | File: app/dashboard/page.tsx | S | Replace the task-count conditional expression (currently `{filter !== "all" ? \` with status "${filter}"\` : " total"}`) with a four-branch expression that reflects both active filters simultaneously: when both are active show `(status: "${filter}", assignee: "${assigneeFilter}")`, when only status is active show `with status "${filter}"`, when only assignee is active show `assigned to "${assigneeFilter}"`, otherwise show `total`. The `data-testid="task-count"` attribute must remain unchanged.
```

---

## Blocked Tasks

| Task | Blocked By | Reason |
|---|---|---|
| TASK-02 | TASK-01 | `fetchTasks` signature change is meaningless without `assigneeFilter` state existing to pass as argument |
| TASK-03 | TASK-01, TASK-02 | `useEffect` must call `fetchTasks(filter, assigneeFilter)` — both the new state and the new signature must exist |
| TASK-04 | TASK-01, TASK-02 | Same as TASK-03 — plain function call sites reference both `assigneeFilter` state and the new two-arg signature |
| TASK-05 | TASK-01, TASK-02 | `handleStatusChange` useCallback call site and dep array both reference `assigneeFilter` |
| TASK-06 | TASK-01 | The `<select>` JSX binds `value={assigneeFilter}` and `onChange` to `setAssigneeFilter` — the state must exist |
| TASK-08 | TASK-01 | The count expression references `assigneeFilter` — the state must exist |

TASK-07 has no dependencies and may be implemented at any point in the sequence.

---

## Validation Plan

```
TASK-01 — `npm run build` completes without TypeScript errors; `assigneeFilter` and `setAssigneeFilter` are present in the compiled output (verify by inspecting the state declarations in the file).

TASK-02 — `npm run build` completes without errors; manually confirm the new `fetchTasks` function body uses `URLSearchParams` and accepts two optional params; call `fetchTasks("todo", "admin")` in browser DevTools Network tab and confirm the outbound URL is `/api/tasks?status=todo&assignee=admin`.

TASK-03 — With `assigneeFilter` set to "admin" in browser state, verify the `useEffect` fires a request to `/api/tasks?assignee=admin` on page load; changing `filter` to "todo" issues `/api/tasks?status=todo&assignee=admin`.

TASK-04 — After creating a task with assignee filter set to "user1", the task list refreshes and shows only user1 tasks (not all tasks); same behaviour after edit and delete.

TASK-05 — With assignee filter set to "admin" and status filter "todo", toggling a task's inline status via `TaskCard` triggers a re-fetch to `/api/tasks?status=todo&assignee=admin` (verify in Network tab).

TASK-06 — `[data-testid="assignee-filter"]` is present in the DOM; it contains exactly three `<option>` elements with values `""`, `"admin"`, and `"user1"`; `[data-testid="status-filter"]` still resolves and all four filter buttons (`filter-all`, `filter-todo`, `filter-in-progress`, `filter-done`) still resolve; `[data-testid="add-task-button"]` still resolves.

TASK-07 — `[data-testid="empty-state"]` renders "No tasks found" (exact text, no trailing sentence); applying assignee="admin" + status="in-progress" with current seed data produces the empty-state element with that text.

TASK-08 — `[data-testid="task-count"]` text reads "X tasks total" with no filters; "X tasks with status 'todo'" with only status active; "X tasks assigned to 'admin'" with only assignee active; "X tasks (status: 'todo', assignee: 'admin')" with both active.
```

---

## Out-of-Scope Reminder

Copied verbatim from `docs/agentic-sdlc/artifacts/KAN-1/requirements.md` Section 4 — Non-Goals:

> - Creating, registering, or managing new user accounts.
> - Editing an `assignee` value directly on a task card (inline edit).
> - Mobile-specific UI or responsive breakpoint work.
> - Bulk operations (bulk-reassign, bulk-delete by assignee).
> - Exporting or downloading filtered task lists.
> - Surfacing the logged-in user's name dynamically as a filter option (the fixed list of Admin / User1 is sufficient for this story).
