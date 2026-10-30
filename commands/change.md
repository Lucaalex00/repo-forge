---
description: Safely change a locked Repo Forge constitution file via an ADR, approval, and a temporary unlock window.
argument-hint: "[what you want to change]"
---

# Repo Forge — Change a Locked Decision

Locked constitution files (see `.repoforge/locked.json`) cannot be edited
directly — the `guard-locked` hook blocks it. This command is the **only**
sanctioned way to change them.

Requested change: `$ARGUMENTS`

Follow this procedure exactly:

1. **Confirm the target.** Identify which locked file(s) the change touches.
   Read them first. If the change does not actually require editing a locked
   file, do it normally and stop here.

2. **Write an ADR.** Create the next `docs/adr/NNNN-*.md` (Architecture
   Decision Record) describing: context, the decision, considered
   alternatives, and consequences. The ADR itself is a new file, so it is not
   blocked.

3. **Get explicit approval.** Show the ADR and the exact diff you intend to
   apply to the locked file(s). Ask the user to approve in plain words. Do not
   proceed on a vague answer.

4. **Open a temporary unlock window.** After approval, create
   `.repoforge/unlock.json`:

   ```json
   {
     "expiresAt": "<ISO-8601 timestamp 10 minutes from now>",
     "paths": ["<relative path(s) being changed>"],
     "reason": "<short reason>",
     "adr": "docs/adr/NNNN-*.md"
   }
   ```

   Compute `expiresAt` as now + 10 minutes in UTC ISO-8601
   (e.g. `2026-01-01T12:34:56Z`). Scope `paths` to only the files being
   changed. `unlock.json` is git-ignored and machine-local.

5. **Apply the change** to the locked file(s) and update `CHANGELOG.md`.

6. **Re-lock.** Delete `.repoforge/unlock.json` so the guard is active again.
   Confirm to the user what changed and that the structure is locked again.

Never widen the unlock beyond the approved files, and never leave an unlock
token in place after the change.
