# Designs Directory

This directory contains architectural decisions and design documents.

## Purpose

Designs capture **what** was decided and **why**. They record architectural choices, interface contracts, and implementation approaches along with the alternatives that were considered and rejected.

## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-03-04-authentication-flow.md`

## Required Sections (for generated designs)

> IMPORTANT: User-generated design documents may exist in this directory that might not conform to the following structure. However, agents MUST conform to the following structure when generating design documents. DO NOT force this structure when UPDATING a USER-GENERATED design document, unless asked.

- `## Purpose` — What decision this document captures.
- `## Context` — Problem, constraints, and forces.
- `## Decision` — The chosen approach.
- `## Alternatives Considered` — Other approaches and why rejected.
- `## Consequences` — Outcomes, trade-offs, and risks.

## References and Templates

- There is no design template in `docs/.templates/`. Use the required sections above as the structural guide.
- Design documents are not governed by `docs/.references/output-contract.md`. That contract applies to plans, PRDs, and work backlogs.
- If a design informs a plan, PRD set, or work backlog, link to it from those documents rather than duplicating content.

## Agent Instructions

- Always apply date-slug naming.
- Do not backdate designs — use today's date.
- Designs are living documents — update them when decisions change.
- Link to related plans, PRD docs, or work items where relevant.