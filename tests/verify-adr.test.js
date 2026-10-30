'use strict';
/* Tests for scripts/verify.js and scripts/adr.js */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { test } = require('./_harness');

const verify = require('../scripts/verify.js');
const adr = require('../scripts/adr.js');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'repoforge-va-')); }
function write(dir, rel, content) {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}
function goodProject() {
  const dir = tmp();
  write(dir, '.repoforge/locked.json', JSON.stringify({ version: 1, locked: ['ARCHITECTURE.md'] }));
  write(dir, 'ARCHITECTURE.md', '# Architecture\nThe system uses SQLite.\n');
  write(dir, '.gitignore', 'node_modules/\n.env\n');
  write(dir, '.env.example', 'DB_URL=\n');
  return dir;
}
const levels = (results, lvl) => results.filter((r) => r.level === lvl).length;

/* ---- verify.js ---- */

test('verify: a well-formed project has no failures', (t) => {
  const { failed, results } = verify.runChecks(goodProject());
  t.ok(!failed, 'results: ' + JSON.stringify(results));
  t.ok(levels(results, 'pass') >= 4);
});
test('verify: missing locked.json fails', (t) => {
  const { failed } = verify.runChecks(tmp());
  t.ok(failed);
});
test('verify: a missing locked file fails', (t) => {
  const dir = goodProject();
  fs.unlinkSync(path.join(dir, 'ARCHITECTURE.md'));
  const { failed, results } = verify.runChecks(dir);
  t.ok(failed);
  t.ok(results.some((r) => r.level === 'fail' && /missing on disk/.test(r.msg)));
});
test('verify: a placeholder in a locked doc warns', (t) => {
  const dir = goodProject();
  write(dir, 'ARCHITECTURE.md', '# Architecture\nTODO: fill this in.\n');
  const { results } = verify.runChecks(dir);
  t.ok(results.some((r) => r.level === 'warn' && /placeholder/.test(r.msg)));
});
test('verify: an open unlock window warns', (t) => {
  const dir = goodProject();
  write(dir, '.repoforge/unlock.json', JSON.stringify({ expiresAt: new Date(Date.now() + 600000).toISOString(), paths: 'all' }));
  const { results } = verify.runChecks(dir);
  t.ok(results.some((r) => r.level === 'warn' && /unlock window is currently OPEN/i.test(r.msg)));
});
test('verify: .env not ignored warns', (t) => {
  const dir = goodProject();
  write(dir, '.gitignore', 'node_modules/\n');
  const { results } = verify.runChecks(dir);
  t.ok(results.some((r) => r.level === 'warn' && /\.env does not appear/.test(r.msg)));
});

test('verify: warns when core constitution docs are missing', (t) => {
  const { results } = verify.runChecks(goodProject()); // only ARCHITECTURE.md present
  t.ok(results.some((r) => r.level === 'warn' && /missing constitution document/.test(r.msg)));
});
test('verify: warns when fewer than 10 rules', (t) => {
  const { results } = verify.runChecks(goodProject());
  t.ok(results.some((r) => r.level === 'warn' && /at least 10/.test(r.msg)));
});
test('verify: a complete project passes docs + rules checks', (t) => {
  const dir = goodProject();
  for (const d of verify.CORE_DOCS) if (d !== 'ARCHITECTURE.md') write(dir, d, '# ' + d + '\n');
  const rules = Array.from({ length: 10 }, (_, i) => `${i + 1}. Rule ${i + 1}`).join('\n');
  write(dir, 'GUARDRAILS.md', '# Guardrails\n' + rules + '\n');
  const { results, failed } = verify.runChecks(dir);
  t.ok(!failed);
  t.ok(results.some((r) => r.level === 'pass' && /all core constitution documents/.test(r.msg)));
  t.ok(results.some((r) => r.level === 'pass' && /project rules/.test(r.msg)));
});
test('verify.countRules counts numbered and bulleted lines', (t) => {
  const dir = goodProject();
  write(dir, 'R.md', '1. a\n2. b\n- c\ntext\n* d\n');
  t.equal(verify.countRules(path.join(dir, 'R.md')), 4);
});

/* ---- adr.js ---- */

test('adr.slugify: lowercases and dashes', (t) => {
  t.equal(adr.slugify('Switch DB to PostgreSQL!'), 'switch-db-to-postgresql');
});
test('adr.computeNext: next after highest existing', (t) => {
  t.equal(adr.computeNext(['0001-a.md', '0003-b.md', 'notes.md']), 4);
  t.equal(adr.computeNext([]), 1);
});
test('adr.pad4', (t) => { t.equal(adr.pad4(2), '0002'); });
test('adr.run: creates first and then next-numbered file', (t) => {
  const dir = tmp();
  const r1 = adr.run({ dir, title: 'Record decisions', status: 'accepted', date: '2026-01-01' });
  t.equal(r1.number, 1);
  t.ok(fs.existsSync(path.join(dir, r1.rel)));
  const r2 = adr.run({ dir, title: 'Switch to Postgres' });
  t.equal(r2.number, 2);
  t.ok(r2.rel.endsWith('0002-switch-to-postgres.md'));
  t.ok(/## Decision/.test(fs.readFileSync(path.join(dir, r2.rel), 'utf8')));
});
