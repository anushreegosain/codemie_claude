# Code Review Findings — KAN-1: Task Priority Levels (Re-Review)

**Stage:** 6 — Code Review (Re-Review after rebase)
**Story:** KAN-1
**Branch:** feature/kan-1-task-priority-levels
**Base (PR target):** feature/kt-12-task-search-filtering
**Reviewer:** sdlc-06-review
**Date:** 2026-11-25

---

## Executive Summary

The KAN-1 priority levels feature is **correctly and completely implemented** against all 18 FRs on the rebased branch. The previous No-Go verdict was due solely to the branch being behind `feature/kt-12-task-search-filtering`. That rebase has been completed and all conflicts resolved. All KT-11 (due dates) and KT-12 (search and filtering) features co-exist with the KAN-1 additions. No High or Medium severity findings were identified.

---

## Findings

### High Severity

No issues found.

---

### Medium Severity

No issues found.

---

### Low Severity

**Finding RV-01**
- Severity: Low
- File + Location: `manual-tests/test-cases.md` — entire file
- Issue: No new test cases were added to `manual-tests/test-cases.md` for KAN-1-specific FRs. The existing cases TC-UI-010 (create with priority), TC-API-009 (POST with `priority: "high"`), and TC-API-013 (PUT with `priority: "high"`) exercise the original three priority values only. The following FRs have no corresponding manual test case: FR-01/FR-07/FR-09/FR-11 (critical priority specifically), FR-05 (`GET ?priority=critical`), FR-06 (combined `?status=todo&priority=high`), FR-13 (priority filter bar testid presence), FR-14 (priority filter click behavior), FR-15 (active button visual state), FR-17 (sort-priority-button), FR-18 (sort + filter combined).
- Recommendation: Add manual test cases for the critical tier (create/update/filter/badge) and for the priority filter and sort controls before Stage 7 automation.

---

**Finding RV-02**
- Severity: Low
- File + Location: `app/dashboard/page.tsx` — `fetchTasks` call in `useEffect` at line 78
- Issue: NFR-06 states "No additional API calls should be made when switching priority filter (filter/sort state is managed client-side)." The implementation calls `fetchTasks` (which makes an API request) when `filterPriority` changes, via `useEffect(() => { fetchTasks(filterStatus, filterPriority, searchTerm); }, [filterStatus, filterPriority])`. The architecture explicitly designed priority filtering as client-side only. The sort correctly remains client-side (no API call when `sortByPriority` toggles). All FRs are satisfied — the results are correct either way — but the approach deviates from the spec.
- Recommendation: If NFR-06 compliance is required, fetch all tasks without a priority param and apply the priority filter inside the `displayedTasks` derivation (client-side), consistent with how the overdue filter works. This is not blocking.

---

## Verified Items

**All 18 KAN-1 FRs satisfied — confirmed**

| FR | Evidence |
|---|---|
| FR-01 — extend TaskPriority to include "critical" | `lib/types.ts` line 2: `"low" \| "medium" \| "high" \| "critical"` |
| FR-02 — priority optional on Task interface | `lib/types.ts` line 9: `priority?: TaskPriority` |
| FR-03 — default priority "medium" on creation | `app/api/tasks/route.ts` line 76: `validPriorities.includes(priority) ? priority : "medium"` |
| FR-04 — seed tasks t1–t5 unchanged | No diff in `lib/store.ts` between KAN-1 and KT-12; SEED_TASKS identical |
| FR-05 — priority query param on GET /api/tasks | `route.ts` lines 21, 32–37, 39; `store.ts` line 126 |
| FR-06 — combined status+priority AND filter | `store.ts` successive filter: status → assignee → search → priority |
| FR-07 — PUT accepts "critical" | `app/api/tasks/[id]/route.ts` line 59: validPriorities includes "critical" |
| FR-08 — API response shape backward compatible | No existing fields removed from any response shape |
| FR-09 — color-coded priority badge | `TaskCard.tsx`: critical=red-100/red-700, high=orange-50/orange-600, medium=yellow-50/yellow-700, low=green-50/green-700 |
| FR-10 — safe render for undefined priority | `priorityColors[task.priority ?? ""] ?? "bg-gray-100 text-gray-400"` and `{task.priority ?? "—"}` |
| FR-11 — Critical option in priority select | `TaskForm.tsx` line 109: `<option value="critical">Critical</option>`; four options total |
| FR-12 — default selection is Medium | `useState<TaskPriority>(initial?.priority ?? "medium")` |
| FR-13 — priority filter bar testids | `data-testid="priority-filter"` container + five buttons: `filter-priority-all/low/medium/high/critical` |
| FR-14 — priority filter click behavior | `onClick={() => setFilterPriority(pf.value)}` triggers `useEffect` → `fetchTasks` |
| FR-15 — active filter visual state | Active: `bg-blue-600 text-white`; inactive: `border border-gray-300 text-gray-600` — matches status filter pattern |
| FR-16 — combined UI filtering | Both `filterStatus` and `filterPriority` are passed to `fetchTasks`; changing one does not reset the other |
| FR-17 — priority sort control | `data-testid="sort-priority-button"` toggles `sortByPriority`; `PRIORITY_ORDER: { critical:4, high:3, medium:2, low:1 }`; undefined tasks get weight 0 and sort to bottom |
| FR-18 — sort within filtered set | Sort applied to `displayedTasks` after priority/overdue filtering |

