# Requirements — KAN-1: Filter Dashboard by Assignee

## 1. Jira Story

- **Key**: KAN-1
- **URL**: https://sehgala36.atlassian.net/browse/KAN-1
- **Summary**: "As a task manager user, I want to filter the dashboard by assignee, so that I can quickly see work assigned to me or another team member"
- **Priority**: Medium | **Status**: To Do

---

## 2. Problem Statement

The task dashboard currently lets users filter by status (All, To Do, In Progress, Done) but provides no way to narrow the list by who a task is assigned to. When multiple team members share a task pool, a user must visually scan every card to find their own work. Adding an assignee filter removes that friction by letting users instantly surface tasks belonging to themselves or any named team member, without leaving the dashboard or reloading the page.

---

## 3. Goals

- Provide a dropdown filter control on the dashboard that lists: **All Assignees**, **Admin**, and **User1**.
- Selecting an assignee option immediately re-renders the task list to show only matching tasks.
- The assignee filter stacks with the existing status filter so both constraints apply simultaneously.
- Clearing or switching filters restores the correct filtered view without a full page reload.
- Reuse the existing backend support (`/api/tasks?assignee=`) — no new API routes required.
- Preserve all existing seed tasks (`t1`–`t5`), API contracts, and `data-testid` attributes.

---

## 4. Non-Goals

- Creating, registering, or managing new user accounts.
- Editing an `assignee` value directly on a task card (inline edit).
- Mobile-specific UI or responsive breakpoint work.
- Bulk operations (bulk-reassign, bulk-delete by assignee).
- Exporting or downloading filtered task lists.
- Surfacing the logged-in user's name dynamically as a filter option (the fixed list of Admin / User1 is sufficient for this story).

---

## 5. Clarifying Q&A

| # | Question | Answer |
|---|----------|--------|
| 1 | What is explicitly out of scope? | Mobile UI, bulk operations, export, creating or assigning new users, editing assignee values inline. |
| 2 | Which users can see and use the assignee filter? | All authenticated users — both `admin` and `user1`. |
| 3 | Are new fields required on the `Task` interface? | No. The `assignee` field already exists on `Task`. If any new field were needed it must be optional. |
| 4 | How do existing tasks without an `assignee` value behave? | Tasks always have an assignee (the field is non-optional in the current type). Tasks appear only under "All Assignees" if their assignee value does not match a known filter option. |
| 5 | What UI control triggers the filter? | A `<select>` (dropdown) element in the existing filter bar. Changing the selection triggers re-filter with no page reload. |
| 6 | What happens when no tasks match the combined filters? | The `[data-testid="empty-state"]` element is shown with the message "No tasks found". |
| 7 | How is each acceptance criterion verified? | Each FR has an explicit pass/fail criterion verifiable via API response body or visible UI state. |
| 8 | Does this story extend existing test cases? | Yes — it extends the filter module (TC-UI-006 through TC-UI-009 and TC-API-008) and adds new test cases for assignee filtering. |

---

## 6. Functional Requirements

### FR-01 — Assignee filter control is visible on the dashboard

**Description**: The dashboard filter area must include an assignee `<select>` control with four options: `All Assignees` (value `""`), `Admin` (value `"admin"`), and `User1` (value `"user1"`).

**Pass criterion**: After login, the element `[data-testid="assignee-filter"]` is present in the DOM and contains exactly three `<option>` elements with the specified values.

**Fail criterion**: The element is absent or contains a different set of options.

---

### FR-02 — Default state shows all assignees

**Description**: On initial dashboard load (and after selecting "All Assignees"), all tasks regardless of assignee are displayed. The filter is not applied.

**Pass criterion**: With no active assignee filter, all seed tasks (t1–t5) appear in the task list; `GET /api/tasks` without an `assignee` param returns all five tasks.

**Fail criterion**: Any task is missing from the unfiltered view.

---

### FR-03 — Selecting "Admin" filters to admin-assigned tasks only

**Description**: When the user selects "Admin" from the assignee filter, the task list reloads without a page reload and shows only tasks with `assignee === "admin"`.

**Pass criterion**: After selecting Admin, the visible task cards are exclusively those with `[data-testid="task-assignee"]` displaying `"admin"`. Corresponds to seed tasks t1 and t4. `GET /api/tasks?assignee=admin` returns exactly those two tasks.

**Fail criterion**: Any task with `assignee !== "admin"` is visible, or any `assignee === "admin"` task is missing.

---

### FR-04 — Selecting "User1" filters to user1-assigned tasks only

**Description**: When the user selects "User1" from the assignee filter, only tasks with `assignee === "user1"` are shown.

**Pass criterion**: After selecting User1, visible task cards are exclusively those with `[data-testid="task-assignee"]` displaying `"user1"`. Corresponds to seed tasks t2, t3, and t5. `GET /api/tasks?assignee=user1` returns exactly those three tasks.

**Fail criterion**: Any task not assigned to user1 is visible, or any user1 task is missing.

---

### FR-05 — Assignee filter and status filter work together (compound filter)

**Description**: When both an assignee filter and a status filter are active simultaneously, the task list shows only tasks matching both constraints.

**Pass criterion**: With assignee = "user1" AND status = "todo" active, only tasks satisfying both conditions are shown (seed task t3 and t5). Corresponds to `GET /api/tasks?assignee=user1&status=todo`.

**Fail criterion**: Tasks appear that match only one of the two constraints, or tasks matching both are missing.

