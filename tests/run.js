'use strict';
/* Test entry point: requires all *.test.js files, then runs the suite. */

const fs = require('fs');
const path = require('path');
const { run } = require('./_harness');

const dir = __dirname;
for (const f of fs.readdirSync(dir)) {
  if (f.endsWith('.test.js')) require(path.join(dir, f));
}

const { failed } = run();
process.exit(failed ? 1 : 0);
