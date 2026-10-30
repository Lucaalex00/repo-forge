'use strict';
/* Tests that validate the plugin's JSON and frontmatter. */

const fs = require('fs');
const path = require('path');
const { test } = require('./_harness');
const { validate, parseFrontmatter } = require('../scripts/validate-plugin.js');

const ROOT = path.resolve(__dirname, '..');

test('validate(): plugin has no schema errors', (t) => {
  const { errors } = validate(ROOT);
  t.equal(errors.length, 0, 'errors:\n' + errors.join('\n'));
});

test('plugin.json: required name + object author', (t) => {
  const p = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  t.equal(p.name, 'repo-forge');
  t.ok(p.author && typeof p.author === 'object' && p.author.name);
});

test('marketplace.json: owner object + plugins array with source', (t) => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  t.ok(m.owner && m.owner.name);
  t.ok(Array.isArray(m.plugins) && m.plugins.length >= 1);
  t.ok(m.plugins[0].source && m.plugins[0].name);
});

test('hooks.json: PreToolUse command references an existing guard script', (t) => {
  const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks', 'hooks.json'), 'utf8'));
  const cmd = h.hooks.PreToolUse[0].hooks[0].command;
  t.ok(/CLAUDE_PLUGIN_ROOT/.test(cmd), 'uses ${CLAUDE_PLUGIN_ROOT}');
  t.ok(fs.existsSync(path.join(ROOT, 'hooks', 'guard-locked.js')));
});

test('every SKILL.md has frontmatter with a description', (t) => {
  const skillsDir = path.join(ROOT, 'skills');
  const names = fs.readdirSync(skillsDir);
  t.ok(names.length >= 6, 'expected at least 6 skills');
  for (const n of names) {
    const f = path.join(skillsDir, n, 'SKILL.md');
    t.ok(fs.existsSync(f), `missing ${n}/SKILL.md`);
    const fm = parseFrontmatter(fs.readFileSync(f, 'utf8'));
    t.ok(fm.present, `${n}: frontmatter must be present/terminated`);
    t.ok(!!fm.data.description, `${n}: needs a description`);
  }
});

test('every command .md has frontmatter with a description', (t) => {
  const cmdDir = path.join(ROOT, 'commands');
  const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
  t.ok(files.length >= 3, 'expected at least 3 commands');
  for (const f of files) {
    const fm = parseFrontmatter(fs.readFileSync(path.join(cmdDir, f), 'utf8'));
    t.ok(fm.present, `${f}: frontmatter present`);
    t.ok(!!fm.data.description, `${f}: needs a description`);
  }
});

test('per-stack CLAUDE.md templates all exist', (t) => {
  const dir = path.join(ROOT, 'skills', 'repo-docs', 'templates', 'claude-md');
  const expected = ['angular', 'react', 'nextjs', 'vue', 'sveltekit', 'astro', 'dotnet', 'nest-express', 'fastapi', 'django', 'laravel', 'go', 'symfony'];
  for (const name of expected) {
    const f = path.join(dir, name + '.md');
    t.ok(fs.existsSync(f), `missing template ${name}.md`);
    t.ok(fs.readFileSync(f, 'utf8').length > 200, `${name}.md looks too short`);
  }
});

test('constitution document templates all exist', (t) => {
  const dir = path.join(ROOT, 'skills', 'repo-docs', 'templates');
  const expected = ['PROJECT_BRIEF.md', 'ARCHITECTURE.md', 'GUIDELINES.md', 'GUARDRAILS.md', 'CONVENTIONS.md', 'WORKFLOW.md', 'CHANGELOG.md', 'CLAUDE.root.md'];
  for (const f of expected) t.ok(fs.existsSync(path.join(dir, f)), `missing template ${f}`);
});
