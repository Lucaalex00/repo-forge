# Architecture — <project name>

> Stable by design. Change only via `/repo-forge:change` (ADR + approval).

## Overview
<One paragraph: what the system is and how the pieces fit.>

## Stack
| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | <...> | <...> |
| Backend | <... / none> | <...> |
| Database | <SQLite default> | <ORM; swappable> |
| Hosting | <...> | <...> |

## Repository layout
```
<tree of the actual chosen layout: monorepo or separate repos,
 docs location, database scripts location>
```

## Data flow
<How a request flows: client → API → data layer → DB, and back. Auth path.>

## Boundaries & modules
<Key modules and the rules about what may import what.>

## Environments & configuration
- Config via `.env` (never committed). `.env.example` lists required keys.
- Environments: <dev / staging / prod> and how they differ.

## Decisions of record
<Link the ADRs in docs/adr/ that shaped this architecture.>
