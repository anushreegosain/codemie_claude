# Architecture — KAN-1: Task Priority Levels

---

## 1. Jira Story

**Key:** KAN-1
**Title:** Task Priority Levels
**Branch:** feature/kan-1-task-priority-levels

---

## 2. Impacted Files

| File Path | Change Type | Reason |
|---|---|---|
| `lib/types.ts` | Modify | Add `"critical"` to `TaskPriority`; change `priority` from required to optional on `Task` |
| `lib/store.ts` | Modify | Add optional `priority` parameter to `getAllTasks` for server-side filtering |
| `app/api/tasks/route.ts` | Modify | Extract `?priority` query param and forward to store; add `"critical"` to `validPriorities` for POST |
| `app/api/tasks/[id]/route.ts` | Modify | Add `"critical"` to `validPriorities` for PUT |
| `components/TaskCard.tsx` | Modify | Re-map `priorityColors` with correct critical/high/medium/low scheme; guard against `priority` being undefined |
| `components/TaskForm.tsx` | Modify | Add `"Critical"` option to priority `<select>` |
| `app/dashboard/page.tsx` | Modify | Add `filterPriority` and `sortByPriority` state; compute `displayedTasks` client-side; render priority filter bar and sort control |

---

## 3. Data Model Changes

### `lib/types.ts`

New/changed fields only. All other fields remain identical.

```typescript
// CHANGED: "critical" added as a fourth valid value
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  // ... existing fields unchanged ...

  // CHANGED: was `priority: TaskPriority` (required).
  // Now optional so existing persisted tasks without the field deserialise safely.
  priority?: TaskPriority;
}
```

**Field status:**
- `TaskPriority` — existing type, extended (additive union member only)
- `Task.priority` — existing field, changed from required to optional (`priority?: TaskPriority`)

No new fields are added to `Task`. No fields are removed or renamed.

---

## 4. API Contract Changes

### GET /api/tasks

**New optional query parameter:**

| Parameter | Type | Valid values | Behavior when omitted |
|---|---|---|---|
| `priority` | string | `low`, `medium`, `high`, `critical` | No priority filter applied; all tasks returned (existing behavior) |

**Updated request shape (new param only):**
```
GET /api/tasks?priority=critical
GET /api/tasks?status=todo&priority=high   // combined AND filter
```

**Response shape:** unchanged. Same `{ data: Task[] }` envelope.

**Confirm:** No existing fields removed or renamed. The `status` and `assignee` query parameters continue to work exactly as before.

---

### POST /api/tasks

**Updated validation only — request body shape unchanged.**

The `priority` field in the request body now also accepts `"critical"` as a valid value. The `validPriorities` array expands from `["low", "medium", "high"]` to `["low", "medium", "high", "critical"]`.

Default behavior when `priority` is omitted: unchanged — the created task receives `priority: "medium"`.

```jsonc
// Request body (new valid value only):
{ "priority": "critical" }  // now accepted (previously rejected with silent fallback to "medium")

// Response: same shape as before, with priority echoed back
{ "data": { "id": "...", "priority": "critical", ... }, "message": "Task created" }
```

**Confirm:** No existing fields removed or renamed.

---

### PUT /api/tasks/:id

**Updated validation only — request body shape unchanged.**

The `validPriorities` array expands identically to the POST route. `"critical"` is now accepted as a valid patch value for `priority`.

```jsonc
// Request body:
{ "priority": "critical" }  // now accepted

// Response: same shape, priority echoed back
{ "data": { "id": "...", "priority": "critical", ... }, "message": "Task updated" }
```

**Confirm:** No existing fields removed or renamed. No other route paths or HTTP verbs change.

---

## 5. Store Logic Changes (`lib/store.ts`)

### Filter logic — `getAllTasks`

Add a third optional filter parameter `priority?: string`. Apply it with the same pattern as the existing `status` filter.

**Current signature:**
```typescript
async function getAllTasks(username: string, status?: string, assignee?: string): Promise<Task[]>
```

**New signature:**
```typescript
async function getAllTasks(
  username: string,
  status?: string,
  assignee?: string,
  priority?: string
): Promise<Task[]>
```

**New filter line added after the existing `assignee` filter:**
```typescript
if (priority) tasks = tasks.filter((t) => t.priority === priority);
```

### Create logic — `createTask`

No change. The `createTask` function accepts `Omit<Task, "id" | "createdAt" | "updatedAt">`. Because `priority` on `Task` becomes optional, the caller (route handler) is responsible for supplying the `"medium"` default before passing data to the store — this is already done in `app/api/tasks/route.ts` via the `validPriorities.includes(priority) ? priority : "medium"` guard. No store change needed.

### Update logic — `updateTask`

