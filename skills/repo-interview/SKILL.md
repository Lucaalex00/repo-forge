---
name: repo-interview
user-invocable: false
description: Deep intake interview for a new web repository, with two paths — Beginner ("decide for me", mostly fixed-choice questions) and Expert ("I drive", open questions) — covering vision, features, non-functional requirements, constraints, repo layout, stack preferences and working rules. Use at the start of /repo-forge:new-repo, or whenever the user wants to define a new project from scratch.
---

# Repo Interview

Conduct a structured, friendly interview in the user's language. Summarize each
step back before moving on. Record every assumption you make so it surfaces in
the Brief.

## Block 0 — Choose the path (ask this first)

Ask one fixed-choice question:

> **How do you want to do this?**
> 1. **Beginner — "decide for me"**: I ask only the essentials in plain language
>    and choose sensible defaults; you just confirm.
> 2. **Expert — "I drive"**: open questions, you control the stack, versions and
>    layout directly.
> 3. **In between**: start simple, I ask more only where it matters.

The `/repo-forge:new-repo` command may pass `beginner` or `expert` as an
argument — if so, skip this question and use that path. You can switch paths
mid-interview if the user's answers suggest it (e.g. a "beginner" who clearly
knows the stack).

### Question-style rule (both paths)

- Use **fixed-choice** questions when the answer space is small and standard, or
  the user is a beginner. Always mark a **recommended default** and let the user
  accept it with a single word.
- Use **open** questions for genuinely project-specific things, or when the user
  is an expert and wants control.
- Never ask something the previous answers already settle. Keep momentum.

---

## Block 1 — Vision (hard gate, both paths)

Ask the user to describe what they want to build and for whom. You need a vision
description of **at least 50 words**. This gate applies to **everyone**,
beginner or expert. If the answer is shorter or vague, ask plain follow-ups (who
uses it, what problem it solves, what success looks like, one example journey)
and help them reach 50 words. Count the words and confirm when the gate is met.
**Do not continue until the 50-word gate is satisfied.**

---

## Beginner path (express)

Keep it to a handful of **fixed-choice** questions, each with a recommended
default the user can accept instantly. Do not use jargon. Infer everything
technical and put it in the Brief for confirmation.

Ask roughly these, adapting to the vision:
1. **What kind of site is it?** (marketing/brochure · shop · booking/reservations
   · web app/dashboard · blog/content) — pick the closest.
2. **Do people log in?** (no · yes, customers · yes, just an admin) *[default: just an admin]*
3. **Does it take payments?** (no · yes) *[default: no]*
4. **Who manages the content?** (just me · a small team) *[default: just me]*
5. **Roughly how big?** (small/personal · growing · unsure) *[default: unsure → start small]*

From these, **decide automatically** (and record the reason in the Brief):
- Stack, via `stack-advisor` (default DB: SQLite).
- Layout: **monorepo**, **docs at the repository root**, **DB scripts inside the
  backend** — but still show this as a one-line "is that OK?" choice.
- Rules and workflow: the default profile, trimmed to what the project needs.

Then go straight to the Project Brief. The beginner should answer ~6 short
questions total and get a complete, justified plan.

---

## Expert path (full control)

Ask the 7 blocks below as **open** questions, terse. Accept direct specifications
(frameworks, exact versions, hosting, monorepo tool, package manager) and honor
them; only fill gaps with defaults, and say when you do.

### Block 2 — Features
Prioritized must-have vs nice-to-have. Probe for the ones often forgotten (auth,
admin, search, payments, notifications, file upload, i18n, public vs private).
Also capture briefly:
- **Core data / entities** and how they relate (drives DB + stack).
- **Third-party integrations** (payments, email/SMS, maps, auth, analytics, CMS)
  — each usually needs an API key that goes in `.env`; note them for
  `.env.example`.

### Block 3 — Non-functional requirements
Scale/traffic, performance, availability, SEO, accessibility target (default
WCAG 2.1 AA), security/privacy (personal data? GDPR?), devices (mobile-first?),
offline, i18n, analytics.

### Block 4 — Constraints
Budget, hosting preferences/limits, deadline, team size and skill, existing
accounts/services, must-use or must-avoid technologies, licensing, data
residency, compliance.

### Block 5 — Repo layout (always the user's explicit choice)
- **Monorepo** vs **separate repos**.
- **Docs location**: root / under frontend / under backend / dedicated docs repo.
- **DB scripts location**: inside the backend / separate `database/` folder.
Explain each trade-off in one sentence. Never pick silently for an expert.

### Block 6 — Stack preferences
Preferences/allergies for Frontend, Backend, Database, hosting. Full-stack
single framework (Next.js, Nuxt, SvelteKit, Laravel, Django) vs separate
backend? Experience level with each? Exact versions if they care.

### Block 7 — Working rules
Language for code/docs/commits (default: English artifacts, chat in the user's
language), branching model, testing expectations, review process, commit style,
CI, who may change the architecture.

---

## Output of this skill

A compact structured summary (not a transcript) of the decisions, tagged with
the chosen **path** and with every default/assumption clearly marked, ready for
`stack-advisor`, `rules-advisor` and `workflow-advisor`.
