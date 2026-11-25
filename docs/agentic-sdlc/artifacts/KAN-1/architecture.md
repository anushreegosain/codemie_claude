# Architecture — KAN-1: Filter Dashboard by Assignee

## 1. Jira Story

**Key**: KAN-1
**Summary**: "As a task manager user, I want to filter the dashboard by assignee, so that I can quickly see work assigned to me or another team member"

---

## 2. Impacted Files

| File Path | Change Type | Reason |
|---|---|---|
| `app/dashboard/page.tsx` | Modify | Add `assigneeFilter` state, extend `fetchTasks` to pass both filter params, add assignee `<select>` control to the filter bar, update `useCallback` deps |
| `lib/types.ts` | None | `Task.assignee` already exists as a required `string` field — no new fields needed |
| `lib/store.ts` | None | `getAllTasks(username, status?, assignee?)` already accepts and applies the `assignee` parameter (line 108–113) |
| `app/api/tasks/route.ts` | None | GET already reads `searchParams.get("assignee")` (line 19) and passes it to the store |
| `app/api/tasks/[id]/route.ts` | None | Single-task routes are unaffected by filter logic |
| `components/TaskCard.tsx` | None | No new display elements needed; `task-assignee` already renders `@{task.assignee}` |
| `components/TaskForm.tsx` | None | Assignee input already exists; no changes to the create/edit form |

---

## 3. Data Model Changes

No data model changes are required.

The `Task` interface in `lib/types.ts` already contains `assignee: string` as a required field. All five seed tasks (`t1`–`t5`) already carry assignee values (`"admin"` or `"user1"`). No new fields are added, removed, or renamed.

---

## 4. API Contract Changes

No API contract changes are required.

### Confirmation

The existing `GET /api/tasks` route already supports the `assignee` query parameter:

```
GET /api/tasks                          → returns all tasks
GET /api/tasks?status=todo              → existing behaviour, unchanged
GET /api/tasks?assignee=admin           → returns tasks where assignee === "admin"
GET /api/tasks?assignee=user1&status=todo → compound filter, already supported
```

Response shape is unchanged:
```json
{ "data": Task[] }
```

No existing fields are removed or renamed. No new required parameters are introduced.

---

## 5. Store Logic Changes

No changes to `lib/store.ts`.

The `getAllTasks` function (line 108) already has the signature:
```typescript
async function getAllTasks(username: string, status?: string, assignee?: string): Promise<Task[]>
```

It already applies sequential filtering:
- Line 110: `if (status) tasks = tasks.filter((t) => t.status === status)`
- Line 111: `if (assignee) tasks = tasks.filter((t) => t.assignee === assignee)`

Both the in-memory and Vercel KV paths go through this same logic. No filter logic, create logic, or update logic changes are needed.

---

## 6. UI Changes

### `TaskForm.tsx` — No changes

The form already has an `assignee` text input (`data-testid="task-assignee-input"`). No new inputs, labels, or validation rules are required.

### `TaskCard.tsx` — No changes

The card already renders `@{task.assignee}` in the `data-testid="task-assignee"` span. No conditional rendering changes are needed.

### `app/dashboard/page.tsx` — Modify

#### New state variable

Add one new state variable for the assignee filter:

```typescript
const [assigneeFilter, setAssigneeFilter] = useState<string>("");
```

Default value `""` means "All Assignees" — no filter applied on initial load.

#### Extended `fetchTasks` callback

The current signature is `async (status?: string)`. Extend it to accept a second optional parameter and build the URL using `URLSearchParams` to handle zero, one, or both active params cleanly:

```typescript
const fetchTasks = useCallback(
  async (status?: string, assignee?: string) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (assignee) params.set("assignee", assignee);
    const qs = params.toString();
    const url = qs ? `/api/tasks?${qs}` : "/api/tasks";
    // ... rest unchanged
  },
  [token, router]
);
```

The `useCallback` dependency array `[token, router]` is unchanged because `status` and `assignee` are passed as arguments, not closed over.

#### Updated call sites

Every existing call to `fetchTasks(filter)` gains the second argument:

