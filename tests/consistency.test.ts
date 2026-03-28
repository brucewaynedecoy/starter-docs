import { describe, expect, test } from "vitest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { renderBuildableAsset } from "../src/renderers";
import { readPackageFile } from "../src/utils";

const BUILDABLE_PATHS = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/.templates/AGENTS.md",
  "docs/.templates/CLAUDE.md",
  "docs/.prompts/AGENTS.md",
  "docs/.prompts/CLAUDE.md",
  "docs/.references/design-workflow.md",
  "docs/.references/design-contract.md",
  "docs/.templates/design.md",
];

describe("default profile consistency", () => {
  test.each(BUILDABLE_PATHS)(
    "matches the checked-in full-profile source for %s",
    (relativePath) => {
      const profile = resolveInstallProfile(defaultSelections());

      expect(renderBuildableAsset(relativePath, profile)).toBe(readPackageFile(relativePath));
    },
  );
});
