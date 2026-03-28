import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export function createTempDir(prefix = "starter-docs-test-"): string {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupTempDir(targetDir: string): void {
  rmSync(targetDir, { recursive: true, force: true });
}

export function collectFiles(rootDir: string): string[] {
  return walk(rootDir).sort();
}

export function collectMarkdownContents(rootDir: string): string[] {
  return walk(rootDir)
    .filter((relativePath) => relativePath.endsWith(".md"))
    .map((relativePath) => readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function walk(rootDir: string, currentDir = rootDir): string[] {
  const entries = readdirSync(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(rootDir, absolutePath));
    } else {
      files.push(path.relative(rootDir, absolutePath).split(path.sep).join("/"));
    }
  }

  return files;
}
