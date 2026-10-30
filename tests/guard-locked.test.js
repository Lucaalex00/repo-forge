'use strict';
/* Tests for hooks/guard-locked.js */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { test } = require('./_harness');

const guard = require('../hooks/guard-locked.js');
const GUARD_PATH = path.resolve(__dirname, '..', 'hooks', 'guard-locked.js');

const LOCKED = ['PROJECT_BRIEF.md', 'docs/ARCHITECTURE.md', 'CLAUDE.md', 'frontend/CLAUDE.md'];
const future = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 1000).toISOString();

function writePayload(tool, input, cwd) {
  return { hook_event_name: 'PreToolUse', tool_name: tool, tool_input: input, cwd };
}

/* ---- pure path matching ---- */

test('pathMatches: exact relative', (t) => {
  t.ok(guard.pathMatches('docs/ARCHITECTURE.md', 'docs/ARCHITECTURE.md'));
});
test('pathMatches: absolute endswith locked relative', (t) => {
  t.ok(guard.pathMatches('/home/u/proj/docs/ARCHITECTURE.md', 'docs/ARCHITECTURE.md'));
});
test('pathMatches: Windows backslash + drive letter', (t) => {
  t.ok(guard.pathMatches('C:\\Progetti\\app\\docs\\ARCHITECTURE.md', 'docs/ARCHITECTURE.md'));
});
test('pathMatches: bare filename matches nested locked file', (t) => {
  t.ok(guard.pathMatches('ARCHITECTURE.md', 'docs/ARCHITECTURE.md'));
});
test('pathMatches: unrelated file does not match', (t) => {
  t.ok(!guard.pathMatches('src/index.ts', 'docs/ARCHITECTURE.md'));
});
test('pathMatches: leading ./ and quotes are normalized', (t) => {
  t.ok(guard.pathMatches('"./PROJECT_BRIEF.md"', 'PROJECT_BRIEF.md'));
});

/* ---- command write-target extraction ---- */

test('commandWriteTargets: bash redirect > is a write', (t) => {
  const got = guard.commandWriteTargets('echo hi > docs/ARCHITECTURE.md');
  t.ok(got.some((x) => guard.pathMatches(x, 'docs/ARCHITECTURE.md')));
});
test('commandWriteTargets: append >> is a write', (t) => {
  const got = guard.commandWriteTargets('printf x >> PROJECT_BRIEF.md');
  t.ok(got.some((x) => guard.pathMatches(x, 'PROJECT_BRIEF.md')));
});
test('commandWriteTargets: sed -i is a write', (t) => {
  const got = guard.commandWriteTargets("sed -i 's/a/b/' PROJECT_BRIEF.md");
  t.ok(got.some((x) => guard.pathMatches(x, 'PROJECT_BRIEF.md')));
});
test('commandWriteTargets: rm is a write', (t) => {
  const got = guard.commandWriteTargets('rm -f CLAUDE.md');
  t.ok(got.some((x) => guard.pathMatches(x, 'CLAUDE.md')));
});
test('commandWriteTargets: tee is a write', (t) => {
  const got = guard.commandWriteTargets('echo x | tee docs/ARCHITECTURE.md');
  t.ok(got.some((x) => guard.pathMatches(x, 'docs/ARCHITECTURE.md')));
});
test('commandWriteTargets: mv destination is a write', (t) => {
  const got = guard.commandWriteTargets('mv tmp.md PROJECT_BRIEF.md');
  t.ok(got.some((x) => guard.pathMatches(x, 'PROJECT_BRIEF.md')));
});
test('commandWriteTargets: PowerShell Set-Content -Path', (t) => {
  const got = guard.commandWriteTargets('Set-Content -Path .\\PROJECT_BRIEF.md -Value "x"');
  t.ok(got.some((x) => guard.pathMatches(x, 'PROJECT_BRIEF.md')));
});
test('commandWriteTargets: PowerShell Out-File positional', (t) => {
  const got = guard.commandWriteTargets("'x' | Out-File frontend\\CLAUDE.md");
  t.ok(got.some((x) => guard.pathMatches(x, 'frontend/CLAUDE.md')));
});
test('commandWriteTargets: PowerShell Remove-Item', (t) => {
  const got = guard.commandWriteTargets('Remove-Item -Path CLAUDE.md');
  t.ok(got.some((x) => guard.pathMatches(x, 'CLAUDE.md')));
});
test('commandWriteTargets: innocent cat read has no targets', (t) => {
  t.equal(guard.commandWriteTargets('cat docs/ARCHITECTURE.md').length, 0);
});
test('commandWriteTargets: innocent Get-Content read has no targets', (t) => {
  t.equal(guard.commandWriteTargets('Get-Content PROJECT_BRIEF.md').length, 0);
});
test('commandWriteTargets: grep read has no targets', (t) => {
  t.equal(guard.commandWriteTargets('grep foo GUARDRAILS.md').length, 0);
});

/* ---- decide(): file tools ---- */

