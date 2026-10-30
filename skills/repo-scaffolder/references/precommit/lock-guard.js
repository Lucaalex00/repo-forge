#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — lock-guard (pre-commit), PORTABLE
 *
 * Template to copy into a generated project (e.g. `scripts/lock-guard.js`) and
 * run from the pre-commit hook. It enforces the structure lock for ANY tool —
 * Codex, other agents, manual `git commit`, CI — not just Claude Code's
 * PreToolUse hook. Self-contained (no plugin dependency), pure Node.
 *
 * Blocks a commit that stages a change to a file listed in
 * `.repoforge/locked.json`, unless a valid `.repoforge/unlock.json` window
 * covers it. Exit 1 aborts the commit; exit 0 allows it.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function norm(p) {
  return String(p || '').trim()
    .replace(/^['"]+|['"]+$/g, '').replace(/\\/g, '/').replace(/^\.\//, '')
    .replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
}
function basename(p) { const n = norm(p); const i = n.lastIndexOf('/'); return i === -1 ? n : n.slice(i + 1); }
function pathMatches(a, b) {
  const x = norm(a); const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.endsWith('/' + y) || y.endsWith('/' + x)) return true;
  return basename(x) === basename(y);
}
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return null; } }

function isUnlocked(rel, unlock, now) {
  if (!unlock) return false;
  const exp = Date.parse(unlock.expiresAt);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const paths = unlock.paths;
  if (paths === undefined || paths === null || paths === 'all' || paths === '*') return true;
  if (Array.isArray(paths)) {
    if (paths.some((p) => p === 'all' || p === '*')) return true;
    return paths.some((p) => pathMatches(p, rel));
  }
  return false;
}

/** True if the path already exists in the current HEAD commit. New files
 *  (first commit, or newly added locked files) are not yet committed, so adding
 *  them is allowed — the lock protects *changes* to committed files. */
function existsInHead(root, rel) {
  try {
    execSync(`git -C ${JSON.stringify(root)} cat-file -e HEAD:${JSON.stringify(rel)}`, { stdio: 'ignore' });
    return true;
  } catch (_) { return false; }
}

function findRoot(start) {
  let dir = start;
  for (let i = 0; i < 64 && dir; i++) {
    if (fs.existsSync(path.join(dir, '.repoforge', 'locked.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function main() {
  const root = findRoot(process.cwd());
  const lock = readJson(path.join(root, '.repoforge', 'locked.json'));
  const locked = lock && Array.isArray(lock.locked) ? lock.locked : [];
  if (locked.length === 0) process.exit(0);
  const unlock = readJson(path.join(root, '.repoforge', 'unlock.json'));
  const now = Date.now();

  let staged = [];
  try {
    staged = execSync('git diff --cached --name-only --diff-filter=ACMRD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch (_) { process.exit(0); }

  const blocked = [];
  for (const f of staged) {
    const hit = locked.find((rel) => pathMatches(f, rel));
    if (!hit) continue;
    if (isUnlocked(hit, unlock, now)) continue;
    // Allow the initial addition of a locked file; block only changes to a
    // file that is already committed in HEAD.
    if (!existsInHead(root, f)) continue;
    blocked.push(hit);
  }

  if (blocked.length) {
    process.stderr.write('\nRepo Forge lock-guard blocked this commit. Locked constitution file(s) staged:\n' +
      [...new Set(blocked)].map((f) => '  - ' + f).join('\n') +
      '\n\nChange them through an ADR + unlock window (see AGENTS.md / WORKFLOW.md),\n' +
      'or in Claude Code run /repo-forge:change. To bypass once: git commit --no-verify.\n\n');
    process.exit(1);
  }
  process.exit(0);
}

module.exports = { norm, basename, pathMatches, isUnlocked, findRoot };

if (require.main === module) main();
