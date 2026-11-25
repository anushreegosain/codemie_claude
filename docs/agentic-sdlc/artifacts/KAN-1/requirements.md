# Requirements — KAN-1: Task Priority Levels

## 1. Jira Story

**Key:** KAN-1
**Title:** Task Priority Levels
**URL:** https://sehgala36.atlassian.net/browse/KAN-1

**Summary (from story):**
Give tasks a priority level (Low / Medium / High / Critical) so users can sort and filter by urgency.

---

## 2. Problem Statement

Users of the Kata Task Manager currently have no way to signal the relative urgency of tasks beyond their status. Without a priority dimension, all tasks sitting in the same status bucket (e.g., "To Do") look equally important, making it difficult to triage work at a glance. Users need a structured priority field — with four severity levels — that is visually prominent on each task card and that integrates into the filter and sort controls on the dashboard so they can focus on what matters most.

---

## 3. Goals

- Extend the `TaskPriority` type to four levels: `low | medium | high | critical`.
- Display a color-coded priority badge on every TaskCard so urgency is visible without opening a task.
- Add a Priority filter to the dashboard filter bar so users can narrow the task list to a single priority level.
- Support combined Status + Priority filtering so users can find, e.g., all "Critical" tasks that are still "To Do".
- Support a priority sort (Critical → High → Medium → Low) so users can order the task list by urgency.
- Ensure full backward compatibility: tasks without a `priority` value must render safely.

---

## 4. Non-Goals

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

## 5. Clarifying Q&A

The full story, acceptance criteria, and artifact path were provided directly by the pipeline operator. No interactive Q&A session was conducted. The following scope assumptions are applied and documented here for the record.

| Question | Assumption Applied |
|---|---|
| Is this feature visible to all users or admins only? | All authenticated users. The story does not restrict visibility. |
| Should the `priority` field be optional or required on new tasks? | Optional in the TypeScript interface. When omitted on creation, the API defaults to `"medium"`. |
| Should existing tasks without a priority value behave differently? | They must render safely (no crash, no blank badge). The badge should display a neutral/default state if `priority` is undefined. |
| What triggers the priority filter? | A click on a filter button in the priority filter bar (consistent with the existing status filter UX). |
| What is the sort trigger? | A dedicated sort control on the dashboard (button or select). Single-direction: Critical → High → Medium → Low. Tasks without a priority sort to the bottom. |
| Does priority filtering replace or combine with status filtering? | They combine. Both filters apply simultaneously (AND logic). |
| Is the priority badge text, icon, or both? | Colored text badge (chip/pill), consistent with how status is displayed. No icon required; implementer may add one. |
| Are there existing test cases this story extends? | TC-UI-010 (create task with priority), TC-API-009 (POST with `priority: "high"`), TC-API-013 (PUT with `priority: "high"`), TC-API-005 (GET — task shape includes `priority`). New test cases will be needed for the priority filter and sort. |

---

## 6. Functional Requirements

### Data Model

**FR-01 — Extend TaskPriority enum**
The `TaskPriority` union type in `lib/types.ts` MUST be extended to include `"critical"` as a fourth valid value.

Final type: `export type TaskPriority = "low" | "medium" | "high" | "critical";`

Pass: TypeScript compiles without error when a task is assigned `priority: "critical"`.
Fail: TypeScript compiler rejects `"critical"` as an assignment to `TaskPriority`.

---

**FR-02 — Make `priority` optional on the Task interface**
The `priority` field on the `Task` interface in `lib/types.ts` MUST be changed to optional: `priority?: TaskPriority`.

Pass: A `Task` object constructed without a `priority` key is accepted by TypeScript; the TaskCard renders without a runtime error.
Fail: TypeScript error when constructing a task without `priority`, or runtime crash on a task card for a task with no `priority` value.

---

**FR-03 — Default priority on task creation**
When a POST /api/tasks request body omits the `priority` field, the created task MUST have `priority: "medium"`.

