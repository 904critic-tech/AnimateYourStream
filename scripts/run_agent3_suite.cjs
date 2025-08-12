#!/usr/bin/env node
const { spawn } = require('child_process');

const TEST_URL = process.env.TEST_URL || 'http://localhost:3001';
const tests = [
  { name: 'default_model', cmd: 'node', args: ['scripts/agent3_test_default_model_animations.cjs'] },
  { name: 'programmatic_switch', cmd: 'node', args: ['scripts/agent3_programmatic_switch_check.cjs'] },
  { name: 'transition_smoothness', cmd: 'node', args: ['scripts/agent3_transition_smoothness_check.cjs'] },
  { name: 'ui_cross_model', cmd: 'node', args: ['scripts/agent3_cross_model_animation_check.cjs'] }
];

(async () => {
  const results = [];

  for (const t of tests) {
    console.log(`\n=== RUN ${t.name} ===`);
    const code = await new Promise((resolve) => {
      const child = spawn(t.cmd, t.args, { stdio: 'inherit', env: { ...process.env, TEST_URL } });
      child.on('close', resolve);
    });
    results.push({ name: t.name, code });
  }

  const summary = results.reduce((acc, r) => {
    acc[r.name] = r.code === 0 ? 'PASS' : `FAIL(${r.code})`;
    return acc;
  }, {});

  console.log('\nAGENT3_SUITE_SUMMARY ' + JSON.stringify(summary));
  process.exit(results.some(r => r.code !== 0) ? 1 : 0);
})();