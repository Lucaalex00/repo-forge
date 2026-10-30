#!/usr/bin/env node
/**
 * Repo Forge — guard-locked.js
 *
 * PreToolUse hook. Blocks any attempt to modify a "constitution" file that has
 * been locked by Repo Forge, unless a currently-valid unlock token is present.
 *
 * Contract (Claude Code hooks):
 *   - Receives the PreToolUse event payload as JSON on stdin.
 *   - Exit 0  => allow the tool call (nothing printed, or JSON on stdout).
 *   - Exit 2  => block the tool call; stderr is shown to Claude as the reason.
 *   - Any other exit code => non-blocking error (the call proceeds).
 *
 * Lock state lives in the *user's project* (not in the plugin):
 *   <project>/.repoforge/locked.json   { "version": 1, "locked": ["PROJECT_BRIEF.md", ...] }
 *   <project>/.repoforge/unlock.json    { "expiresAt": "<ISO>", "paths": ["..."] | "all" }
 *
 * Design notes:
 *   - Over-blocking is safer than under-blocking for a guardrail, so ambiguous
 *     write commands that reference a locked file are blocked.
 *   - Pure decision logic (decide / extractTargets / isLockedTarget) is exported
 *     so it can be unit-tested without touching the filesystem or stdin.
 *   - Cross-platform: Windows (backslash, drive letters, PowerShell) and POSIX.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* Path normalization & matching                                       */
/* ------------------------------------------------------------------ */

/** Normalize a path/token for comparison: strip quotes, unify separators,
 *  drop leading "./" and trailing "/", and lower-case (locked file names are
 *  fixed-case, and case-insensitive comparison is safe + handles Windows). */
function norm(p) {
  if (p === undefined || p === null) return '';
  return String(p)
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function basename(p) {
  const n = norm(p);
  const i = n.lastIndexOf('/');
  return i === -1 ? n : n.slice(i + 1);
}

/** Does `target` (any form: relative, absolute, Windows) refer to `lockedRel`
 *  (a project-relative locked path)? */
function pathMatches(target, lockedRel) {
  const t = norm(target);
  const l = norm(lockedRel);
  if (!t || !l) return false;
  if (t === l) return true;
  if (t.endsWith('/' + l)) return true; // absolute or nested reference
  // Bare filename reference (e.g. "ARCHITECTURE.md" for "docs/ARCHITECTURE.md").
  if (basename(t) === basename(l) && !t.includes('/')) return true;
  return false;
}

function isLockedTarget(target, lockedList) {
  return lockedList.some((rel) => pathMatches(target, rel));
}

/* ------------------------------------------------------------------ */
/* Extracting write targets from a tool call                           */
/* ------------------------------------------------------------------ */

const FILE_WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const SHELL_TOOLS = new Set(['Bash', 'BashOutput', 'Shell']);

/** Split a shell command into segments on separators that start a new command,
 *  so a redirect stays attached to its own segment. Pipes split too. */
function splitSegments(cmd) {
  return String(cmd).split(/\n|;|\|\||&&|\||&(?!>)/g);
}

/** Tokenize a segment, honoring simple single/double quotes. */
function tokenize(segment) {
  const tokens = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(segment)) !== null) {
    tokens.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  }
  return tokens;
}

const PS_WRITE_CMDLETS = new Set([
  'set-content', 'add-content', 'out-file', 'clear-content', 'new-item',
  'remove-item', 'move-item', 'copy-item', 'rename-item',
  'sc', 'ac', 'ni', 'ri', 'del', 'erase', 'rd', 'rmdir',
]);
const POSIX_WRITE_VERBS = new Set([
  'tee', 'rm', 'unlink', 'shred', 'truncate', 'mv', 'cp', 'install', 'ln', 'rename', 'dd',
]);

function isOption(tok) {
  return /^-{1,2}/.test(tok);
}

