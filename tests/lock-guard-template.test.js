'use strict';
/* Tests for the portable pre-commit lock-guard template. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { test } = require('./_harness');

const GUARD = path.resolve(__dirname, '..', 'skills', 'repo-scaffolder', 'references', 'precommit', 'lock-guard.js');
const lg = require(GUARD);

const future = () => new Date(Date.now() + 600000).toISOString();

test('lock-guard template: pathMatches handles relative and Windows paths', (t) => {
  t.ok(lg.pathMatches('docs/ARCHITECTURE.md', 'docs/ARCHITECTURE.md'));
  t.ok(lg.pathMatches('docs\\ARCHITECTURE.md', 'docs/ARCHITECTURE.md'));
  t.ok(!lg.pathMatches('src/app.ts', 'docs/ARCHITECTURE.md'));
});
test('lock-guard template: isUnlocked honors expiry and scope', (t) => {
  t.ok(lg.isUnlocked('A.md', { expiresAt: future(), paths: 'all' }, Date.now()));
  t.ok(!lg.isUnlocked('A.md', { expiresAt: '2000-01-01T00:00:00Z', paths: 'all' }, Date.now()));
  t.ok(!lg.isUnlocked('A.md', { expiresAt: future(), paths: ['B.md'] }, Date.now()));
  t.ok(lg.isUnlocked('A.md', { expiresAt: future(), paths: ['all'] }, Date.now())); // array "all"
});

function gitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'repoforge-lg-'));
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: dir });
  fs.mkdirSync(path.join(dir, '.repoforge'));
  fs.writeFileSync(path.join(dir, '.repoforge', 'locked.json'), JSON.stringify({ version: 1, locked: ['ARCHITECTURE.md'] }));
  fs.writeFileSync(path.join(dir, 'ARCHITECTURE.md'), '# A\nSQLite.\n');
  fs.writeFileSync(path.join(dir, 'app.ts'), 'export const x = 1;\n');
  return dir;
}
function runGuard(dir) {
  return require('child_process').spawnSync('node', [GUARD], { cwd: dir, encoding: 'utf8' });
}

test('lock-guard e2e: initial addition of a locked file is allowed (not yet in HEAD)', (t) => {
  const dir = gitRepo(); // no commits yet
  execSync('git add ARCHITECTURE.md', { cwd: dir });
  t.equal(runGuard(dir).status, 0, 'first commit of the constitution must be allowed');
});
test('lock-guard e2e: modifying an already-committed locked file is blocked (exit 1)', (t) => {
  const dir = gitRepo();
  execSync('git add . && git commit -q -m baseline', { cwd: dir }); // commit locked file
  fs.appendFileSync(path.join(dir, 'ARCHITECTURE.md'), '\nedited\n');
  execSync('git add ARCHITECTURE.md', { cwd: dir });
  const res = runGuard(dir);
  t.equal(res.status, 1);
  t.ok(/lock-guard blocked/.test(res.stderr));
});
test('lock-guard e2e: committing only an unlocked file is allowed (exit 0)', (t) => {
  const dir = gitRepo();
  execSync('git add . && git commit -q -m baseline', { cwd: dir });
  fs.appendFileSync(path.join(dir, 'app.ts'), '\n// more\n');
  execSync('git add app.ts', { cwd: dir });
  t.equal(runGuard(dir).status, 0);
});
test('lock-guard e2e: a valid unlock window allows modifying a committed locked file', (t) => {
  const dir = gitRepo();
  execSync('git add . && git commit -q -m baseline', { cwd: dir });
  fs.appendFileSync(path.join(dir, 'ARCHITECTURE.md'), '\nedited\n');
  fs.writeFileSync(path.join(dir, '.repoforge', 'unlock.json'), JSON.stringify({ expiresAt: future(), paths: ['ARCHITECTURE.md'] }));
  execSync('git add ARCHITECTURE.md', { cwd: dir });
  t.equal(runGuard(dir).status, 0);
});
