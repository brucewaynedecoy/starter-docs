# Starter Docs

Drop-in documentation structure, templates, and AI agent instructions for any project. Install the system with `npx starter-docs` to get a ready-made setup for generating PRDs, implementation backlogs, architectural designs, and plans with consistent naming conventions and enforced section contracts.

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

This repo also includes maintainer-only validation tooling for the instruction routers. That tooling is documented below and is intentionally excluded from the downstream copy commands.

## Quick Start

### Install with `npx` (recommended)

From your project root:

```bash
npx starter-docs
```

The installer starts in full-install mode:

- all capabilities are selected by default: `designs`, `plans`, `prd`, and `work`
- optional assets are selected by default: prompt starters, all valid templates, all valid references, and both `AGENTS.md` and `CLAUDE.md`
- you opt out of anything you do not want

The capability graph is dependency-aware:

- `designs` is independent
- `plans` is independent
- `prd` requires `plans`
- `work` requires both `plans` and `prd`

If you opt out of a prerequisite, downstream capabilities stay selected for later but become disabled until the prerequisite is turned back on.

Useful non-interactive forms:

```bash
# Install everything with defaults
npx starter-docs init --yes

# Full install except work docs
npx starter-docs init --yes --no-work

# Re-run updates using the existing manifest and selections
npx starter-docs update

# Reconfigure an existing install
npx starter-docs update --reconfigure

# Preview changes without writing files
npx starter-docs init --dry-run
```

### What the installer writes

The installer writes only the files that match your selected profile:

- visible capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`
- only the prompt starters, templates, and reference files that are valid for that profile
- generated instruction routers and support files that avoid pointing agents at missing directories or prompt files
- `docs/.starter-docs/manifest.json`, which records the installed profile and managed file hashes for later updates

Update behavior is intentionally non-destructive:

- unchanged managed files are updated in place
- locally modified managed files are skipped
- unmanaged conflicting files are never overwritten
- proposed replacements are staged under `docs/.starter-docs/conflicts/<run-id>/`

### Copy the drop-in docs files manually

If you do not want to use the installer, you can still copy the template files directly.

Using `curl` + `tar` (no clone required):

```bash
# From your project root
curl -sL https://github.com/<owner>/starter-docs/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=1 \
    --exclude='*/README.md' \
    --exclude='*/justfile' \
    --exclude='*/scripts' \
    --exclude='*/scripts/*'
```

Using `git clone` + `rsync`:

```bash
# Clone into a temporary directory, copy contents, clean up
git clone --depth 1 https://github.com/<owner>/starter-docs.git /tmp/starter-docs
rsync -av \
  --exclude='README.md' \
  --exclude='justfile' \
  --exclude='scripts/' \
  --exclude='.git' \
  /tmp/starter-docs/ ./
rm -rf /tmp/starter-docs
```

Using `degit` (if installed):

```bash
npx degit <owner>/starter-docs ./tmp-starter-docs
rsync -av \
  --exclude='README.md' \
  --exclude='justfile' \
  --exclude='scripts/' \
  ./tmp-starter-docs/ ./
rm -rf ./tmp-starter-docs
```

> **Note:** Replace `<owner>` with the GitHub username or organization once the repo is public.

### What you'll get

After installing or copying, your project will have:

- **`docs/`** -- A structured documentation directory with templates and agent instructions ready to use.
- **`CLAUDE.md` / `AGENTS.md`** -- Root-level agent instructions that point AI agents to the documentation system. The installer can generate these to match the selected capability profile and will not overwrite conflicting files automatically.
- **`docs/.starter-docs/manifest.json`** -- Present when you use the CLI installer. Tracks the selected profile and managed file hashes so `update` stays narrow and safe.

The copy commands above intentionally exclude this repo's maintainer-only `justfile` and `scripts/check-instruction-routers.sh`.

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

If you used the installer, rerun `npx starter-docs update --reconfigure` after changing which capability families you want managed locally. The installer will regenerate profile-aware router files so they stay aligned with the directories you keep.

## Maintainer Checks

This repo includes a maintainer-only validation script for the instruction routers:

- `scripts/check-instruction-routers.sh` verifies that `AGENTS.md` and `CLAUDE.md` pairs stay identical, stay within the router line budgets, and do not reintroduce heavy headings like `## Files` or `## Templates`.

Run it after editing instruction routers and before committing those changes:

```bash
just check-instruction-routers
```

Fallback if `just` is unavailable:

```bash
bash scripts/check-instruction-routers.sh
```

This check is for maintainers of this template repo. It is not part of the downstream documentation workflow and is intentionally not copied into consumer projects.

## License

This project is provided as-is for use in your own projects.