/** Collect write-target tokens from a single shell segment. */
function segmentWriteTargets(segment) {
  const targets = [];
  const tokens = tokenize(segment);
  if (tokens.length === 0) return targets;

  // 1) Output redirections: `> file`, `>>file`, `1> file` (ignore 2>, >&2, &>).
  //    We scan the raw segment for redirect operators and their following token.
  const redir = /(^|[^0-9&>])>>?\s*("[^"]+"|'[^']+'|[^\s;|&><()]+)/g;
  let rm;
  while ((rm = redir.exec(segment)) !== null) {
    targets.push(rm[2]);
  }

  // 2) Command verb heuristics.
  const verbRaw = tokens[0];
  const verb = norm(verbRaw);
  const args = tokens.slice(1);
  const nonOpt = args.filter((t) => !isOption(t));

  if (verb === 'tee') {
    nonOpt.forEach((t) => targets.push(t));
  } else if (verb === 'rm' || verb === 'unlink' || verb === 'shred' || verb === 'truncate') {
    nonOpt.forEach((t) => targets.push(t));
  } else if (verb === 'mv' || verb === 'cp' || verb === 'install' || verb === 'rename' || verb === 'ln') {
    if (nonOpt.length >= 1) targets.push(nonOpt[nonOpt.length - 1]); // destination
  } else if (verb === 'dd') {
    args.forEach((t) => {
      const mm = /^of=(.+)$/i.exec(t);
      if (mm) targets.push(mm[1]);
    });
  } else if (verb === 'sed' || verb === 'perl' || verb === 'ruby' || verb === 'gawk' || verb === 'awk') {
    const inPlace = args.some((t) => t === '-i' || /^--?i(n-?place)?/i.test(t) || /^-i\S*/.test(t));
    if (inPlace) {
      // File operands are trailing non-option, non-script tokens. Be generous:
      // take trailing tokens that look like paths (contain a dot or slash).
      nonOpt.forEach((t) => {
        if (/[./\\]/.test(t)) targets.push(t);
      });
    }
  } else if (PS_WRITE_CMDLETS.has(verb)) {
    // PowerShell: -Path/-LiteralPath/-Destination <value>, or positional path.
    for (let i = 0; i < args.length; i++) {
      const a = norm(args[i]);
      if (a === '-path' || a === '-literalpath' || a === '-destination' || a === '-filepath') {
        if (args[i + 1] !== undefined) targets.push(args[i + 1]);
      }
    }
    // Positional first non-option operand (e.g. `Out-File docs\X.md`).
    if (nonOpt.length >= 1) targets.push(nonOpt[0]);
  }

  return targets;
}

/** Write calls hidden inside interpreter one-liners (python -c, node -e, …),
 *  where the path is an argument to a known write function rather than a shell
 *  redirect. Precise: only fires on actual write-call syntax, so it does not
 *  flag reads. Scans the whole command (the code is usually a quoted string). */
