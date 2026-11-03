'use strict';
/* Tests for lock.js --auto discovery, install-guards.js, publish.js and the new verify checks. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { test } = require('./_harness');

const lock = require('../scripts/lock.js');
const installGuards = require('../scripts/install-guards.js');
const publish = require('../scripts/publish.js');
const verify = require('../scripts/verify.js');

const NEXT_BLOCK = '<!-- BEGIN:nextjs-agent-rules -->\n# Next.js rules\n<!-- END:nextjs-agent-rules -->\n';

function tmp(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix || 'repoforge-ip-')); }
function write(dir, rel, content) {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}
function git(dir, args) { return execSync(`git ${args}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
function gitInit(dir) { git(dir, 'init -q -b main'); git(dir, 'config user.email t@t'); git(dir, 'config user.name t'); }

/* ---- lock.js discovery ---- */

test('lock.stripManagedBlocks / isFrameworkOwned', (t) => {
  t.equal(lock.stripManagedBlocks(NEXT_BLOCK).trim(), '');
  const dir = tmp();
  write(dir, 'a/AGENTS.md', NEXT_BLOCK);
  write(dir, 'b/AGENTS.md', '# Our rules\n' + NEXT_BLOCK);
  t.ok(lock.isFrameworkOwned(path.join(dir, 'a/AGENTS.md')));
  t.ok(!lock.isFrameworkOwned(path.join(dir, 'b/AGENTS.md')));
});

test('lock.discoverConstitution: core docs + per-part agent files, skips framework-owned, CHANGELOG, hidden and node_modules', (t) => {
  const dir = tmp();
  for (const f of ['PROJECT_BRIEF.md', 'ARCHITECTURE.md', 'GUARDRAILS.md', 'CHANGELOG.md', 'CLAUDE.md', 'AGENTS.md']) write(dir, f, '# ' + f + '\n');
  write(dir, 'apps/web/CLAUDE.md', '# web\n');
  write(dir, 'apps/web/AGENTS.md', NEXT_BLOCK); // Next.js-owned
  write(dir, 'node_modules/x/CLAUDE.md', 'x');
  write(dir, '.claude/CLAUDE.md', 'x');
  write(dir, 'docs/adr/0001-x.md', '# adr');
  const found = lock.discoverConstitution(dir);
  t.equal(found.join(','), 'AGENTS.md,ARCHITECTURE.md,CLAUDE.md,GUARDRAILS.md,PROJECT_BRIEF.md,apps/web/CLAUDE.md');
});

test('lock.run --auto writes the discovered list; empty discovery writes nothing', (t) => {
  const dir = tmp();
  write(dir, 'ARCHITECTURE.md', '# a');
  const r = lock.run({ dir, auto: true, files: [] });
  t.equal(r.data.locked.join(','), 'ARCHITECTURE.md');
  const empty = tmp();
  const r2 = lock.run({ dir: empty, auto: true, files: [] });
  t.ok(r2.empty);
  t.ok(!fs.existsSync(path.join(empty, '.repoforge', 'locked.json')));
});

/* ---- install-guards.js ---- */

test('install-guards: adapted copies are .cjs with header and no shebang', (t) => {
  const out = installGuards.adapt('#!/usr/bin/env node\n\'use strict\';\n');
  t.ok(out.startsWith('/* eslint-disable */'));
  t.ok(!out.includes('#!'));
});

test('install-guards: Husky project gets guards prepended before existing commands (idempotent)', (t) => {
  const dir = tmp();
  gitInit(dir);
  write(dir, '.husky/pre-commit', 'npx lint-staged\n');
  const r1 = installGuards.run({ dir });
  t.equal(r1.hookKind, 'husky');
  t.equal(r1.added.join(','), 'secret-guard,lock-guard');
  const hook = fs.readFileSync(path.join(dir, '.husky/pre-commit'), 'utf8').split('\n');
  t.ok(/secret-guard\.cjs/.test(hook[0]) && /lock-guard\.cjs/.test(hook[1]) && hook[2] === 'npx lint-staged');
  for (const f of ['secret-guard.cjs', 'lock-guard.cjs', 'unlock.cjs']) t.ok(fs.existsSync(path.join(dir, 'scripts', f)), f);
  const r2 = installGuards.run({ dir });
  t.equal(r2.added.length, 0);
  t.equal(r2.copied.length, 0);
});

