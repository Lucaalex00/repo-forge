#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — install-guards.js
 *
 * Deterministically install the pre-commit guards into a generated project, so
 * the step cannot be skipped or hand-wired differently each time:
 *   - copies secret-guard, lock-guard and unlock into <project>/scripts/ as .cjs
 *     (always CommonJS, so they also work in "type": "module" projects);
 *   - wires them into the pre-commit hook: Husky (.husky/pre-commit) when the
 *     project uses it, otherwise the configured core.hooksPath, otherwise
 *     .githooks/pre-commit + `git config core.hooksPath .githooks`.
 * Idempotent: re-running changes nothing.
 *
 * Usage: node install-guards.js --dir <projectRoot>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const PRECOMMIT = path.join(PLUGIN_ROOT, 'skills', 'repo-scaffolder', 'references', 'precommit');
const SOURCES = {
  'secret-guard.cjs': path.join(PRECOMMIT, 'secret-guard.js'),
  'lock-guard.cjs': path.join(PRECOMMIT, 'lock-guard.js'),
  'unlock.cjs': path.join(PLUGIN_ROOT, 'scripts', 'unlock.js'),
};
const HOOK_LINES = [
  { name: 'secret-guard', line: 'node scripts/secret-guard.cjs || exit 1' },
  { name: 'lock-guard', line: 'node scripts/lock-guard.cjs || exit 1' },
];
const HEADER = '/* eslint-disable */\n// Installed by Repo Forge (install-guards.js). Re-run it to update; do not edit by hand.\n';

function git(dir, args) {
  try {
    return execSync(`git ${args}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) { return null; }
}

/** Source text adapted for installation: drop the shebang, add the header. */
function adapt(source) {
  return HEADER + String(source).replace(/^#!.*\r?\n/, '');
}

function copyGuards(dir) {
  const scriptsDir = path.join(dir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  const written = [];
  for (const [name, src] of Object.entries(SOURCES)) {
    const dest = path.join(scriptsDir, name);
    const content = adapt(fs.readFileSync(src, 'utf8'));
    let current = null;
    try { current = fs.readFileSync(dest, 'utf8'); } catch (_) { /* absent */ }
    if (current !== content) { fs.writeFileSync(dest, content); written.push(`scripts/${name}`); }
  }
  return written;
}

/** Pick the hook file to wire, respecting what the project already uses. */
function resolveHookFile(dir) {
  if (fs.existsSync(path.join(dir, '.husky'))) {
    return { file: path.join(dir, '.husky', 'pre-commit'), kind: 'husky', setHooksPath: false };
  }
  const configured = git(dir, 'config core.hooksPath');
  if (configured && !/^\.husky(\/_)?$/.test(configured)) {
    return { file: path.join(dir, configured, 'pre-commit'), kind: 'hooksPath', setHooksPath: false };
  }
  return { file: path.join(dir, '.githooks', 'pre-commit'), kind: 'githooks', setHooksPath: true };
}

/** Prepend missing guard lines (guards run first: cheap and blocking). */
function wireHook(hookFile, kind) {
  let content = '';
  try { content = fs.readFileSync(hookFile, 'utf8'); } catch (_) { /* new file */ }
  const missing = HOOK_LINES.filter((h) => !content.includes(h.name));
  if (missing.length === 0) return [];
  const lines = missing.map((h) => h.line).join('\n') + '\n';
  let updated;
  if (content.startsWith('#!')) {
    const nl = content.indexOf('\n') + 1;
    updated = content.slice(0, nl) + lines + content.slice(nl);
  } else if (content === '' && kind !== 'husky') {
    updated = '#!/bin/sh\n' + lines; // plain git hooks need a shebang
  } else {
    updated = lines + content;
  }
  fs.mkdirSync(path.dirname(hookFile), { recursive: true });
  fs.writeFileSync(hookFile, updated);
  try { fs.chmodSync(hookFile, 0o755); } catch (_) { /* Windows: not needed */ }
  return missing.map((h) => h.name);
}

function run(opts) {
  const dir = path.resolve(opts.dir || '.');
  const report = { dir, copied: copyGuards(dir), notes: [] };
  const hook = resolveHookFile(dir);
  report.hookFile = path.relative(dir, hook.file).replace(/\\/g, '/');
  report.hookKind = hook.kind;
  report.added = wireHook(hook.file, hook.kind);
  if (hook.setHooksPath) {
    if (git(dir, 'rev-parse --is-inside-work-tree') === 'true') {
      if (git(dir, 'config core.hooksPath .githooks') !== null) report.hooksPath = '.githooks';
    } else {
      report.notes.push('Not a git repository yet: after `git init`, run `git config core.hooksPath .githooks`.');
    }
  }
  if (hook.kind === 'husky') {
    report.notes.push('Husky detected: the guards run before the existing pre-commit commands (installed by `npm install` via the "prepare" script).');
  }
  return report;
}

module.exports = { run, adapt, copyGuards, resolveHookFile, wireHook, HOOK_LINES, SOURCES };

if (require.main === module) {
  let dir = '.';
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--dir') dir = argv[++i];
  const r = run({ dir });
  process.stdout.write(`Guards installed in ${r.dir}\n`);
  process.stdout.write(`  copied: ${r.copied.length ? r.copied.join(', ') : '(already up to date)'}\n`);
  process.stdout.write(`  hook:   ${r.hookFile} (${r.hookKind}) ${r.added.length ? '+ ' + r.added.join(', ') : '(already wired)'}\n`);
  if (r.hooksPath) process.stdout.write(`  git config core.hooksPath ${r.hooksPath}\n`);
  r.notes.forEach((n) => process.stdout.write(`  note: ${n}\n`));
}
