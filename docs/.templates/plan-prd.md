# PRD Generation Plan

**Date:** {{DATE}}
**Repository:** `{{REPO_ROOT}}`
**Purpose:** Produce a reviewable plan for translating a new idea or design into a structured PRD set and implementation backlog.

## Objective

State what the PRD set should capture, who the outputs are for, and what counts as completion. Identify whether the target is a greenfield project or an addition to an existing codebase.

## Design Inputs

List every source of truth that feeds into PRD generation. Each entry should note its format, location, and confidence level (authoritative, draft, exploratory).

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| {{INPUT_NAME}} | {{FORMAT}} | {{LOCATION}} | {{CONFIDENCE}} |

Open questions or ambiguities in the inputs should be captured here and promoted into `03-open-questions-and-risk-register.md` during execution.

## Existing Codebase Context

- Codebase status: {{CODEBASE_STATUS}} <!-- greenfield | existing-active | existing-legacy -->
- Integration constraints: {{INTEGRATION_CONSTRAINTS}} <!-- e.g., must use existing auth module, must preserve current API surface -->
- Discovery pass required: {{DISCOVERY_REQUIRED}} <!-- yes | no — whether workers need to audit existing code before writing PRDs -->
- Discovery scope if required: {{DISCOVERY_SCOPE}}

## Output Contract

- Plan file: `docs/plans/{{DATE}}-prd-plan.md`
- PRD core:
  - `docs/prd/00-index.md`
  - `docs/prd/01-product-overview.md`
  - `docs/prd/02-architecture-overview.md`
  - `docs/prd/03-open-questions-and-risk-register.md`
  - `docs/prd/04-glossary.md`
  - adaptive numbered feature/subsystem docs starting at `05-*`
- Implementation work:
  - `docs/work/{{DATE}}-implementation-backlog.md`
  - or `docs/work/{{DATE}}-implementation-backlog/` if the backlog must split

## Existing PRD Handling

- Active `docs/prd/` status: {{ACTIVE_PRD_STATUS}}
- Archive step required before execution: {{ARCHIVE_REQUIRED}}
- Planned archive target if approved: `{{ARCHIVE_TARGET}}`
- Active root entries to archive: {{ARCHIVE_ENTRIES}}

## Coordinator Policy

- Highest intended delegation tier: {{DELEGATION_TIER}}
- Coordinator role: `coordination only`
- Coordinator write scope: `none` when delegation is available
- Coordinator responsibilities: preflight, approvals, routing, worker spawning, progress tracking, blocker handling, final status reporting

## Scope & Phasing

Describe how the idea should be decomposed into implementable phases. Each phase should be self-contained enough to ship or validate independently.

- Phasing strategy: {{PHASING_STRATEGY}} <!-- single-phase | incremental | mvp-then-iterate -->
- Phase boundaries driven by: {{PHASE_DRIVERS}} <!-- user value | technical dependency | risk reduction | stakeholder milestones -->

If phases are known at plan time, list them:

| Phase | Summary | Key Deliverables | Dependencies |
| ----- | ------- | ---------------- | ------------ |
| {{PHASE_ID}} | {{SUMMARY}} | {{DELIVERABLES}} | {{DEPENDENCIES}} |

If phases are not yet known, note that a scoping worker should derive them from the design inputs before feature PRD writing begins.

## Proposed Catalog

List the fixed core docs plus the adaptive feature/subsystem docs anticipated from the design inputs. Explain whether the tree should stay flat or use numbered subfolders.

Core docs are always produced. Adaptive docs should map to distinct features, subsystems, or integration surfaces identified in the design inputs. Each adaptive doc should be scoped narrowly enough that a single worker can own it.

## Worker Ownership

List the delegated workers, their scopes, write scopes, dependencies, and deliverables.

- Assign every output-writing task to a worker when delegation is available.
- Include a scoping/discovery worker if the existing codebase requires audit before PRD writing.
- Include a dedicated shared-doc assembly worker for `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md`, and the implementation backlog.
- Include a dedicated validation/fix worker when the harness can support it.
- The coordinator should not appear as the owner of any document-writing task when delegation is available.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| {{WORKER_NAME}} | {{SCOPE}} | {{WRITE_SCOPE}} | {{DEPENDENCIES}} | {{DELIVERABLES}} |

## MCP Strategy

- Preferred servers available: {{MCP_STATUS}}
- Fallback plan if unavailable: {{FALLBACK_PLAN}}

## Acceptance Criteria Guidance

Describe how workers should derive acceptance criteria within each PRD. Criteria should be traceable back to design inputs and testable at implementation time.

- Criteria style: {{CRITERIA_STYLE}} <!-- given-when-then | checklist | user-story-driven -->
- Non-functional requirements to address in every feature PRD: {{NFR_CHECKLIST}} <!-- e.g., performance, accessibility, security, observability -->

## Validation

Explain how the execution step will validate the generated outputs. Validation should confirm:

- Every design input is accounted for in at least one PRD.
- Every adaptive PRD traces back to a design input or a discovered integration need.
- The implementation backlog covers all PRDs with no orphaned or unreachable items.
- Open questions are captured and none block backlog generation without explicit acknowledgment.
- Cross-references between docs are consistent and resolvable.

Describe which review pass happens at the end and who approves the final output set.