test('install-guards: plain git repo gets .githooks + core.hooksPath', (t) => {
  const dir = tmp();
  gitInit(dir);
  const r = installGuards.run({ dir });
  t.equal(r.hookKind, 'githooks');
  t.equal(git(dir, 'config core.hooksPath'), '.githooks');
  t.ok(fs.readFileSync(path.join(dir, '.githooks/pre-commit'), 'utf8').startsWith('#!/bin/sh\n'));
});

test('install-guards: not a git repo yet -> note, no crash', (t) => {
  const dir = tmp();
  const r = installGuards.run({ dir });
  t.ok(r.notes.some((n) => /git init/.test(n)));
});

test('install-guards: copied lock-guard.cjs runs in a "type": "module" project', (t) => {
  const dir = tmp();
  gitInit(dir);
  write(dir, 'package.json', JSON.stringify({ name: 'x', type: 'module' }));
  installGuards.run({ dir });
  const res = spawnSync('node', ['scripts/lock-guard.cjs'], { cwd: dir, encoding: 'utf8' });
  t.equal(res.status, 0, res.stderr);
  const res2 = spawnSync('node', ['scripts/unlock.cjs', '--dir', '.', '--paths', 'all'], { cwd: dir, encoding: 'utf8' });
  t.equal(res2.status, 0, res2.stderr);
});

test('install-guards e2e: real commit through the installed hook blocks a locked change', (t) => {
  const dir = tmp();
  gitInit(dir);
  write(dir, 'ARCHITECTURE.md', '# A\n');
  lock.run({ dir, auto: true, files: [] });
  installGuards.run({ dir });
  git(dir, 'add -A');
  git(dir, 'commit -q -m init'); // first addition of locked files is allowed
  fs.appendFileSync(path.join(dir, 'ARCHITECTURE.md'), 'changed\n');
  git(dir, 'add ARCHITECTURE.md');
  const res = spawnSync('git', ['commit', '-m', 'touch locked'], { cwd: dir, encoding: 'utf8' });
  t.notEqual(res.status, 0, 'commit must be rejected');
  t.ok(/lock-guard blocked/.test(res.stderr + res.stdout));
});

/* ---- publish.js ---- */

test('publish.recommend: decision table', (t) => {
  t.equal(publish.recommend({ isGitRepo: false }).step, 'init');
  t.equal(publish.recommend({ isGitRepo: true, commits: 0, uncommitted: 3 }).step, 'commit');
  t.equal(publish.recommend({ isGitRepo: true, commits: 1, uncommitted: 0, remoteUrl: null, ghAuthed: true }).step, 'gh-create');
  t.equal(publish.recommend({ isGitRepo: true, commits: 1, uncommitted: 0, remoteUrl: null, ghAuthed: false }).step, 'create-remote');
  t.equal(publish.recommend({ isGitRepo: true, commits: 1, uncommitted: 0, remoteUrl: 'x', remoteReachable: false }).step, 'check-access');
  t.equal(publish.recommend({ isGitRepo: true, commits: 1, uncommitted: 0, remoteUrl: 'x', remoteReachable: true, remoteEmpty: true }).step, 'push');
  t.equal(publish.recommend({ isGitRepo: true, commits: 1, uncommitted: 0, remoteUrl: 'x', remoteReachable: true, remoteHead: 'a', inSync: true }).step, 'done');
  t.equal(publish.recommend({ isGitRepo: true, commits: 1, uncommitted: 0, remoteUrl: 'x', remoteReachable: true, remoteHead: 'a', inSync: false }).step, 'sync');
});

