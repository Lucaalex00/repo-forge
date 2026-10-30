#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — verify.js
 *
 * Deterministic health check for a Repo Forge project, run by /repo-forge:check
 * so the mechanical checks are reliable (the model then adds build/lint).
 *
 * Checks: locked.json valid; every locked file exists; no stale/expired unlock
 * token; .env git-ignored and not tracked; .env.example present; no leftover
 * placeholders in locked documents.
 *
 * Usage: node verify.js --dir <projectDir>
 * Exit 1 if any hard check fails, else 0.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLACEHOLDER_PATTERNS = [/\bTODO\b/, /\bTBD\b/, /\bFIXME\b/, /\bXXX\b/, /<[^>\n]*\s[^>\n]*>/];
const CORE_DOCS = ['PROJECT_BRIEF.md', 'ARCHITECTURE.md', 'GUIDELINES.md', 'GUARDRAILS.md', 'CONVENTIONS.md', 'WORKFLOW.md', 'CHANGELOG.md', 'CLAUDE.md'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'sandbox', 'dist', 'build', '.next', 'vendor', '.venv']);

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

/** Find the first file with the given basename anywhere under dir, or null. */
function findByBasename(dir, basename, depth = 0) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return null; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || depth > 6) continue;
      const found = findByBasename(path.join(dir, e.name), basename, depth + 1);
      if (found) return found;
    } else if (e.name === basename) {
      return path.join(dir, basename);
    }
  }
  return null;
}

/** Count rule-like lines (numbered or bulleted) in a markdown file. */
function countRules(file) {
  if (!file) return 0;
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return 0; }
  return text.split(/\r?\n/).filter((l) => /^\s*(?:\d+\.|[-*])\s+\S/.test(l)).length;
}

function isGitIgnored(dir, rel) {
  try {
    execSync(`git -C ${JSON.stringify(dir)} check-ignore ${JSON.stringify(rel)}`, { stdio: 'ignore' });
    return true; // exit 0 => ignored
  } catch (_) { return false; }
}

function isTracked(dir, rel) {
  try {
    const out = execSync(`git -C ${JSON.stringify(dir)} ls-files -- ${JSON.stringify(rel)}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim().length > 0;
  } catch (_) { return false; }
}

function runChecks(dir, now = Date.now()) {
  const results = [];
  const pass = (msg) => results.push({ level: 'pass', msg });
  const warn = (msg) => results.push({ level: 'warn', msg });
  const fail = (msg) => results.push({ level: 'fail', msg });

  const lock = readJson(path.join(dir, '.repoforge', 'locked.json'));
  if (!lock || !Array.isArray(lock.locked) || lock.locked.length === 0) {
    fail('.repoforge/locked.json missing or has no locked files');
    return { results, failed: true };
  }
  pass(`locked.json lists ${lock.locked.length} file(s)`);

  // Locked files exist + placeholder scan.
  let missing = 0;
  let placeholders = 0;
  for (const rel of lock.locked) {
    const abs = path.join(dir, rel);
    if (!fs.existsSync(abs)) { fail(`locked file is missing on disk: ${rel}`); missing++; continue; }
    let text = '';
    try { text = fs.readFileSync(abs, 'utf8'); } catch (_) { /* ignore */ }
    if (PLACEHOLDER_PATTERNS.some((re) => re.test(text))) { warn(`locked file still contains a placeholder: ${rel}`); placeholders++; }
  }
  if (!missing) pass('every locked file exists on disk');
  if (!placeholders) pass('no leftover placeholders in locked documents');

  // Constitution completeness (layout-agnostic: search anywhere under the project).
  const missingDocs = CORE_DOCS.filter((d) => !findByBasename(dir, d));
  if (missingDocs.length) warn('missing constitution document(s): ' + missingDocs.join(', '));
  else pass('all core constitution documents are present');
  if (!findByBasename(dir, '0001-record-architecture-decisions.md') && !fs.existsSync(path.join(dir, 'docs', 'adr'))) {
    warn('no docs/adr/ directory (ADRs) found');
  }

  // Rule count (guardrails + guidelines) should be at least 10.
  const ruleCount = countRules(findByBasename(dir, 'GUARDRAILS.md')) + countRules(findByBasename(dir, 'GUIDELINES.md'));
  if (ruleCount >= 10) pass(`found ${ruleCount} project rules (guardrails + guidelines)`);
  else warn(`only ${ruleCount} project rules found; aim for at least 10 across GUARDRAILS.md and GUIDELINES.md`);

  // Unlock token state.
  const unlock = readJson(path.join(dir, '.repoforge', 'unlock.json'));
  if (unlock) {
    const exp = Date.parse(unlock.expiresAt);
    if (Number.isFinite(exp) && exp > now) warn('an unlock window is currently OPEN (locked files are editable) — close it with unlock.js --clear when done');
    else warn('a stale/expired unlock.json is present — remove it (unlock.js --clear)');
  } else pass('no unlock token present (structure is locked)');

  // .env handling.
  const gitignore = (() => { try { return fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'); } catch (_) { return ''; } })();
  const ignoresEnv = /(^|\n)\s*\.env(\s|$|\/|\*)/.test(gitignore) || isGitIgnored(dir, '.env');
  if (ignoresEnv) pass('.env is git-ignored');
  else warn('.env does not appear to be git-ignored — add it to .gitignore');
  if (isTracked(dir, '.env')) fail('.env is tracked by git — remove it from the index (git rm --cached .env)');
  if (fs.existsSync(path.join(dir, '.env.example'))) pass('.env.example is present');
  else warn('.env.example is missing — commit one with placeholder keys');

  return { results, failed: results.some((r) => r.level === 'fail') };
}

module.exports = { runChecks, findByBasename, countRules, PLACEHOLDER_PATTERNS, CORE_DOCS };

if (require.main === module) {
  let dir = '.';
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--dir') dir = argv[++i];
  const { results, failed } = runChecks(path.resolve(dir));
  const icon = { pass: '✓', warn: '‼', fail: '✗' };
  results.forEach((r) => process.stdout.write(`${icon[r.level]} ${r.msg}\n`));
  const n = (l) => results.filter((r) => r.level === l).length;
  process.stdout.write(`\n${n('pass')} ok, ${n('warn')} warning(s), ${n('fail')} failure(s)\n`);
  process.exit(failed ? 1 : 0);
}
