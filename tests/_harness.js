'use strict';
/**
 * Tiny zero-dependency test harness.
 * Usage:
 *   const { test, run } = require('./_harness');
 *   test('name', (t) => { t.equal(a, b); });
 *   // run.js calls run() after all test files are required.
 */

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function makeCtx() {
  return {
    _count: 0,
    ok(cond, msg) {
      this._count++;
      if (!cond) throw new Error('assertion failed: ' + (msg || ''));
    },
    equal(a, b, msg) {
      this._count++;
      if (a !== b) {
        throw new Error(`expected ${JSON.stringify(b)} but got ${JSON.stringify(a)}${msg ? ' — ' + msg : ''}`);
      }
    },
    notEqual(a, b, msg) {
      this._count++;
      if (a === b) throw new Error(`expected value to differ from ${JSON.stringify(b)}${msg ? ' — ' + msg : ''}`);
    },
    throws(fn, msg) {
      this._count++;
      let threw = false;
      try { fn(); } catch (_) { threw = true; }
      if (!threw) throw new Error('expected function to throw' + (msg ? ' — ' + msg : ''));
    },
  };
}

function run() {
  let passed = 0;
  let failed = 0;
  let asserts = 0;
  const failures = [];
  for (const { name, fn } of tests) {
    const ctx = makeCtx();
    try {
      fn(ctx);
      asserts += ctx._count;
      passed++;
      process.stdout.write(`  ✓ ${name} (${ctx._count})\n`);
    } catch (err) {
      failed++;
      failures.push({ name, err });
      process.stdout.write(`  ✗ ${name}\n      ${err.message}\n`);
    }
  }
  process.stdout.write(`\n${passed} passed, ${failed} failed, ${asserts} assertions\n`);
  return { passed, failed, asserts, failures };
}

module.exports = { test, run, _tests: tests };