test('publish e2e: commit -> push -> done against a local bare remote', (t) => {
  const dir = tmp();
  const bare = tmp('repoforge-bare-');
  git(bare, 'init -q --bare -b main');
  t.equal(publish.run({ dir }).step, 'init');
  gitInit(dir);
  write(dir, 'index.md', '# hi\n');
  t.equal(publish.run({ dir }).step, 'commit');
  git(dir, 'add -A'); git(dir, 'commit -q -m init');
  t.ok(['create-remote', 'gh-create'].includes(publish.run({ dir }).step));
  git(dir, `remote add origin ${JSON.stringify(bare)}`);
  t.equal(publish.run({ dir }).step, 'push');
  git(dir, 'push -q -u origin main');
  t.equal(publish.run({ dir }).step, 'done');
  write(dir, 'more.md', '# more\n'); git(dir, 'add -A'); git(dir, 'commit -q -m more');
  t.equal(publish.run({ dir }).step, 'push', 'local ahead of remote must be a plain push, not sync');
});

test('publish e2e: remote created with a README (unrelated history) -> sync, then done after merge', (t) => {
  const bare = tmp('repoforge-bare-');
  git(bare, 'init -q --bare -b main');
  const other = tmp(); gitInit(other); write(other, 'README.md', '# from github\n');
  git(other, 'add -A'); git(other, 'commit -q -m "Initial commit"');
  git(other, `remote add origin ${JSON.stringify(bare)}`); git(other, 'push -q origin main');
  const dir = tmp(); gitInit(dir); write(dir, 'README.md', '# project\n'); write(dir, 'app.ts', 'x\n');
  git(dir, 'add -A'); git(dir, 'commit -q -m scaffold');
  git(dir, `remote add origin ${JSON.stringify(bare)}`);
  t.equal(publish.run({ dir }).step, 'sync');
  git(dir, 'fetch -q origin');
  spawnSync('git', ['pull', 'origin', 'main', '--allow-unrelated-histories', '--no-rebase', '--no-edit'], { cwd: dir });
  git(dir, 'checkout --ours README.md'); git(dir, 'add README.md');
  spawnSync('git', ['commit', '-q', '--no-edit'], { cwd: dir });
  git(dir, 'push -q origin main');
  t.equal(publish.run({ dir }).step, 'done');
  t.equal(fs.readFileSync(path.join(dir, 'README.md'), 'utf8'), '# project\n');
});

/* ---- verify.js new checks ---- */

test('verify: warns on missing guards and unlocked per-part docs; passes once fixed', (t) => {
  const dir = tmp();
  gitInit(dir);
  write(dir, 'ARCHITECTURE.md', '# a\n');
  write(dir, 'apps/web/CLAUDE.md', '# web\n');
  write(dir, 'apps/web/AGENTS.md', NEXT_BLOCK);
  write(dir, '.gitignore', '.env\n'); write(dir, '.env.example', 'X=\n');
  lock.run({ dir, files: ['ARCHITECTURE.md'] });
  let { results } = verify.runChecks(dir);
  t.ok(results.some((r) => r.level === 'warn' && /not in locked\.json: apps\/web\/CLAUDE\.md/.test(r.msg)));
  t.ok(!results.some((r) => /apps\/web\/AGENTS\.md/.test(r.msg)), 'framework-owned AGENTS.md must not be flagged');
  t.ok(results.some((r) => r.level === 'warn' && /guard\(s\) not installed/.test(r.msg)));
  lock.run({ dir, auto: true, files: [] });
  installGuards.run({ dir });
  ({ results } = verify.runChecks(dir));
  t.ok(results.some((r) => r.level === 'pass' && /every discovered constitution document is locked/.test(r.msg)));
  t.ok(results.some((r) => r.level === 'pass' && /secret-guard and lock-guard are installed/.test(r.msg)));
});
