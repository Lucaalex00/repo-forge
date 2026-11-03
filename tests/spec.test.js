'use strict';
/* Tests for scripts/spec.js (non-interactive mode) */

const fs = require('fs');
const path = require('path');
const { test } = require('./_harness');
const spec = require('../scripts/spec.js');

const longVision = Array.from({ length: 55 }, (_, i) => `word${i}`).join(' ');

test('spec.wordCount counts words', (t) => {
  t.equal(spec.wordCount('a b  c\nd'), 4);
});

test('spec: a complete valid spec has no errors and normalizes defaults', (t) => {
  const { errors, normalized } = spec.validateSpec({
    level: 'expert', vision: longVision,
    features: { mustHave: ['x'] },
    stack: { frontend: 'next', backend: 'none', database: 'sqlite' },
    layout: { repo: 'monorepo', docs: 'root', dbScripts: 'backend' },
  });
  t.equal(errors.length, 0, errors.join(';'));
  t.equal(normalized.stack.database, 'sqlite');
});

test('spec: vision under 50 words is an error (gate enforced)', (t) => {
  const { errors } = spec.validateSpec({ vision: 'too short', level: 'beginner' });
  t.ok(errors.some((e) => /50 words/.test(e)));
});

test('spec: missing vision is an error', (t) => {
  const { errors } = spec.validateSpec({ level: 'expert' });
  t.ok(errors.some((e) => /vision is required/.test(e)));
});

test('spec: invalid level and layout values error', (t) => {
  const { errors } = spec.validateSpec({ vision: longVision, level: 'wizard', layout: { repo: 'nope' } });
  t.ok(errors.some((e) => /level must be/.test(e)));
  t.ok(errors.some((e) => /layout.repo must be/.test(e)));
});

test('spec: missing stack/layout default with warnings, not errors', (t) => {
  const { errors, warnings, normalized } = spec.validateSpec({ vision: longVision, level: 'beginner' });
  t.equal(errors.length, 0);
  t.equal(normalized.layout.repo, 'monorepo');
  t.equal(normalized.stack.frontend, 'auto');
  t.ok(warnings.length >= 1);
});

test('spec: warns when backend is "none" but dbScripts targets the backend', (t) => {
  const { errors, warnings } = spec.validateSpec({
    vision: longVision, level: 'expert',
    stack: { backend: 'none' }, layout: { dbScripts: 'backend' },
  });
  t.equal(errors.length, 0);
  t.ok(warnings.some((w) => /dbScripts is "backend" but stack.backend is "none"/.test(w)));
});

test('spec: github block is validated and normalized', (t) => {
  const ok = spec.validateSpec({ vision: longVision, level: 'expert', github: { owner: 'Lucaalex00', repo: 'terzo-spazio' } });
  t.equal(ok.errors.length, 0, ok.errors.join(';'));
  t.equal(ok.normalized.github.visibility, 'private');
  t.ok(ok.normalized.github.publish);
  const bad = spec.validateSpec({ vision: longVision, level: 'expert', github: { owner: 'bad owner!', repo: 'a b', visibility: 'secret' } });
  t.ok(bad.errors.some((e) => /visibility/.test(e)));
  t.ok(bad.errors.some((e) => /owner/.test(e)));
  t.ok(bad.errors.some((e) => /github.repo/.test(e)));
  const noOwner = spec.validateSpec({ vision: longVision, level: 'expert', github: { publish: true } });
  t.ok(noOwner.warnings.some((w) => /asked at publish time/.test(w)));
});

test('spec: the shipped example validates', (t) => {
  const file = path.resolve(__dirname, '..', 'skills', 'repo-interview', 'references', 'repoforge.config.example.json');
  const { errors } = spec.validateSpec(JSON.parse(fs.readFileSync(file, 'utf8')));
  t.equal(errors.length, 0, errors.join(';'));
});
