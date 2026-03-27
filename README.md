# Starter Docs

Drop-in documentation structure, templates, and AI agent instructions for any project. Copy the contents of this repo into your project to get a ready-made system for generating PRDs, implementation backlogs, architectural designs, and plans -- all with consistent naming conventions and enforced section contracts.

## What's Included

```
docs/
  .prompts/          # Reusable prompt templates for common documentation workflows
  .references/       # Normative rules: output contracts, workflows, capability matrix
  .templates/         # Reusable document templates for PRDs, plans, and backlogs
  designs/            # Architectural decisions and design rationale (ADRs)
  plans/              # Approach and strategy documents (created before execution)
  prd/                # Product requirement documents (descriptive: what the product is)
  work/               # Work backlogs and task lists (prescriptive: what to do)
CLAUDE.md             # Root agent instructions
AGENTS.md             # Root agent instructions (multi-agent compatible)
```

Each directory includes its own `CLAUDE.md` and `AGENTS.md` files with context-specific instructions for AI agents generating documentation within that directory.

The hidden support directories under `docs/` each serve a different role: `docs/.references/` contains the authoritative rules and workflows, `docs/.templates/` contains document structure starting points, and `docs/.prompts/` contains reusable prompt text for kicking off common documentation tasks.

## Quick Start

### Copy everything (except this README) into an existing project

Using `curl` + `tar` (no clone required):

```bash
# From your project root
curl -sL https://github.com/<owner>/starter-docs/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=1 --exclude='*/README.md'
```

Using `git clone` + `rsync`:

```bash
# Clone into a temporary directory, copy contents, clean up
git clone --depth 1 https://github.com/<owner>/starter-docs.git /tmp/starter-docs
rsync -av --exclude='README.md' --exclude='.git' /tmp/starter-docs/ ./
rm -rf /tmp/starter-docs
```

Using `degit` (if installed):

```bash
npx degit <owner>/starter-docs ./tmp-starter-docs
rsync -av --exclude='README.md' ./tmp-starter-docs/ ./
rm -rf ./tmp-starter-docs
```

> **Note:** Replace `<owner>` with the GitHub username or organization once the repo is public.

### What you'll get

After copying, your project will have:

- **`docs/`** -- A structured documentation directory with templates and agent instructions ready to use.
- **`CLAUDE.md` / `AGENTS.md`** -- Root-level agent instructions that point AI agents to the documentation system. Merge these with any existing agent instructions in your project.

## How It Works

This system supports two primary workflows, both driven by AI agents:

1. **Planning** -- Settle the document tree shape, determine which PRD sections are needed, and produce a reviewable plan before any documents are written.
2. **Execution** -- Generate a full PRD set and linked work backlog from an approved plan, with support for single-agent or delegated multi-agent execution.

### Document Types

| Directory | Purpose | Naming Convention |
|-----------|---------|-------------------|
| `prd/` | Describe what the product is and how it works | `NN-<slug>.md` (e.g., `01-product-overview.md`) |
| `work/` | Prescribe what to build, in what order | `YYYY-MM-DD-<slug>.md` |
| `plans/` | Capture approach and rationale before execution | `YYYY-MM-DD-<slug>.md` |
| `designs/` | Record architectural decisions and trade-offs | `YYYY-MM-DD-<slug>.md` |

### PRD Structure

Every PRD set includes a fixed core:

| File | Purpose |
|------|---------|
| `00-index.md` | Table of contents and PRD overview |
| `01-product-overview.md` | What the product does and why |
| `02-architecture-overview.md` | System architecture and key components |
| `03-open-questions-and-risk-register.md` | Unknowns, risks, and mitigations |
| `04-glossary.md` | Domain-specific terminology |

Additional subsystem documents (`05-*` through `99-*`) are added as needed for features, services, or reference material.

## Customization

- **Prompt templates** (`docs/.prompts/`) -- Add or refine reusable prompts for common documentation workflows and handoff tasks.
- **Templates** (`docs/.templates/`) -- Modify these to change the structure of generated documents.
- **Output contract** (`docs/.references/output-contract.md`) -- Adjust naming conventions, required sections, and structural rules.
- **Agent instructions** (`CLAUDE.md`, `AGENTS.md`, and per-directory variants) -- Tailor agent behavior to your team's conventions.

## License

This project is provided as-is for use in your own projects.
