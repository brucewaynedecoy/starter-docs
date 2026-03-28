import { isFullDefaultProfile } from "./profile";
import { getPromptPaths } from "./rules";
import type { InstallProfile } from "./types";
import { formatInlineList, readPackageFile } from "./utils";

const ROOT_INSTRUCTIONS = new Set(["AGENTS.md", "CLAUDE.md"]);
const DOCS_ROUTER_INSTRUCTIONS = new Set(["docs/AGENTS.md", "docs/CLAUDE.md"]);
const TEMPLATE_ROUTER_INSTRUCTIONS = new Set([
  "docs/.templates/AGENTS.md",
  "docs/.templates/CLAUDE.md",
]);
const PROMPTS_ROUTER_INSTRUCTIONS = new Set([
  "docs/.prompts/AGENTS.md",
  "docs/.prompts/CLAUDE.md",
]);
const DESIGN_REFERENCE_RENDERERS = new Set([
  "docs/.references/design-workflow.md",
  "docs/.references/design-contract.md",
  "docs/.templates/design.md",
]);

export function isBuildablePath(relativePath: string): boolean {
  return (
    ROOT_INSTRUCTIONS.has(relativePath) ||
    DOCS_ROUTER_INSTRUCTIONS.has(relativePath) ||
    TEMPLATE_ROUTER_INSTRUCTIONS.has(relativePath) ||
    PROMPTS_ROUTER_INSTRUCTIONS.has(relativePath) ||
    DESIGN_REFERENCE_RENDERERS.has(relativePath)
  );
}

export function renderBuildableAsset(relativePath: string, profile: InstallProfile): string {
  if (isFullDefaultProfile(profile)) {
    return readPackageFile(relativePath);
  }

  if (ROOT_INSTRUCTIONS.has(relativePath)) {
    return readPackageFile(relativePath);
  }

  switch (relativePath) {
    case "docs/AGENTS.md":
    case "docs/CLAUDE.md":
      return renderDocsRouter(profile);
    case "docs/.templates/AGENTS.md":
    case "docs/.templates/CLAUDE.md":
      return renderTemplatesRouter(profile);
    case "docs/.prompts/AGENTS.md":
    case "docs/.prompts/CLAUDE.md":
      return renderPromptsRouter(profile);
    case "docs/.references/design-workflow.md":
      return renderDesignWorkflow(profile);
    case "docs/.references/design-contract.md":
      return renderDesignContract(profile);
    case "docs/.templates/design.md":
      return renderDesignTemplate(profile);
    default:
      throw new Error(`No buildable renderer registered for ${relativePath}.`);
  }
}

function renderDocsRouter(profile: InstallProfile): string {
  const lines = [
    "# Documentation Router",
    "",
    "Use `docs/` only as a router. Do not create generated files directly in this directory.",
  ];

  if (profile.capabilityState.designs.effectiveSelection) {
    lines.push(
      "- For design docs, read `docs/.references/design-workflow.md`, `docs/.references/design-contract.md`, and `docs/.templates/design.md`, then continue in `docs/designs/`.",
    );
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    lines.push(
      "- For plans, read `docs/.references/planning-workflow.md` and the selected plan template in `docs/.templates/`, then continue in `docs/plans/`.",
    );
  }

  if (
    profile.capabilityState.prd.effectiveSelection &&
    profile.capabilityState.work.effectiveSelection
  ) {
    lines.push(
      "- For PRD or work generation, read `docs/.references/execution-workflow.md`, `docs/.references/output-contract.md`, and the selected template in `docs/.templates/`, then continue in `docs/prd/` or `docs/work/`.",
    );
  } else if (profile.capabilityState.prd.effectiveSelection) {
    lines.push(
      "- For PRD generation, read `docs/.references/execution-workflow.md`, `docs/.references/output-contract.md`, and the selected template in `docs/.templates/`, then continue in `docs/prd/`.",
    );
  }

  if (
    profile.capabilityState.plans.effectiveSelection ||
    profile.capabilityState.prd.effectiveSelection ||
    profile.capabilityState.work.effectiveSelection
  ) {
    lines.push(
      profile.capabilityState.prd.effectiveSelection || profile.capabilityState.work.effectiveSelection
        ? "- For requirement changes, also read `docs/.references/prd-change-management.md` before choosing change templates or delta outputs."
        : "- For requirement-change plans, also read `docs/.references/prd-change-management.md` before choosing the change-planning template.",
    );
  }

  if (getPromptPaths(profile).length > 0) {
    lines.push(
      "- For reusable prompt starters, use `docs/.prompts/`; prompts are optional starters, not authority.",
    );
  }

  return `${lines.join("\n")}\n`;
}

