# Plans Directory

This directory contains approach and rationale documents created before execution begins.

## Purpose

Plans describe **why** an approach was chosen and **how** it will be carried out. Plans are reviewed and approved before execution. They capture the reasoning behind decisions so that execution is decision-complete.

## Naming Convention

Files must use the pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- The slug is lowercase with hyphens separating words.
- No special characters, spaces, or underscores.
- Example: `2026-03-25-migration-strategy.md`

## Required Sections

Every plan must include these headings:

- `## Purpose` — What the plan covers and why.
- `## Objective` — Concrete goals and completion criteria.
- `## Approach` — Proposed approach and trade-offs.
- `## Validation` — How success will be verified.

## Templates

Use the appropriate plan template from `docs/.templates/`:

- `plan-prd-decompose.md` — For plans that reverse-engineer an existing codebase into a PRD set and rebuild backlog.
- `plan-prd.md` — For plans that generate a PRD set and implementation backlog from a new idea or design.

## References

Before creating a plan, consult these files in `docs/.references/`:

- `planning-workflow.md` — Step-by-step workflow to follow when producing a reviewable plan.
- `output-contract.md` — Required paths, naming rules, and structural constraints that the plan and its outputs must satisfy.
- `harness-capability-matrix.md` — Use when determining delegation tier or MCP availability for the plan.

## Agent Instructions

- Always apply the date-slug naming convention.
- Do not backdate plans — use today's date.
- Plans should be created before execution work begins, not retroactively.
- Read `docs/.references/planning-workflow.md` before starting a new plan.
- Use the matching template from `docs/.templates/` as the structural starting point.