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

2. **Write an ADR.** Create the next-numbered record with the helper (it picks
   the number and slug and prints the path):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/adr.js" --dir . --title "<decision title>"
   ```

   Then fill in its Context / Decision / Alternatives / Consequences sections.
   The ADR is a new file, so it is not blocked. Use the printed path for `--adr`
   in step 4.

3. **Get explicit approval.** Show the ADR and the exact diff you intend to
   apply to the locked file(s). Ask the user to approve in plain words. Do not
   proceed on a vague answer.

4. **Open a temporary unlock window.** After approval, run the helper (it
   computes the 10-minute expiry and scopes the window deterministically — do
   not hand-write the timestamp):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/unlock.js" --dir . \
     --paths "<relative path(s) being changed, comma-separated>" \
     --minutes 10 --reason "<short reason>" --adr "docs/adr/NNNN-*.md"
   ```

   This writes `.repoforge/unlock.json` (git-ignored, machine-local), scoped to
   only the files being changed.

5. **Apply the change** to the locked file(s) and update `CHANGELOG.md`.

6. **Re-lock.** Close the window so the guard is active again:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/unlock.js" --dir . --clear
   ```

   Confirm to the user what changed and that the structure is locked again.

Never widen the unlock beyond the approved files, and never leave an unlock
token in place after the change.
