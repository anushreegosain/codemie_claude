# Design Review — KAN-1: Filter Dashboard by Assignee

**Verdict: Go**
All findings are Low severity. No blocking issues. Proceed to Stage 4 (Implementation Plan).

---

## Findings

### Completeness — Does the architecture cover every FR?

| FR | Covered? | Architecture Section |
|---|---|---|
| FR-01 — Assignee filter control visible | Yes | Section 6, "New assignee filter control" |
| FR-02 — Default state shows all assignees | Yes | Section 6, `useState<string>("")` default |
| FR-03 — Selecting "Admin" filters correctly | Yes | Section 6, fetchTasks + store filter chain |
| FR-04 — Selecting "User1" filters correctly | Yes | Section 6, fetchTasks + store filter chain |
| FR-05 — Compound filter (assignee + status) | Yes | Section 6, URLSearchParams building both params |
| FR-06 — Clearing filters restores full list | Yes | Section 6, useEffect deps + default "" clears param |
| FR-07 — Empty state when no tasks match | Partial — see DR-01 | Section 7, Backward Compatibility |
| FR-08 — Existing /api/tasks?assignee= preserved | Yes | Section 4 |
| FR-09 — Seed tasks t1–t5 unchanged | Yes | Sections 3 and 5 |
| FR-10 — Existing data-testid attributes unchanged | Yes | Section 7 and Appendix |

| NFR | Covered? | Architecture Section |
|---|---|---|
| NFR-01 — Performance (re-render within 500 ms) | Yes | Existing fetch pattern, no additional round trips |
| NFR-02 — Backward compatibility | Yes | Section 7 |
| NFR-03 — No new npm dependencies | Yes | Only native URLSearchParams used |
| NFR-04 — Accessibility (aria-label) | Yes | Section 6, `aria-label="Filter by assignee"` |

---

**Finding DR-01**
- Severity: Low
- Location: Section 6, "Updated call sites" table and Section 7
- Issue: FR-07 requires `[data-testid="empty-state"]` to display the text "No tasks found" when filters produce zero results. The architecture states only that the empty-state element is "preserved" (Section 7, Backward Compatibility) but does not confirm the existing text is already "No tasks found". If the current implementation displays different text (e.g., "No tasks yet" or a blank element), FR-07 would fail without any change called out in the architecture.
- Resolution: Before Stage 4 begins, verify that the current `app/dashboard/page.tsx` renders the text "No tasks found" inside `[data-testid="empty-state"]`. If the text differs, add a one-line text update to Section 6 of `architecture.md` covering this change.

---

**Finding DR-02**
- Severity: Low
- Location: Section 6, "Updated call sites" table
- Issue: The architecture explicitly updates `handleStatusChange`'s `useCallback` dependency array to include `assigneeFilter`, but `handleCreate`, `handleUpdate`, and `handleDelete` are listed in the call site table as gaining `fetchTasks(filter, assigneeFilter)` without any mention of whether these are also `useCallback`-wrapped. If they are `useCallback`, their dep arrays must also include `assigneeFilter`; otherwise they will close over a stale value and re-fetch with the wrong assignee after a filter change.
- Resolution: Architecture should explicitly state: either (a) `handleCreate`, `handleUpdate`, and `handleDelete` are not `useCallback` wrappers and therefore re-capture `assigneeFilter` on every render, or (b) they are `useCallback` and `assigneeFilter` must be added to each of their dependency arrays. Add a sentence clarifying this in Section 6 before coding begins.

---

**Finding DR-03**
- Severity: Low
- Location: Section 6, "New assignee filter control" JSX snippet
- Issue: The architecture wraps the existing `<div data-testid="status-filter">` inside a new `<div className="flex items-center gap-4">`. The `data-testid` attribute itself is preserved, but the parent element changes. Any existing automated test that uses a parent-child DOM relationship (e.g., `.closest()`, `within()`, or CSS selector chains anchored above `status-filter`) could break silently. The architecture does not call this structural change out explicitly.
- Resolution: Add a note to Section 7 (Backward Compatibility) acknowledging the new wrapper div and confirming that no existing tests rely on the DOM parent of `status-filter`. Low risk given the guardrail is testid-based, but the change should be documented.

---

**Finding DR-04**
- Severity: Low
- Location: FR-01 description vs. architecture Section 6
- Issue: FR-01 says "four options" in the description sentence but its pass criterion says "exactly three `<option>` elements". The architecture correctly implements three options (`""`, `"admin"`, `"user1"`), which matches the pass criterion. The word "four" in the FR description is a typo in the requirements document. No action needed in the architecture, but the requirements document should be corrected to avoid confusion during verification.
- Resolution: Correct the word "four" to "three" in FR-01's Description sentence in `requirements.md`. No change needed to `architecture.md`.

---

No issues found in: Correctness, API Contract, Optional Fields, Security, DRY/Clarity, Scope Creep, or No-New-Dependencies.

---

## Decisions

The following design choices are explicitly agreed upon at this stage:

1. `assigneeFilter` state defaults to `""` (empty string), which means "All Assignees" — no assignee query param is sent on initial page load.
2. Filtering is server-side (via `/api/tasks?assignee=X&status=Y` query params), not client-side cache filtering. This is explicitly allowed by NFR-01.
3. `URLSearchParams` is used to construct the query string, ensuring clean handling of zero, one, or both active filter params.
4. The `<select>` satisfies NFR-04 via `aria-label="Filter by assignee"` (not a `<label>` element).
5. The `task-count` text is updated to reflect both active filters simultaneously, consistent with the OQ-2 resolution in requirements (filtered count, not total count).
6. No new npm packages are introduced. `URLSearchParams` is a native browser/Node.js API.
7. Only `app/dashboard/page.tsx` is modified. All other files remain untouched.
8. Seed tasks `t1`–`t5` are not modified; the assignee values already in the seed data drive the filter results.
9. The assignee filter does not persist across page refreshes (consistent with OQ-1 assumption in requirements).

---

## Required Changes to architecture.md

The following updates must be made to `architecture.md` before Stage 4 can start:

1. **(DR-01)** Add an explicit statement in Section 6 or Section 7 confirming that the existing empty-state element already renders the text "No tasks found", OR add a code-level change item that updates the empty-state text to match FR-07's pass criterion.

2. **(DR-02)** Add a sentence in Section 6 (after the "Updated call sites" table) explicitly stating whether `handleCreate`, `handleUpdate`, and `handleDelete` use `useCallback`. If they do, add `assigneeFilter` to their listed dependency arrays. If they do not, state that plainly.

3. **(DR-03)** Add a sentence to Section 7 (Backward Compatibility) acknowledging that the new `<div className="flex items-center gap-4">` wrapper is inserted as the new parent of `data-testid="status-filter"`, and confirming no existing test relies on the DOM parent of that element.

---

## Verdict

**Verdict: Go**
All findings are Low severity. None block coding. The three required architecture clarifications (DR-01, DR-02, DR-03) can be addressed as minor addendums to `architecture.md` before the implementation plan is written, but they do not require re-running Stage 3.
