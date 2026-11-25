# Code Review Findings — KAN-1: Task Priority Levels

**Stage:** 6 — Code Review
**Story:** KAN-1
**Branch:** feature/kan-1-task-priority-levels
**Base (PR target):** feature/kt-12-task-search-filtering
**Reviewer:** sdlc-06-review
**Date:** 2026-11-25

---

## Executive Summary

The KAN-1 priority levels feature is **correctly and completely implemented** against all 18 FRs. Every functional requirement is satisfied. The blocking issue is a **branch divergence**: the KAN-1 branch was created from commit `c6ad1f1` (the original SDLC pipeline commit), which predates the KT-11 due-dates work (`04a4b67`) and the KT-12 search/filter work (`acb3e07`) that now sit at the tip of `feature/kt-12-task-search-filtering`. A direct merge would overwrite both of those features, removing four `data-testid` attributes that exist in the target branch and stripping out test infrastructure.

**Required fix before Stage 7:** Rebase `feature/kan-1-task-priority-levels` onto `feature/kt-12-task-search-filtering`, resolve merge conflicts, and confirm that all KT-11 and KT-12 features co-exist with the KAN-1 additions.

---

## Findings

### High Severity

**Finding RV-01**
- Severity: High
- File + Location: `components/TaskCard.tsx` — badge rendering block
- Issue: Compared against `feature/kt-12-task-search-filtering` (the PR target), two `data-testid` attributes are absent from the KAN-1 working tree: `task-duedate` and `task-overdue-badge`. These were added by KT-11 (due-dates story) in commit `04a4b67`. The KAN-1 branch was not rebased after KT-11 merged, so the working tree never received them. Merging KAN-1 as-is would delete these testids from the codebase and regress the KT-11 feature entirely (no due-date display, no overdue badge, `formatDueDate` helper gone, `isTaskOverdue` import gone).
- Recommendation: Rebase `feature/kan-1-task-priority-levels` onto `feature/kt-12-task-search-filtering`. In the resulting TaskCard.tsx, preserve the KT-11 `dueDate` block and `task-overdue-badge` badge alongside the KAN-1 four-level `priorityColors` map and undefined guard.

---

**Finding RV-02**
- Severity: High
- File + Location: `components/TaskForm.tsx` — form fields
- Issue: The `data-testid="task-duedate-input"` attribute (a `<input type="date">` added by KT-11) is absent from the KAN-1 working tree. Same root cause as RV-01. Merging would remove the due-date form field and lose `dueDate` state handling.
- Recommendation: Addressed by the same rebase fix as RV-01. After rebasing, preserve the `dueDate` input field from KT-11 alongside KAN-1's Critical priority option.

---

**Finding RV-03**
- Severity: High
- File + Location: `app/dashboard/page.tsx` — filter bar section
- Issue: The `data-testid="search-input"` attribute (a text input added by KT-12 for task search) is absent from the KAN-1 working tree. KT-12 added `searchTerm` state, a debounced search effect, and the search `<input>` to the dashboard. The KAN-1 implementation also replaces KT-12's combined `fetchTasks(status, priority, search)` signature with a simpler `fetchTasks(status)` only, removing server-side priority and search query forwarding that KT-12 built.
- Recommendation: After rebasing, retain the KT-12 search input and debounced-fetch logic. Integrate KAN-1's client-side priority filter and sort on top of the returned task set, consistent with the KAN-1 architecture decision. The `fetchTasks` function should pass status (and optionally search) to the API; priority filtering remains client-side per architecture.md.

---

**Finding RV-04**
- Severity: High
- File + Location: `lib/types.ts` — `Task` interface
- Issue: The `dueDate?: string` field added by KT-11 is absent from the KAN-1 `Task` interface. Merging would remove the field from the type, causing TypeScript compilation errors in any KT-11 component that references `task.dueDate` once the rebase brings those components back.
- Recommendation: After rebasing, the `Task` interface must retain both `dueDate?: string` (KT-11) and the KAN-1 change of `priority?: TaskPriority` (optional). Both are optional fields; there is no conflict.