Pass: `POST /api/tasks` with body `{"title": "New Task"}` returns `201` with `data.priority === "medium"`.
Fail: The created task has `priority: null`, `priority: undefined`, or any value other than `"medium"`.

---

**FR-04 — Seed data unchanged**
Seed tasks `t1`–`t5` in `lib/store.ts` MUST remain exactly as currently defined. Their existing `priority` values (`"high"`, `"high"`, `"medium"`, `"medium"`, `"low"`) are already valid under the extended type and require no modification.

Pass: `GET /api/tasks` for the `admin` user returns t1 with `priority: "high"` and t5 with `priority: "low"`.
Fail: Any seed task's `id`, `title`, `status`, `priority`, `assignee`, or timestamp fields are changed.

---

### API

**FR-05 — Priority filter query parameter on GET /api/tasks**
The `GET /api/tasks` endpoint MUST support a new optional query parameter `priority`. Valid values: `low`, `medium`, `high`, `critical`. When provided, only tasks matching the given priority MUST be returned. When omitted, all tasks are returned (existing behavior unchanged).

Pass: `GET /api/tasks?priority=critical` returns only tasks with `priority: "critical"`. `GET /api/tasks` with no `priority` param returns all tasks.
Fail: The parameter is silently ignored, or returns an error, or filters out tasks incorrectly.

---

**FR-06 — Combined status + priority filtering**
The `GET /api/tasks` endpoint MUST support both `status` and `priority` query parameters simultaneously. When both are present, only tasks matching BOTH criteria MUST be returned (AND logic).

Pass: `GET /api/tasks?status=todo&priority=high` returns only tasks where `status === "todo"` AND `priority === "high"`.
Fail: One parameter overrides the other, or combined filtering returns incorrect results.

---

**FR-07 — Priority accepted on PUT /api/tasks/:id**
The `PUT /api/tasks/:id` endpoint MUST accept `"critical"` as a valid value for the `priority` field in the request body.

Pass: `PUT /api/tasks/t3` with body `{"priority": "critical"}` returns `200` with `data.priority === "critical"`.
Fail: The API rejects `"critical"` with a `400` error, or silently ignores the value.

---

**FR-08 — API response shape backward compatible**
All existing API response fields (`id`, `title`, `description`, `status`, `assignee`, `createdAt`, `updatedAt`) MUST remain present and unchanged in shape. The `priority` field is now optional in the TypeScript interface but MAY continue to appear in all API responses (existing tasks already have it set).

Pass: `GET /api/tasks` response shape matches the existing schema documented in README.md. Automation test TC-API-005 continues to pass.
Fail: Any previously-present response field is removed, renamed, or its type changed.

---

### UI — TaskCard

**FR-09 — Color-coded priority badge on TaskCard**
The TaskCard component MUST display a color-coded badge on the element with `data-testid="task-priority"` indicating the task's priority. The minimum required color scheme is:

| Priority | Badge Color |
|---|---|
| `critical` | Red |
| `high` | Orange |
| `medium` | Blue or Yellow |
| `low` | Green or Gray |

Pass: A task with `priority: "critical"` renders a red-styled badge; a task with `priority: "low"` renders a green/gray badge. Visual difference is distinguishable at a glance.
Fail: All priorities render identically, or the badge is absent, or the `data-testid="task-priority"` element is removed.

---

**FR-10 — Safe render for tasks without priority**
When a task has no `priority` field (i.e., `priority` is `undefined`), the TaskCard MUST render without throwing a runtime error. It MUST display a neutral/default badge state (e.g., no badge, or a gray "—" indicator).

Pass: Rendering a `Task` object with `priority` omitted produces no console errors and displays a card.
Fail: Runtime exception, blank screen, or broken layout when `priority` is undefined.

---

### UI — TaskForm

**FR-11 — "Critical" option in priority select**
The task creation and edit form MUST include `"Critical"` as a selectable option in the priority `<select>` input (`data-testid="task-priority-select"`). The four options MUST be: Low, Medium, High, Critical (displayed in this order or in reverse urgency order).

