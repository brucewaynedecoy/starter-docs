import { getPromptPaths, getReferenceDirInstalled, getReferencePaths, getTemplateDirInstalled, getTemplatePaths, getPromptsDirInstalled } from "./rules";
import { renderBuildableAsset, isBuildablePath } from "./renderers";
import type { InstallProfile, InstructionKind, ResolvedAsset } from "./types";
import { INSTRUCTION_KINDS } from "./types";
import { readPackageFile } from "./utils";

function buildAsset(profile: InstallProfile, relativePath: string): ResolvedAsset {
  const assetClass = isBuildablePath(relativePath) ? "buildable" : "scoped-static";
  const content =
    assetClass === "buildable"
      ? renderBuildableAsset(relativePath, profile)
      : readPackageFile(relativePath);

  return {
    relativePath,
    assetClass,
    sourceId:
      assetClass === "buildable" ? `build:${relativePath}` : `file:${relativePath}`,
    content,
  };
}

function addInstructionAssets(
  profile: InstallProfile,
  instructionKind: InstructionKind,
  relativePaths: Set<string>,
): void {
  if (!profile.selections.instructionKinds[instructionKind]) {
    return;
  }

  relativePaths.add(instructionKind);
  relativePaths.add(`docs/${instructionKind}`);

  if (profile.capabilityState.designs.effectiveSelection) {
    relativePaths.add(`docs/designs/${instructionKind}`);
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    relativePaths.add(`docs/plans/${instructionKind}`);
  }

  if (profile.capabilityState.prd.effectiveSelection) {
    relativePaths.add(`docs/prd/${instructionKind}`);
  }

  if (profile.capabilityState.work.effectiveSelection) {
    relativePaths.add(`docs/work/${instructionKind}`);
  }

  if (getReferenceDirInstalled(profile)) {
    relativePaths.add(`docs/.references/${instructionKind}`);
  }

  if (getTemplateDirInstalled(profile)) {
    relativePaths.add(`docs/.templates/${instructionKind}`);
  }

  if (getPromptsDirInstalled(profile)) {
    relativePaths.add(`docs/.prompts/${instructionKind}`);
  }
}

export function getDesiredAssets(profile: InstallProfile): ResolvedAsset[] {
  const relativePaths = new Set<string>();

  for (const referencePath of getReferencePaths(profile)) {
    relativePaths.add(referencePath);
  }

  for (const templatePath of getTemplatePaths(profile)) {
    relativePaths.add(templatePath);
  }

  for (const promptPath of getPromptPaths(profile)) {
    relativePaths.add(promptPath);
  }

  for (const instructionKind of INSTRUCTION_KINDS) {
    addInstructionAssets(profile, instructionKind, relativePaths);
  }

  return Array.from(relativePaths)
    .sort()
    .map((relativePath) => buildAsset(profile, relativePath));
}
