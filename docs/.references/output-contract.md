# Output Contract

## Purpose

Use this contract to keep plan, PRD, and work document outputs consistent across repositories and harnesses. Treat the codebase as authoritative, write in plain English, and keep the PRD set descriptive while keeping rebuild work prescriptive.

## Required Paths

| Artifact | Required path |
| --- | --- |
| PRD plan | `docs/plans/YYYY-MM-DD-{{PLAN NAME}}.md` |
| PRD index | `docs/prd/00-index.md` |
| Product overview | `docs/prd/01-product-overview.md` |
| Architecture overview | `docs/prd/02-architecture-overview.md` |
| Risk register | `docs/prd/03-open-questions-and-risk-register.md` |
| Glossary | `docs/prd/04-glossary.md` |
| Work backlog | `docs/work/YYYY-MM-DD-{{PLAN NAME}}-backlog.md` |
| Archived PRD set | `docs/prd/archive/YYYY-MM-DD/` or `docs/prd/archive/YYYY-MM-DD-XX/` |

If the work backlog becomes too large for one file, migrate it to `docs/work/YYYY-MM-DD-{{PLAN NAME}}-backlog/` and create:

- `docs/work/YYYY-MM-DD-{{PLAN NAME}}-backlog/00-index.md`
- ordered phase files such as `01-foundation.md`, `02-core-platform.md`, `03-integrations.md`

## PRD Lifecycle Rules

- `docs/prd/` contains one active PRD set only.
- Every root entry in `docs/prd/` except the `archive/` directory is part of the active PRD namespace.
- Older PRD sets belong under `docs/prd/archive/`, not alongside the active PRD set.
- Archived PRD sets are historical records and are not part of active PRD validation.

## Archive Rules

- Before writing a fresh PRD set, inspect `docs/prd/` for active root entries outside `archive/`.
- If no such entries exist, proceed normally.
- If active root entries exist, summarize them and ask for explicit approval before moving them.
- On approval, move those entries into `docs/prd/archive/YYYY-MM-DD/`.
- If that dated directory already exists, use `docs/prd/archive/YYYY-MM-DD-XX/`, where `XX` is a zero-padded increment starting at `01`.
- Do not place loose files directly under `docs/prd/archive/`; it should contain dated directories only.

## PRD Tree Rules

### Fixed core

Always generate the fixed core first or reserve its numbers:

- `00-index.md`
- `01-product-overview.md`
- `02-architecture-overview.md`
- `03-open-questions-and-risk-register.md`
- `04-glossary.md`

### Adaptive middle

Use `05` through `99` for adaptive subsystem and reference docs.

Prefer a flat PRD tree by default:

```text
docs/prd/
├── 00-index.md
├── 01-product-overview.md
├── 02-architecture-overview.md
├── 03-open-questions-and-risk-register.md
├── 04-glossary.md
├── 05-feature-capability-map.md
├── 06-data-model-reference.md
└── 07-api-reference.md
```

Switch to a numbered subfolder only when one subsystem is too large for one file:

```text
docs/prd/
├── 00-index.md
├── 01-product-overview.md
├── 02-architecture-overview.md
├── 03-open-questions-and-risk-register.md
├── 04-glossary.md
├── 05-backend/
│   ├── 01-server-core.md
│   ├── 02-handlers.md
│   └── 03-stores.md
├── 06-frontend/
│   ├── 01-app-framework.md
│   └── 02-pages.md
```

Do not place unnumbered Markdown files directly under `docs/prd/`.
Do not place active PRD docs under `docs/prd/archive/`.

## Section Contracts

Use the matching template in `docs/.templates/` and preserve these required headings.

| Doc type | Required headings |
| --- | --- |
| `prd-index.md` | `## Purpose`, `## Reading Order`, `## Document Map`, `## Source Anchors`, `## Audience Paths` |
| `prd-overview.md` | `## Purpose`, `## Users`, `## Key Capabilities`, `## System Boundaries`, `## Current Limitations`, `## Source Anchors` |
| `prd-architecture.md` | `## Purpose`, `## Topology`, `## Module Map`, `## Runtime Boundaries`, `## Data Flow`, `## Configuration Surfaces`, `## Source Anchors` |
| `prd-risk-register.md` | `## Purpose`, `## Confirmed Drift`, `## Open Questions`, `## Rebuild Risks`, `## Source Anchors` |
| `prd-glossary.md` | `## Purpose`, `## Terms`, `## Source Anchors` |
| `prd-subsystem.md` | `## Purpose`, `## Scope`, `## Component and Capability Map`, `## Contracts and Data`, `## Integrations`, `## Rebuild Notes`, `## Source Anchors` |
| `prd-reference.md` | `## Purpose`, `## Reference`, `## Source Anchors` |
| `work-backlog.md` | `## Purpose`, `## Dependency Order`, `## Phases`, `## Acceptance Criteria` |
| `work-backlog-index.md` | `## Purpose`, `## Phase Map`, `## Usage Notes` |
| `work-backlog-phase.md` | `## Purpose`, `## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}` (repeatable, each containing `### Tasks` and `### Acceptance criteria`) |

## Code Anchor Rules

### General rule

Every substantive PRD section should cite concrete repo paths in inline code. Prefer relative repo paths with optional line anchors.

Accepted examples:

- `package.json`
- `src/main.ts`
- `src/server/router.ts:42`
- `cmd/sensoroni.go:49`
- `server/modules/modules.go`

### Practical rule

Keep code anchors inside the section they support. Do not rely only on a final source list to justify claims made earlier in the document.

### Source anchors section

Use `## Source Anchors` to aggregate the most important files that shaped the document. This section supplements, but does not replace, section-level anchors.

## Existing Documentation Rule

- Supplement existing docs and cite them where useful.
- Do not silently rewrite or replace existing documentation that already serves a different audience.
- If docs and code disagree, treat the code as authoritative and record the disagreement in `03-open-questions-and-risk-register.md`.
- If an older PRD set exists in `docs/prd/`, archive it as a set before writing the new active PRD set.

## Work Backlog Rule

- Keep work out of `docs/prd/`.
- Link backlog phases back to the relevant PRD docs.
- Organize backlog phases by dependency order, not by implementation convenience.
- Include task-level acceptance criteria in every phase.

## Link Rules

- Use relative Markdown links between generated docs.
- Make sure every internal link resolves.
- Use the PRD index and backlog index as navigation entry points.
- Archived PRD docs do not need to satisfy the active PRD link contract.