const INTERPRETER_WRITE_CALLS = [
  /\bopen\s*\(\s*(['"])([^'"]+)\1\s*,\s*(['"])[rbt+]*[wax][rbt+]*\3/gi, // python open(x, 'w'|'a'|...)
  /\bwrite_?file(?:sync)?\s*\(\s*(['"])([^'"]+)\1/gi,                    // node fs.writeFile(Sync)(x
  /\b(?:append_?file(?:sync)?|createwritestream)\s*\(\s*(['"])([^'"]+)\1/gi,
  /\bfile\.(?:write|open|new)\s*\(\s*(['"])([^'"]+)\1/gi,               // ruby File.write/open/new(x
  /\b(?:file_put_contents|fopen)\s*\(\s*(['"])([^'"]+)\1/gi,           // php
];

function interpreterWriteTargets(cmd) {
  const out = [];
  for (const re of INTERPRETER_WRITE_CALLS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(cmd)) !== null) out.push(m[2]);
  }
  return out;
}

function commandWriteTargets(cmd) {
  const out = [];
  splitSegments(cmd).forEach((seg) => {
    segmentWriteTargets(seg).forEach((t) => out.push(t));
  });
  interpreterWriteTargets(cmd).forEach((t) => out.push(t));
  return out;
}

/**
 * Extract the set of paths a tool call would WRITE to.
 * Returns { targets: string[], inspected: boolean }.
 * `inspected` is false when the tool is not one we guard (always allowed).
 */
function extractTargets(payload) {
  const tool = payload && payload.tool_name;
  const input = (payload && payload.tool_input) || {};

  if (FILE_WRITE_TOOLS.has(tool)) {
    const targets = [];
    if (input.file_path) targets.push(input.file_path);
    if (input.notebook_path) targets.push(input.notebook_path);
    if (input.path) targets.push(input.path);
    return { targets, inspected: true };
  }

  if (SHELL_TOOLS.has(tool)) {
    const cmd = input.command || input.script || '';
    return { targets: commandWriteTargets(cmd), inspected: true };
  }

  return { targets: [], inspected: false };
}

/* ------------------------------------------------------------------ */
/* Unlock handling                                                     */
/* ------------------------------------------------------------------ */

/** Is a given locked path currently unlocked by a valid token? */
function isUnlocked(lockedRel, unlock, now) {
  if (!unlock || typeof unlock !== 'object') return false;
  const expires = Date.parse(unlock.expiresAt);
  if (!Number.isFinite(expires) || expires <= now) return false; // missing or expired
  const paths = unlock.paths;
  if (paths === undefined || paths === null || paths === 'all' || paths === '*') return true;
  if (Array.isArray(paths)) {
    if (paths.some((p) => p === 'all' || p === '*')) return true;
    return paths.some((p) => pathMatches(p, lockedRel) || pathMatches(lockedRel, p));
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Core decision (pure)                                                */
/* ------------------------------------------------------------------ */

/**
 * @param {object} args
 * @param {object} args.payload   PreToolUse payload.
 * @param {string[]} args.locked  Project-relative locked paths.
 * @param {object} [args.unlock]  Parsed unlock.json (optional).
 * @param {number} [args.now]     Current epoch ms (defaults Date.now()).
 * @returns {{block:boolean, reason?:string, matched?:string}}
 */
function decide({ payload, locked, unlock, now }) {
  now = Number.isFinite(now) ? now : Date.now();
  if (!Array.isArray(locked) || locked.length === 0) return { block: false };

  const { targets, inspected } = extractTargets(payload);
  if (!inspected || targets.length === 0) return { block: false };

  for (const target of targets) {
    const hit = locked.find((rel) => pathMatches(target, rel));
    if (!hit) continue;
    if (isUnlocked(hit, unlock, now)) continue; // currently unlocked -> allow
    return {
      block: true,
      matched: hit,
      reason:
        `Repo Forge: "${hit}" is a locked constitution file and cannot be modified directly.\n` +
        `Run /repo-forge:change to record an ADR, get approval, and open a temporary 10-minute unlock window.`,
    };
  }
  return { block: false };
}

/* ------------------------------------------------------------------ */
/* Filesystem wiring (impure)                                          */
/* ------------------------------------------------------------------ */

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

/** Walk up from `start` to locate a directory containing .repoforge/locked.json. */
function findProjectRoot(start) {
  let dir = start;
  for (let i = 0; i < 64 && dir; i++) {
    try {
      if (fs.existsSync(path.join(dir, '.repoforge', 'locked.json'))) return dir;
    } catch (_) { /* ignore */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadLockState(projectRoot) {
  const lockFile = readJsonSafe(path.join(projectRoot, '.repoforge', 'locked.json'));
  const unlock = readJsonSafe(path.join(projectRoot, '.repoforge', 'unlock.json'));
  const locked = lockFile && Array.isArray(lockFile.locked) ? lockFile.locked : [];
  return { locked, unlock };
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (_) {
    return '';
  }
}

function main() {
  const raw = readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    // Malformed payload: we cannot identify a target, so do not block.
    process.exit(0);
  }
  if (!payload || typeof payload !== 'object') process.exit(0);

  const startDir = payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const projectRoot = findProjectRoot(startDir) || startDir;
  const { locked, unlock } = loadLockState(projectRoot);

  const result = decide({ payload, locked, unlock, now: Date.now() });
  if (result.block) {
    process.stderr.write(result.reason + '\n');
    process.exit(2);
  }
  process.exit(0);
}

/* Export pure helpers for tests; run main() only when invoked directly. */
module.exports = {
  norm,
  basename,
  pathMatches,
  isLockedTarget,
  extractTargets,
  commandWriteTargets,
  segmentWriteTargets,
  interpreterWriteTargets,
  isUnlocked,
  decide,
  findProjectRoot,
  loadLockState,
};

if (require.main === module) {
  main();
}
