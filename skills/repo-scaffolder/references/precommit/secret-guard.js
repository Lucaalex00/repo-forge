#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — secret-guard (pre-commit)
 *
 * Template to copy into a generated project (e.g. as `scripts/secret-guard.js`)
 * and run from the project's pre-commit hook. Blocks a commit that would add a
 * real `.env` file or stage an obvious secret. Cross-platform (pure Node).
 *
 * Wire it up either way:
 *   - Husky:   `.husky/pre-commit` -> `node scripts/secret-guard.js`
 *   - Plain:   `git config core.hooksPath .githooks` and a `.githooks/pre-commit`
 *              shell/bat that runs `node scripts/secret-guard.js`
 *
 * Exit 1 aborts the commit; exit 0 allows it.
 */

const { execSync } = require('child_process');

function staged() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

// Files that must never be committed (but .env.example / .env.sample are fine).
const FORBIDDEN_FILE = /(^|\/)\.env(\.[A-Za-z0-9_-]+)?$/i;
const ALLOWED_FILE = /(^|\/)\.env\.(example|sample|template|dist)$/i;

// High-signal secret patterns scanned in staged text content.
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,                     // AWS access key id
  /\bAIza[0-9A-Za-z_-]{35}\b/,                // Google API key
  /\bgh[pousr]_[0-9A-Za-z]{30,}\b/,           // GitHub token
  /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/,          // Slack token
  /\bsk-[0-9A-Za-z]{20,}\b/,                   // generic secret key (OpenAI-style)
  /\b(?:password|passwd|secret|api[_-]?key|token|connectionstring)\s*[:=]\s*['"][^'"]{6,}['"]/i,
];

function stagedContent(file) {
  try { return execSync(`git show :${JSON.stringify(file)}`, { encoding: 'utf8' }); }
  catch (_) { return ''; }
}

function main() {
  const files = staged();
  const problems = [];

  for (const f of files) {
    if (FORBIDDEN_FILE.test(f) && !ALLOWED_FILE.test(f)) {
      problems.push(`  - ${f} looks like a real environment file; commit .env.example instead.`);
      continue;
    }
    if (/\.(png|jpg|jpeg|gif|pdf|zip|lock|ico|woff2?)$/i.test(f)) continue; // skip binaries/locks
    const content = stagedContent(f);
    for (const re of SECRET_PATTERNS) {
      if (re.test(content)) {
        problems.push(`  - ${f} contains something that looks like a secret (${re}).`);
        break;
      }
    }
  }

  if (problems.length) {
    process.stderr.write('\nRepo Forge secret-guard blocked this commit:\n' + problems.join('\n') +
      '\n\nMove secrets into .env (git-ignored) and commit .env.example with placeholders.\n' +
      'If this is a false positive, bypass once with `git commit --no-verify`.\n\n');
    process.exit(1);
  }
  process.exit(0);
}

main();
