# Planning Workflow

## Purpose

Use this workflow to produce a reviewable decomposition plan before generating documentation. Planning mode exists to lock the output structure, workstream boundaries, and validation approach before the repo is mutated.

## Preflight

Inspect the repo root, current doc folders, any existing decomposition artifacts, and whether `docs/prd/` already contains active content outside `docs/prd/archive/`.

## Planning Goals

Produce a plan that makes the execution step decision-complete. The plan should settle:

- the doc tree shape
- the fixed core docs plus adaptive docs
- whether execution will require archiving an existing active PRD set
- the delegation tier and workstream split for execution
- the coordinator role and write scope
- the backlog placement under `docs/work`
- the validation pass and any follow-up review

## User Preference Questions

Ask the user only when the answer affects the output shape or execution style. Typical planning questions include:

- whether a large subsystem should split into a numbered folder
- whether reference-style docs should stay separate from subsystem docs
- whether the backlog should remain one file or move into a dated folder
- whether the user explicitly wants to forbid delegation and force single-agent execution despite the default

Do not ask questions that can be answered by repo inspection.

## Plan Structure

Start from `docs/.templates/prd-plan.md` and fill it with:

- repo summary
- output contract
- existing PRD handling
- coordinator policy and delegation tier
- adaptive document catalog
- worker ownership, write scopes, and dependencies
- MCP strategy and fallback strategy
- validation and review steps

## File Writing Rule

Planning mode should present the plan in chat first. Write `docs/plans/YYYY-MM-DD-prd-plan.md` only after the user approves the plan or explicitly asks for the file.

## Approval Prompt Rule

After presenting the plan, separate the two user decisions:

- whether to save the plan file
- whether to start execution now

Do not imply that approving the plan automatically authorizes execution. Use compact wording that makes the choice explicit, such as:

- approve and save the plan only
- approve, save the plan, and start execution

If the user approves the plan without explicitly choosing execution, default to saving the plan only and stop.

## Workstream Rules

- Design workstreams to be delegation-ready first, not single-agent first.
- For context-heavy repos, prefer using the same delegation ladder during planning if the harness supports it: parallel agents, then subagents, then single-agent fallback.
- If delegation is available, the coordinator write scope is `none`.
- Assign every output-writing task to a worker, including shared docs such as `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md`, and the rebuild backlog.
- Reserve a dedicated assembly worker for shared docs and a dedicated validation/fix worker for contract cleanup when the harness can support them.
- Describe workstreams, dependencies, and merge order.
- Do not hard-code Agent A, Agent B, or panel-specific assignments in the saved plan.
- Keep scopes disjoint so an execution harness can parallelize safely.
- The coordinator should never appear as the owner of document-writing tasks when delegation is available.

## Flat vs Nested Decision

Use a flat PRD tree when:

- the repo is small or medium
- the subsystem count is manageable
- one file per subsystem remains readable

Use a numbered subfolder when:

- a subsystem would become too large for one doc
- the repo has strong backend/frontend or service/domain boundaries
- a deep subsystem needs multiple docs but still needs one top-level number

## Handoff to Execution

Before leaving planning mode, make the execution prerequisites explicit:

- approved plan exists
- the user has not necessarily approved execution yet
- MCP availability has been confirmed or fallback is accepted
- target output paths are fixed
- execution should use the delegation ladder by default: parallel agents, then subagents, then single-agent fallback
- if delegation is available, the coordinator write scope is `none`
- if `docs/prd/` already has active content, archival approval is required before execution can write the new PRD set
- workstreams are disjoint
- validation step is mandatory
