import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { readPackageFile } from "../src/utils";
import { cleanupTempDir, collectFiles, collectMarkdownContents, createTempDir } from "./helpers";

function installWithSelections(
  targetDir: string,
  configure: (selections: ReturnType<typeof defaultSelections>) => void,
) {
  const selections = defaultSelections();
  configure(selections);

  const existingManifest = loadManifest(targetDir);
  const plan = planInstall({
    targetDir,
    selections,
    existingManifest,
  });
  const result = applyInstallPlan({
    targetDir,
    plan,
    existingManifest,
  });

  return { selections, plan, result, manifest: loadManifest(targetDir)! };
}

describe("installer integration", () => {
  test("installs the full default profile", () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = installWithSelections(targetDir, () => {});

      expect(manifest.effectiveCapabilities).toEqual(["designs", "plans", "prd", "work"]);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts/designs-to-plan.prompt.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/.references/harness-capability-matrix.md")),
      ).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("disabling plans automatically disables prd and work", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, (selections) => {
        selections.capabilities.plans = false;
      });

      expect(existsSync(path.join(targetDir, "docs/designs/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/prd/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(
        existsSync(path.join(targetDir, "docs/.prompts/request-to-design.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/.prompts/designs-to-plan.prompt.md")),
      ).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/plans/",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("disabling prd automatically disables work", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, (selections) => {
        selections.capabilities.prd = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/prd/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports a designs-only install without planning routes", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, (selections) => {
        selections.capabilities.plans = false;
        selections.capabilities.prd = false;
        selections.capabilities.work = false;
      });

      const workflow = readFileSync(
        path.join(targetDir, "docs/.references/design-workflow.md"),
        "utf8",
      );
      const docsRouter = readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8");

      expect(workflow).toContain("planning-not-installed");
      expect(workflow).not.toContain("docs/.prompts/");
      expect(docsRouter).toContain("docs/designs/");
      expect(docsRouter).not.toContain("docs/plans/");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports a plans-only install without prompts", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, (selections) => {
        selections.capabilities.designs = false;
        selections.capabilities.prd = false;
        selections.capabilities.work = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts"))).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/.prompts/",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports plans and prd without work", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, (selections) => {
        selections.capabilities.designs = false;
        selections.capabilities.work = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/prd/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(
        existsSync(path.join(targetDir, "docs/.prompts/plan-to-prd-green-field.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/.prompts/prd-to-work-full-prd.prompt.md")),
      ).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/work/",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("removes prompt references when prompts are disabled", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, (selections) => {
        selections.prompts = false;
      });

      expect(existsSync(path.join(targetDir, "docs/.prompts"))).toBe(false);

      const contents = collectMarkdownContents(targetDir).join("\n");
      expect(contents).not.toContain("docs/.prompts/");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("stages conflicting instruction files without overwriting them", () => {
    const targetDir = createTempDir();
    try {
      mkdirSync(path.join(targetDir, "docs"), { recursive: true });
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), "custom docs agents\n", "utf8");

      const { manifest } = installWithSelections(targetDir, () => {});

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe("custom root agents\n");
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "custom docs agents\n",
      );

      const files = collectFiles(targetDir);
      const conflictFiles = files.filter((relativePath) =>
        relativePath.startsWith("docs/.starter-docs/conflicts/"),
      );

      expect(conflictFiles.some((relativePath) => relativePath.endsWith("/AGENTS.md"))).toBe(true);
      expect(conflictFiles.some((relativePath) => relativePath.endsWith("/docs/AGENTS.md"))).toBe(
        true,
      );
      expect(manifest.files["AGENTS.md"]).toBeUndefined();
      expect(manifest.files["docs/AGENTS.md"]).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("appends generated instructions when updating a conflicting instruction file", () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");

      const selections = defaultSelections();
      const existingManifest = loadManifest(targetDir);
      const plan = planInstall({
        targetDir,
        selections,
        existingManifest,
        instructionConflictResolutions: {
          "AGENTS.md": "update",
        },
      });

      expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")).toMatchObject({
        type: "update-conflict",
      });

      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      const merged = readFileSync(path.join(targetDir, "AGENTS.md"), "utf8");
      expect(merged).toContain("custom root agents\n");
      expect(merged).toContain(readPackageFile("AGENTS.md"));
      expect(result.manifest.files["AGENTS.md"]).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("overwrites conflicting instruction files when overwrite is selected", () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");

      const selections = defaultSelections();
      const existingManifest = loadManifest(targetDir);
      const plan = planInstall({
        targetDir,
        selections,
        existingManifest,
        instructionConflictResolutions: {
          "AGENTS.md": "overwrite",
        },
      });

      expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")).toMatchObject({
        reason: "Overwrite existing conflicting agent instructions.",
      });

      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readPackageFile("AGENTS.md"),
      );
      expect(result.manifest.files["AGENTS.md"]).toBeDefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("plans a noop update for unchanged managed files", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, () => {});

      const existingManifest = loadManifest(targetDir);
      const plan = planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest,
      });

      expect(plan.actions.every((action) => action.type === "noop")).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skips and stages updates for locally modified managed files", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, () => {});
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), "locally edited docs router\n", "utf8");

      const existingManifest = loadManifest(targetDir);
      const plan = planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest,
      });

      const action = plan.actions.find((candidate) => candidate.relativePath === "docs/AGENTS.md");
      expect(action?.type).toBe("skip-conflict");

      applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "locally edited docs router\n",
      );

      const files = collectFiles(targetDir);
      expect(
        files.some(
          (relativePath) =>
            relativePath.startsWith("docs/.starter-docs/conflicts/") &&
            relativePath.endsWith("/docs/AGENTS.md"),
        ),
      ).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports update reconfiguration from full to partial and back", () => {
    const targetDir = createTempDir();
    try {
      installWithSelections(targetDir, () => {});

      installWithSelections(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.prompts = false;
      });

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.prompts"))).toBe(false);

      installWithSelections(targetDir, () => {});

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts/designs-to-plan.prompt.md"))).toBe(
        true,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