| Location | Before | After |
|---|---|---|
| `useEffect` (initial load + filter changes) | `fetchTasks(filter)` | `fetchTasks(filter, assigneeFilter)` |
| `handleCreate` | `fetchTasks(filter)` | `fetchTasks(filter, assigneeFilter)` |
| `handleUpdate` | `fetchTasks(filter)` | `fetchTasks(filter, assigneeFilter)` |
| `handleDelete` | `fetchTasks(filter)` | `fetchTasks(filter, assigneeFilter)` |
| `handleStatusChange` | `fetchTasks(filter)` | `fetchTasks(filter, assigneeFilter)` |

#### Updated `useEffect` dependency array

Add `assigneeFilter` so the effect re-runs when either filter changes:

```typescript
useEffect(() => {
  // ...
  fetchTasks(filter, assigneeFilter);
}, [filter, assigneeFilter, fetchTasks, router]);
```

#### Updated `handleStatusChange` dependency array

Add `assigneeFilter`:

```typescript
const handleStatusChange = useCallback(
  async (id: string, newStatus: TaskStatus): Promise<void> => {
    // ...
    fetchTasks(filter, assigneeFilter);
  },
  [token, filter, assigneeFilter, fetchTasks]
);
```

#### New assignee filter control

Add a `<select>` element to the filter bar, placed inside a wrapper `<div>` that groups it with the existing status filter buttons. The existing `data-testid="status-filter"` div is not modified — the new element is a sibling:

```tsx
{/* Actions bar */}
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    {/* Existing status filter — UNCHANGED */}
    <div className="flex gap-2" data-testid="status-filter">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          data-testid={`filter-${f.value}`}
          // ... unchanged
        >
          {f.label}
        </button>
      ))}
    </div>

    {/* New assignee filter */}
    <select
      data-testid="assignee-filter"
      aria-label="Filter by assignee"
      value={assigneeFilter}
      onChange={(e) => setAssigneeFilter(e.target.value)}
      className="border border-gray-300 text-sm rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Assignees</option>
      <option value="admin">Admin</option>
      <option value="user1">User1</option>
    </select>
  </div>

  {/* Existing add button — UNCHANGED */}
  <button
    onClick={() => { setShowForm(true); setEditingTask(null); }}
    data-testid="add-task-button"
    // ...
  >
    + Add Task
  </button>
</div>
```

The `aria-label="Filter by assignee"` satisfies NFR-04 (accessibility).

#### Updated `task-count` text

The count text currently reads `{filter !== "all" ? ` with status "${filter}"` : " total"}`. Update to reflect both active filters:

```tsx
{tasks.length} task{tasks.length !== 1 ? "s" : ""}
{filter !== "all" && assigneeFilter
  ? ` (status: "${filter}", assignee: "${assigneeFilter}")`
  : filter !== "all"
  ? ` with status "${filter}"`
  : assigneeFilter
  ? ` assigned to "${assigneeFilter}"`
  : " total"}
```

The `data-testid="task-count"` attribute is preserved unchanged. The count value reflects the already-filtered `tasks` array (consistent with OQ-2 resolution in requirements).

#### No layout regressions

The outer `flex items-center justify-between` container retains the same structure. The left side gains a wrapper `<div className="flex items-center gap-4">` around the status buttons and the new select. This does not break the existing `justify-between` alignment — the add button remains right-aligned.

---

## 7. Backward Compatibility Statement

- **`app/dashboard/page.tsx`**: All existing status filter buttons (`data-testid="filter-all"`, `filter-todo`, `filter-in-progress`, `filter-done`), the `data-testid="status-filter"` container, the add-task button, the task list, the loading indicator, the empty state, and the task count element retain their existing `data-testid` values and behaviour; the assignee filter defaults to `""` so the initial page load is identical to the current experience.
- **`lib/types.ts`**: No change — existing `Task` interface is unmodified.
- **`lib/store.ts`**: No change — seed tasks `t1`–`t5` and all CRUD helpers are unmodified.
- **`app/api/tasks/route.ts`**: No change — existing GET and POST routes continue to operate identically.
- **`app/api/tasks/[id]/route.ts`**: No change — GET, PUT, DELETE routes are unaffected.
- **`components/TaskCard.tsx`**: No change — all existing `data-testid` attributes and rendering logic are unmodified.
- **`components/TaskForm.tsx`**: No change — all existing inputs and `data-testid` attributes are unmodified.

