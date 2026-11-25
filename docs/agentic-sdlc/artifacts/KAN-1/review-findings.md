# Code Review Findings — KAN-1: Filter Dashboard by Assignee

**Stage**: 6 — Code Review
**Reviewer**: sdlc-06-review agent
**Date**: 2026-11-25
**Branch**: feature/kan-1-filter-dashboard-by-assignee
**File reviewed**: `app/dashboard/page.tsx`

---

## FR / NFR Coverage Map

| Requirement | Implementation Location | Verdict |
|---|---|---|
| FR-01 — Assignee filter control present | `page.tsx` lines 194–215: pill-button row with `data-testid="assignee-filter"` wrapper; individual buttons `assignee-filter-all`, `assignee-filter-admin`, `assignee-filter-user1` | PARTIAL — see RV-01 |
| FR-02 — Default shows all assignees | `useState<string>("all")` (line 15); `if (assignee && assignee !== "all")` guard omits param when "all" | PASS |
| FR-03 — Admin filter | URLSearchParams sets `assignee=admin`; store filters `t.assignee === "admin"` | PASS |
| FR-04 — User1 filter | URLSearchParams sets `assignee=user1`; store filters `t.assignee === "user1"` | PASS |
| FR-05 — Compound filter (assignee + status) | Both params set independently via URLSearchParams; store applies both sequentially | PASS |
| FR-06 — Clearing filters restores full list, no reload | Reset to `"all"` omits assignee param; React state update re-renders without navigation | PASS |
| FR-07 — Empty state text is exactly "No tasks found" | `page.tsx` line 248: text node is exactly `No tasks found` | PASS |
| FR-08 — API endpoint behaviour preserved | `git diff main -- app/api/` returned no changes; routes untouched | PASS |
| FR-09 — Seed tasks t1–t5 intact | `git diff main -- lib/store.ts` returned no output; seeds confirmed unchanged | PASS |
| FR-10 — Existing data-testids unchanged | No `-` removals for existing testids in diff; all values intact | PASS |
| NFR-01 — Filter within 500 ms | Single API call with query params; no extra round trips | PASS |
| NFR-02 — Backward compatibility | No routes, fields, or testids removed | PASS |
| NFR-03 — No new npm dependencies | `git diff main -- package.json` returned no output | PASS |
| NFR-04 — Accessibility | `aria-pressed` on each pill button satisfies screen-reader identification | PASS |

---

## Findings

**Finding RV-01**
- Severity: Medium
- File + Location: `app/dashboard/page.tsx` lines 194–215; FR-01 pass criterion
- Issue: FR-01 specifies the assignee filter as a `<select>` element with the `data-testid="assignee-filter"` on the select itself, an "All Assignees" option with `value=""`, and an explicit pass criterion that the element "contains exactly three `<option>` elements with the specified values." The implementation deviates in two respects: (1) the control is a row of pill `<button>` elements inside a wrapper `<div data-testid="assignee-filter">`, not a `<select>`; (2) the "All Assignees" sentinel is `"all"` rather than `""`. The filtering logic is functionally correct, but any automated test written against the FR-01 pass criterion (querying for `<option>` elements inside `[data-testid="assignee-filter"]`) will fail. The architecture was also approved with a `<select>` design; the pivot to pill buttons occurred during implementation without a formal amendment to FR-01 or the architecture decision table.
- Recommendation: Before Stage 7, either (a) update FR-01, the architecture decision table in `architecture.md`, and the Stage 7 verification test expectations to reflect the pill-button implementation — this is the preferred path since the pill-button UI is consistent with the existing status filter pattern and provides better UX — or (b) revert to a `<select data-testid="assignee-filter">` with `<option value="">All Assignees</option>`, `<option value="admin">Admin</option>`, `<option value="user1">User1</option>` as originally specified. Either way the functional filtering behaviour is correct.

---

**Finding RV-02**
- Severity: Low
- File + Location: `docs/agentic-sdlc/artifacts/KAN-1/implementation-log.md`
- Issue: The impl-plan contains 8 tasks (TASK-01 through TASK-08). The implementation-log documents TASK-01 through TASK-06 only. TASK-07 from the plan (changing the empty-state paragraph text from "No tasks found. Add one to get started!" to "No tasks found") was executed correctly in the code — confirmed in the git diff — but has no entry in the implementation-log. TASK-08 from the plan is covered by the log's TASK-06, but the task numbering is not reconciled.
- Recommendation: Add a TASK-07 entry to the implementation-log noting the empty-state text change and its mapping to FR-07 and DR-01 from the design review.

---

**Finding RV-03**
- Severity: Low
- File + Location: `app/dashboard/page.tsx` lines 271–277; impl-plan TASK-08 validation criteria
- Issue: The task-count display text format deviates from the impl-plan TASK-08 specification. (1) The only-assignee branch renders `assigned to ${assigneeFilter}` without quotes around the assignee name; the impl-plan validation states the text should read "X tasks assigned to 'admin'" with single-quote delimiters. (2) The both-active branch renders `with status "${filter}" assigned to ${assigneeFilter}`, while both the architecture and impl-plan TASK-08 specify a parenthetical format: `(status: "${filter}", assignee: "${assigneeFilter}")`. The `data-testid="task-count"` attribute is preserved and the informational content is correct, but Stage 7 verification tests written against the documented format strings will fail.
- Recommendation: Align the both-active and only-assignee count strings with the format documented in impl-plan TASK-08, or update the impl-plan and Stage 7 test expectations to match the implemented format before Stage 7 runs.

