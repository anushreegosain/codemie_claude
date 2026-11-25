# Implementation Plan — KAN-1: Task Priority Levels

**Stage:** 4 — Implementation Plan
**Story:** KAN-1
**Branch:** feature/kan-1-task-priority-levels
**Date:** 2026-11-25

---

## Task List

```
TASK-01 | File: lib/types.ts                | S | Extend TaskPriority union to add "critical" as a fourth value; change Task.priority from required (priority: TaskPriority) to optional (priority?: TaskPriority)
TASK-02 | File: lib/store.ts                | S | Add optional fourth parameter priority?: string to getAllTasks; apply it as a successive filter — if (priority) tasks = tasks.filter((t) => t.priority === priority) — after the existing assignee filter
TASK-03 | File: app/api/tasks/route.ts      | S | Extract priority from searchParams (const priority = searchParams.get("priority") ?? undefined) and pass it as the fourth argument to store.getAllTasks; expand validPriorities in POST from ["low","medium","high"] to ["low","medium","high","critical"]
TASK-04 | File: app/api/tasks/[id]/route.ts | S | Expand validPriorities in PUT from ["low","medium","high"] to ["low","medium","high","critical"]; no other changes to this file
TASK-05 | File: components/TaskCard.tsx     | S | Replace the three-entry priorityColors map with a four-entry map (critical: "bg-red-100 text-red-700", high: "bg-orange-50 text-orange-600", medium: "bg-yellow-50 text-yellow-700", low: "bg-green-50 text-green-700"); guard the badge className lookup with priorityColors[task.priority ?? ""] ?? "bg-gray-100 text-gray-400"; replace {task.priority} badge text with {task.priority ?? "—"}
TASK-06 | File: components/TaskForm.tsx     | S | Add <option value="critical">Critical</option> to the priority <select> (data-testid="task-priority-select") so options read Critical, High, Medium, Low from top to bottom (descending urgency order)
TASK-07 | File: app/dashboard/page.tsx      | M | (1) Add TaskPriority to the import from "@/lib/types". (2) Rename state variable filter to filterStatus and setFilter to setFilterStatus everywhere in the file. (3) Add type FilterPriority = TaskPriority | "all" and two new state variables: const [filterPriority, setFilterPriority] = useState<FilterPriority>("all") and const [sortByPriority, setSortByPriority] = useState(false). (4) Add module-level constant PRIORITY_ORDER: Record<string,number> = { critical:4, high:3, medium:2, low:1 } above the component. (5) Inside the component, derive displayedTasks: start from tasks, apply priority filter when filterPriority !== "all", then sort a spread copy when sortByPriority is true using PRIORITY_ORDER (undefined priority maps to weight 0, placed last). (6) Add priority filter bar <div data-testid="priority-filter"> with five buttons whose data-testid values are filter-priority-all, filter-priority-low, filter-priority-medium, filter-priority-high, filter-priority-critical; active button matches existing status filter visual treatment (bg-blue-600 text-white vs bordered white). (7) Add sort toggle button data-testid="sort-priority-button" that flips sortByPriority; label "Sort by Priority" / "Sorted by Priority". (8) Replace tasks.map in the task list with displayedTasks.map. (9) Update task-count to show displayedTasks.length and include active filter context: append ' · status "{filterStatus}"' when filterStatus !== "all" and ' · priority "{filterPriority}"' when filterPriority !== "all"; show " total" only when both are "all".
```

Columns: `TASK-ID | File | Effort (S=<30 min / M=30–60 min / L=>60 min) | Description`

---

## Blocked Tasks

| Blocked Task | Blocked By | Reason |
|---|---|---|
| TASK-02 | TASK-01 | `getAllTasks` stores `Task[]`; `priority` parameter type is derived from `TaskPriority` which must be optional-safe first |
| TASK-03 | TASK-01, TASK-02 | Route calls `store.getAllTasks` with the new fourth argument; `validPriorities` must reference the updated `TaskPriority` type |
| TASK-04 | TASK-01 | `validPriorities` is typed as `TaskPriority[]`; `"critical"` must exist in the union before it can be used as an array element |
| TASK-05 | TASK-01 | `task.priority` is now `TaskPriority | undefined`; the undefined guard pattern depends on the type being optional |
| TASK-06 | TASK-01 | The `priority` state in `TaskForm` is typed as `TaskPriority`; `"critical"` must be a valid member before it can be cast from the select value |
| TASK-07 | TASK-01, TASK-05, TASK-06 | Uses `TaskPriority` for `FilterPriority`; renders `TaskCard` (TASK-05 must handle undefined safely); uses `TaskForm` (TASK-06 must expose the Critical option) |

---

## Validation Plan

```
TASK-01 — `npm run build` completes without TypeScript errors; a Task object constructed without a priority key is accepted by the compiler; a variable typed TaskPriority accepts the value "critical" without error
TASK-02 — Manual or automated: GET /api/tasks?priority=critical returns only tasks where priority === "critical"; GET /api/tasks?status=todo&priority=high returns only tasks matching both; GET /api/tasks with no priority param returns all tasks unchanged
TASK-03 — GET /api/tasks?priority=critical filters correctly (depends on TASK-02); POST /api/tasks with body {"title":"T","priority":"critical"} returns 201 with data.priority === "critical"; POST with no priority field returns data.priority === "medium"
TASK-04 — PUT /api/tasks/t3 with body {"priority":"critical"} returns 200 with data.priority === "critical"; existing PUT with priority "low"/"medium"/"high" continues to work
TASK-05 — Rendering a Task object where priority is undefined produces no console errors and shows a gray badge with text "—"; a task with priority "critical" renders a red-class badge; a task with priority "high" renders an orange-class badge; data-testid="task-priority" element remains present in all cases
TASK-06 — data-testid="task-priority-select" contains exactly four <option> elements with values "critical","high","medium","low"; opening the form for a new task shows the select pre-selected on "medium"; `npm run build` passes
TASK-07 — data-testid="priority-filter" is present on the dashboard page; all five buttons filter-priority-all, filter-priority-low, filter-priority-medium, filter-priority-high, filter-priority-critical are locatable; data-testid="sort-priority-button" is present; clicking a priority filter button updates the task list without clearing the active status filter; activating sort places Critical tasks before High before Medium before Low with undefined-priority tasks last; `npm run build` and `npm run lint` pass without new errors
```

---

## Out-of-Scope Reminder

The following are explicitly out of scope for KAN-1:

- Mobile-specific UI changes or responsive layout redesign.
- Bulk operations (e.g., bulk-set priority on multiple tasks at once).
- Export or reporting features based on priority.
- Priority-based notifications or alerting.
- Admin-only visibility of priorities (feature is available to all authenticated users).
- Automated escalation or time-based priority changes.
- Changes to any existing API route paths, HTTP verbs, or existing response field names.
- Changes to seed tasks `t1`–`t5` in `lib/store.ts`.
- Introduction of new npm dependencies.

---

*Document generated by the Agentic SDLC pipeline — Stage 4: Implementation Plan.*
*Story: KAN-1 | Branch: feature/kan-1-task-priority-levels | Date: 2026-11-25*