---

## 8. Rollback Strategy

Because only one file is modified (`app/dashboard/page.tsx`), rollback is a single-file revert:

1. `git checkout HEAD -- app/dashboard/page.tsx` — restores the file to the pre-KAN-1 state.
2. No database migrations, seed data changes, or dependency changes were made, so no additional rollback steps are needed.
3. If the change was merged to the branch, `git revert <commit-sha>` on the single commit is sufficient.
4. All other files (`lib/types.ts`, `lib/store.ts`, API routes, `TaskCard.tsx`, `TaskForm.tsx`) are untouched and require no rollback action.

---

## Appendix — Data Flow Diagram (text)

```
User selects assignee from <select data-testid="assignee-filter">
  │
  └─► setAssigneeFilter(value)           [React state update]
        │
        └─► useEffect fires (deps: filter, assigneeFilter)
              │
              └─► fetchTasks(filter, assigneeFilter)
                    │
                    └─► builds URL: /api/tasks?status=X&assignee=Y
                          │
                          └─► GET /api/tasks?status=X&assignee=Y
                                │
                                └─► store.getAllTasks(username, status, assignee)
                                      │
                                      ├─► filter by status (if set)
                                      └─► filter by assignee (if set)
                                            │
                                            └─► returns Task[]
                                                  │
                                                  └─► setTasks(json.data)
                                                        │
                                                        └─► TaskCard list re-renders
```

---

## Appendix — Existing `data-testid` Inventory (must not change)

| `data-testid` | Element | File |
|---|---|---|
| `logged-in-user` | `<span>` | dashboard/page.tsx |
| `logout-button` | `<button>` | dashboard/page.tsx |
| `status-filter` | `<div>` | dashboard/page.tsx |
| `filter-all` | `<button>` | dashboard/page.tsx |
| `filter-todo` | `<button>` | dashboard/page.tsx |
| `filter-in-progress` | `<button>` | dashboard/page.tsx |
| `filter-done` | `<button>` | dashboard/page.tsx |
| `add-task-button` | `<button>` | dashboard/page.tsx |
| `task-modal` | `<div>` | dashboard/page.tsx |
| `dashboard-error` | `<p>` | dashboard/page.tsx |
| `loading-indicator` | `<p>` | dashboard/page.tsx |
| `empty-state` | `<p>` | dashboard/page.tsx |
| `task-list` | `<div>` | dashboard/page.tsx |
| `task-count` | `<p>` | dashboard/page.tsx |
| `task-card` | `<div>` | TaskCard.tsx |
| `task-id` | `<p>` | TaskCard.tsx |
| `task-title` | `<h3>` | TaskCard.tsx |
| `edit-task-button` | `<button>` | TaskCard.tsx |
| `delete-task-button` | `<button>` | TaskCard.tsx |
| `task-description` | `<p>` | TaskCard.tsx |
| `task-status` | `<span>` | TaskCard.tsx |
| `task-status-select` | `<select>` | TaskCard.tsx + TaskForm.tsx |
| `inline-status-option-todo` | `<option>` | TaskCard.tsx |
| `inline-status-option-in-progress` | `<option>` | TaskCard.tsx |
| `inline-status-option-done` | `<option>` | TaskCard.tsx |
| `task-status-error` | `<p>` | TaskCard.tsx |
| `task-priority` | `<span>` | TaskCard.tsx |
| `task-assignee` | `<span>` | TaskCard.tsx |
| `task-form` | `<form>` | TaskForm.tsx |
| `task-title-input` | `<input>` | TaskForm.tsx |
| `task-description-input` | `<textarea>` | TaskForm.tsx |
| `task-priority-select` | `<select>` | TaskForm.tsx |
| `task-assignee-input` | `<input>` | TaskForm.tsx |
| `task-form-error` | `<p>` | TaskForm.tsx |
| `task-submit-button` | `<button>` | TaskForm.tsx |
| `task-cancel-button` | `<button>` | TaskForm.tsx |

New `data-testid` added by this story: `assignee-filter` (on the new `<select>` element in `app/dashboard/page.tsx`).
