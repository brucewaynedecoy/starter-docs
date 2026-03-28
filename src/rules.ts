import type { Capability, InstallProfile } from "./types";

export interface PromptRule {
  relativePath: string;
  requires: Capability[];
}

export const PROMPT_RULES: PromptRule[] = [
  {
    relativePath: "docs/.prompts/request-to-design.prompt.md",
    requires: ["designs"],
  },
  {
    relativePath: "docs/.prompts/designs-to-plan.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: "docs/.prompts/designs-to-plan-change.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: "docs/.prompts/plan-to-prd-change.prompt.md",
    requires: ["plans", "prd"],
  },
  {
    relativePath: "docs/.prompts/plan-to-prd-green-field.prompt.md",
    requires: ["plans", "prd"],
  },
  {
    relativePath: "docs/.prompts/prd-change-to-work.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: "docs/.prompts/prd-to-work-full-prd.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: "docs/.prompts/prd-to-work-prd-feature.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: "docs/.prompts/update-readme-green-field.prompt.md",
    requires: ["designs", "plans"],
  },
];

const PLAN_TEMPLATE_PATHS = [
  "docs/.templates/plan-prd.md",
  "docs/.templates/plan-prd-decompose.md",
  "docs/.templates/plan-prd-change.md",
];

const PRD_TEMPLATE_PATHS = [
  "docs/.templates/prd-architecture.md",
  "docs/.templates/prd-change-addition.md",
  "docs/.templates/prd-change-revision.md",
  "docs/.templates/prd-glossary.md",
  "docs/.templates/prd-index.md",
  "docs/.templates/prd-overview.md",
  "docs/.templates/prd-reference.md",
  "docs/.templates/prd-risk-register.md",
  "docs/.templates/prd-subsystem.md",
];

const WORK_TEMPLATE_PATHS = [
  "docs/.templates/work-backlog.md",
  "docs/.templates/work-backlog-index.md",
  "docs/.templates/work-backlog-phase.md",
];

const REQUIRED_REFERENCE_PATHS = {
  designs: ["docs/.references/design-workflow.md", "docs/.references/design-contract.md"],
  plans: [
    "docs/.references/planning-workflow.md",
    "docs/.references/output-contract.md",
    "docs/.references/prd-change-management.md",
  ],
  prd: [
    "docs/.references/execution-workflow.md",
    "docs/.references/output-contract.md",
    "docs/.references/prd-change-management.md",
  ],
  work: [
    "docs/.references/execution-workflow.md",
    "docs/.references/output-contract.md",
    "docs/.references/prd-change-management.md",
  ],
} as const;

export function profileHasCapabilities(
  profile: InstallProfile,
  capabilities: Capability[],
): boolean {
  return capabilities.every(
    (capability) => profile.capabilityState[capability].effectiveSelection,
  );
}

export function getPromptPaths(profile: InstallProfile): string[] {
  if (!profile.selections.prompts) {
    return [];
  }

  return PROMPT_RULES.filter((rule) => profileHasCapabilities(profile, rule.requires)).map(
    (rule) => rule.relativePath,
  );
}

export function getTemplatePaths(profile: InstallProfile): string[] {
  const paths = new Set<string>();

  if (profile.capabilityState.designs.effectiveSelection) {
    paths.add("docs/.templates/design.md");
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    for (const templatePath of PLAN_TEMPLATE_PATHS) {
      paths.add(templatePath);
    }
  }

  if (profile.capabilityState.prd.effectiveSelection) {
    for (const templatePath of PRD_TEMPLATE_PATHS) {
      paths.add(templatePath);
    }
  }

  if (profile.capabilityState.work.effectiveSelection) {
    for (const templatePath of WORK_TEMPLATE_PATHS) {
      paths.add(templatePath);
    }
  }

  return Array.from(paths).sort();
}

export function getReferencePaths(profile: InstallProfile): string[] {
  const paths = new Set<string>();

  for (const capability of Object.keys(REQUIRED_REFERENCE_PATHS) as Capability[]) {
    if (profile.capabilityState[capability].effectiveSelection) {
      for (const referencePath of REQUIRED_REFERENCE_PATHS[capability]) {
        paths.add(referencePath);
      }
    }
  }

  if (profile.selections.referencesMode === "all" && profile.effectiveCapabilities.length > 0) {
    paths.add("docs/.references/harness-capability-matrix.md");
  }

  return Array.from(paths).sort();
}

export function getReferenceDirInstalled(profile: InstallProfile): boolean {
  return getReferencePaths(profile).length > 0;
}

export function getTemplateDirInstalled(profile: InstallProfile): boolean {
  return getTemplatePaths(profile).length > 0;
}

export function getPromptsDirInstalled(profile: InstallProfile): boolean {
  return getPromptPaths(profile).length > 0;
}