**Seed tasks t1–t5 unchanged — confirmed**
`lib/store.ts` has zero diff against `feature/kt-12-task-search-filtering`. SEED_TASKS definitions for t1–t5 (id, title, description, status, priority, assignee, createdAt, updatedAt) are byte-for-byte identical to the base branch.

**All existing data-testid attributes preserved — confirmed**
Grep of the diff against the base branch (`git diff feature/kt-12-task-search-filtering -- components/ app/ | grep "data-testid"`) shows no testid removals. All pre-existing testids remain: `task-card`, `task-id`, `task-title`, `task-description`, `task-status`, `task-priority`, `task-duedate`, `task-overdue-badge`, `task-assignee`, `edit-task-button`, `delete-task-button`, `task-form`, `task-title-input`, `task-description-input`, `task-status-select`, `task-priority-select`, `task-duedate-input`, `task-assignee-input`, `task-form-error`, `task-submit-button`, `task-cancel-button`, `status-filter`, `filter-all/todo/in-progress/done/overdue`, `add-task-button`, `search-input`, `task-modal`, `dashboard-error`, `loading-indicator`, `empty-state`, `task-list`, `task-count`, `logged-in-user`, `logout-button`. New KAN-1 testids added: `priority-filter`, `filter-priority-all/low/medium/high/critical`, `sort-priority-button`.

**No new npm dependencies added — confirmed**
`git diff feature/kt-12-task-search-filtering -- package.json` produces no output. `dependencies` and `devDependencies` are unchanged.

**KT-11 features preserved — confirmed**
- `dueDate?: string` field present on `Task` interface (`lib/types.ts` line 13)
- `isTaskOverdue` imported and used in `TaskCard.tsx` (line 4, line 105) and `app/dashboard/page.tsx` (line 6, line 156)
- `data-testid="task-duedate"` present in `TaskCard.tsx` line 101
- `data-testid="task-overdue-badge"` present in `TaskCard.tsx` line 109
- Overdue status filter (`filter-overdue`) present in dashboard status filter bar
- Due date validation in POST and PUT handlers preserved

**KT-12 features preserved — confirmed**
- `data-testid="search-input"` present in `app/dashboard/page.tsx` line 193
- 300ms debounced search `useEffect` present at line 69–74
- `search` parameter in `getAllTasks` signature (`lib/store.ts` line 112)
- `search` query param extracted and forwarded in `app/api/tasks/route.ts` line 20
- Server-side search filter (title + description, case-insensitive) in `store.ts` lines 118–125

**API contract integrity — confirmed**
All handlers present and unmodified in verb: `POST /api/auth/login`, `POST /api/auth/logout`, `GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/:id`. No path changes, no verb changes.

**New priority field optional in TypeScript interface — confirmed**
`priority?: TaskPriority` — the `?` is present. All existing tasks without a priority value deserialise and render safely.

**Server-side input validation for new field — confirmed**
GET route validates `priority` query param and returns 400 for unrecognised values. POST and PUT routes validate against `validPriorities: ["low", "medium", "high", "critical"]` before writing to the store.

---

## Required Fixes Before PR

None. No High severity findings were identified.

Low severity findings RV-01 and RV-02 are noted but do not block Stage 7.

---

## Verdict

**Verdict: Go**

2 findings total: 0 High, 0 Medium, 2 Low. No blocking issues. All 18 KAN-1 FRs are satisfied. KT-11 and KT-12 features are fully preserved on the rebased branch. Proceed to Stage 7 (Verify).

---

*Document generated by the Agentic SDLC pipeline — Stage 6: Code Review (Re-Review).*
*Story: KAN-1 | Branch: feature/kan-1-task-priority-levels | Date: 2026-11-25*
