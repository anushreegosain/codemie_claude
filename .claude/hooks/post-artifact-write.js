#!/usr/bin/env node
/**
 * PostToolUse hook — fires after every Write call.
 * When a pipeline artifact is written, automatically updates pipeline-state.json
 * for that stage so Claude doesn't need to remember to do it manually.
 */

  'requirements.md':       'requirements',
  'architecture.md':       'architecture',
  'design-review.md':      'design-review',
  'impl-plan.md':          'impl-plan',
  'implementation-log.md': 'implementation',
  'review-findings.md':    'review',
  'verification-report.md':'verify',
  'pr-description.md':     'pr',
};

let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const filePath = (payload.tool_input?.file_path || '').replace(/\\/g, '/');

    const match = filePath.match(/docs\/agentic-sdlc\/artifacts\/([^/]+)\/([^/]+)$/);
    if (!match) process.exit(0);

    const [, key, filename] = match;
    // Don't trigger on writes to pipeline-state.json itself (avoid infinite loop)
    if (filename === 'pipeline-state.json') process.exit(0);

    const stage = FILE_TO_STAGE[filename];
    if (!stage) process.exit(0);

    const stateFile = path.join('docs', 'agentic-sdlc', 'artifacts', key, 'pipeline-state.json');
    if (!fs.existsSync(stateFile)) process.exit(0);

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

    // Only update if not already completed (don't overwrite completedAt on a re-run)
    if (state.stages[stage]?.status !== 'completed') {
      state.stages[stage] = {
        status: 'completed',
        completedAt: new Date().toISOString(),
        artifact: filename,
      };
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
      console.log(`[pipeline post-hook] ✅ ${key}/${stage} → completed`);
    }
  } catch (_) {
    // Never throw from a hook
  }
  process.exit(0);
});