test('decide: blocks Write to a locked file (absolute path)', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/docs/ARCHITECTURE.md' }), locked: LOCKED });
  t.ok(r.block);
});
test('decide: blocks Edit to a locked file', (t) => {
  const r = guard.decide({ payload: writePayload('Edit', { file_path: '/p/PROJECT_BRIEF.md' }), locked: LOCKED });
  t.ok(r.block);
});
test('decide: allows Write to an unlocked file', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/src/index.ts' }), locked: LOCKED });
  t.ok(!r.block);
});
test('decide: allows unknown/read tool', (t) => {
  const r = guard.decide({ payload: writePayload('Read', { file_path: '/p/PROJECT_BRIEF.md' }), locked: LOCKED });
  t.ok(!r.block);
});
test('decide: empty locked list allows everything', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/PROJECT_BRIEF.md' }), locked: [] });
  t.ok(!r.block);
});

/* ---- decide(): bash/powershell ---- */

test('decide: blocks bash redirect to locked file', (t) => {
  const r = guard.decide({ payload: writePayload('Bash', { command: 'echo x > docs/ARCHITECTURE.md' }), locked: LOCKED });
  t.ok(r.block);
});
test('decide: blocks PowerShell write to locked file', (t) => {
  const r = guard.decide({ payload: writePayload('Bash', { command: 'Set-Content -Path PROJECT_BRIEF.md -Value y' }), locked: LOCKED });
  t.ok(r.block);
});
test('decide: allows bash read of locked file', (t) => {
  const r = guard.decide({ payload: writePayload('Bash', { command: 'cat PROJECT_BRIEF.md' }), locked: LOCKED });
  t.ok(!r.block);
});

/* ---- decide(): unlock handling ---- */

test('decide: valid unlock (all) allows the write', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/PROJECT_BRIEF.md' }), locked: LOCKED, unlock: { expiresAt: future(), paths: 'all' } });
  t.ok(!r.block);
});
test('decide: expired unlock still blocks', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/PROJECT_BRIEF.md' }), locked: LOCKED, unlock: { expiresAt: past(), paths: 'all' } });
  t.ok(r.block);
});
test('decide: unlock scoped to a different file still blocks', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/PROJECT_BRIEF.md' }), locked: LOCKED, unlock: { expiresAt: future(), paths: ['docs/ARCHITECTURE.md'] } });
  t.ok(r.block);
});
test('decide: unlock scoped to the target file allows it', (t) => {
  const r = guard.decide({ payload: writePayload('Write', { file_path: '/p/PROJECT_BRIEF.md' }), locked: LOCKED, unlock: { expiresAt: future(), paths: ['PROJECT_BRIEF.md'] } });
  t.ok(!r.block);
});
test('isUnlocked: malformed expiresAt is treated as not unlocked', (t) => {
  t.ok(!guard.isUnlocked('PROJECT_BRIEF.md', { expiresAt: 'not-a-date', paths: 'all' }, Date.now()));
});

/* ---- end-to-end: spawn the hook with stdin + a temp project ---- */

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'repoforge-test-'));
  fs.mkdirSync(path.join(dir, '.repoforge'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.repoforge', 'locked.json'), JSON.stringify({ version: 1, locked: LOCKED }));
  return dir;
}
function runHook(payload, cwd) {
  return spawnSync('node', [GUARD_PATH], { input: JSON.stringify(payload), cwd, encoding: 'utf8' });
}

test('e2e: exit 2 when writing a locked file', (t) => {
  const dir = makeProject();
  const res = runHook(writePayload('Write', { file_path: path.join(dir, 'PROJECT_BRIEF.md') }, dir), dir);
  t.equal(res.status, 2);
  t.ok(/locked/i.test(res.stderr), 'stderr should explain the block');
});
test('e2e: exit 0 when writing an unlocked file', (t) => {
  const dir = makeProject();
  const res = runHook(writePayload('Write', { file_path: path.join(dir, 'src', 'app.ts') }, dir), dir);
  t.equal(res.status, 0);
});
test('e2e: exit 0 with a valid unlock token', (t) => {
  const dir = makeProject();
  fs.writeFileSync(path.join(dir, '.repoforge', 'unlock.json'), JSON.stringify({ expiresAt: future(), paths: 'all' }));
  const res = runHook(writePayload('Write', { file_path: path.join(dir, 'PROJECT_BRIEF.md') }, dir), dir);
  t.equal(res.status, 0);
});
test('e2e: exit 2 with an expired unlock token', (t) => {
  const dir = makeProject();
  fs.writeFileSync(path.join(dir, '.repoforge', 'unlock.json'), JSON.stringify({ expiresAt: past(), paths: 'all' }));
  const res = runHook(writePayload('Write', { file_path: path.join(dir, 'PROJECT_BRIEF.md') }, dir), dir);
  t.equal(res.status, 2);
});
test('e2e: malformed stdin exits 0 (no crash, no block)', (t) => {
  const dir = makeProject();
  const res = spawnSync('node', [GUARD_PATH], { input: 'not json at all', cwd: dir, encoding: 'utf8' });
  t.equal(res.status, 0);
});
test('e2e: no locked.json anywhere exits 0', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'repoforge-nolock-'));
  const res = runHook(writePayload('Write', { file_path: path.join(dir, 'PROJECT_BRIEF.md') }, dir), dir);
  t.equal(res.status, 0);
});
test('e2e: blocks a bash write via spawn', (t) => {
  const dir = makeProject();
  const res = runHook(writePayload('Bash', { command: 'echo hi > ' + path.join(dir, 'CLAUDE.md') }, dir), dir);
  t.equal(res.status, 2);
});
