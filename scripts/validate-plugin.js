#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — local plugin validator (zero dependencies).
 *
 * Complements `claude plugin validate` by checking, in a way the test suite can
 * import:
 *   - every JSON file parses;
 *   - plugin.json / marketplace.json required fields + basic rules;
 *   - every SKILL.md and command .md has well-formed YAML frontmatter with
 *     recognized keys (and `description`);
 *   - hooks.json has the documented shape and its command paths exist.
 *
 * Exposes validate(root) => { errors, warnings } and runs as a CLI.
 */

const fs = require('fs');
const path = require('path');

const SKILL_KEYS = new Set([
  'name', 'description', 'when_to_use', 'argument-hint', 'arguments',
  'disable-model-invocation', 'user-invocable', 'allowed-tools',
  'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background',
  'hooks', 'paths', 'shell', 'metadata', 'license', 'compatibility',
]);
// Commands accept the same keys except `name` and `paths` (docs).
const COMMAND_KEYS = new Set([...SKILL_KEYS].filter((k) => k !== 'name' && k !== 'paths'));

const RESERVED_PLUGIN_NAMES = new Set([
  'claude', 'anthropic', 'claude-code', 'claude-mods', 'anthropics',
]);

function listFiles(dir, filterFn, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return acc; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'sandbox' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(full, filterFn, acc);
    else if (filterFn(full)) acc.push(full);
  }
  return acc;
}

/** Parse a leading YAML frontmatter block into a flat key->rawValue map.
 *  Minimal parser: top-level `key: value` pairs only (enough for validation). */
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { present: false, data: {} };
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== '---') return { present: false, data: {} };
  const data = {};
  let closed = false;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { closed = true; break; }
    const m = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(lines[i]);
    if (m && !/^\s/.test(lines[i])) data[m[1]] = m[2];
  }
  return { present: closed, data };
}

function validate(root) {
  const errors = [];
  const warnings = [];
  const E = (f, msg) => errors.push(`${path.relative(root, f)}: ${msg}`);
  const W = (f, msg) => warnings.push(`${path.relative(root, f)}: ${msg}`);

  // 1) All JSON files parse.
  const jsonFiles = listFiles(root, (f) => f.endsWith('.json'));
  const parsed = {};
  for (const f of jsonFiles) {
    try { parsed[f] = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (err) { E(f, 'invalid JSON: ' + err.message); }
  }

  // 2) plugin.json
  const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
  const plugin = parsed[pluginPath];
  if (!plugin) E(pluginPath, 'missing or unparseable .claude-plugin/plugin.json');
  else {
    if (!plugin.name) E(pluginPath, 'missing required field "name"');
    else {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(plugin.name)) E(pluginPath, `name "${plugin.name}" must be kebab-case`);
      if (/^(claude|anthropic|anthropics|cc-plugin)-/.test(plugin.name) || RESERVED_PLUGIN_NAMES.has(plugin.name))
        E(pluginPath, `name "${plugin.name}" is reserved`);
    }
    if (!plugin.version) W(pluginPath, 'missing "version"');
    if (!plugin.description) W(pluginPath, 'missing "description"');
    if (!plugin.author) W(pluginPath, 'missing "author"');
    else if (typeof plugin.author !== 'object' || !plugin.author.name) E(pluginPath, '"author" must be an object with a "name"');
  }

  // 3) marketplace.json
  const mktPath = path.join(root, '.claude-plugin', 'marketplace.json');
  const mkt = parsed[mktPath];
  if (!mkt) E(mktPath, 'missing or unparseable .claude-plugin/marketplace.json');
  else {
    if (!mkt.name) E(mktPath, 'missing required field "name"');
    if (!mkt.owner || typeof mkt.owner !== 'object' || !mkt.owner.name) E(mktPath, '"owner" must be an object with a "name"');
    if (!Array.isArray(mkt.plugins) || mkt.plugins.length === 0) E(mktPath, '"plugins" must be a non-empty array');
    else mkt.plugins.forEach((p, i) => {
      if (!p || !p.name) E(mktPath, `plugins[${i}] missing "name"`);
      if (!p || !p.source) E(mktPath, `plugins[${i}] missing "source"`);
      else if (typeof p.source === 'string' && !/^\.\.?\//.test(p.source)) E(mktPath, `plugins[${i}].source relative path must start with "./"`);
    });
  }

  // 4) SKILL.md frontmatter
  for (const f of listFiles(path.join(root, 'skills'), (x) => x.endsWith('SKILL.md'))) {
    const fm = parseFrontmatter(fs.readFileSync(f, 'utf8'));
    if (!fm.present) { E(f, 'missing or unterminated YAML frontmatter'); continue; }
    if (!fm.data.description) W(f, 'skill has no "description" (recommended)');
    for (const k of Object.keys(fm.data)) if (!SKILL_KEYS.has(k)) W(f, `unknown frontmatter key "${k}"`);
  }

  // 5) command .md frontmatter
  for (const f of listFiles(path.join(root, 'commands'), (x) => x.endsWith('.md'))) {
    const fm = parseFrontmatter(fs.readFileSync(f, 'utf8'));
    if (!fm.present) { W(f, 'command has no frontmatter'); continue; }
    if (!fm.data.description) W(f, 'command has no "description" (recommended)');
    for (const k of Object.keys(fm.data)) {
      if (k === 'name' || k === 'paths') E(f, `command frontmatter may not use "${k}"`);
      else if (!COMMAND_KEYS.has(k)) W(f, `unknown frontmatter key "${k}"`);
    }
  }

  // 6) hooks.json shape + command paths exist
  const hooksPath = path.join(root, 'hooks', 'hooks.json');
  const hooks = parsed[hooksPath];
  if (hooks) {
    if (!hooks.hooks || typeof hooks.hooks !== 'object') E(hooksPath, 'missing top-level "hooks" object');
    else {
      for (const [event, groups] of Object.entries(hooks.hooks)) {
        if (!Array.isArray(groups)) { E(hooksPath, `"${event}" must be an array`); continue; }
        groups.forEach((g, i) => {
          if (!Array.isArray(g.hooks)) E(hooksPath, `${event}[${i}] missing "hooks" array`);
          else g.hooks.forEach((h, j) => {
            if (!h.type) E(hooksPath, `${event}[${i}].hooks[${j}] missing "type"`);
            if (h.type === 'command') {
              if (!h.command) E(hooksPath, `${event}[${i}].hooks[${j}] missing "command"`);
              else {
                const m = /\$\{CLAUDE_PLUGIN_ROOT\}\/([^"']+?\.js)/.exec(h.command);
                if (m && !fs.existsSync(path.join(root, m[1]))) E(hooksPath, `hook command references missing file: ${m[1]}`);
              }
            }
          });
        });
      }
    }
  }

  return { errors, warnings };
}

module.exports = { validate, parseFrontmatter };

if (require.main === module) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
  const { errors, warnings } = validate(root);
  warnings.forEach((w) => process.stdout.write('warning: ' + w + '\n'));
  errors.forEach((e) => process.stdout.write('ERROR:   ' + e + '\n'));
  process.stdout.write(`\n${errors.length} error(s), ${warnings.length} warning(s)\n`);
  process.exit(errors.length ? 1 : 0);
}