---

### FR-06 — Clearing filters restores the full task list without page reload

**Description**: After any combination of filters has been applied, switching both the status and assignee filters back to their "All" defaults restores the complete unfiltered list in the same browser session without navigation.

**Pass criterion**: Starting from a filtered view, resetting both filters causes all seed tasks to reappear. The URL does not trigger a full page reload (no browser navigation event).

**Fail criterion**: The page navigates (reload detected) or not all tasks reappear after clearing.

---

### FR-07 — Empty state message when no tasks match combined filters

**Description**: When the combined active filters (assignee + status) match no tasks, the element `[data-testid="empty-state"]` is displayed with a human-readable "No tasks found" message.

**Pass criterion**: Applying a filter combination that returns zero results (e.g., assignee = "admin", status = "in-progress" with current seed data) causes `[data-testid="empty-state"]` to be visible and contain the text "No tasks found".

**Fail criterion**: The empty state element is absent, hidden, or shows a blank/error state.

---

### FR-08 — Existing `/api/tasks?assignee=` endpoint behaviour is preserved

**Description**: The API route `GET /api/tasks` with the `assignee` query parameter continues to function exactly as before this change — same response shape, same filter logic, no new required parameters.

**Pass criterion**: `GET /api/tasks?assignee=admin` returns `200 OK` with `data` array containing only admin-assigned tasks; `GET /api/tasks?assignee=user1` returns only user1 tasks; `GET /api/tasks` returns all tasks. Response envelope `{ data: Task[] }` is unchanged.

**Fail criterion**: Any of the above requests returns a different status code, a changed response shape, or incorrect task lists.

---

### FR-09 — Seed tasks t1–t5 remain intact and unchanged

**Description**: The five seed tasks (`t1`–`t5`) in `lib/store.ts` are not modified by this feature. Their IDs, titles, descriptions, statuses, priorities, assignees, and timestamps remain exactly as defined.

**Pass criterion**: `GET /api/tasks/t1` through `GET /api/tasks/t5` each return the original seed values with no field changes.

**Fail criterion**: Any seed task field differs from the original definition in `lib/store.ts`.

---

### FR-10 — Existing data-testid attributes remain unchanged

**Description**: All existing `data-testid` attributes listed in the README (login-form, status-filter, filter-all, filter-todo, filter-in-progress, filter-done, task-card, task-assignee, etc.) remain present in the DOM with the same values and semantics.

**Pass criterion**: UI selectors for all existing `data-testid` values continue to resolve to the correct elements and behave as described in the README.

**Fail criterion**: Any existing `data-testid` selector fails to locate its element or resolves to the wrong element.

---

## 7. Non-Functional Requirements

### NFR-01 — Performance

Filter changes must result in a re-rendered task list within 500 ms on a standard broadband connection. No additional round trips to the server are required beyond the existing `/api/tasks` call with query parameters; client-side filtering from a cached task set is acceptable.

### NFR-02 — Backward Compatibility

The feature must not break any existing automated or manual test case (TC-UI-001 through TC-UI-014, TC-API-001 through TC-API-015). The API response shape for all existing endpoints must be identical before and after this change.

### NFR-03 — No New Dependencies

No new npm packages may be introduced to support this feature. The assignee filter is a standard HTML `<select>` element styled with existing Tailwind CSS classes.

### NFR-04 — Accessibility

The assignee filter `<select>` must have an associated `<label>` or an `aria-label` attribute so screen readers can identify it.

---

## 8. Risks and Assumptions

| # | Type | Description |
|---|------|-------------|
| A-1 | Assumption | The set of known assignees is static (admin, user1) and does not need to be fetched dynamically from an API. If new users are added to the system in the future, the filter options will need a manual update or a dynamic fetch. |
| A-2 | Assumption | Client-side filtering (filtering an already-fetched task array) is acceptable for performance and simplicity. If task lists grow large, server-side filtering via query params is already supported. |
| A-3 | Assumption | The `Task.assignee` field is always a string matching either "admin" or "user1" in existing seed data. Tasks with other or empty assignee values will appear only under "All Assignees". |
| R-1 | Risk | If the dashboard page component does not currently expose assignee filter state to child components, state management refactoring may be needed. This is low risk given the existing status filter pattern. |
| R-2 | Risk | Combining assignee + status filters requires both parameters to be passed to `getAllTasks`. The store already accepts both; the risk is that the UI does not pass both simultaneously. Must be verified during implementation. |
| R-3 | Risk | Adding a new `data-testid="assignee-filter"` element must not conflict with or overlap any existing testid. Low risk — name does not appear in the existing README table. |

---

## 9. Open Questions

The following items do not block coding but should be confirmed before the story is considered fully closed.

| # | Question | Default / Assumption Used |
|---|----------|--------------------------|
| OQ-1 | Should the assignee filter persist across page refreshes (e.g., via URL query param or localStorage)? | No persistence assumed. Filter resets to "All Assignees" on page load. |
| OQ-2 | Should the task count (`[data-testid="task-count"]`) reflect the filtered count or the total count? | Filtered count — consistent with how the status filter already works. |
| OQ-3 | Is there a plan to support free-text assignee filtering in future (beyond the fixed three options)? | No. This story is scoped to the fixed list. Future story if needed. |
| OQ-4 | Should filtering by assignee be reflected in the page URL for shareability? | Not required for this story. |
