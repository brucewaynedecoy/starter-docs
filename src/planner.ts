import { existsSync } from "node:fs";
import path from "node:path";
import { getDesiredAssets } from "./catalog";
import type {
  InstallManifest,
  InstallPlan,
  InstallProfile,
  PackageMeta,
  PlannedAction,
} from "./types";
import { hashText, readTextFile, relativePathToTarget, createRunId } from "./utils";

export function createInstallPlan(options: {
  targetDir: string;
  packageMeta: PackageMeta;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
}): InstallPlan {
  const { targetDir, packageMeta, profile, existingManifest } = options;
  const desiredAssets = getDesiredAssets(profile);
  const desiredFiles = Object.fromEntries(
    desiredAssets.map((asset) => [
      asset.relativePath,
      {
        hash: hashText(asset.content),
        sourceId: asset.sourceId,
      },
    ]),
  );

  const actions: PlannedAction[] = [];
  let conflictsRunId: string | undefined;

  for (const asset of desiredAssets) {
    const absolutePath = relativePathToTarget(targetDir, asset.relativePath);
    const desiredHash = hashText(asset.content);

    if (!existsSync(absolutePath)) {
      actions.push({
        type: asset.assetClass === "buildable" ? "generate" : "create",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
      });
      continue;
    }

    const currentContent = readTextFile(absolutePath);
    if (currentContent === asset.content) {
      actions.push({
        type: "noop",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        contentHash: desiredHash,
      });
      continue;
    }

    const currentHash = hashText(currentContent);
    const manifestEntry = existingManifest?.files[asset.relativePath];
    if (manifestEntry && manifestEntry.hash === currentHash) {
      actions.push({
        type: asset.assetClass === "buildable" ? "generate" : "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
      });
      continue;
    }

    conflictsRunId ??= createRunId();
    actions.push({
      type: "skip-conflict",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      content: asset.content,
      contentHash: desiredHash,
      reason: manifestEntry
        ? "Managed file was modified locally."
        : "Unmanaged file already exists with different content.",
    });
  }

  if (existingManifest) {
    for (const [relativePath, manifestEntry] of Object.entries(existingManifest.files)) {
      if (relativePath in desiredFiles) {
        continue;
      }

      const absolutePath = path.join(targetDir, relativePath);
      if (!existsSync(absolutePath)) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
        });
        continue;
      }

      const currentContent = readTextFile(absolutePath);
      const currentHash = hashText(currentContent);
      if (currentHash === manifestEntry.hash) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
        });
        continue;
      }

      conflictsRunId ??= createRunId();
      actions.push({
        type: "skip-conflict",
        relativePath,
        sourceId: manifestEntry.sourceId,
        reason: "Managed file was modified locally and will not be removed automatically.",
      });
    }
  }

  actions.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return {
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    profile,
    actions,
    desiredFiles,
    conflictsRunId,
  };
}
