# Documentation Directory

This directory contains structured project documentation organized into purpose-specific subdirectories.

## Structure

- `.references/` — Normative reference documents that govern how plans, PRDs, and work backlogs are generated
- `.templates/` — Document templates for plans, PRDs, and work backlogs
- `designs/` — Ideas, architectural decisions, and design documents
- `plans/` — Approach and rationale documents created before execution
- `prd/` — Product requirement documents
- `work/` — Prescriptive work items, backlogs, and task lists

## Agent Instructions

When managing documents in this directory:

1. Always apply the correct naming convention for the target directory before creating files.
2. Do not create files directly in `docs/` — use the appropriate subdirectory.

When generating plans, PRDs, or work backlogs:

1. Consult `docs/.references/` for the rules and workflows that govern document generation. Start with `output-contract.md` for required paths, naming, and section headings.
2. Use the matching template from `docs/.templates/` as the structural starting point for each document.
3. Read the `AGENTS.md` or `CLAUDE.md` in the target subdirectory for directory-specific conventions.