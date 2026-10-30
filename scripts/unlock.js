#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — unlock.js
 *
 * Deterministically open or close the temporary unlock window used by
 * /repo-forge:change, so the 10-minute expiry and scoped paths are computed by
 * code, not hand-written by the model.
 *
 * Open a window:
 *   node unlock.js --dir . --paths "docs/ARCHITECTURE.md" --minutes 10 \
 *     --reason "Switch DB to Postgres" --adr "docs/adr/0002-switch-to-postgres.md"
 * Close it (re-lock):
 *   node unlock.js --dir . --clear
 *
 * Writes/removes <project>/.repoforge/unlock.json. That file is git-ignored.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { dir: '.', paths: [], minutes: 10, reason: '', adr: '', clear: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') out.dir = argv[++i];
    else if (a === '--paths') out.paths.push(...String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--minutes') out.minutes = Number(argv[++i]);
    else if (a === '--reason') out.reason = argv[++i] || '';
    else if (a === '--adr') out.adr = argv[++i] || '';
    else if (a === '--clear' || a === '--relock') out.clear = true;
  }
  return out;
}

function normalizeRel(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function buildUnlock({ paths, minutes, reason, adr, now }) {
  const mins = Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
  const data = {
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + mins * 60 * 1000).toISOString(),
    paths: paths && paths.length ? paths.map(normalizeRel) : 'all',
  };
  if (reason) data.reason = reason;
  if (adr) data.adr = normalizeRel(adr);
  return data;
}

function run(opts, now = Date.now()) {
  const dir = path.resolve(opts.dir);
  const rfDir = path.join(dir, '.repoforge');
  const unlockFile = path.join(rfDir, 'unlock.json');
  if (opts.clear) {
    let removed = false;
    try { fs.unlinkSync(unlockFile); removed = true; } catch (_) { /* already absent */ }
    return { unlockFile, cleared: true, removed };
  }
  const data = buildUnlock({ ...opts, now });
  fs.mkdirSync(rfDir, { recursive: true });
  fs.writeFileSync(unlockFile, JSON.stringify(data, null, 2) + '\n');
  return { unlockFile, data };
}

module.exports = { parseArgs, normalizeRel, buildUnlock, run };

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  const res = run(opts);
  if (res.cleared) {
    process.stdout.write(res.removed ? `Re-locked (removed ${res.unlockFile})\n` : 'Already locked (no unlock window)\n');
  } else {
    process.stdout.write(`Unlock window open until ${res.data.expiresAt} for ${JSON.stringify(res.data.paths)} -> ${res.unlockFile}\n`);
  }
}
