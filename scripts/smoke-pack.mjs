import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const npmHome = mkdtempSync(path.join(os.tmpdir(), "starter-docs-npm-home-"));
const packOutputDir = mkdtempSync(path.join(os.tmpdir(), "starter-docs-pack-output-"));

function npmEnv() {
  const cacheDir = path.join(npmHome, ".npm");
  mkdirSync(cacheDir, { recursive: true });

  return {
    ...process.env,
    HOME: npmHome,
    npm_config_cache: cacheDir,
  };
}

execFileSync("npm", ["run", "build"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: npmEnv(),
});

const packOutput = execFileSync("npm", ["pack", "--json", "--pack-destination", packOutputDir], {
  cwd: repoRoot,
  encoding: "utf8",
  env: npmEnv(),
});
const [{ filename }] = JSON.parse(packOutput);
const tarballPath = path.join(packOutputDir, filename);

const unpackDir = mkdtempSync(path.join(os.tmpdir(), "starter-docs-pack-"));
const targetDir = mkdtempSync(path.join(os.tmpdir(), "starter-docs-smoke-"));

try {
  execFileSync("tar", ["-xzf", tarballPath, "-C", unpackDir], { stdio: "inherit" });
  const packageRoot = path.join(unpackDir, "package");
  execFileSync(
    "node",
    [path.join(packageRoot, "dist/index.js"), "init", "--yes", "--target", targetDir],
    { stdio: "inherit" },
  );

  const manifestPath = path.join(targetDir, "docs/.starter-docs/manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error("Smoke pack install did not produce a manifest.");
  }

  if (!existsSync(path.join(targetDir, "docs/AGENTS.md"))) {
    throw new Error("Smoke pack install did not produce docs/AGENTS.md.");
  }
} finally {
  rmSync(unpackDir, { recursive: true, force: true });
  rmSync(targetDir, { recursive: true, force: true });
  rmSync(packOutputDir, { recursive: true, force: true });
  rmSync(npmHome, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
}
