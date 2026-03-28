import { hashText, formatInlineList } from "./utils";
import {
  CAPABILITIES,
  type Capability,
  type CapabilityState,
  type InstallProfile,
  type InstallSelections,
} from "./types";

export const CAPABILITY_DEPENDENCIES: Record<Capability, Capability[]> = {
  designs: [],
  plans: [],
  prd: ["plans"],
  work: ["plans", "prd"],
};

export function defaultSelections(): InstallSelections {
  return {
    capabilities: {
      designs: true,
      plans: true,
      prd: true,
      work: true,
    },
    prompts: true,
    templatesMode: "all",
    referencesMode: "all",
    instructionKinds: {
      "AGENTS.md": true,
      "CLAUDE.md": true,
    },
  };
}

export function cloneSelections(selections: InstallSelections): InstallSelections {
  return {
    capabilities: { ...selections.capabilities },
    prompts: selections.prompts,
    templatesMode: selections.templatesMode,
    referencesMode: selections.referencesMode,
    instructionKinds: { ...selections.instructionKinds },
  };
}

export function resolveCapabilityState(
  selections: InstallSelections,
): Record<Capability, CapabilityState> {
  const state = {} as Record<Capability, CapabilityState>;

  for (const capability of CAPABILITIES) {
    const missingPrerequisites = CAPABILITY_DEPENDENCIES[capability].filter(
      (dependency) => !state[dependency]?.effectiveSelection,
    );
    const explicitSelection = selections.capabilities[capability];
    const effectiveSelection = explicitSelection && missingPrerequisites.length === 0;

    state[capability] = {
      explicitSelection,
      effectiveSelection,
      missingPrerequisites,
      disabledReason:
        missingPrerequisites.length > 0
          ? `${capability} requires ${formatInlineList(missingPrerequisites)}`
          : undefined,
    };
  }

  return state;
}

export function resolveInstallProfile(selections: InstallSelections): InstallProfile {
  const capabilityState = resolveCapabilityState(selections);
  const effectiveCapabilities = CAPABILITIES.filter(
    (capability) => capabilityState[capability].effectiveSelection,
  );

  const profileId = hashText(
    JSON.stringify({
      capabilities: capabilityState,
      prompts: selections.prompts,
      templatesMode: selections.templatesMode,
      referencesMode: selections.referencesMode,
      instructionKinds: selections.instructionKinds,
    }),
  ).slice(0, 16);

  return {
    selections,
    capabilityState,
    effectiveCapabilities,
    profileId,
  };
}

export function hasEffectiveCapabilities(profile: InstallProfile): boolean {
  return profile.effectiveCapabilities.length > 0;
}

export function isFullDefaultProfile(profile: InstallProfile): boolean {
  return (
    CAPABILITIES.every((capability) => profile.capabilityState[capability].effectiveSelection) &&
    profile.selections.prompts &&
    profile.selections.templatesMode === "all" &&
    profile.selections.referencesMode === "all" &&
    profile.selections.instructionKinds["AGENTS.md"] &&
    profile.selections.instructionKinds["CLAUDE.md"]
  );
}
