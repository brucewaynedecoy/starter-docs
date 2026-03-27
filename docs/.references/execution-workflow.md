# Execution Workflow

## Purpose

Use this workflow to generate the approved PRD set and work backlog in a consistent way. Execution mode is allowed only after the user explicitly authorizes execution, either after plan approval or as direct execution from the start.

## Preconditions

Execution mode requires one of:

- an approved plan plus an explicit instruction to execute it
- a direct user instruction that explicitly authorizes immediate execution

If neither exists, switch back to planning mode.

## Preflight

1. Determine the highest usable delegation tier for the current session: parallel agents, then subagents, then single-agent fallback.
2. Re-check existing docs so you avoid duplicating or clobbering useful material.
3. Inspect `docs/prd/` and determine whether active root entries already exist outside `archive/`.

## Delegation Ladder

- PRD generation is delegation-first by default because this workflow is highly context-intensive.
- Use this priority order:
  1. parallel agents
  2. subagents
  3. single-agent fallback
- If the harness likely supports delegation, decide the workstream split and spawn workers before broad repo analysis or document drafting by the coordinator.
- If delegation is available, the coordinator write scope is `none`.
- The coordinating agent must not draft PRD docs, create backlog files, fill shared docs, run assembly sweeps, or perform fix-up edits when those tasks can be delegated.
- Any task that creates or edits output files must be assigned to a worker whenever delegation is available.
- Single-agent execution is the fallback only when the harness or session policy does not permit delegation.

## Coordinator Role

If delegation is available, the coordinator is limited to:

- capability and preflight checks
- approval handling
- workstream definition and task routing
- worker spawning and monitoring
- blocker resolution and reassignment
- final user-facing status reporting

If delegation is available, the coordinator must not:

- author PRD docs
- author backlog docs
- own shared-doc assembly
- merge glossary or risk-register content itself
- run validator-driven document fixes itself
- perform broad deep-dive reads that belong to a worker's authoring scope

## Active PRD Gate

- Treat `docs/prd/` as a single active PRD namespace.
- If root entries already exist outside `docs/prd/archive/`, summarize them and ask for approval before moving them.
- On approval, archive every root entry except `archive/` into `docs/prd/archive/YYYY-MM-DD/` or `docs/prd/archive/YYYY-MM-DD-XX/`.
- Include stray or hidden root entries in the archive summary and move set when they are part of the active namespace.
- If archival is declined, stop before writing anything into `docs/prd/`.
- Treat archived PRD sets as historical records, not active output targets.

## Writing Order

Use this order to reduce churn:

1. Determine the delegation tier and spawn workstreams if supported.
2. Resolve the active-PRD archive gate if one is required.
3. Determine the final PRD catalog shape.
4. Route domain and subsystem docs to delegated workers.
5. Route shared-doc assembly for `00-index.md`, `03-open-questions-and-risk-register.md`, `04-glossary.md`, and the backlog to a dedicated worker.
6. Route contract validation and fix-up work to a dedicated validation worker.
7. Keep the coordinator focused on status, blockers, and final reporting.

## Parallelization Rules

If the harness supports delegated workers, do not postpone delegation until the coordinator has already consumed most of its context budget.

- Prefer multiple concurrent workers when the harness supports parallel agents.
- If the harness does not support concurrent workers but does support delegated workers, use subagents before falling back to single-agent execution.
- Split work by subsystem or document family.
- Keep write scopes disjoint.
- Reserve final assembly, cross-linking, and validation for delegated workers, not the coordinator.
- Tell each spawned agent to build its own MCP indexes in its own session before deep analysis.

## Existing Documentation Rule

- Supplement and cite useful existing docs.
- Do not silently overwrite docs that serve another audience or purpose.
- If existing docs drift from the code, record the drift in `03-open-questions-and-risk-register.md`.
- If an older active PRD set already exists under `docs/prd/`, archive it before writing the replacement active PRD set.

## Backlog Rules

- Write the rebuild backlog to `docs/work/YYYY-MM-DD-{{PLAN NAME}}-backlog.md` by default.
- Split into `docs/work/YYYY-MM-DD-{{PLAN NAME}}-backlog/` only when one file becomes too large to navigate.
- Keep backlog phases dependency-ordered.
- Include task-level acceptance criteria in every phase.

## Final Validation

Before closing the task:

1. Resolve broken links, missing core docs, missing required headings, or misplaced backlog files.
2. Confirm the PRD index reflects the final catalog.
3. Confirm the backlog links to the relevant PRD docs.
