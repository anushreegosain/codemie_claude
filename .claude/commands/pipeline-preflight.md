---
name: pipeline-preflight
description: Auto-trigger before starting or resuming any SDLC pipeline stage. Reads pipeline-state.json from the story's artifact folder to determine which stages are complete vs pending.
---

## When to Apply

Apply this check automatically whenever you are about to:
- Start the pipeline for a story key
- Resume the pipeline for a story key
- Determine whether to skip a stage

## The Check

Given a story key `<KEY>`:

**Step 1** — Check if `docs/agentic-sdlc/artifacts/<KEY>/pipeline-state.json` exists.
- **Does not exist** → no prior run. All stages are pending. Proceed to initialize (Stage 1 creates it).

**Step 2** — If it exists, read the file and inspect the `stages` object.
- Stages with `"status": "completed"` → already done for this story. Safe to skip.
- Stages with `"status": "pending"` → not yet run. Execute from the first pending stage.

**Step 3** — Report a status summary before proceeding:
```
Pipeline state for <KEY>:
  ✅ requirements   — completed
  ✅ architecture   — completed
  ⏳ design-review  — pending  ← resume from here
  ⏳ impl-plan      — pending
  ⏳ implementation — pending
  ⏳ review         — pending
  ⏳ verify         — pending
  ⏳ pr             — pending
```

## Why This Matters

Each story's artifacts live in their own folder (`docs/agentic-sdlc/artifacts/<KEY>/`), so stale artifacts from a different story never collide. The JSON state file is the single source of truth for resume decisions — no content scanning required.
