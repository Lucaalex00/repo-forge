# 1. Record architecture decisions

- Status: accepted
- Date: <YYYY-MM-DD>

## Context
We want the significant decisions behind this repository to be written down, so
the structure stays intentional and does not drift. Repo Forge locks the
constitution documents; changes to them go through an ADR.

## Decision
We will use Architecture Decision Records (ADRs), stored in `docs/adr/`, one
Markdown file per decision, numbered sequentially. Each `/repo-forge:change`
produces a new ADR before a locked file is edited.

## Consequences
- Every structural change has a rationale on record.
- New contributors can read `docs/adr/` to understand why things are the way
  they are.
- The lock + ADR flow adds a small, deliberate amount of friction to structural
  changes — which is the point.
