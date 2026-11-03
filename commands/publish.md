---
description: Publish the project to GitHub step by step (account, first commit, create the repository, push), handling repos created with a README.
argument-hint: "[owner/repo] [private|public]"
---

# Repo Forge — Publish to GitHub

Arguments: `$ARGUMENTS` (optional `owner/repo` and `private`/`public`; default
**private**). If the interview already recorded the GitHub details, reuse them.

Never print, store or commit a token. Authentication goes through the GitHub CLI
(`gh auth login`) or Git's credential manager (on Windows, Git for Windows opens
a browser login on the first push).

## 1. Check where we are (one command)

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/publish.js" --dir .
```

It reports git state, the `origin` remote, whether the GitHub CLI is installed
and logged in, and prints a **NEXT STEP**. Follow it, then re-run the check
after each step until it says `done`.

## 2. GitHub account

If the user has no GitHub account yet, guide them in plain words: sign up at
https://github.com/signup and verify the email. Optionally install the GitHub CLI
from its official page https://cli.github.com (confirm the current install
command there before showing it), then run `gh auth login`.

## 3. Steps by NEXT STEP

- **init** — `git init -b main`.
- **commit** — make sure `.env` is ignored, then stage and make the first commit
  (`chore: initial scaffold by Repo Forge`). The pre-commit guards allow the first
  addition of the locked constitution files; if a guard blocks, fix the cause —
  never bypass it with `--no-verify`.
- **gh-create** — create and push in one go (confirm flags with
  `gh repo create --help`):
  `gh repo create <owner>/<repo> --private --source=. --remote=origin --push`
- **create-remote** — no GitHub CLI: ask the user to create an **empty**
  repository at https://github.com/new — **no README, no .gitignore, no
  license** (those create a commit that then has to be merged). Then:
  `git remote add origin https://github.com/<owner>/<repo>.git`, then
  `git branch -M main`, then `git push -u origin main`.
- **check-access** — the URL is wrong or the user is not authenticated: verify the
  URL (`git remote -v`) and log in (`gh auth login`, or let the credential
  manager prompt on push).
- **push** — `git push -u origin <branch>`.
- **sync** — the remote already has commits (typically a README created on
  GitHub): `git fetch origin`, then
  `git pull origin <branch> --allow-unrelated-histories --no-rebase`; on a
  `README.md` conflict keep the project's README; commit the merge, then push.
- **done** — show the repository URL.

## 4. Finish

Re-run the check and confirm `NEXT STEP: done`. Tell the user the repository URL
and that Repo Forge's guards also run on every future commit.
