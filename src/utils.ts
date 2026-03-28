import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_ROOT = findPackageRoot(import.meta.url);

export function findPackageRoot(fromUrl: string): string {
  let current = path.dirname(fileURLToPath(fromUrl));

  while (!existsSync(path.join(current, "package.json"))) {
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Could not locate package.json from current module.");
    }

    current = parent;
  }

  return current;
}

export function readPackageFile(relativePath: string): string {
  return readTextFile(path.join(PACKAGE_ROOT, relativePath));
}

export function readTextFile(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

export function writeTextFile(filePath: string, content: string): void {
  ensureParentDir(filePath);
  writeFileSync(filePath, content, "utf8");
}

export function ensureParentDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

export function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

export function hashText(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function readPackageMeta(): { name: string; version: string } {
  const raw = JSON.parse(readPackageFile("package.json")) as {
    name: string;
    version: string;
  };

  return { name: raw.name, version: raw.version };
}

export function createRunId(now = new Date()): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

export function pruneEmptyDirectories(startDir: string, stopDir: string): void {
  let current = startDir;
  const boundary = path.resolve(stopDir);

  while (current.startsWith(boundary) && current !== boundary) {
    if (!existsSync(current)) {
      current = path.dirname(current);
      continue;
    }

    const entries = readdirSync(current);
    if (entries.length > 0) {
      break;
    }

    rmSync(current, { recursive: true, force: true });
    current = path.dirname(current);
  }
}

export function formatInlineList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

export function relativePathToTarget(targetDir: string, relativePath: string): string {
  return path.join(targetDir, relativePath);
}

export function exists(filePath: string): boolean {
  return existsSync(filePath);
}
