# References Directory

This directory contains normative references that govern how agents plan, execute, and validate document generation workflows.

## Purpose

Reference documents define **rules and workflows** — they are not templates and not outputs. Agents should consult these files before and during plan creation, PRD generation, and work backlog generation to ensure consistent, contract-compliant results.

## Files

- `output-contract.md` — Required paths, naming rules, section contracts, and structural constraints for all generated plan, PRD, and work documents.
- `planning-workflow.md` — Step-by-step workflow for producing a reviewable plan before execution begins.
- `execution-workflow.md` — Step-by-step workflow for generating an approved PRD set and work backlog.
- `harness-capability-matrix.md` — Environment capability detection and safe defaults for MCP access and agent delegation.

## Agent Instructions

- Read `output-contract.md` before generating or validating any document to confirm required paths, headings, and structural rules.
- Read the relevant workflow (`planning-workflow.md` or `execution-workflow.md`) before starting that phase.
- Consult `harness-capability-matrix.md` when determining delegation tier or MCP availability.
- Do not modify files in this directory unless explicitly asked to update a reference.