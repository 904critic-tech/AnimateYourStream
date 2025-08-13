#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');

async function probeUrl(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      // Treat 200 and 404 as alive
      resolve(res.statusCode === 200 || res.statusCode === 404);
      res.resume();
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function detectUrl() {
  const candidates = process.env.TEST_URL
    ? [process.env.TEST_URL]
    : ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'];
  for (const url of candidates) {
    // Ensure trailing slash
    const target = url.endsWith('/') ? url : url + '/';
    // Probe root
    // eslint-disable-next-line no-await-in-loop
    const ok = await probeUrl(target);
    if (ok) return target.replace(/\/$/, '');
  }
  return null;
}

(async () => {
  const detected = await detectUrl();
  const TEST_URL = detected || process.env.TEST_URL || 'http://localhost:3001';
  console.log(`AGENT3_SUITE_TARGET ${TEST_URL}`);

  const tests = [
    { name: 'default_model', cmd: 'node', args: ['scripts/agent3_test_default_model_animations.cjs'] },
    { name: 'programmatic_switch', cmd: 'node', args: ['scripts/agent3_programmatic_switch_check.cjs'] },
    { name: 'transition_smoothness', cmd: 'node', args: ['scripts/agent3_transition_smoothness_check.cjs'] },
    { name: 'ui_cross_model', cmd: 'node', args: ['scripts/agent3_cross_model_animation_check.cjs'] }
  ];

  const results = [];

  for (const t of tests) {
    console.log(`\n=== RUN ${t.name} ===`);
    // eslint-disable-next-line no-await-in-loop
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