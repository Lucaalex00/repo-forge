#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — publish.js
 *
 * Deterministic "where are we" check used by /repo-forge:publish, so the model
 * does not have to probe git/GitHub state with many separate commands. It only
 * READS state and recommends the next step; it never pushes or creates repos.
 *
 * Usage: node publish.js --dir <projectRoot> [--json]
 *
 * Next steps: init · commit · gh-create · create-remote · check-access · push ·
 * sync · done
 */

const path = require('path');
const { execSync } = require('child_process');

function sh(cmd, cwd, timeout = 20000) {
  try {
    const out = execSync(cmd, {
      cwd, encoding: 'utf8', timeout,
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, // never hang on a credential prompt
    });
    return { ok: true, out: out.trim() };
  } catch (_) { return { ok: false, out: '' }; }
}

function collect(dir) {
  const s = {};
  s.isGitRepo = sh('git rev-parse --is-inside-work-tree', dir).out === 'true';
  if (!s.isGitRepo) return s;
  s.branch = sh('git symbolic-ref --short HEAD', dir).out || null;
  s.commits = Number(sh('git rev-list --count HEAD', dir).out) || 0;
  s.uncommitted = sh('git status --porcelain', dir).out.split('\n').filter(Boolean).length;
  s.localHead = s.commits ? sh('git rev-parse HEAD', dir).out : null;
  s.remoteUrl = sh('git remote get-url origin', dir).out || null;
  s.ghInstalled = sh('gh --version', dir).ok;
  s.ghAuthed = s.ghInstalled ? sh('gh auth status', dir).ok : false;
  if (s.remoteUrl) {
    const ls = sh('git ls-remote origin', dir, 30000);
    s.remoteReachable = ls.ok;
    s.remoteEmpty = ls.ok && ls.out === '';
    const m = ls.out.split('\n').find((l) => s.branch && l.endsWith(`refs/heads/${s.branch}`));
    s.remoteHead = m ? m.split(/\s+/)[0] : null;
    s.inSync = Boolean(s.remoteHead && s.localHead && s.remoteHead === s.localHead);
    // Local strictly ahead (remote tip already in local history) -> a plain push works.
    s.localAhead = Boolean(s.remoteHead && !s.inSync && sh(`git merge-base --is-ancestor ${s.remoteHead} HEAD`, dir).ok);
  }
  return s;
}

/** Pure: state -> { step, reason }. */
function recommend(s) {
  if (!s.isGitRepo) return { step: 'init', reason: 'not a git repository yet' };
  if (s.commits === 0 || s.uncommitted > 0) return { step: 'commit', reason: s.commits === 0 ? 'no commits yet' : `${s.uncommitted} uncommitted change(s)` };
  if (!s.remoteUrl) return s.ghAuthed
    ? { step: 'gh-create', reason: 'no remote; GitHub CLI is installed and logged in' }
    : { step: 'create-remote', reason: 'no remote; create an EMPTY repository on GitHub, then add it as origin' };
  if (!s.remoteReachable) return { step: 'check-access', reason: 'remote not reachable (wrong URL or not authenticated)' };
  if (s.remoteEmpty || !s.remoteHead) return { step: 'push', reason: 'remote has no commits on this branch' };
  if (s.inSync) return { step: 'done', reason: 'local branch and remote are in sync' };
  if (s.localAhead) return { step: 'push', reason: 'local branch is ahead of the remote' };
  return { step: 'sync', reason: 'remote has commits that are not in your local history (e.g. a README created on GitHub, or work pushed from elsewhere): fetch and integrate, then push' };
}

function run(opts) {
  const dir = path.resolve(opts.dir || '.');
  const state = collect(dir);
  return { dir, state, ...recommend(state) };
}

module.exports = { collect, recommend, run };

if (require.main === module) {
  const argv = process.argv.slice(2);
  let dir = '.';
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--dir') dir = argv[++i];
  const r = run({ dir });
  if (argv.includes('--json')) { process.stdout.write(JSON.stringify(r, null, 2) + '\n'); process.exit(0); }
  const s = r.state;
  const yn = (v) => (v ? 'yes' : 'no');
  process.stdout.write(`git repo:      ${yn(s.isGitRepo)}\n`);
  if (s.isGitRepo) {
    process.stdout.write(`branch:        ${s.branch || '(none)'} · commits: ${s.commits} · uncommitted: ${s.uncommitted}\n`);
    process.stdout.write(`remote origin: ${s.remoteUrl || '(none)'}\n`);
    if (s.remoteUrl) process.stdout.write(`reachable:     ${yn(s.remoteReachable)} · remote empty: ${yn(s.remoteEmpty)} · in sync: ${yn(s.inSync)}\n`);
    process.stdout.write(`GitHub CLI:    installed ${yn(s.ghInstalled)} · logged in ${yn(s.ghAuthed)}\n`);
  }
  process.stdout.write(`\nNEXT STEP: ${r.step} — ${r.reason}\n`);
}
