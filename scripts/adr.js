#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — adr.js
 *
 * Deterministically create the next-numbered Architecture Decision Record under
 * <project>/docs/adr/. Run by /repo-forge:change so numbering never collides.
 *
 * Usage:
 *   node adr.js --dir . --title "Switch database to PostgreSQL" [--status proposed] [--date YYYY-MM-DD]
 * Prints the created file's project-relative path on stdout (pass it to
 * unlock.js --adr).
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { dir: '.', title: '', status: 'proposed', date: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') out.dir = argv[++i];
    else if (a === '--title') out.title = argv[++i] || '';
    else if (a === '--status') out.status = argv[++i] || 'proposed';
    else if (a === '--date') out.date = argv[++i] || '';
  }
  return out;
}

function slugify(title) {
  return String(title).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'decision';
}

function pad4(n) { return String(n).padStart(4, '0'); }

/** Next ADR number given existing file names (e.g. ["0001-x.md","0002-y.md"]). */
function computeNext(existingNames) {
  let max = 0;
  for (const name of existingNames) {
    const m = /^(\d{1,6})[-_.]/.exec(name);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

function buildAdr({ number, title, status, date }) {
  return `# ${number}. ${title}

- Status: ${status}
- Date: ${date}

## Context
<Why is this decision needed? What forces are at play?>

## Decision
<What are we deciding to do?>

## Alternatives considered
<What else was considered, and why not?>

## Consequences
<What becomes easier or harder as a result?>
`;
}

function run(opts, now = new Date()) {
  const dir = path.resolve(opts.dir);
  const adrDir = path.join(dir, 'docs', 'adr');
  fs.mkdirSync(adrDir, { recursive: true });
  const existing = fs.readdirSync(adrDir).filter((f) => f.endsWith('.md'));
  const number = computeNext(existing);
  const date = opts.date || now.toISOString().slice(0, 10);
  const file = `${pad4(number)}-${slugify(opts.title)}.md`;
  const abs = path.join(adrDir, file);
  fs.writeFileSync(abs, buildAdr({ number, title: opts.title || 'Untitled decision', status: opts.status, date }));
  return { rel: path.join('docs', 'adr', file).replace(/\\/g, '/'), number, abs };
}

module.exports = { parseArgs, slugify, computeNext, pad4, buildAdr, run };

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.title) { process.stderr.write('adr.js: --title is required\n'); process.exit(1); }
  const { rel } = run(opts);
  process.stdout.write(rel + '\n');
}