function renderTemplatesRouter(profile: InstallProfile): string {
  const templateFamilies: string[] = [];

  if (profile.capabilityState.designs.effectiveSelection) {
    templateFamilies.push("`design.md` for design docs");
  }

  const wildcardFamilies: string[] = [];
  if (profile.capabilityState.plans.effectiveSelection) {
    wildcardFamilies.push("`plan-*`");
  }
  if (profile.capabilityState.prd.effectiveSelection) {
    wildcardFamilies.push("`prd-*`");
  }
  if (profile.capabilityState.work.effectiveSelection) {
    wildcardFamilies.push("`work-*`");
  }

  if (wildcardFamilies.length > 0) {
    templateFamilies.push(
      `the matching ${formatInlineList(wildcardFamilies)} template for the target artifact`,
    );
  }

  const usageLine =
    templateFamilies.length > 0
      ? `- Use ${formatInlineList(templateFamilies)}.`
      : "- Install at least one documentation capability before using templates.";

  return [
    "# Templates Router",
    "",
    "This directory contains structural starting points for generated docs.",
    "- Copy the relevant template shape into the target output file; do not write outputs here.",
    usageLine,
    "- Resolve workflow and contract questions in `docs/.references/`, then continue in the target output directory router.",
    "- Do not modify template files unless the user explicitly asks.",
    "",
  ].join("\n");
}

function renderPromptsRouter(profile: InstallProfile): string {
  const outputs: string[] = [];

  if (profile.capabilityState.plans.effectiveSelection) {
    outputs.push("plans");
  }
  if (profile.capabilityState.prd.effectiveSelection) {
    outputs.push("PRDs");
  }
  if (profile.capabilityState.work.effectiveSelection) {
    outputs.push("work backlogs");
  }
  if (profile.capabilityState.designs.effectiveSelection) {
    outputs.push("design docs");
  }

  const outputText =
    outputs.length > 0
      ? `- Do not write generated ${formatInlineList(outputs)} here.`
      : "- Do not write generated outputs here.";

  return [
    "# Prompts Router",
    "",
    "This directory stores reusable prompt starters, not authoritative rules and not generated outputs.",
    "- Use it only when the user wants a stored prompt or a reusable workflow kickoff.",
    "- Keep placeholder tokens explicit unless the user asks to instantiate them.",
    "- When executing a prompt, read the target workflow in `docs/.references/`, the matching template in `docs/.templates/`, and the router in the target output directory.",
    outputText,
    "",
  ].join("\n");
}

