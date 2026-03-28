import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { createTempDir, cleanupTempDir } from "./helpers";

const runSelectionWizardMock = vi.fn();
const promptForUpdateWizardActionMock = vi.fn();
const promptForInstructionConflictResolutionsMock = vi.fn();
const confirmMock = vi.fn();

vi.mock("../src/wizard", () => ({
  runSelectionWizard: runSelectionWizardMock,
  promptForUpdateWizardAction: promptForUpdateWizardActionMock,
  promptForInstructionConflictResolutions: promptForInstructionConflictResolutionsMock,
}));

vi.mock("@clack/prompts", async () => {
  const actual = await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: confirmMock,
    isCancel: (value: unknown) => value === "cancelled",
  };
});

function setTTY(value: boolean) {
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value,
  });
}

function installManifest(targetDir: string) {
  const selections = defaultSelections();
  const plan = planInstall({
    targetDir,
    selections,
    existingManifest: loadManifest(targetDir),
  });

  applyInstallPlan({
    targetDir,
    plan,
    existingManifest: loadManifest(targetDir),
  });
}

describe("cli interactive flows", () => {
  beforeEach(() => {
    runSelectionWizardMock.mockReset();
    promptForUpdateWizardActionMock.mockReset();
    promptForInstructionConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("uses the wizard for interactive init", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Let's configure your starter-docs install",
      });
      expect(promptForUpdateWizardActionMock).not.toHaveBeenCalled();
      expect(promptForInstructionConflictResolutionsMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses the wizard for update --reconfigure", async () => {
    const targetDir = createTempDir();

    try {
      installManifest(targetDir);
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["update", "--reconfigure", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Let's reconfigure your starter-docs install",
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("offers update vs reconfigure for implicit update and starts at review when keeping selections", async () => {
    const targetDir = createTempDir();

    try {
      installManifest(targetDir);
      promptForUpdateWizardActionMock.mockResolvedValue("update-existing");
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["--target", targetDir]);

      expect(promptForUpdateWizardActionMock).toHaveBeenCalledTimes(1);
      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Review your current starter-docs install",
        startStep: "review",
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves non-interactive flag behavior with --yes", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--yes", "--no-work", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForInstructionConflictResolutionsMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("prompts for instruction conflict resolutions when selected agent files already exist", async () => {
    const targetDir = createTempDir();

    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      promptForInstructionConflictResolutionsMock.mockResolvedValue({
        "AGENTS.md": "update",
      });
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--target", targetDir]);

      expect(promptForInstructionConflictResolutionsMock).toHaveBeenCalledWith([
        {
          relativePath: "AGENTS.md",
          instructionKind: "AGENTS.md",
          reason: "Unmanaged file already exists with different content.",
        },
      ]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
