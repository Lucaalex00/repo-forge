#!/usr/bin/env node
'use strict';
/**
 * Repo Forge — spec.js
 *
 * Non-interactive mode. Reads and validates a project spec
 * (repoforge.config.json) so /repo-forge:new-repo can skip the interview and go
 * straight to Brief -> scaffold -> docs -> lock. This is the agentic / low-token
 * path: an agent or a returning user writes the spec once, the flow runs with
 * almost no Q&A.
 *
 * The 50-word vision gate is enforced here too.
 *
 * Usage: node spec.js --file repoforge.config.json [--dir .]
 * Exit 1 on validation errors, else 0.
 */

const fs = require('fs');
const path = require('path');

const LEVELS = ['beginner', 'expert'];
const REPO_LAYOUTS = ['monorepo', 'separate'];
const DOCS_LAYOUTS = ['root', 'frontend', 'backend', 'dedicated'];
const DBSCRIPT_LAYOUTS = ['backend', 'separate'];

function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function validateSpec(spec) {
  const errors = [];
  const warnings = [];
  const normalized = JSON.parse(JSON.stringify(spec || {}));

  if (!spec || typeof spec !== 'object') {
    return { errors: ['spec is not an object'], warnings, normalized: {} };
  }

  // level
  if (spec.level === undefined) { warnings.push('level missing; defaulting to "expert"'); normalized.level = 'expert'; }
  else if (!LEVELS.includes(spec.level)) errors.push(`level must be one of ${LEVELS.join('|')}`);

  // vision + 50-word gate
  if (!spec.vision || typeof spec.vision !== 'string') {
    errors.push('vision is required');
  } else {
    const wc = wordCount(spec.vision);
    if (wc < 50) errors.push(`vision must be at least 50 words (got ${wc}); the vision gate applies in spec mode too`);
  }

  // stack (values or "auto"; default all auto)
  const stack = spec.stack || {};
  normalized.stack = {
    frontend: stack.frontend || 'auto',
    backend: stack.backend || 'auto',
    database: stack.database || 'sqlite',
  };
  if (!spec.stack) warnings.push('stack missing; defaulting to auto frontend/backend and SQLite');

  // layout (defaults + validation)
  const layout = spec.layout || {};
  normalized.layout = {
    repo: layout.repo || 'monorepo',
    docs: layout.docs || 'root',
    dbScripts: layout.dbScripts || 'backend',
  };
  if (layout.repo && !REPO_LAYOUTS.includes(layout.repo)) errors.push(`layout.repo must be one of ${REPO_LAYOUTS.join('|')}`);
  if (layout.docs && !DOCS_LAYOUTS.includes(layout.docs)) errors.push(`layout.docs must be one of ${DOCS_LAYOUTS.join('|')}`);
  if (layout.dbScripts && !DBSCRIPT_LAYOUTS.includes(layout.dbScripts)) errors.push(`layout.dbScripts must be one of ${DBSCRIPT_LAYOUTS.join('|')}`);
  if (!spec.layout) warnings.push('layout missing; defaulting to monorepo, docs at root, DB scripts in backend');

  // Cross-field sanity: "no backend" but layout references the backend folder.
  if (normalized.stack.backend === 'none') {
    if (normalized.layout.dbScripts === 'backend') warnings.push('layout.dbScripts is "backend" but stack.backend is "none"; put DB scripts in the app or a separate folder');
    if (normalized.layout.docs === 'backend') warnings.push('layout.docs is "backend" but stack.backend is "none"; choose root, frontend or dedicated');
  }

  // features (recommended)
  if (!spec.features || !Array.isArray(spec.features.mustHave) || spec.features.mustHave.length === 0) {
    warnings.push('features.mustHave is empty; the advisor will infer features from the vision');
  }

  // integrations: each needs envKeys so .env.example can be generated
  if (Array.isArray(spec.integrations)) {
    spec.integrations.forEach((it, i) => {
      if (!it || !it.name) errors.push(`integrations[${i}] needs a name`);
    });
  }

  // rules (optional; advisor fills to >=10 if absent)
  const g = (spec.rules && spec.rules.guardrails) || [];
  const gl = (spec.rules && spec.rules.guidelines) || [];
  if (g.length + gl.length > 0 && g.length + gl.length < 10) {
    warnings.push(`only ${g.length + gl.length} rules in spec; rules-advisor will top up to at least 10`);
  }

  // github (optional): where /repo-forge:publish will push the project.
  if (spec.github !== undefined) {
    const gh = spec.github || {};
    normalized.github = {
      publish: gh.publish !== false,
      owner: gh.owner || null,
      repo: gh.repo || null,
      visibility: gh.visibility || 'private',
    };
    if (gh.visibility && !['private', 'public'].includes(gh.visibility)) errors.push('github.visibility must be private|public');
    if (gh.owner && !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(gh.owner)) errors.push('github.owner is not a valid GitHub user/organization name');
    if (gh.repo && !/^[A-Za-z0-9._-]{1,100}$/.test(gh.repo)) errors.push('github.repo may contain only letters, digits, ".", "_" and "-"');
    if (normalized.github.publish && !gh.owner) warnings.push('github.owner missing; it will be asked at publish time');
  }

  return { errors, warnings, normalized };
}

function run(opts) {
  const file = path.resolve(opts.dir || '.', opts.file);
  let spec;
  try { spec = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return { errors: [`cannot read/parse ${opts.file}: ${e.message}`], warnings: [], normalized: null }; }
  return validateSpec(spec);
}

module.exports = { validateSpec, wordCount, run, LEVELS, REPO_LAYOUTS, DOCS_LAYOUTS, DBSCRIPT_LAYOUTS };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opts = { dir: '.', file: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file') opts.file = argv[++i];
    else if (argv[i] === '--dir') opts.dir = argv[++i];
  }
  if (!opts.file) { process.stderr.write('spec.js: --file is required\n'); process.exit(1); }
  const { errors, warnings, normalized } = run(opts);
  warnings.forEach((w) => process.stdout.write('warning: ' + w + '\n'));
  errors.forEach((e) => process.stdout.write('ERROR:   ' + e + '\n'));
  if (errors.length) { process.stdout.write(`\n${errors.length} error(s)\n`); process.exit(1); }
  process.stdout.write('spec OK\n' + JSON.stringify(normalized, null, 2) + '\n');
}
