# PRD Directory

This directory contains product requirement documents that describe what the product is and how it works.

## Purpose

PRDs are **descriptive** — they document what the product is and how it works. A PRD set may describe an existing codebase (via decomposition) or define what should be built (via forward-planning from a new idea or design).

## Naming Convention

Files must use the pattern: `NN-<slug>.md`

- NN is a zero-padded two-digit number.
- Fixed core: `00-index.md`, `01-product-overview.md`, `02-architecture-overview.md`, `03-open-questions-and-risk-register.md`, `04-glossary.md`.
- Adaptive docs start at `05` and go up to `99`.
- Example: `05-feature-map.md`

## Management

- Only one active PRD set exists at a time under `docs/prd/`.
- Older PRD sets are archived under `docs/prd/archive/YYYY-MM-DD/`.

## PRD Template Files

Use the following templates from `docs/.templates/` when generating PRD documents:

### Fixed Core

- `00-index.md` — use `docs/.templates/prd-index.md`
- `01-product-overview.md` — use `docs/.templates/prd-overview.md`
- `02-architecture-overview.md` — use `docs/.templates/prd-architecture.md`
- `03-open-questions-and-risk-register.md` — use `docs/.templates/prd-risk-register.md`
- `04-glossary.md` — use `docs/.templates/prd-glossary.md`

### Adaptive

- **Subsystem doc** — use `docs/.templates/prd-subsystem.md`
- **Reference doc** — use `docs/.templates/prd-reference.md`

## Reference Documents

Before generating or validating PRD documents, consult:

- `docs/.references/output-contract.md` — required paths, section headings, PRD tree rules, and archive rules.
- `docs/.references/execution-workflow.md` — step-by-step workflow for generating an approved PRD set.

## Agent Instructions

- Do not independently author full PRD sets — plan it and then orchestrate one or more teams of agents to generate the individual PRD docs in the set.
- When creating a stub PRD doc, auto-increment the NN prefix from the highest existing number.
- Validate generated PRD documents against the section contracts in `docs/.references/output-contract.md`.