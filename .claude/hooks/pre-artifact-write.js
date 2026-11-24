#!/usr/bin/env node
/**
 * PreToolUse hook — fires before every Write call.
 * When writing a pipeline artifact, checks that all prior stages are completed
 * in pipeline-state.json. Warns but does not block.
 */

const fs = require('fs');
const path = require('path');

const STAGE_ORDER = [
  'requirements',
  'architecture',
  'design-review',
  'impl-plan',
  'implementation',
  'review',
  'verify',
  'pr',
];

const FILE_TO_STAGE = {
  'requirements.md':      'requirements',
  'architecture.md':      'architecture',
  'design-review.md':     'design-review',
  'impl-plan.md':         'impl-plan',
  'implementation-log.md':'implementation',
  'review-findings.md':   'review',
  'verification-report.md':'verify',
  'pr-description.md':    'pr',
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
    if (filename === 'pipeline-state.json') process.exit(0);

    const targetStage = FILE_TO_STAGE[filename];
    if (!targetStage) process.exit(0);

    const stateFile = path.join('docs', 'agentic-sdlc', 'artifacts', key, 'pipeline-state.json');
    if (!fs.existsSync(stateFile)) process.exit(0);

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const targetIdx = STAGE_ORDER.indexOf(targetStage);

    const incomplete = [];
    for (let i = 0; i < targetIdx; i++) {
      const prior = STAGE_ORDER[i];
      if (state.stages[prior]?.status !== 'completed') {
        incomplete.push(prior);
      }
    }

    if (incomplete.length > 0) {
      console.warn(
        `\n⚠️  [pipeline pre-hook] Writing ${filename} for ${key} but prior stage(s) not completed: ${incomplete.join(', ')}\n`
      );
    } else {
      console.log(`[pipeline pre-hook] ✅ Prerequisites satisfied for ${filename} (${key})`);
    }
  } catch (_) {
    // Never block on hook errors
  }
  process.exit(0);
});
