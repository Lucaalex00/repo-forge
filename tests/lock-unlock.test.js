'use strict';
/* Tests for scripts/lock.js and scripts/unlock.js */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { test } = require('./_harness');

const lock = require('../scripts/lock.js');
const unlock = require('../scripts/unlock.js');
const guard = require('../hooks/guard-locked.js');

const NOW = Date.parse('2026-01-01T12:00:00.000Z');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'repoforge-lk-'));
}

/* ---- lock.js ---- */

test('lock.buildLocked: normalizes, de-dupes and sorts', (t) => {
  const d = lock.buildLocked({ existing: null, files: ['./b.md', 'a\\c.md', 'b.md'], replace: false, now: NOW });
  t.equal(d.version, 1);
  t.equal(d.lockedAt, '2026-01-01T12:00:00.000Z');
  t.equal(d.locked.join(','), 'a/c.md,b.md');
});
test('lock.buildLocked: merges with existing unless replace', (t) => {
  const existing = { locked: ['x.md'] };
  t.equal(lock.buildLocked({ existing, files: ['y.md'], replace: false, now: NOW }).locked.join(','), 'x.md,y.md');
  t.equal(lock.buildLocked({ existing, files: ['y.md'], replace: true, now: NOW }).locked.join(','), 'y.md');
});
test('lock.parseArgs: collects --files (repeatable, comma-split) and flags', (t) => {
  const o = lock.parseArgs(['--dir', 'p', '--files', 'a.md,b.md', '--files', 'c.md', '--replace']);
  t.equal(o.dir, 'p');
  t.equal(o.files.join(','), 'a.md,b.md,c.md');
  t.ok(o.replace);
});
test('lock.run: writes .repoforge/locked.json', (t) => {
  const dir = tmp();
  const { data } = lock.run({ dir, files: ['PROJECT_BRIEF.md'], replace: false }, NOW);
  const onDisk = JSON.parse(fs.readFileSync(path.join(dir, '.repoforge', 'locked.json'), 'utf8'));
  t.equal(onDisk.locked[0], 'PROJECT_BRIEF.md');
  t.equal(onDisk.lockedAt, data.lockedAt);
});

/* ---- unlock.js ---- */

test('unlock.buildUnlock: expiresAt is now + minutes', (t) => {
  const d = unlock.buildUnlock({ paths: ['a.md'], minutes: 10, now: NOW });
  t.equal(d.expiresAt, new Date(NOW + 10 * 60000).toISOString());
  t.equal(d.paths.join(','), 'a.md');
});
test('unlock.buildUnlock: empty paths => "all"; invalid minutes => 10', (t) => {
  const d = unlock.buildUnlock({ paths: [], minutes: NaN, now: NOW });
  t.equal(d.paths, 'all');
  t.equal(d.expiresAt, new Date(NOW + 10 * 60000).toISOString());
});
test('unlock.run then --clear removes the token', (t) => {
  const dir = tmp();
  unlock.run({ dir, paths: ['a.md'], minutes: 10, reason: 'r', adr: 'docs/adr/1.md' }, NOW);
  t.ok(fs.existsSync(path.join(dir, '.repoforge', 'unlock.json')));
  const res = unlock.run({ dir, clear: true });
  t.ok(res.cleared && res.removed);
  t.ok(!fs.existsSync(path.join(dir, '.repoforge', 'unlock.json')));
});

/* ---- integration: scripts + guard decision ---- */

test('integration: a fresh unlock window lets the guard allow the write', (t) => {
  const now = Date.now();
  const u = unlock.buildUnlock({ paths: ['docs/ARCHITECTURE.md'], minutes: 10, now });
  const r = guard.decide({
    payload: { tool_name: 'Write', tool_input: { file_path: '/p/docs/ARCHITECTURE.md' } },
    locked: ['docs/ARCHITECTURE.md'],
    unlock: u,
    now,
  });
  t.ok(!r.block);
});
