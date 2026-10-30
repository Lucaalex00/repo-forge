#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — lock.js
 *
 * Deterministically write <project>/.repoforge/locked.json listing the
 * constitution files to protect. Run by /repo-forge:new-repo (and adopt) so the
 * lock state does not depend on the model hand-writing JSON/timestamps.
 *
 * Usage:
 *   node lock.js --dir <projectDir> --files "PROJECT_BRIEF.md,docs/ARCHITECTURE.md,..."
 *   node lock.js --dir . --files "a.md" --files "b.md"      (repeatable)
 *   node lock.js --dir . --files "a.md" --replace           (overwrite, don't merge)
 *
 * Paths are stored project-relative with POSIX separators. Existing entries are
 * merged (union) unless --replace is given.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { dir: '.', files: [], replace: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') out.dir = argv[++i];
    else if (a === '--files') out.files.push(...String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--replace') out.replace = true;
  }
  return out;
}

function normalizeRel(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function buildLocked({ existing, files, replace, now }) {
  const base = !replace && existing && Array.isArray(existing.locked) ? existing.locked : [];
  const set = new Set(base.map(normalizeRel));
  files.map(normalizeRel).forEach((f) => { if (f) set.add(f); });
  return {
    version: 1,
    lockedAt: new Date(now).toISOString(),
    locked: [...set].sort(),
  };
}

function run(opts, now = Date.now()) {
  const dir = path.resolve(opts.dir);
  const rfDir = path.join(dir, '.repoforge');
  const lockFile = path.join(rfDir, 'locked.json');
  let existing = null;
  try { existing = JSON.parse(fs.readFileSync(lockFile, 'utf8')); } catch (_) { /* none */ }
  const data = buildLocked({ existing, files: opts.files, replace: opts.replace, now });
  fs.mkdirSync(rfDir, { recursive: true });
  fs.writeFileSync(lockFile, JSON.stringify(data, null, 2) + '\n');
  return { lockFile, data };
}

module.exports = { parseArgs, normalizeRel, buildLocked, run };

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.files.length === 0) {
    process.stderr.write('lock.js: no --files given\n');
    process.exit(1);
  }
  const { lockFile, data } = run(opts);
  process.stdout.write(`Locked ${data.locked.length} file(s) -> ${lockFile}\n`);
  data.locked.forEach((f) => process.stdout.write('  - ' + f + '\n'));
}
