import { existsSync } from "node:fs";
import path from "node:path";
import type { InstallManifest, InstallProfile, ManifestFileEntry, PackageMeta } from "./types";
import { readTextFile, writeTextFile } from "./utils";

export const MANIFEST_SCHEMA_VERSION = 1;
export const MANIFEST_RELATIVE_PATH = "docs/.starter-docs/manifest.json";

export function getManifestPath(targetDir: string): string {
  return path.join(targetDir, MANIFEST_RELATIVE_PATH);
}

export function loadManifest(targetDir: string): InstallManifest | null {
  const manifestPath = getManifestPath(targetDir);
  if (!existsSync(manifestPath)) {
    return null;
  }

  return JSON.parse(readTextFile(manifestPath)) as InstallManifest;
}

export function createManifest(
  packageMeta: PackageMeta,
  profile: InstallProfile,
  files: Record<string, ManifestFileEntry>,
): InstallManifest {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    updatedAt: new Date().toISOString(),
    profileId: profile.profileId,
    selections: profile.selections,
    effectiveCapabilities: profile.effectiveCapabilities,
    files,
  };
}

export function writeManifest(targetDir: string, manifest: InstallManifest): string {
  const manifestPath = getManifestPath(targetDir);
  writeTextFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}
