# Pre-commit secret guard (template)

Copy `secret-guard.js` into the generated project (e.g. `scripts/secret-guard.js`)
and run it from the project's pre-commit hook. It blocks commits that add a real
`.env` file or stage an obvious secret (private keys, AWS/Google/GitHub/Slack
tokens, `password = "..."`-style literals). It is pure Node, so it works on
Windows, macOS and Linux.

## Install (choose one)

**Husky (JS projects):**
```bash
npm install --save-dev husky
npx husky init
# put this line in .husky/pre-commit:
node scripts/secret-guard.js
```

**No Node toolchain / any stack — plain git hooks path:**
```bash
git config core.hooksPath .githooks
```
`.githooks/pre-commit` (make it executable on macOS/Linux: `chmod +x`):
```sh
#!/bin/sh
node scripts/secret-guard.js
```
On Windows, git runs the hook via its bundled `sh`, so the same file works.

**pre-commit framework (Python/polyglot):** add a local hook that runs
`node scripts/secret-guard.js`.

## Notes
- `.env.example` / `.env.sample` are allowed; real `.env` files are blocked.
- A genuine false positive can be bypassed once with `git commit --no-verify`.
- This complements, and does not replace, a server-side secret scanner.