function renderDesignWorkflow(profile: InstallProfile): string {
  if (
    profile.capabilityState.plans.effectiveSelection &&
    hasDesignPlanningPrompts(profile)
  ) {
    return readPackageFile("docs/.references/design-workflow.md");
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    return [
      "# Design Workflow",
      "",
      "## Purpose",
      "",
      "Use this workflow when the user wants to turn a request into one or more design docs before planning, PRD generation, or backlog generation.",
      "",
      "This workflow ends with design docs in `docs/designs/`. It does not draft a plan.",
      "",
      "## Preflight",
      "",
      "Before writing:",
      "",
      "1. Inspect `docs/designs/` for related design docs.",
      "2. Inspect related plans, PRD docs, or work backlogs only as needed for context or route classification.",
      "3. Determine whether the request belongs to the same decision area as an existing design.",
      "4. Choose whether to update an existing design or create a new dated design doc.",
      "",
      "## Create Vs Update Rules",
      "",
      "- Prefer updating an existing design when the request clearly concerns the same decision area and the existing doc can absorb the change without obscuring prior intent.",
      "- Create a new dated design doc when no clear related design exists, when the request spans a distinct decision area, or when a substantial direction change would make the existing design misleading.",
      "- One design doc is the default output unit. Create more than one only when the request clearly spans multiple distinct decision areas.",
      "",
      "## Lineage Rules",
      "",
      "- If a generated update materially changes prior design intent, add an optional `## Design Lineage` section before `## Intended Follow-On`.",
      "- Use `## Design Lineage` to record:",
      "  - `Update Mode:` `updated-existing` or `new-doc-related`",
      "  - `Prior Design Docs:` relative links to the earlier design docs",
      "  - `Reason:` a short explanation of why the prior design was updated or why a related new design doc was needed",
      "- If the request is only a minor clarification and does not materially change prior design intent, the lineage section is optional.",
      "",
      "## Intended Follow-On Rules",
      "",
      "- Every generated design doc must include `## Intended Follow-On`.",
      "- Allowed `Route` values:",
      "  - `baseline-plan`",
      "  - `change-plan`",
      "- Prompt links are unavailable in this profile because prompt starters are not installed locally.",
      "- Record:",
      "  - `Next Step:` rerun `npx starter-docs update --reconfigure` and enable prompts if you want local prompt starters",
      "  - `Why:` a short explanation of why the selected route is the correct downstream workflow",
      "",
      "## Stop Rule",
      "",
      "- Stop after the design docs are created or updated.",
      "- Do not draft a plan as part of the request-to-design workflow.",
      "",
      "## Validation Checklist",
      "",
      "Before closing the task, confirm:",
      "",
      "1. The output lives in `docs/designs/` and follows date-slug naming.",
      "2. The generated design uses the required design template structure.",
      "3. The create-vs-update choice is justified by the current design tree.",
      "4. `## Design Lineage` is present when the design materially updates prior intent.",
      "5. `## Intended Follow-On` uses `baseline-plan` or `change-plan` without linking to missing prompt files.",
      "",
    ].join("\n");
  }

  return [
    "# Design Workflow",
    "",
    "## Purpose",
    "",
    "Use this workflow when the user wants to turn a request into one or more design docs before later planning work.",
    "",
    "This workflow ends with design docs in `docs/designs/`. Local planning assets are not installed in this profile.",
    "",
    "## Preflight",
    "",
    "Before writing:",
    "",
    "1. Inspect `docs/designs/` for related design docs.",
    "2. Inspect related plans, PRD docs, or work backlogs only as needed for context or route classification.",
    "3. Determine whether the request belongs to the same decision area as an existing design.",
    "4. Choose whether to update an existing design or create a new dated design doc.",
    "",
    "## Create Vs Update Rules",
    "",
    "- Prefer updating an existing design when the request clearly concerns the same decision area and the existing doc can absorb the change without obscuring prior intent.",
    "- Create a new dated design doc when no clear related design exists, when the request spans a distinct decision area, or when a substantial direction change would make the existing design misleading.",
    "- One design doc is the default output unit. Create more than one only when the request clearly spans multiple distinct decision areas.",
    "",
    "## Lineage Rules",
    "",
    "- If a generated update materially changes prior design intent, add an optional `## Design Lineage` section before `## Intended Follow-On`.",
    "- Use `## Design Lineage` to record:",
    "  - `Update Mode:` `updated-existing` or `new-doc-related`",
    "  - `Prior Design Docs:` relative links to the earlier design docs",
    "  - `Reason:` a short explanation of why the prior design was updated or why a related new design doc was needed",
    "- If the request is only a minor clarification and does not materially change prior design intent, the lineage section is optional.",
    "",
    "## Intended Follow-On Rules",
    "",
    "- Every generated design doc must include `## Intended Follow-On`.",
    "- Because the `plans` capability is not installed in this profile, do not link to prompt starter files that are not installed locally.",
    "- Record the follow-on as:",
    "  - `Route:` `planning-not-installed`",
    "  - `Next Step:` rerun `npx starter-docs update --reconfigure` and enable `plans`",
    "  - `Why:` a short explanation of whether the next step should be baseline planning or change planning once planning assets are installed",
    "",
    "## Stop Rule",
    "",
    "- Stop after the design docs are created or updated.",
    "- Do not draft a plan as part of the request-to-design workflow.",
    "",
    "## Validation Checklist",
    "",
    "Before closing the task, confirm:",
    "",
    "1. The output lives in `docs/designs/` and follows date-slug naming.",
    "2. The generated design uses the required design template structure.",
    "3. The create-vs-update choice is justified by the current design tree.",
    "4. `## Design Lineage` is present when the design materially updates prior intent.",
    "5. `## Intended Follow-On` records that local planning assets are not installed and names rerunning the installer as the next step.",
    "",
  ].join("\n");
}

