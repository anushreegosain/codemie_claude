# Design Review — KAN-1: Task Priority Levels

**Stage:** 3 — Design Review
**Story:** KAN-1
**Branch:** feature/kan-1-task-priority-levels
**Reviewer:** sdlc-03-design-review
**Date:** 2026-11-25

---

## Checklist Coverage

| Area | Result |
|---|---|
| Completeness — all 18 FRs covered | Pass |
| Correctness — changes match FR specifications | Pass |
| Backward Compatibility — statements present and credible | Pass |
| Optional Fields — `priority?: TaskPriority` correct, default handled in route | Pass |
| API Contract — existing paths, verbs, and shapes preserved | Pass |
| UI Consistency — `data-testid` naming follows existing `filter-{dim}-{val}` pattern | Pass |
| Error Handling — undefined priority guarded in TaskCard; invalid POST/PUT values rejected | Pass |
| Security — user input validated server-side via `validPriorities` on write paths | Pass |
| DRY / Clarity — `PRIORITY_ORDER` extracted as module-level constant; no duplicated logic | Pass |
| Scope Creep — one minor addition flagged (see DR-02) | Minor |

---

## Findings

**Finding DR-01**
- Severity: Low
- Location: `architecture.md` — Section 8 (Rollback Strategy), opening sentence
- Issue: The rollback section header reads "restore the following **six** files to their pre-change state" but then lists seven numbered items (lib/types.ts, lib/store.ts, app/api/tasks/route.ts, app/api/tasks/[id]/route.ts, components/TaskCard.tsx, components/TaskForm.tsx, app/dashboard/page.tsx). The count in Section 2 (Impacted Files table) correctly shows seven files.
- Resolution: Change "six files" to "seven files" in the Section 8 header. No implementation change required.

---

**Finding DR-02**
- Severity: Low
- Location: `architecture.md` — Section 6, `app/dashboard/page.tsx`, "Updated `task-count` element" subsection
- Issue: The architecture proposes updating the `task-count` element text to include the active priority filter label (e.g., `· priority "critical"`). No FR in `requirements.md` requires this change. It is minor scope creep. While it will not break any existing test (the `data-testid="task-count"` attribute is preserved), any existing test that asserts the exact text content of `task-count` could fail.
- Resolution: Accept the addition (it is benign and improves UX) but confirm no existing automated test asserts on the full `task-count` text value. If such a test exists, update it in Stage 7 (Verify) alongside the new test cases. Document the decision below.

---

No other issues found across all ten checklist areas. All 18 FRs (FR-01 through FR-18) and all 7 NFRs are addressed. Specific coverage notes:

- **FR-03 (default priority):** Default is applied in the route handler before calling the store, not in the store itself. This is correct — the store accepts `Omit<Task, ...>` where `priority` is now optional; the route supplies `"medium"` before the call. No store change required. Architecture is consistent.
- **FR-05/FR-06 (API-level filter):** Implemented via a new `priority?` parameter in `getAllTasks` applied with the same successive-filter pattern as `status`, yielding correct AND logic.
- **FR-14/FR-16 (UI combined filter):** Status is filtered server-side (via `fetchTasks` API call); priority is filtered client-side from the returned `tasks` state. Changing either filter does not reset the other. This satisfies FR-16 and NFR-06 (no extra API calls on priority change).
- **FR-17 (sort to bottom for undefined):** `PRIORITY_ORDER[a.priority ?? ""] ?? 0` correctly maps undefined priority to weight 0, placing those tasks last in the `bOrder - aOrder` descending sort.
- **FR-10 (safe render):** `priorityColors[task.priority ?? ""] ?? "bg-gray-100 text-gray-400"` correctly prevents `undefined` from being stringified into an invalid Tailwind class name.

---

## Decisions

1. **API-level vs client-side priority filtering:** The dashboard applies priority filtering entirely client-side from the full status-filtered task list. The API-level `?priority` query parameter (FR-05/FR-06) is implemented for external consumers but is not used by the dashboard fetch path. This is consistent with NFR-06.

2. **Invalid `priority` value on GET /api/tasks:** Per assumption A-03 in `requirements.md`, an unrecognised value (e.g., `?priority=xyz`) is passed to the store's string-equality filter and silently returns an empty array. No `400` error is returned. This matches the existing `status` filter behavior.

3. **`filter` → `filterStatus` rename:** Renaming the existing state variable from `filter` to `filterStatus` is accepted as an internal refactor. TypeScript compilation (NFR-02) will catch any missed reference at build time. No `data-testid` values or API calls are affected.

4. **`task-count` text update:** The architecture's optional enhancement to include priority filter context in the `task-count` element text is accepted. Any test asserting on exact `task-count` text must be updated during Stage 7.

5. **New `data-testid="sort-priority-button"`:** The architecture adds this testid to the sort control. The requirements (FR-17) do not specify a testid for this element; adding one is a safe enhancement and improves testability.

6. **Priority badge type:** `priorityColors` uses `Record<string, string>` rather than a narrower `Record<TaskPriority, string>`. This is acceptable because the undefined-guard coerces the key to `""` before lookup, so strict key typing is not needed. If the team prefers stricter typing, `Record<TaskPriority | "", string>` could be used, but this is not a blocking concern.

---

## Required Changes to architecture.md

1. In Section 8 (Rollback Strategy), change "restore the following **six** files" to "restore the following **seven** files" to match the actual list.

These are documentation corrections only. No structural or logic changes to the architecture are required before Stage 4 begins.

---

## Verdict

**Verdict: Go**

All findings are Low severity. Both are documentation or minor scope items with no impact on correctness, compatibility, or testability. The architecture fully covers all 18 functional requirements and 7 non-functional requirements. No breaking changes to API routes, HTTP verbs, response shapes, or existing `data-testid` attributes are present. All new fields are optional-safe, seed tasks are untouched, and no new npm dependencies are introduced.

Proceed to Stage 4 (Implementation Plan).

---

*Document generated by the Agentic SDLC pipeline — Stage 3: Design Review.*
*Story: KAN-1 | Branch: feature/kan-1-task-priority-levels | Date: 2026-11-25*
