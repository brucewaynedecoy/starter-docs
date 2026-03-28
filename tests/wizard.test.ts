import { describe, expect, test } from "vitest";
import { defaultSelections } from "../src/profile";
import type { PromptIO } from "../src/wizard";
import { runSelectionWizard } from "../src/wizard";

class MockPromptIO implements PromptIO {
  public readonly messages: string[] = [];
  public readonly confirmQuestions: string[] = [];
  public readonly chooseQuestions: string[] = [];

  constructor(
    private readonly confirms: boolean[],
    private readonly choices: string[] = [],
  ) {}

  info(message: string): void {
    this.messages.push(message);
  }

  async confirm(question: string): Promise<boolean> {
    this.confirmQuestions.push(question);
    const value = this.confirms.shift();
    if (typeof value !== "boolean") {
      throw new Error(`No confirm answer queued for "${question}".`);
    }
    return value;
  }

  async choose(question: string): Promise<string> {
    this.chooseQuestions.push(question);
    const value = this.choices.shift();
    if (typeof value !== "string") {
      throw new Error(`No choice answer queued for "${question}".`);
    }
    return value;
  }
}

describe("selection wizard", () => {
  test("cancels when every capability is turned off and the user confirms cancellation", async () => {
    const io = new MockPromptIO([false, false, false, false, true]);

    const result = await runSelectionWizard(
      io,
      defaultSelections(),
      "Configure starter-docs install",
    );

    expect(result).toBeNull();
    expect(io.confirmQuestions).toContain("No capabilities are selected. Cancel installer? [Y/n]");
  });
});
