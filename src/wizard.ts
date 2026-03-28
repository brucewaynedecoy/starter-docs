import { cloneSelections, resolveInstallProfile } from "./profile";
import type {
  Capability,
  InstallProfile,
  InstallSelections,
  ReferencesMode,
  TemplatesMode,
} from "./types";

export interface PromptIO {
  info(message: string): void;
  confirm(question: string, defaultValue: boolean): Promise<boolean>;
  choose<T extends string>(question: string, options: readonly T[], defaultValue: T): Promise<T>;
}

const CAPABILITY_LABELS: Record<Capability, string> = {
  designs: "designs",
  plans: "plans",
  prd: "prd",
  work: "work",
};

export async function runSelectionWizard(
  io: PromptIO,
  initialSelections: InstallSelections,
  label: string,
): Promise<InstallSelections | null> {
  const selections = cloneSelections(initialSelections);

  io.info(label);

  while (true) {
    io.info("");
    io.info("Capabilities");

    selections.capabilities.designs = await io.confirm(
      "Install designs? [Y/n]",
      selections.capabilities.designs,
    );
    selections.capabilities.plans = await io.confirm(
      "Install plans? [Y/n]",
      selections.capabilities.plans,
    );

    const interimAfterPlans = resolveInstallProfile(selections);
    selections.capabilities.prd = await io.confirm(
      capabilityQuestion("prd", selections.capabilities.prd, interimAfterPlans),
      selections.capabilities.prd,
    );

    const interimAfterPrd = resolveInstallProfile(selections);
    selections.capabilities.work = await io.confirm(
      capabilityQuestion("work", selections.capabilities.work, interimAfterPrd),
      selections.capabilities.work,
    );

    const profile = resolveInstallProfile(selections);
    io.info(renderCapabilitySummary(profile));

    if (profile.effectiveCapabilities.length > 0) {
      break;
    }

    const cancel = await io.confirm(
      "No capabilities are selected. Cancel installer? [Y/n]",
      true,
    );
    if (cancel) {
      return null;
    }
  }

  io.info("");
  io.info("Options");

  selections.prompts = await io.confirm(
    "Install prompt starters? [Y/n]",
    selections.prompts,
  );

  selections.templatesMode = await io.choose<TemplatesMode>(
    "Install templates: [all/required]",
    ["all", "required"],
    selections.templatesMode,
  );

  selections.referencesMode = await io.choose<ReferencesMode>(
    "Install references: [all/required]",
    ["all", "required"],
    selections.referencesMode,
  );

  selections.instructionKinds["AGENTS.md"] = await io.confirm(
    "Install AGENTS.md instruction files? [Y/n]",
    selections.instructionKinds["AGENTS.md"],
  );
  selections.instructionKinds["CLAUDE.md"] = await io.confirm(
    "Install CLAUDE.md instruction files? [Y/n]",
    selections.instructionKinds["CLAUDE.md"],
  );

  return selections;
}

function capabilityQuestion(
  capability: Capability,
  currentValue: boolean,
  profile: InstallProfile,
): string {
  const state = profile.capabilityState[capability];
  if (state.missingPrerequisites.length === 0) {
    return `Install ${CAPABILITY_LABELS[capability]}? [Y/n]`;
  }

  const preserveVerb = currentValue ? "Keep" : "Select";
  return `${preserveVerb} ${CAPABILITY_LABELS[capability]} selected for later? [Y/n]`;
}

export function renderCapabilitySummary(profile: InstallProfile): string {
  const lines = ["Current capability state:"];

  for (const capability of ["designs", "plans", "prd", "work"] as const) {
    const state = profile.capabilityState[capability];
    const parts = [
      `- ${capability}: explicit=${state.explicitSelection ? "on" : "off"}`,
      `effective=${state.effectiveSelection ? "on" : "off"}`,
    ];

    if (state.disabledReason) {
      parts.push(`reason=${state.disabledReason}`);
    }

    lines.push(parts.join(", "));
  }

  return lines.join("\n");
}
