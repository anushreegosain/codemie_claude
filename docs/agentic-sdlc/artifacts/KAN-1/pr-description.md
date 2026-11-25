## Summary

Implements KAN-1: Task Priority Levels — a four-tier priority system (`low | medium | high | critical`) for the Kata Task Manager. Users can now assign a priority to every task, see a color-coded badge on each task card, filter the dashboard by priority, and sort the task list from Critical down to Low. All changes are additive and fully backward-compatible with existing tasks, routes, and test IDs.

Closes KAN-1.

## Changes Made

- **`lib/types.ts`** — Extended `TaskPriority` union to add `"critical"` as a fourth value; changed `Task.priority` from required to optional (`priority?: TaskPriority`) so existing tasks without the field deserialise safely.
- **`lib/store.ts`** — Added optional `priority?: string` parameter to `getAllTasks`; applies a successive filter after the existing `assignee` filter to support server-side priority queries.
- **`app/api/tasks/route.ts`** — Extracts `?priority` query param and forwards it to `getAllTasks`; expanded `validPriorities` in POST handler to include `"critical"`; default creation priority remains `"medium"`.
- **`app/api/tasks/[id]/route.ts`** — Expanded `validPriorities` in PUT handler to include `"critical"`; no other changes.
- **`components/TaskCard.tsx`** — Replaced three-entry `priorityColors` map with a four-entry map (critical=red, high=orange, medium=yellow, low=green); guarded undefined priority with a neutral gray badge; badge text falls back to `"—"` for tasks with no priority.
- **`components/TaskForm.tsx`** — Added `<option value="critical">Critical</option>` to the priority select (descending urgency order: Critical, High, Medium, Low).
- **`app/dashboard/page.tsx`** — Added `FilterPriority` type, `PRIORITY_ORDER` constant, and `filterPriority` / `sortByPriority` state variables; derived `displayedTasks` with client-side priority filter and sort; added priority filter bar (`data-testid="priority-filter"`) with five buttons (`filter-priority-all/low/medium/high/critical`); added `Sort by Priority` toggle button (`data-testid="sort-priority-button"`); updated task-count element to reflect active filter context.

## Test Evidence

### Lint
```
npm run lint — passed (2 pre-existing warnings, 0 errors)
```

### Build
```
npm run build — passed
TypeScript compilation clean
Generating static pages (8/8)
/dashboard — 3.91 kB (91.2 kB first load)
```

### Feature Checks (5/5 passed)
| Check | Result |
|---|---|
| POST /api/tasks with `priority: "critical"` → 201, data.priority === "critical" | Pass |
| POST /api/tasks without priority → data.priority === "medium" (default) | Pass |
| PUT /api/tasks/t4 with `priority: "critical"` → 200, priority updated | Pass |
| GET /api/tasks — priority field present on all tasks | Pass |
| GET /api/tasks/:id for task from F-01 | Pass |

### Regression Checks (8/8 passed)
| Check | Result |
|---|---|
| POST /api/auth/login — valid credentials | Pass |
| POST /api/auth/login — wrong password → 401 | Pass |
| GET /api/tasks — no auth header → 401 | Pass |
| GET /api/tasks — authenticated, 5+ tasks | Pass |
| GET /api/tasks?status=todo — all items status=todo | Pass |
| POST /api/tasks — missing title → 400 | Pass |
| GET /api/tasks/t1 — data.id === "t1" | Pass |
| POST /api/auth/logout → 200 | Pass |

## Known Limitations

**Out of scope (requirements.md Non-Goals):**
- Mobile-specific UI changes or responsive layout redesign.
- Bulk operations (e.g., bulk-set priority on multiple tasks at once).
- Export or reporting features based on priority.
- Priority-based notifications or alerting.
- Admin-only visibility of priorities (feature is available to all authenticated users).
- Automated escalation or time-based priority changes.

**Unresolved Low-severity findings (review-findings.md):**
- **RV-01 (Low):** No new manual test cases added to `manual-tests/test-cases.md` for KAN-1-specific FRs (critical tier, priority filter bar, sort control). Existing TC-UI-010, TC-API-009, TC-API-013 cover only the original three priority values.
- **RV-02 (Low):** Dashboard calls `fetchTasks` (API request) when `filterPriority` changes, which deviates from the architecture's NFR-06 intent of pure client-side priority filtering. All FRs are satisfied and results are correct; this is a performance-spec deviation only, not a correctness issue.

## Reviewer Checklist

- [ ] New fields are optional and backward-compatible
- [ ] Existing `data-testid` attributes unchanged
- [ ] Existing API routes and response shapes unchanged
- [ ] Seed tasks `t1`–`t5` unmodified
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Manual regression: login, logout, task CRUD, status filters all work
- [ ] New feature works end-to-end per the FRs in requirements.md

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