---

**Finding RV-05**
- Severity: High
- File + Location: `lib/store.ts` — `getAllTasks` function signature
- Issue: The KT-12 version of `getAllTasks` accepts a `search?: string` parameter and applies a case-insensitive title/description filter. The KAN-1 version removes this parameter. If merged, the `?search=` query parameter on `GET /api/tasks` — which the KT-12 dashboard uses for its debounced search — would silently stop working.
- Recommendation: After rebasing, the final `getAllTasks` signature must carry all four filter parameters: `username`, `status?`, `assignee?`, `search?`, `priority?`. The KAN-1 `priority?` parameter is additive; inserting it after `search?` preserves the KT-12 call sites.

---

**Finding RV-06**
- Severity: High
- File + Location: `package.json` — `devDependencies` and `scripts`
- Issue: The KAN-1 branch removes all test infrastructure that KT-12 introduced: `jest`, `jest-environment-jsdom`, `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `@types/jest`, `ts-node`, and the `test`, `test:watch`, `test:coverage` scripts. Merging would break any CI pipeline that runs `npm test`, and would strip the ability to run unit/integration tests that KT-12 added.
- Recommendation: After rebasing, `package.json` must retain all testing devDependencies and scripts from KT-12 unchanged.

---

### Low Severity

**Finding RV-07**
- Severity: Low
- File + Location: `manual-tests/test-cases.md` — no KAN-1 entries
- Issue: No new test cases have been added to `manual-tests/test-cases.md` for KAN-1 FRs. The requirements document lists existing test cases (TC-UI-010, TC-API-009, TC-API-013, TC-API-005) that relate to priority, but these exercise `"high"` only. The following FRs have no corresponding manual test case: FR-05 (`GET ?priority=critical`), FR-06 (combined `?status=todo&priority=high`), FR-07 (PUT with `"critical"`), FR-10 (safe render for undefined priority), FR-13 (priority filter bar testids), FR-14 (priority filter click behavior), FR-15 (active button visual state), FR-17 (sort control), FR-18 (sort + filter combined).
- Recommendation: Add manual test cases TC-UI-015 through TC-UI-019 (priority filter, sort, combined filter, safe render) and TC-API-016 through TC-API-018 (GET with priority param, combined, PUT critical) to `manual-tests/test-cases.md` before Stage 7.

---

## Verified Items

**KAN-1 FR implementation — all 18 FRs satisfied (confirmed)**

| FR | Check | Result |
|---|---|---|
| FR-01 — extend TaskPriority to include "critical" | `lib/types.ts` line 2 | Confirmed |
| FR-02 — priority optional on Task interface | `lib/types.ts` line 9: `priority?: TaskPriority` | Confirmed |
| FR-03 — default priority "medium" on creation | `app/api/tasks/route.ts` line 46: `validPriorities.includes(priority) ? priority : "medium"` | Confirmed |
| FR-04 — seed tasks t1–t5 unchanged | SEED_TASKS identical to KT-12 branch baseline | Confirmed |
| FR-05 — priority query param on GET /api/tasks | route.ts line 20–22, store.ts line 112 | Confirmed |
| FR-06 — combined status+priority AND filter | store.ts successive filter pattern lines 110–112 | Confirmed |
| FR-07 — PUT accepts "critical" | `app/api/tasks/[id]/route.ts` line 46 | Confirmed |
| FR-08 — API response shape backward compatible | No existing fields removed from response shape | Confirmed |
| FR-09 — color-coded priority badge | TaskCard.tsx: critical=red, high=orange, medium=yellow, low=green | Confirmed |
| FR-10 — safe render for undefined priority | `priorityColors[task.priority ?? ""] ?? "bg-gray-100 text-gray-400"` and `{task.priority ?? "—"}` | Confirmed |
| FR-11 — Critical option in priority select | TaskForm.tsx line 101: `<option value="critical">Critical</option>` | Confirmed |
| FR-12 — default selection is Medium | `useState<TaskPriority>(initial?.priority ?? "medium")` | Confirmed |
| FR-13 — priority filter bar testids | `data-testid="priority-filter"` container + five `filter-priority-{all,low,medium,high,critical}` buttons | Confirmed |
| FR-14 — priority filter click behavior | `onClick={() => setFilterPriority(pf.value)}` + client-side filter on `displayedTasks` | Confirmed |
| FR-15 — active filter visual state | Active: `bg-blue-600 text-white`, inactive: `border border-gray-300` — matches status filter pattern | Confirmed |
| FR-16 — combined UI filtering | Priority filters `tasks` (status-filtered from API); changing either does not reset the other | Confirmed |
| FR-17 — priority sort control | `data-testid="sort-priority-button"` toggles `sortByPriority`, PRIORITY_ORDER weight map, undefined sorts to 0 | Confirmed |
| FR-18 — sort within filtered set | Sort applied after priority filter on `displayedTasks` | Confirmed |

**Seed tasks t1–t5 unchanged — confirmed**
Both the KAN-1 working tree and the KT-12 branch have identical SEED_TASKS definitions. No seed task id, title, status, priority, assignee, or timestamp was modified.

**All existing API route paths and HTTP verbs preserved — confirmed**
`GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/:id`, `POST /api/auth/login`, `POST /api/auth/logout` all present. No path or verb changes.

**New priority field is optional — confirmed**
`priority?: TaskPriority` in `lib/types.ts`; POST route defaults to `"medium"` when omitted; PUT route conditionally applies only when provided and valid.

**Server-side input validation for priority — confirmed**
`validPriorities: TaskPriority[] = ["low", "medium", "high", "critical"]` validated before use in both POST and PUT handlers.

**No new npm dependencies introduced by KAN-1 — confirmed**
No entries were added to `dependencies` or `devDependencies` by the KAN-1 implementation. (Note: RV-06 flags the removal of KT-12 test dependencies as a separate high-severity regression.)

---

## Required Fixes Before PR

The following **High** severity findings must be resolved before Stage 7 (Verify):

| Finding | File(s) | Required Action |
|---|---|---|
| RV-01 | `components/TaskCard.tsx` | Rebase onto `feature/kt-12-task-search-filtering`; preserve `task-duedate` and `task-overdue-badge` testids |
| RV-02 | `components/TaskForm.tsx` | Same rebase; preserve `task-duedate-input` testid and `dueDate` state |
| RV-03 | `app/dashboard/page.tsx` | Same rebase; preserve `search-input` testid and debounced search logic |
| RV-04 | `lib/types.ts` | Same rebase; preserve `dueDate?: string` field on `Task` interface |
| RV-05 | `lib/store.ts` | Same rebase; preserve `search?` parameter in `getAllTasks` |
| RV-06 | `package.json` | Same rebase; preserve jest/testing-library devDependencies and test scripts |

All six findings share one root cause: **the KAN-1 branch was not rebased onto `feature/kt-12-task-search-filtering` before review**. A single `git rebase feature/kt-12-task-search-filtering` on the KAN-1 branch, followed by conflict resolution that merges KT-11/KT-12 features with KAN-1 additions, resolves all six findings simultaneously.

---

## Verdict

**Verdict: No-Go**

Blocking issues: RV-01, RV-02, RV-03, RV-04, RV-05, RV-06.

Total findings: 7 — 6 High, 0 Medium, 1 Low.

The KAN-1 priority levels feature is correctly implemented in isolation (all 18 FRs satisfied, no logic bugs, no testid regressions within the story scope). The No-Go is entirely due to the branch not being rebased onto the current tip of `feature/kt-12-task-search-filtering`. Once the rebase is performed and conflicts resolved to preserve KT-11 and KT-12 features, re-run Stage 6 to confirm all High findings are cleared before proceeding to Stage 7.

---

*Document generated by the Agentic SDLC pipeline — Stage 6: Code Review.*
*Story: KAN-1 | Branch: feature/kan-1-task-priority-levels | Date: 2026-11-25*
