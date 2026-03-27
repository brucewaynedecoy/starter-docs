# Prompts Directory

This directory contains reusable prompt templates for common documentation workflows.

## Purpose

Prompt files are optional starting points for recurring tasks. They help users invoke a workflow consistently, but they do not replace the normative rules in `docs/.references/`, they are not document templates, and they are not generated outputs.

## Files

- `designs-to-plan.prompt.md` — Prompt for turning one or more design docs into a plan.
- `plan-to-prd-green-field.prompt.md` — Prompt for generating a PRD set from an approved green-field plan.
- `prd-to-work-full-prd.prompt.md` — Prompt for generating a full implementation backlog from the active PRD set.
- `prd-to-work-prd-feature.prompt.md` — Prompt for generating work for a specific feature or subset of the PRD.
- `update-readme-green-field.prompt.md` — Prompt for updating a project README from design docs and a plan.

## Agent Instructions

- Use these files only when the user wants a reusable prompt template or wants to kick off a workflow from a stored prompt.
- Keep placeholder tokens such as `{{PLAN DOC}}` and `{{DESIGN DOCS}}` explicit unless the user asks you to instantiate them.
- When executing a prompt from this directory, follow the authoritative instructions in `docs/.references/`, use the relevant file from `docs/.templates/`, and then read the `AGENTS.md` or `CLAUDE.md` in the target output directory.
- Do not treat prompt files as output document templates.
- Do not write generated plans, PRDs, work backlogs, or designs into this directory.
