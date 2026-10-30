# Guardrails — <project name>

> Hard rules. "Must never / must always." These are protected by the Repo Forge
> lock; change only via `/repo-forge:change`.

1. Code, comments, identifiers, commit messages and documents are in **English**.
   Communication/chat is in the user's language.
2. Respect existing patterns strictly. Do not add a second way to do something
   that already has a convention in this repo.
3. Secrets (credentials, tokens, connection strings) live **only** in `.env`,
   which is git-ignored. Commit `.env.example` with placeholder keys. Never
   hard-code a secret.
4. Do not edit locked constitution files directly — use `/repo-forge:change`.
5. No direct commits to the default branch; use feature branches and review.
6. <stack-specific must-never, e.g. "No raw SQL outside the repository layer.">
7. <stack-specific must-always, e.g. "Every API response is typed.">
8. <...>

<Keep these concrete and checkable. Add the structural rules that define the
 project's shape.>