No change. The function accepts `Partial<Omit<Task, "id" | "createdAt">>`, which already allows any subset of fields including an optional `priority`. The route handler validates the value before passing it.

### Seed tasks (`SEED_TASKS`)

Not modified. `t1`–`t5` retain their current `id`, `title`, `status`, `priority`, `assignee`, and timestamp values exactly as defined.

---

## 6. UI Changes

### `components/TaskForm.tsx`

**New input:** Add a fourth `<option>` to the existing priority `<select>` (`data-testid="task-priority-select"`):

```tsx
<option value="critical">Critical</option>
```

Display order in the select (descending urgency, matching requirements): Critical, High, Medium, Low.

**Validation rules:** None added. The select constrains to valid enum values by construction.

**Default value:** Unchanged — `useState<TaskPriority>(initial?.priority ?? "medium")` remains. When the form opens for a new task, the select shows "Medium".

**No existing `data-testid` attributes change.**

---

### `components/TaskCard.tsx`

**Re-mapped `priorityColors`:** The existing map must be updated to reflect the correct four-level color scheme. The current scheme incorrectly assigns red to `high` (which should be orange) because `critical` did not exist. New mapping:

```typescript
const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700",    // new — red for critical
  high:     "bg-orange-50 text-orange-600", // existing key, color adjusted
  medium:   "bg-yellow-50 text-yellow-700", // existing key, color adjusted
  low:      "bg-green-50 text-green-700",   // existing key, was blue
};
```

Note: The exact Tailwind classes are illustrative. The implementer must verify the final palette satisfies the requirements spec (critical=red, high=orange, medium=blue or yellow, low=green or gray) and that all classes are present in the Tailwind build.

**Safe render for undefined priority (FR-10):**

The existing badge render:
```tsx
className={`... ${priorityColors[task.priority]}`}
```
If `task.priority` is `undefined`, `priorityColors[undefined]` evaluates to `undefined`, which is serialised as the string `"undefined"` in a template literal, producing an invalid class name. This must be guarded:

```tsx
className={`... ${priorityColors[task.priority ?? ""] ?? "bg-gray-100 text-gray-400"}`}
```

The badge text should also handle undefined:
```tsx
{task.priority ?? "—"}
```

The `data-testid="task-priority"` element remains present and unchanged in all cases (renders with neutral styling when priority is undefined).

**No existing `data-testid` attributes change.**

---

### `app/dashboard/page.tsx`

**New state variables:**

```typescript
// Add to existing useState declarations
type FilterPriority = TaskPriority | "all";
const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
const [sortByPriority, setSortByPriority] = useState(false);
```

`TaskPriority` must be added to the existing import from `@/lib/types`.

**Client-side derived display list:**

Priority filtering and sorting happen entirely client-side — no additional API call is triggered when `filterPriority` or `sortByPriority` changes. This satisfies NFR-06.

A `priorityOrder` weight map is defined as a module-level constant (outside the component):

```typescript
const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
```

Derived inside the component render (or as a `useMemo`):

```typescript
let displayedTasks = tasks;

if (filterPriority !== "all") {
  displayedTasks = displayedTasks.filter((t) => t.priority === filterPriority);
}

if (sortByPriority) {
  displayedTasks = [...displayedTasks].sort((a, b) => {
    const aOrder = PRIORITY_ORDER[a.priority ?? ""] ?? 0;
    const bOrder = PRIORITY_ORDER[b.priority ?? ""] ?? 0;
    return bOrder - aOrder; // Critical first; tasks without priority sort to bottom
  });
}
```

**`fetchTasks` function:** Unchanged. It continues to pass only the `status` filter to the API. The API-level `priority` filter (FR-05/FR-06) is available for external consumers but is not used by the dashboard fetch path; the dashboard applies priority filtering client-side.

**New priority filter bar:**

Rendered below (or beside) the existing status filter bar. Container carries `data-testid="priority-filter"`. Five buttons, each with the exact `data-testid` required by FR-13:

```tsx
<div className="flex gap-2" data-testid="priority-filter">
  {priorityFilters.map((f) => (
    <button
      key={f.value}
      onClick={() => setFilterPriority(f.value)}
      data-testid={`filter-priority-${f.value}`}
      className={/* active/inactive styles matching existing status filter pattern */}
    >
      {f.label}
    </button>
  ))}
</div>
```

Where `priorityFilters` is:
```typescript
const priorityFilters: { label: string; value: FilterPriority }[] = [
  { label: "All",      value: "all"      },
  { label: "Low",      value: "low"      },
  { label: "Medium",   value: "medium"   },
  { label: "High",     value: "high"     },
  { label: "Critical", value: "critical" },
];
```

Active button uses the same visual treatment as the existing status filter (blue background / white text for active, bordered white for inactive).