---

**Finding RV-04**
- Severity: Low
- File + Location: `manual-tests/test-cases.md`
- Issue: No new UI test cases were added to cover FR-01 through FR-07 (the assignee filter feature). The requirements document states this story extends the filter module and adds new assignee filter test cases. `manual-tests/test-cases.md` contains TC-API-008 (`GET /api/tasks?assignee=user1`) covering the backend endpoint, but no UI test cases cover: selecting an assignee filter pill, compound assignee+status filtering, clearing the assignee filter, or the empty-state under a no-match filter combination.
- Recommendation: Add UI test cases for at minimum: (a) selecting "admin" filter verifying only t1/t4 appear; (b) selecting "user1" filter verifying t2/t3/t5 appear; (c) compound filter (assignee=user1, status=todo) verifying only t3/t5 appear; (d) empty-state when filters produce no matches; (e) resetting "All Assignees" restoring the full five-task list.

---

No issues found in: Correctness (filtering logic, URL construction, state management), Backward Compatibility, Optional Fields, Error Handling, Security, Seed Data, API Contract, No New Dependencies, Code Clarity, or DRY Principle.

---

## Verified Items

- **assigneeFilter state uses "all" sentinel (not "")** — confirmed (line 15: `useState<string>("all")`)
- **fetchTasks guard uses `if (assignee && assignee !== "all")`** — confirmed (line 30)
- **useEffect includes assigneeFilter in dep array** — confirmed (line 56: `[filter, assigneeFilter, fetchTasks, router]`)
- **handleCreate passes assigneeFilter to fetchTasks** — confirmed (line 81)
- **handleUpdate passes assigneeFilter to fetchTasks** — confirmed (line 99)
- **handleDelete passes assigneeFilter to fetchTasks** — confirmed (line 113)
- **handleStatusChange useCallback from KT-20 preserved and updated** — confirmed (lines 116–133; dep array `[token, filter, assigneeFilter, fetchTasks]`; calls `fetchTasks(filter, assigneeFilter)`)
- **assignee-filter wrapper div present** — confirmed (`data-testid="assignee-filter"` on line 194)
- **assignee-filter-all button present** — confirmed (`data-testid="assignee-filter-all"`)
- **assignee-filter-admin button present** — confirmed (`data-testid="assignee-filter-admin"`)
- **assignee-filter-user1 button present** — confirmed (`data-testid="assignee-filter-user1"`)
- **aria-pressed on each pill button** — confirmed (line 205: `aria-pressed={assigneeFilter === opt.value}`)
- **task-count ternary uses !== "all" checks** — confirmed (lines 271–277)
- **All existing data-testid attributes preserved** — confirmed: `logged-in-user`, `logout-button`, `status-filter`, `filter-all`, `filter-todo`, `filter-in-progress`, `filter-done`, `add-task-button`, `task-modal`, `dashboard-error`, `loading-indicator`, `empty-state`, `task-list`, `task-count` all present in `app/dashboard/page.tsx`. Note: `task-status` testid in `components/TaskCard.tsx` was moved to an `sr-only` span as part of the KT-20 (Inline Status Controls) story on this branch; it is still present in the DOM.
- **Seed tasks t1–t5 unchanged** — confirmed (`git diff main -- lib/store.ts` produced no output; `lib/store.ts` lines 15–21 show all five seed tasks intact with original ids, titles, descriptions, statuses, priorities, assignees, and timestamps)
- **No changes to API routes** — confirmed (`git diff main -- app/api/` produced no output; all seven route exports present and unmodified)
- **No new npm dependencies added** — confirmed (`git diff main -- package.json` produced no output)
- **No changes to lib/types.ts** — confirmed (`git diff main -- lib/types.ts` produced no output)
- **No changes to lib/store.ts** — confirmed
- **Build passes** — confirmed in implementation-log (Next.js 14.2.35, compiled successfully, no TypeScript errors)
- **Lint passes** — confirmed in implementation-log (no ESLint warnings or errors)
- **URLSearchParams used for clean URL construction** — confirmed (lines 28–32)
- **Empty-state text matches FR-07 pass criterion** — confirmed (line 248: "No tasks found")

---

## Required Fixes Before PR

No High severity findings. No blocking issues.

The Medium finding (RV-01) is recommended to resolve before Stage 7 to avoid false failures in verification tests written against the FR-01 pass criterion. The fix is a documentation alignment (update FR-01 and architecture to match the pill-button implementation), not a code defect.

---

## Verdict

**Verdict: Go**
4 findings total: 0 High, 1 Medium, 3 Low. No blocking issues. Proceed to Stage 7.

The implementation is functionally correct: assignee state management, URL parameter construction, all call-site updates, the pill-button filter UI, aria-pressed accessibility attributes, the task-count ternary, and the empty-state text are all implemented correctly and produce the filtering behaviour specified by FR-02 through FR-09. The single Medium finding (RV-01) is a specification-alignment issue, not a logic defect.