Pass: The `data-testid="task-priority-select"` dropdown contains exactly four options including one with value `"critical"`.
Fail: The dropdown is missing "Critical", or contains more/fewer than four options.

---

**FR-12 — Default selection in priority select**
When the TaskForm opens for a new task, the priority select MUST default to "Medium".

Pass: Opening the create task modal shows the priority select pre-selected on "Medium".
Fail: The default is blank, Low, High, or any other value.

---

### UI — Dashboard Filter Bar

**FR-13 — Priority filter bar section**
The dashboard filter bar MUST include a Priority filter section that allows users to filter tasks by priority. The section container MUST carry `data-testid="priority-filter"`. It MUST contain the following filter buttons with these exact `data-testid` values:

| Button Label | data-testid |
|---|---|
| All | `filter-priority-all` |
| Low | `filter-priority-low` |
| Medium | `filter-priority-medium` |
| High | `filter-priority-high` |
| Critical | `filter-priority-critical` |

Pass: All five elements are locatable by their `data-testid` values on the dashboard page.
Fail: Any element is missing, misnamed, or the `data-testid` values differ from those specified above.

---

**FR-14 — Priority filter behavior**
Clicking a priority filter button MUST update the visible task list to show only tasks matching that priority. Clicking "All" (priority) MUST remove the priority filter and restore all tasks (subject to any active status filter).

Pass: Clicking `filter-priority-critical` shows only Critical tasks. Clicking `filter-priority-all` restores all tasks.
Fail: Clicking a filter button has no effect, or shows incorrect tasks.

---

**FR-15 — Active filter visual state**
The active priority filter button MUST be visually distinguished from inactive buttons (e.g., different background color or underline), consistent with the visual treatment of the existing status filter buttons.

Pass: After clicking `filter-priority-high`, the High button is visually highlighted; other priority buttons are not.
Fail: All buttons look identical regardless of which is active.

---

**FR-16 — Combined UI filtering**
When both a status filter and a priority filter are active simultaneously, the task list MUST display only tasks matching BOTH criteria. Changing one filter MUST NOT reset the other.

Pass: With status="To Do" and priority="High" both active, only High+ToDo tasks are shown. Changing status to "Done" preserves the priority filter.
Fail: Activating a priority filter clears the status filter, or vice versa.

---

### UI — Priority Sort

