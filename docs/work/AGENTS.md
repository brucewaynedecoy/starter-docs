# Work Directory

This directory contains prescriptive work items, backlogs, and task lists.

## Purpose

Work documents are **prescriptive** — they describe what to do, not what exists. They contain phases, stages, task lists, acceptance criteria, and dependency information. "Stages" are the work item unit of measurement.

## Naming Convention

Files must use the pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date.
- The slug is lowercase with hyphens separating words.
- No special characters, spaces, or underscores.
- Example: `2026-03-25-rebuild-backlog.md`

If a backlog is too large for one file, migrate it to `YYYY-MM-DD-<slug>/` and create an index plus ordered phase files inside.

## Required Sections

Every work document must include these headings:

- `## Purpose` — What work this document prescribes and why.
- `## Phase <phase number> - <phase name>` — Heading for each phase included in this document.
- `### Overview` — What work is to be performed in the phase.
- `### Stage <stage number> - <stage name>` — Heading for each stage within a phase.
- `#### Tasks` — Numbered list of tasks to complete for the stage.
- `#### Acceptance Criteria` — Checkable criteria for completion of the stage.
- `#### Dependencies` — Prerequisites or related work items for the stage.

There must be at least one phase in each work document and at least one stage per phase.

## Templates

Use the templates in `docs/.templates/` when creating work documents:

- `work-backlog.md` — Single-file backlog.
- `work-backlog-index.md` — Index for a split backlog.
- `work-backlog-phase.md` — Individual phase file for a split backlog.

## References

Before generating or validating work documents, consult these files in `docs/.references/`:

- `output-contract.md` — Required paths, section headings, and structural rules for work backlogs.
- `execution-workflow.md` — Step-by-step workflow that governs backlog generation during execution.

## Agent Instructions

- Use the appropriate template from `docs/.templates/` when creating new work documents.
- Validate required paths and headings against `docs/.references/output-contract.md`.
- Always apply the date-slug naming convention.
- Keep work out of `docs/prd/` — link backlog phases back to relevant PRD docs instead.
- Organize backlog phases by dependency order, not by implementation convenience.