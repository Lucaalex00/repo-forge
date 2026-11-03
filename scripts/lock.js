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
 *   node lock.js --dir <projectDir> --auto                  (discover the constitution)
 *   node lock.js --dir <projectDir> --files "PROJECT_BRIEF.md,docs/ARCHITECTURE.md,..."
 *   node lock.js --dir . --auto --files "extra.md"          (discovery + extras)
 *   node lock.js --dir . --files "a.md" --replace           (overwrite, don't merge)
 *
 * --auto finds the core constitution documents and every CLAUDE.md / AGENTS.md
 * (root and per part), skipping files owned by a framework — e.g. the AGENTS.md
 * that Next.js 16+ writes and re-writes during `next dev`, which contains only a
 * managed `<!-- BEGIN:... -->`/`<!-- END:... -->` block. CHANGELOG.md and ADRs
 * are never locked: they must keep receiving entries.
 *
 * Paths are stored project-relative with POSIX separators. Existing entries are
 * merged (union) unless --replace is given.
 */

const fs = require('fs');
const path = require('path');

const CORE_CONSTITUTION = ['PROJECT_BRIEF.md', 'ARCHITECTURE.md', 'GUIDELINES.md', 'GUARDRAILS.md', 'CONVENTIONS.md', 'WORKFLOW.md'];
const AGENT_FILES = ['CLAUDE.md', 'AGENTS.md'];
const SKIP_DIRS = new Set(['node_modules', 'sandbox', 'dist', 'build', 'out', 'coverage', 'vendor', 'bin', 'obj', 'target']);

function parseArgs(argv) {
  const out = { dir: '.', files: [], replace: false, auto: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') out.dir = argv[++i];
    else if (a === '--files') out.files.push(...String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--replace') out.replace = true;
    else if (a === '--auto') out.auto = true;
  }
  return out;
}

function normalizeRel(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

/** Remove framework-managed blocks: <!-- BEGIN:name --> ... <!-- END:name -->. */
function stripManagedBlocks(text) {
  return String(text).replace(/<!--\s*BEGIN:([\w.-]+)\s*-->[\s\S]*?<!--\s*END:\1\s*-->/g, '');
}

/** A file is framework-owned when nothing but managed blocks lives in it. */
function isFrameworkOwned(file) {
  try { return stripManagedBlocks(fs.readFileSync(file, 'utf8')).trim() === ''; } catch (_) { return false; }
}

/** Discover the constitution under dir (project-relative POSIX paths, sorted). */
function discoverConstitution(dir) {
  const wanted = new Set([...CORE_CONSTITUTION, ...AGENT_FILES]);
  const found = [];
  (function walk(abs, depth) {
    let entries;
    try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      const full = path.join(abs, e.name);
      if (e.isDirectory()) {
        // Constitution never lives in hidden dirs (.git, .next, .claude, .husky, …).
        if (e.name.startsWith('.') || SKIP_DIRS.has(e.name) || depth >= 6) continue;
        walk(full, depth + 1);
      } else if (wanted.has(e.name)) {
        if (AGENT_FILES.includes(e.name) && isFrameworkOwned(full)) continue;
        found.push(normalizeRel(path.relative(dir, full)));
      }
    }
  })(dir, 0);
  return found.sort();
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
  const files = [...(opts.auto ? discoverConstitution(dir) : []), ...(opts.files || [])];
  const data = buildLocked({ existing, files, replace: opts.replace, now });
  if (data.locked.length === 0) return { lockFile, data, empty: true }; // never write an empty lock
  fs.mkdirSync(rfDir, { recursive: true });
  fs.writeFileSync(lockFile, JSON.stringify(data, null, 2) + '\n');
  return { lockFile, data };
}

module.exports = {
  parseArgs, normalizeRel, buildLocked, run,
  stripManagedBlocks, isFrameworkOwned, discoverConstitution, CORE_CONSTITUTION, AGENT_FILES,
};

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.files.length === 0 && !opts.auto) {
    process.stderr.write('lock.js: pass --auto and/or --files\n');
    process.exit(1);
  }
  const { lockFile, data, empty } = run(opts);
  if (empty) {
    process.stderr.write('lock.js: nothing to lock (no constitution documents found)\n');
    process.exit(1);
  }
  process.stdout.write(`Locked ${data.locked.length} file(s) -> ${lockFile}\n`);
  data.locked.forEach((f) => process.stdout.write('  - ' + f + '\n'));
}
