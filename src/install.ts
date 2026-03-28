import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { createManifest, writeManifest } from "./manifest";
import { createInstallPlan } from "./planner";
import { resolveInstallProfile } from "./profile";
import type {
  ApplyResult,
  InstructionConflict,
  InstructionConflictResolutions,
  InstructionKind,
  InstallManifest,
  InstallPlan,
  InstallSelections,
  PackageMeta,
  PlannedAction,
} from "./types";
import { INSTRUCTION_KINDS } from "./types";
import {
  ensureParentDir,
  pruneEmptyDirectories,
  readPackageMeta,
  relativePathToTarget,
  writeTextFile,
} from "./utils";

export function planInstall(options: {
  targetDir: string;
  selections: InstallSelections;
  existingManifest: InstallManifest | null;
  packageMeta?: PackageMeta;
  instructionConflictResolutions?: InstructionConflictResolutions;
}): InstallPlan {
  const packageMeta = options.packageMeta ?? readPackageMeta();
  const profile = resolveInstallProfile(options.selections);

  return createInstallPlan({
    targetDir: options.targetDir,
    packageMeta,
    profile,
    existingManifest: options.existingManifest,
    instructionConflictResolutions: options.instructionConflictResolutions,
  });
}

export function findInstructionConflicts(plan: InstallPlan): InstructionConflict[] {
  return plan.actions.flatMap((action) => {
    if (action.type !== "skip-conflict" || typeof action.content !== "string" || !action.reason) {
      return [];
    }

    const instructionKind = getInstructionKindForPath(action.relativePath);
    if (!instructionKind) {
      return [];
    }

    return [
      {
        relativePath: action.relativePath,
        instructionKind,
        reason: action.reason,
      },
    ];
  });
}

export function applyInstallPlan(options: {
  targetDir: string;
  plan: InstallPlan;
  existingManifest: InstallManifest | null;
}): ApplyResult {
  const { targetDir, plan, existingManifest } = options;
  const nextFiles = { ...(existingManifest?.files ?? {}) };
  const conflictFiles: string[] = [];

  mkdirSync(targetDir, { recursive: true });

  for (const action of plan.actions) {
    applyAction({
      targetDir,
      plan,
      action,
      nextFiles,
      conflictFiles,
    });
  }

  const manifest = createManifest(
    {
      name: plan.packageName,
      version: plan.packageVersion,
    },
    plan.profile,
    nextFiles,
  );
  writeManifest(targetDir, manifest);

  return {
    manifest,
    appliedActions: plan.actions,
    conflictFiles,
  };
}

function applyAction(options: {
  targetDir: string;
  plan: InstallPlan;
  action: PlannedAction;
  nextFiles: Record<string, { hash: string; sourceId: string }>;
  conflictFiles: string[];
}): void {
  const { targetDir, plan, action, nextFiles, conflictFiles } = options;
  const absolutePath = relativePathToTarget(targetDir, action.relativePath);
  const desiredEntry = plan.desiredFiles[action.relativePath];

  switch (action.type) {
    case "create":
    case "update":
    case "generate": {
      if (typeof action.content !== "string" || !desiredEntry) {
        throw new Error(`Missing content for ${action.type} action on ${action.relativePath}.`);
      }

      writeTextFile(absolutePath, action.content);
      nextFiles[action.relativePath] = desiredEntry;
      return;
    }
    case "update-conflict": {
      if (typeof action.content !== "string") {
        throw new Error(`Missing content for ${action.type} action on ${action.relativePath}.`);
      }

      writeTextFile(absolutePath, action.content);
      delete nextFiles[action.relativePath];
      return;
    }
    case "noop": {
      if (desiredEntry) {
        nextFiles[action.relativePath] = desiredEntry;
      }
      return;
    }
    case "remove-managed": {
      if (existsSync(absolutePath)) {
        rmSync(absolutePath, { force: true });
        pruneEmptyDirectories(path.dirname(absolutePath), targetDir);
      }
      delete nextFiles[action.relativePath];
      return;
    }
    case "skip-conflict": {
      if (typeof action.content === "string" && plan.conflictsRunId) {
        const conflictPath = path.join(
          targetDir,
          "docs/.starter-docs/conflicts",
          plan.conflictsRunId,
          action.relativePath,
        );
        ensureParentDir(conflictPath);
        writeTextFile(conflictPath, action.content);
        conflictFiles.push(conflictPath);
      }
      return;
    }
    default: {
      const exhaustiveCheck: never = action.type;
      throw new Error(`Unhandled action type: ${exhaustiveCheck}`);
    }
  }
}

function getInstructionKindForPath(relativePath: string): InstructionKind | null {
  const basename = path.posix.basename(relativePath);
  return INSTRUCTION_KINDS.includes(basename as InstructionKind)
    ? (basename as InstructionKind)
    : null;
}
