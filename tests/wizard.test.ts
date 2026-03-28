import { describe, expect, test } from "vitest";
import { defaultSelections } from "../src/profile";
import type {
  WizardOptionSelections,
  WizardRenderer,
  WizardReviewAction,
} from "../src/wizard";
import type { Capability } from "../src/types";
import {
  applyCapabilitySelections,
  applyWizardOptionSelections,
  buildCapabilityChecklistState,
  getWizardOptionSelections,
  renderWizardReviewSummary,
  runSelectionWizardWithRenderer,
} from "../src/wizard";

class MockWizardRenderer implements WizardRenderer {
  public readonly seenCapabilityStates: Capability[][] = [];
  public readonly seenOptionStates: WizardOptionSelections[] = [];
  public readonly seenReviewActions: WizardReviewAction[] = [];
  public readonly introTitles: string[] = [];

  constructor(
    private readonly capabilityAnswers: Array<Capability[] | null>,
    private readonly optionAnswers: Array<WizardOptionSelections | null>,
    private readonly reviewAnswers: WizardReviewAction[],
  ) {}

  beginSession(title: string): void {
    this.introTitles.push(title);
  }

  async editCapabilities(state: Parameters<WizardRenderer["editCapabilities"]>[0]) {
    this.seenCapabilityStates.push(state.checklist.selectedCapabilities);
    return this.capabilityAnswers.shift() ?? null;
  }

  async editOptions(state: Parameters<WizardRenderer["editOptions"]>[0]) {
    this.seenOptionStates.push(state.options);
    return this.optionAnswers.shift() ?? null;
  }

  async review() {
    const answer = this.reviewAnswers.shift();
    if (!answer) {
      throw new Error("No review answer queued.");
    }
    this.seenReviewActions.push(answer);
    return answer;
  }
}

describe("selection wizard", () => {
  test("derives disabled capability rows from unmet prerequisites", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;
    selections.capabilities.prd = true;
    selections.capabilities.work = true;

    const checklist = buildCapabilityChecklistState(selections);

    expect(checklist.selectedCapabilities).toEqual(["designs"]);
    expect(checklist.options.find((option) => option.value === "prd")).toMatchObject({
      disabled: true,
      statusText: "prd requires plans",
    });
    expect(checklist.options.find((option) => option.value === "work")).toMatchObject({
      disabled: true,
      statusText: "work requires plans and prd",
    });
  });

  test("auto-clears dependent capabilities when a prerequisite is removed", () => {
    const selections = applyCapabilitySelections(defaultSelections(), ["designs", "plans"]);

    expect(selections.capabilities.designs).toBe(true);
    expect(selections.capabilities.plans).toBe(true);
    expect(selections.capabilities.prd).toBe(false);
    expect(selections.capabilities.work).toBe(false);
  });

  test("maps grouped option answers back into install selections", () => {
    const selections = applyWizardOptionSelections(defaultSelections(), {
      prompts: false,
      templatesMode: "required",
      referencesMode: "all",
      instructionKinds: ["AGENTS.md"],
    });

    expect(getWizardOptionSelections(selections)).toEqual({
      prompts: false,
      templatesMode: "required",
      referencesMode: "all",
      instructionKinds: ["AGENTS.md"],
    });
    expect(selections.instructionKinds["CLAUDE.md"]).toBe(false);
  });

  test("renders agents as all when both instruction files are selected", () => {
    const summary = renderWizardReviewSummary(defaultSelections());

    expect(summary).toContain("- Agents: all");
    expect(summary).not.toContain("AGENTS.md and CLAUDE.md");
  });

  test("supports editing options from the review step before applying", async () => {
    const renderer = new MockWizardRenderer(
      [["designs", "plans", "prd", "work"]],
      [
        {
          prompts: true,
          templatesMode: "all",
          referencesMode: "all",
          instructionKinds: ["AGENTS.md", "CLAUDE.md"],
        },
        {
          prompts: false,
          templatesMode: "required",
          referencesMode: "required",
          instructionKinds: ["AGENTS.md"],
        },
      ],
      ["edit-options", "apply"],
    );

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure starter-docs",
    });

    expect(result).toMatchObject({
      prompts: false,
      templatesMode: "required",
      referencesMode: "required",
    });
    expect(result?.instructionKinds).toEqual({
      "AGENTS.md": true,
      "CLAUDE.md": false,
    });
    expect(renderer.introTitles).toEqual(["Configure starter-docs"]);
    expect(renderer.seenOptionStates).toHaveLength(2);
  });

  test("cancels when the renderer stops at the capability step", async () => {
    const renderer = new MockWizardRenderer([null], [], []);

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure starter-docs",
    });

    expect(result).toBeNull();
  });
});
