---
name: repo-interview
description: Deep 7-block intake interview for a new web repository (vision, features, non-functional requirements, constraints, repo layout, stack preferences, working rules). Use at the start of /repo-forge:new-repo, or whenever the user wants to define a new project from scratch.
---

# Repo Interview

Conduct a structured, friendly interview. Ask in the user's language. One block
at a time; summarize each block back before moving on. Offer sensible defaults
so a non-technical user can answer "I don't know, you decide" and still get a
good result — but record every assumption you make so it surfaces in the Brief.

Keep it tight: ask the few questions that matter, not a questionnaire. Prefer
concrete examples over jargon.

## Block 1 — Vision (hard gate)

Ask the user to describe what they want to build and for whom. You need a
vision description of **at least 50 words**. If the answer is shorter or vague,
ask follow-up questions (who uses it, what problem it solves, what success looks
like, one example user journey) and help them reach 50 words. **Do not continue
to Block 2 until the 50-word gate is met.** Count the words and tell the user
when the gate is satisfied.

## Block 2 — Features

What must the product do? Capture a prioritized list: must-have vs nice-to-have.
Probe for the obvious ones the user forgot (auth? admin? search? payments?
notifications? file upload? i18n? public vs private content?). For the bakery
example: menu, bookings/reservations, contact, gallery, opening hours, admin to
manage bookings.

Also capture, briefly:
- **Core data / entities** — the main things the app stores and how they relate
  (e.g. Booking → Customer, Product). This drives the database and stack choice.
- **Third-party integrations** — payments (Stripe…), email/SMS, maps, auth
  providers, analytics, CMS. Each integration usually needs an API key, which
  will go in `.env`; note them now so the scaffolder and `.env.example` include
  them.

## Block 3 — Non-functional requirements

Expected traffic/scale, performance expectations, availability, SEO needs,
accessibility target, security/privacy (personal data? GDPR?), devices (mobile
first?), offline needs, i18n/languages, analytics. Give defaults for a small
project (e.g. "a few hundred visits/day, SEO matters, mobile-first, WCAG AA").

## Block 4 — Constraints

Budget, hosting preferences or limits, deadline, team size and skill level,
existing accounts/services, must-use or must-avoid technologies, licensing,
data residency, compliance. Record anything that rules a technology in or out.

## Block 5 — Repo layout (always the user's choice)

Present the real options plainly and let the user choose (with a recommended
default):
- **Monorepo** (one repo, FE + BE + shared) **vs separate repos**.
- **Docs location**: repository root / under the frontend / under the backend /
  a dedicated docs repo.
- **Database scripts location**: inside the backend / a separate `database/`
  folder.
Explain the trade-off in one sentence each. Never silently pick for them.

## Block 6 — Stack preferences

Any preferences or allergies for Frontend, Backend, Database, hosting? Does the
user want a single full-stack framework (e.g. Next.js, Laravel) instead of a
separate backend? Experience level with each? If the user has no preference,
say so and let `stack-advisor` decide with justification.

## Block 7 — Working rules

How should the project be worked on? Language for code/docs/commits (default:
English for all artifacts, chat in the user's language), branching model,
testing expectations, review process, commit style, CI, who can change the
architecture. These feed `rules-advisor`.

## Output of this skill

A compact structured summary (not a transcript) of all 7 blocks, with every
default/assumption clearly marked, ready to hand to `stack-advisor`,
`rules-advisor` and `workflow-advisor`.
