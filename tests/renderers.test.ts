import { describe, expect, test } from "vitest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { renderBuildableAsset } from "../src/renderers";

describe("buildable renderers", () => {
  test("renders a docs router without missing capabilities", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/AGENTS.md", profile);

    expect(rendered).toContain("docs/designs/");
    expect(rendered).not.toContain("docs/plans/");
    expect(rendered).not.toContain("docs/prd/");
    expect(rendered).not.toContain("docs/work/");
  });

  test("removes prompt links from design workflow when plans are absent", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/.references/design-workflow.md", profile);

    expect(rendered).toContain("planning-not-installed");
    expect(rendered).not.toContain("designs-to-plan.prompt.md");
    expect(rendered).not.toContain("docs/.prompts/");
  });

  test("removes prompt links from design workflow when prompts are disabled", () => {
    const selections = defaultSelections();
    selections.prompts = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/.references/design-workflow.md", profile);

    expect(rendered).toContain("Prompt links are unavailable in this profile");
    expect(rendered).not.toContain("docs/.prompts/");
  });
});
