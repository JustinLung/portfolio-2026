# Portfolio 2026 specifications

This directory is the source of truth for product intent, architecture, implementation standards,
and project decisions. Code should implement an approved specification; a specification should not
be rewritten afterward merely to match the code.

## Structure

- [`00_meta/project-context.md`](00_meta/project-context.md) — goals, principles, vocabulary, and
  specification states.
- [`01_architecture/system-architecture.md`](01_architecture/system-architecture.md) — application
  boundaries, routes, data flow, and technical constraints.
- [`02_coding_standards/frontend-standards.md`](02_coding_standards/frontend-standards.md) — Svelte,
  CSS, motion, accessibility, and quality conventions.
- [`03_business_domain/portfolio-domain.md`](03_business_domain/portfolio-domain.md) — users,
  content model, and business rules.
- [`04_workflows/spec-driven-development.md`](04_workflows/spec-driven-development.md) — the
  required feature workflow and quality gates.
- [`04_workflows/feature-spec-template.md`](04_workflows/feature-spec-template.md) — copy this for
  each new feature.
- [`05_project_memory/decision-log.md`](05_project_memory/decision-log.md) — durable architectural
  and product decisions (ADR-001 through ADR-012).

## Working agreement

1. Create a feature spec from the template before changing implementation code.
2. Mark assumptions and unresolved questions explicitly; do not silently turn them into behavior.
3. Review the user experience, responsive behavior, motion, accessibility, data states, and
   acceptance criteria.
4. Implement only the approved scope.
5. Verify every acceptance criterion and run the repository quality gates.
6. Update architecture, domain rules, or the decision log when the feature changes a lasting
   project contract.

## Feature spec location

Put active and completed feature specs in `specs/features/` using:

```text
YYYY-MM-DD-kebab-case-feature.md
```

Each spec moves through `Draft → Ready → In progress → Verified`. A spec is **Ready** only when its
acceptance criteria are observable and its unresolved questions no longer block implementation.
