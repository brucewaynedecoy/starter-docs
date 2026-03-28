import { describe, expect, test } from "vitest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";

describe("profile resolution", () => {
  test("disables dependent capabilities when plans are turned off", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    const profile = resolveInstallProfile(selections);

    expect(profile.capabilityState.prd.explicitSelection).toBe(true);
    expect(profile.capabilityState.prd.effectiveSelection).toBe(false);
    expect(profile.capabilityState.prd.missingPrerequisites).toEqual(["plans"]);

    expect(profile.capabilityState.work.explicitSelection).toBe(true);
    expect(profile.capabilityState.work.effectiveSelection).toBe(false);
    expect(profile.capabilityState.work.missingPrerequisites).toEqual(["plans", "prd"]);
  });

  test("restores effective selections when prerequisites come back", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    let profile = resolveInstallProfile(selections);
    expect(profile.capabilityState.prd.effectiveSelection).toBe(false);
    expect(profile.capabilityState.work.effectiveSelection).toBe(false);

    selections.capabilities.plans = true;
    profile = resolveInstallProfile(selections);

    expect(profile.capabilityState.prd.explicitSelection).toBe(true);
    expect(profile.capabilityState.prd.effectiveSelection).toBe(true);
    expect(profile.capabilityState.work.explicitSelection).toBe(true);
    expect(profile.capabilityState.work.effectiveSelection).toBe(true);
  });
});