**New sort control:**

A single toggle button placed near the filter bars (exact position: implementer's choice; recommended — beside the "+ Add Task" button or end of the filter row):

```tsx
<button
  onClick={() => setSortByPriority((prev) => !prev)}
  data-testid="sort-priority-button"
  className={sortByPriority ? "bg-blue-600 text-white ..." : "border border-gray-300 ..."}
>
  {sortByPriority ? "Sorted by Priority" : "Sort by Priority"}
</button>
```

**Updated `task-count` element:**

The existing `data-testid="task-count"` element remains. Its text is updated to reflect `displayedTasks.length` and the active priority filter, e.g.:

```tsx
<p ... data-testid="task-count">
  {displayedTasks.length} task{displayedTasks.length !== 1 ? "s" : ""}
  {filterStatus !== "all" ? ` · status "${filterStatus}"` : ""}
  {filterPriority !== "all" ? ` · priority "${filterPriority}"` : ""}
  {filterStatus === "all" && filterPriority === "all" ? " total" : ""}
</p>
```

**Existing status filter:** The `filter` state variable is renamed to `filterStatus` to avoid confusion with the new `filterPriority`. This is a local refactor — it does not change any `data-testid` values, API call patterns, or externally observable behaviour.

**No existing `data-testid` attributes change.**

---

## 7. Backward Compatibility Statement

| File | Backward Compatibility |
|---|---|
| `lib/types.ts` | The `TaskPriority` union is extended additively; existing code that handles `"low"`, `"medium"`, or `"high"` continues to compile and run correctly. Making `priority` optional means existing `Task` objects stored in KV or memory without a priority value will deserialise without error. |
| `lib/store.ts` | The new `priority` parameter is the fourth positional argument with a default of `undefined`; all existing call sites that pass only `username`, `status`, and `assignee` are unaffected. |
| `app/api/tasks/route.ts` | The `?priority` query param is optional; existing clients that do not send it receive all tasks as before. The POST valid-priority guard continues to default to `"medium"` for missing/unrecognised values. |
| `app/api/tasks/[id]/route.ts` | The PUT valid-priority guard continues to ignore unrecognised values; the only change is that `"critical"` is now accepted. All existing `"low"`, `"medium"`, `"high"` updates continue to work. |
| `components/TaskCard.tsx` | The `task-priority` badge is always rendered; the undefined guard ensures no crash for tasks missing a priority field. All other card fields and `data-testid` values are unchanged. |
| `components/TaskForm.tsx` | The existing three options remain in the select; a fourth `"critical"` option is appended. The default value and all `data-testid` attributes are unchanged. |
| `app/dashboard/page.tsx` | The status filter API call path is unchanged; priority filtering is additive and client-side only. All existing `data-testid` attributes remain. The `filter` → `filterStatus` rename is internal and does not affect any observable attribute or API call. |

---

## 8. Rollback Strategy

To revert KAN-1 cleanly, restore the following six files to their pre-change state:

1. **`lib/types.ts`** — Revert `TaskPriority` to `"low" | "medium" | "high"` and change `priority?: TaskPriority` back to `priority: TaskPriority`.
2. **`lib/store.ts`** — Remove the `priority?` parameter and filter line from `getAllTasks`.
3. **`app/api/tasks/route.ts`** — Remove `priority` from `searchParams` extraction; revert `validPriorities` to `["low", "medium", "high"]`.
4. **`app/api/tasks/[id]/route.ts`** — Revert `validPriorities` to `["low", "medium", "high"]`.
5. **`components/TaskCard.tsx`** — Revert `priorityColors` to the pre-KAN-1 three-entry map; remove the undefined guard.
6. **`components/TaskForm.tsx`** — Remove the `"critical"` option from the priority select.
7. **`app/dashboard/page.tsx`** — Remove `filterPriority`, `sortByPriority`, `displayedTasks` derivation, priority filter bar, sort button, and `PRIORITY_ORDER` constant; restore `filter` state variable name and task-count text.

No database migrations are required. Tasks in Vercel KV with `priority: "critical"` set by this feature will remain stored; after rollback the `TaskCard` will fall back to the neutral badge style (undefined path) rather than crashing, because the guard introduced in step 5 will also be reverted — plan for a brief window where those tasks display the old `priorityColors[task.priority]` with an undefined class. If a clean rollback is critical, purge KV tasks with `priority: "critical"` before reverting the files.

For a git-based rollback: `git revert` the single commit for this story, or `git checkout main -- <file>` for each of the seven files listed above.

---

*Document generated by the Agentic SDLC pipeline — Stage 2: Architecture.*
*Story: KAN-1 | Branch: feature/kan-1-task-priority-levels | Date: 2026-11-25*