function renderDesignContract(profile: InstallProfile): string {
  if (
    profile.capabilityState.plans.effectiveSelection &&
    hasDesignPlanningPrompts(profile)
  ) {
    return readPackageFile("docs/.references/design-contract.md");
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    return [
      "# Design Contract",
      "",
      "## Purpose",
      "",
      "Use this contract for agent-generated design docs under `docs/designs/`.",
      "",
      "User-authored design docs may not fully conform. Apply this contract to newly generated design docs and to substantial agent-authored updates.",
      "",
      "## Required Path",
      "",
      "- `docs/designs/YYYY-MM-DD-{{DESIGN NAME}}.md`",
      "",
      "## Required Headings",
      "",
      "Generated design docs must include:",
      "",
      "- `## Purpose`",
      "- `## Context`",
      "- `## Decision`",
      "- `## Alternatives Considered`",
      "- `## Consequences`",
      "- `## Intended Follow-On`",
      "",
      "## Intended Follow-On Contract",
      "",
      "The `## Intended Follow-On` section must include:",
      "",
      "- `Route:` `baseline-plan` or `change-plan`",
      "- `Next Step:` rerun `npx starter-docs update --reconfigure` and enable prompts if you want local prompt starters",
      "- `Why:` a short explanation of why that route is the correct downstream workflow",
      "",
      "Do not add a `Next Prompt` link when prompt starters are not installed locally.",
      "",
      "## Optional Design Lineage",
      "",
      "Add `## Design Lineage` when a generated design materially updates prior design intent or when a new design doc is closely related to an earlier design.",
      "",
      "When present, include:",
      "",
      "- `Update Mode:` `updated-existing` or `new-doc-related`",
      "- `Prior Design Docs:` relative Markdown links",
      "- `Reason:` a short explanation of the lineage relationship",
      "",
      "## Link Rules",
      "",
      "- Use relative Markdown links between design docs and related plans, PRD docs, or work items.",
      "- If prompt starters are not installed locally, do not create broken prompt links.",
      "",
    ].join("\n");
  }

  return [
    "# Design Contract",
    "",
    "## Purpose",
    "",
    "Use this contract for agent-generated design docs under `docs/designs/`.",
    "",
    "User-authored design docs may not fully conform. Apply this contract to newly generated design docs and to substantial agent-authored updates.",
    "",
    "## Required Path",
    "",
    "- `docs/designs/YYYY-MM-DD-{{DESIGN NAME}}.md`",
    "",
    "## Required Headings",
    "",
    "Generated design docs must include:",
    "",
    "- `## Purpose`",
    "- `## Context`",
    "- `## Decision`",
    "- `## Alternatives Considered`",
    "- `## Consequences`",
    "- `## Intended Follow-On`",
    "",
    "## Intended Follow-On Contract",
    "",
    "The `## Intended Follow-On` section must include:",
    "",
    "- `Route:` `planning-not-installed`",
    "- `Next Step:` rerun `npx starter-docs update --reconfigure` and enable `plans` if you want local planning prompts and templates",
    "- `Why:` a short explanation of what planning should happen later",
    "",
    "Do not add a `Next Prompt` link when planning assets are not installed locally.",
    "",
    "## Optional Design Lineage",
    "",
    "Add `## Design Lineage` when a generated design materially updates prior design intent or when a new design doc is closely related to an earlier design.",
    "",
    "When present, include:",
    "",
    "- `Update Mode:` `updated-existing` or `new-doc-related`",
    "- `Prior Design Docs:` relative Markdown links",
    "- `Reason:` a short explanation of the lineage relationship",
    "",
    "## Link Rules",
    "",
    "- Use relative Markdown links between design docs and related plans, PRD docs, or work items.",
    "- If planning assets are not installed locally, do not create broken prompt links.",
    "",
  ].join("\n");
}

function renderDesignTemplate(profile: InstallProfile): string {
  if (profile.capabilityState.plans.effectiveSelection) {
    return readPackageFile("docs/.templates/design.md");
  }

  return [
    "# {{TITLE}}",
    "",
    "## Purpose",
    "",
    "Explain what decision this document captures and why it exists.",
    "",
    "## Context",
    "",
    "Describe the problem, constraints, forces, and existing conditions that shape the decision.",
    "",
    "## Decision",
    "",
    "Describe the chosen approach clearly enough that planning can proceed from it once planning assets are installed.",
    "",
    "## Alternatives Considered",
    "",
    "List the meaningful alternatives and why they were not chosen.",
    "",
    "## Consequences",
    "",
    "Describe outcomes, trade-offs, risks, and follow-on implications.",
    "",
    "## Intended Follow-On",
    "",
    "- Route: planning-not-installed",
    "- Next Step: Re-run `npx starter-docs update --reconfigure` and enable `plans` to install local planning prompts and templates.",
    "- Why: Explain whether this design should later feed a baseline plan or a change plan.",
    "",
  ].join("\n");
}

function hasDesignPlanningPrompts(profile: InstallProfile): boolean {
  return getPromptPaths(profile).some(
    (relativePath) =>
      relativePath === "docs/.prompts/designs-to-plan.prompt.md" ||
      relativePath === "docs/.prompts/designs-to-plan-change.prompt.md",
  );
}