**FR-17 — Priority sort control**
The dashboard MUST provide a sort control (button, link, or select — implementer's choice) that sorts the task list by priority in descending urgency order: Critical first, then High, Medium, Low. Tasks without a `priority` value MUST sort to the bottom.

Pass: Activating the sort produces a list where any Critical tasks appear before High tasks, High before Medium, Medium before Low, and tasks with no priority appear last.
Fail: Sort order is incorrect, or the control is absent.

---

**FR-18 — Sort does not conflict with filters**
When both a priority filter and the priority sort are active simultaneously, the filtered results MUST be sorted. The sort applies within the currently filtered set.

Pass: With priority filter = "High" and sort active, all visible tasks are "High" and displayed in creation order or stable order (since they share the same priority level).
Fail: Sort resets the filter, or the sort only works when no filter is active.

---

## 7. Non-Functional Requirements

**NFR-01 — No new npm dependencies**
This story MUST NOT introduce any new packages to `package.json`. All priority badge styling MUST be achieved using existing Tailwind CSS utility classes.

**NFR-02 — TypeScript strict compliance**
The codebase MUST continue to compile with `npm run build` and `npm run lint` passing without new errors after changes are applied.

**NFR-03 — No breaking changes to existing API contracts**
Existing route paths (`/api/tasks`, `/api/tasks/:id`, `/api/auth/*`), HTTP verbs, and response field names MUST remain unchanged. The new `priority` query parameter on `GET /api/tasks` is purely additive.

**NFR-04 — No removal of existing data-testid attributes**
All `data-testid` attributes currently documented in `README.md` and `manual-tests/test-cases.md` MUST remain present and unchanged. New `data-testid` attributes defined in FR-13 are additive.

**NFR-05 — Backward compatibility for existing tasks**
Existing tasks stored in Vercel KV (production) or in-memory (local dev) that have `priority` values of `"low"`, `"medium"`, or `"high"` MUST continue to display correctly. No data migration is required.

**NFR-06 — Performance**
Client-side priority filtering and sorting MUST complete within a single render cycle. No additional API calls should be made when switching priority filter or activating sort (filter/sort state is managed client-side).

**NFR-07 — All users, no admin restriction**
The priority badge, filter bar, sort control, and form select are visible and functional for all authenticated users. No role-based gating is required.

---

## 8. Risks and Assumptions

| # | Risk / Assumption | Mitigation |
|---|---|---|
| R-01 | The `priority` field is currently required (non-optional) on the `Task` interface. Changing it to optional may surface TypeScript errors in components that assume `task.priority` is always defined. | All components accessing `task.priority` must be updated to use optional chaining (`task.priority?.`) or a fallback, and the full component tree must be re-checked. |
| R-02 | The seed tasks (t1–t5) already define `priority` using the existing three-value enum. Extending the enum to four values is non-breaking for them, but the TaskCard must handle `"critical"` correctly even if no seed task has it. | Add a "critical" badge style and test it in isolation before relying on seed data. |
| R-03 | Production data in Vercel KV may contain tasks with `priority: undefined` if a bug in a previous release omitted the field. | Making `priority` optional (FR-02) handles this. The TaskCard safe-render requirement (FR-10) ensures no crash. |
| R-04 | The README Field Reference section currently lists priority values as `low \| medium \| high`. If automation tests assert against this documentation literally, adding `critical` is a documentation change that must be coordinated. | Update README Field Reference and API Reference sections as part of this story's implementation. |
| R-05 | The story specifies the priority sort order as Critical → High → Medium → Low. If the sort direction is ever reversed, existing test cases will fail. | Encode the sort weight as a constant map in the implementation (e.g., `{ critical: 4, high: 3, medium: 2, low: 1 }`) so it is easy to verify and adjust. |
| A-01 | It is assumed that priority filtering is single-select (one priority level active at a time), consistent with the status filter. Multi-select is out of scope. | Confirmed by scope assumption in Section 5. |
| A-02 | It is assumed that the priority sort is a one-click toggle (apply/remove), not a dropdown with ascending/descending options. | Flagged as an open question below. |
| A-03 | It is assumed that an `invalid` or unrecognised `priority` query parameter value on `GET /api/tasks` returns an empty array (not a 400 error), consistent with how the existing `status` filter behaves. | To be confirmed with implementer. |

---

## 9. Open Questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| OQ-01 | Should the priority sort control be a toggle button (ascending only) or a full sort dropdown with ascending and descending options? The current story describes only "Critical → Low" direction. | Product / UX | No — ascending-only is safe to implement; can be extended later. |
| OQ-02 | When an invalid value is passed to `GET /api/tasks?priority=xyz`, should the API return `400 Bad Request` with a validation error, or silently return an empty array? | Backend implementer | No — empty array is safer for backward compatibility with automation tests. |
| OQ-03 | Should the priority filter and status filter be shown in the same filter bar row or as separate rows? The current filter bar only contains status. | UX / implementer | No — single row with two grouped sections is the assumed default. |
| OQ-04 | The README Field Reference section and API documentation currently list priority values as `low \| medium \| high`. Should updating the README be part of this story or a separate documentation task? | Tech lead | No — assumed in-scope for this story, as the pipeline's architecture and PR stages will update the README. |

---

*Document generated by the Agentic SDLC pipeline — Stage 1: Requirements.*
*Story: KAN-1 | Branch: feature/kan-1-task-priority-levels | Date: 2026-11-25*
