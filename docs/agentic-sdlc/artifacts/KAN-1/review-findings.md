# Code Review Findings — KAN-1: Filter Dashboard by Assignee

**Stage**: 6 — Code Review
**Reviewer**: sdlc-06-review (Claude Sonnet 4.6)
**Date**: 2026-11-24
**File reviewed**: `app/dashboard/page.tsx`

---

## FR / NFR Coverage Map

| Requirement | Implementation Location | Verdict |
|---|---|---|
| FR-01 — Assignee filter control present with 3 options | `page.tsx` lines 185–195: `<select data-testid="assignee-filter">` with options `""`, `"admin"`, `"user1"` | PASS |
| FR-02 — Default shows all assignees | `useState<string>("")` (line 15); `if (assignee)` guard on line 30 omits param when empty | PASS |
| FR-03 — Admin filter | URLSearchParams sets `assignee=admin`; store filters `t.assignee === "admin"` | PASS |
| FR-04 — User1 filter | URLSearchParams sets `assignee=user1`; store filters `t.assignee === "user1"` | PASS |
| FR-05 — Compound filter (assignee + status) | Both params set independently via URLSearchParams; store applies both sequentially | PASS |
| FR-06 — Clearing filters restores full list, no reload | Reset to `""` omits assignee param; React state update re-renders without navigation | PASS |
| FR-07 — Empty state text is exactly "No tasks found" | `page.tsx` line 238: text node is exactly `No tasks found` | PASS |
| FR-08 — API endpoint behaviour preserved | `git diff main -- app/api/` returned no changes; routes untouched | PASS |
| FR-09 — Seed tasks t1–t5 intact | `git diff main -- lib/store.ts` returned no output; seeds confirmed unchanged | PASS |
| FR-10 — Existing data-testids unchanged | Diff shows only indentation change for `status-filter` / `filter-${f.value}`; all values intact | PASS |
| NFR-01 — Filter within 500 ms | Single API call with query params; no extra round trips | PASS |
| NFR-02 — Backward compatibility | No routes, fields, or testids removed | PASS |
| NFR-03 — No new npm dependencies | `git diff main -- package.json` returned no output | PASS |
| NFR-04 — Accessibility on assignee select | `aria-label="Filter by assignee"` present on line 187 | PASS |

---

## Findings

### RV-01

**Finding RV-01**
- Severity: Low
- File + Location: `docs/agentic-sdlc/artifacts/KAN-1/` (missing file)
- Issue: No `manual-tests/test-cases.md` document exists for KAN-1. The requirements reference test cases TC-UI-006 through TC-UI-009 and TC-API-008 as the basis for new assignee filter scenarios, but no KAN-1-specific test-case document was produced in the artifacts directory. FRs 01–07 have no corresponding explicit test case entries.
- Recommendation: Add a `manual-tests.md` or `test-cases.md` to the KAN-1 artifact folder covering at least the seven new filter scenarios before final sign-off.

---

### RV-02

**Finding RV-02**
- Severity: Low
- File + Location: `app/dashboard/page.tsx` line 238
- Issue: The empty-state text was changed from `"No tasks found. Add one to get started!"` to `"No tasks found"`. This is a correct and intentional change (per design-review DR-01 and FR-07), but any existing automated test that matched the full old string will fail after this change. NFR-02 requires that existing test cases TC-UI-001 through TC-UI-014 not break.
- Recommendation: Confirm that all existing test-suite matchers for the empty-state element use `toContain("No tasks found")` or a partial match rather than an exact full-string match. If any test used the full old string, update it to match the new exact text before Stage 7.

---

## Verified Items

- Seed tasks t1–t5 unchanged — confirmed (`git diff main -- lib/store.ts` empty)
- All existing data-testid attributes preserved — confirmed (no `-` removals in diff; only indentation changes for `status-filter` / `filter-${f.value}`, which retain their values)
- No new npm dependencies added — confirmed (`git diff main -- package.json` empty)
- No changes to `lib/types.ts` — confirmed (`git diff main -- lib/types.ts` empty)
- No changes to `lib/store.ts` — confirmed
- No changes to `app/api/tasks/route.ts` or `app/api/tasks/[id]/route.ts` — confirmed
- No changes to `components/TaskCard.tsx` or `components/TaskForm.tsx` — confirmed
- API route exports: GET, POST on `/api/tasks`; GET, PUT, DELETE on `/api/tasks/[id]`; POST on `/api/auth/login` and `/api/auth/logout` — all present and unchanged
- `useCallback` dependency array for `fetchTasks` is `[token, router]` — correct (`status` and `assignee` are arguments, not closures)
- `useEffect` dependency array is `[filter, assigneeFilter, fetchTasks, router]` — correct
- `handleStatusChange` dependency array is `[token, filter, assigneeFilter, fetchTasks]` — correct (includes new `assigneeFilter`)
- `handleCreate`, `handleUpdate`, `handleDelete` are plain `async function` declarations — no stale closure risk; they re-capture `assigneeFilter` on every render
- URLSearchParams logic correctly omits `status` when value is `"all"` or falsy, and omits `assignee` when value is `""` (falsy)
- Assignee filter select has exactly 3 `<option>` elements with values `""`, `"admin"`, `"user1"` — confirmed
- Empty-state text is exactly `"No tasks found"` — confirmed
- Build passed with no TypeScript or ESLint errors (per implementation log)

---

## Required Fixes Before PR

None. No High severity findings were identified.

RV-01 and RV-02 are both Low severity. They are noted for the verify stage but do not block progression to Stage 7.

---

## Verdict

**Verdict: Go**

2 findings total: 0 High, 0 Medium, 2 Low. No blocking issues. Proceed to Stage 7.
