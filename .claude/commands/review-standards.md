---
name: review-standards
description: Skill for Stage 6. Invoked by the code review agent to load the full project-specific guardrail checklist — including exact grep commands — before reviewing the implementation.
---

## Purpose

This skill loads the kata-taskmanager project's non-negotiable review standards so the code review agent applies them consistently on every story, without relying on memory or re-reading CLAUDE.md.

## Mandatory Checks (must verify on every review)

### API Contract Integrity
- Existing route paths must not change: `GET|POST /api/tasks`, `GET|PUT|DELETE /api/tasks/:id`, `POST /api/auth/login`, `POST /api/auth/logout`
- HTTP verbs must not change
- Existing response fields must still be present — adding fields is allowed, removing or renaming is not

Verify with:
```bash
grep -r "export async function" app/api/
```

### data-testid Preservation
Every `data-testid` attribute that existed before this story must still be present and unchanged.

Verify with:
```bash
git diff main -- components/ app/ | grep "data-testid"
```
Any line starting with `-` that removes a `data-testid` is a **High** severity finding.

### Optional-Only New Fields
Every field added to the `Task` interface must be marked optional (`field?: type`).

Verify with:
```bash
git diff main -- lib/types.ts
```
Any new field without `?` is a **High** severity finding.

### Seed Task Integrity (`t1`–`t5`)
The five seed tasks in `lib/store.ts` must be byte-for-byte identical to `main`.

Verify with:
```bash
git diff main -- lib/store.ts | grep -A 5 "const seedTasks\|t1:\|t2:\|t3:\|t4:\|t5:"
```
Any change to seed task content is a **High** severity finding.

### No New npm Dependencies
`package.json` must not have new entries in `dependencies` or `devDependencies` unless the story explicitly requires a new package.

Verify with:
```bash
git diff main -- package.json
```

### New Field Defaults in Store
If a new field was added to the Task interface, verify that `lib/store.ts`:
- Provides a sensible default when creating a task (e.g. `newField: null` or `newField: undefined`)
- Handles the field in update/patch logic

### Server-Side Input Validation
Any new field accepted in a POST or PUT request body must be validated server-side before use.

## Severity Guide

| Severity | Definition |
|---|---|
| **High** | Breaks existing behaviour, removes a field/route/testid, or violates a mandatory check above. Blocks PR. |
| **Medium** | Degrades quality but doesn't break anything. Should fix before merge. |
| **Low** | Style, naming, or test coverage gap. Noted but does not block. |
