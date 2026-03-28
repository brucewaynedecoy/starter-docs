import {
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_CHECKBOX_SELECTED,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  select,
  symbol,
} from "@clack/prompts";
import { MultiSelectPrompt, wrapTextWithPrefix } from "@clack/core";
import { styleText } from "node:util";
import {
  CAPABILITY_DEPENDENCIES,
  cloneSelections,
  resolveInstallProfile,
} from "./profile";
import {
  CAPABILITIES,
  INSTRUCTION_KINDS,
  type Capability,
  type InstallProfile,
  type InstallSelections,
  type InstructionConflict,
  type InstructionConflictResolution,
  type InstructionConflictResolutions,
  type InstructionKind,
  type ReferencesMode,
  type TemplatesMode,
} from "./types";
import { formatInlineList } from "./utils";

const CAPABILITY_METADATA: Record<
  Capability,
  {
    label: string;
    hint: string;
    description: string;
  }
> = {
  designs: {
    label: "Designs",
    hint: "Architecture decisions and rationale",
    description:
      "Adds the architectural decision flow, design templates, and scoped references for long-lived design documentation.",
  },
  plans: {
    label: "Plans",
    hint: "Execution plans and strategy docs",
    description:
      "Adds planning workflows, plan templates, and the shared planning references that drive delivery before implementation starts.",
  },
  prd: {
    label: "PRD",
    hint: "Product requirements documents",
    description:
      "Adds the structured PRD set, architecture overview templates, and requirement references for descriptive product documentation.",
  },
  work: {
    label: "Work",
    hint: "Implementation backlogs and task lists",
    description:
      "Adds execution backlogs, phased work templates, and the prompts that decompose approved PRDs into buildable work.",
  },
};

const OPTION_METADATA = {
  prompts: {
    label: "Prompt starters",
    description:
      "Reusable starter prompts under `docs/.prompts/` for common design, planning, PRD, and work handoff flows.",
  },
  templatesMode: {
    label: "Templates",
    all: "Install every valid template for the chosen profile.",
    required: "Install only the minimal template set required for the chosen profile.",
  },
  referencesMode: {
    label: "References",
    all: "Install every valid reference file for the chosen profile.",
    required: "Install only the minimal reference set required for the chosen profile.",
  },
  instructionKinds: {
    label: "Instruction files",
    descriptions: {
      "AGENTS.md": "Multi-agent routing instructions used by Codex-style tooling.",
      "CLAUDE.md": "Claude-compatible instructions for environments that read Claude routers.",
    } satisfies Record<InstructionKind, string>,
  },
};

export type WizardStep = "capabilities" | "options" | "review";
export type WizardReviewAction = "apply" | "edit-capabilities" | "edit-options" | "cancel";
export type UpdateWizardAction = "update-existing" | "reconfigure";

export interface RunSelectionWizardOptions {
  initialSelections: InstallSelections;
  introTitle: string;
  startStep?: WizardStep;
}

export interface CapabilityChecklistOption {
  value: Capability;
  label: string;
  hint: string;
  disabled: boolean;
  description: string;
  dependencyText: string;
  statusText: string;
}

export interface CapabilityChecklistState {
  selections: InstallSelections;
  profile: InstallProfile;
  options: CapabilityChecklistOption[];
  selectedCapabilities: Capability[];
}

export interface WizardOptionSelections {
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
  instructionKinds: InstructionKind[];
}

export interface CapabilityStepState {
  selections: InstallSelections;
  checklist: CapabilityChecklistState;
}

export interface OptionsStepState {
  selections: InstallSelections;
  options: WizardOptionSelections;
}

export interface ReviewStepState {
  selections: InstallSelections;
  profile: InstallProfile;
  summary: string;
}

export interface WizardRenderer {
  beginSession?(title: string): Promise<void> | void;
  editCapabilities(state: CapabilityStepState): Promise<Capability[] | null>;
  editOptions(state: OptionsStepState): Promise<WizardOptionSelections | null>;
  review(state: ReviewStepState): Promise<WizardReviewAction>;
}

export function normalizeWizardSelections(selections: InstallSelections): InstallSelections {
  const next = cloneSelections(selections);

  for (const capability of CAPABILITIES) {
    const missingPrerequisites = CAPABILITY_DEPENDENCIES[capability].filter(
      (dependency) => !next.capabilities[dependency],
    );

    if (missingPrerequisites.length > 0) {
      next.capabilities[capability] = false;
    }
  }

  return next;
}

export function applyCapabilitySelections(
  selections: InstallSelections,
  selectedCapabilities: Iterable<Capability>,
): InstallSelections {
  const next = cloneSelections(selections);
  const selectedSet = new Set(selectedCapabilities);

  for (const capability of CAPABILITIES) {
    next.capabilities[capability] = selectedSet.has(capability);
  }

  return normalizeWizardSelections(next);
}

export function getWizardOptionSelections(
  selections: InstallSelections,
): WizardOptionSelections {
  return {
    prompts: selections.prompts,
    templatesMode: selections.templatesMode,
    referencesMode: selections.referencesMode,
    instructionKinds: INSTRUCTION_KINDS.filter(
      (instructionKind) => selections.instructionKinds[instructionKind],
    ),
  };
}

export function applyWizardOptionSelections(
  selections: InstallSelections,
  options: WizardOptionSelections,
): InstallSelections {
  const next = cloneSelections(selections);
  next.prompts = options.prompts;
  next.templatesMode = options.templatesMode;
  next.referencesMode = options.referencesMode;

  for (const instructionKind of INSTRUCTION_KINDS) {
    next.instructionKinds[instructionKind] = options.instructionKinds.includes(instructionKind);
  }

  return next;
}

export function buildCapabilityChecklistState(
  selections: InstallSelections,
): CapabilityChecklistState {
  const normalizedSelections = normalizeWizardSelections(selections);
  const profile = resolveInstallProfile(normalizedSelections);

  const options = CAPABILITIES.map((capability) => {
    const metadata = CAPABILITY_METADATA[capability];
    const state = profile.capabilityState[capability];
    const disabled = state.missingPrerequisites.length > 0;
    const dependencyText =
      CAPABILITY_DEPENDENCIES[capability].length === 0
        ? "No prerequisites"
        : `Requires ${formatInlineList(CAPABILITY_DEPENDENCIES[capability])}`;
    const statusText = state.effectiveSelection
      ? "Selected"
      : disabled
        ? state.disabledReason ?? "Unavailable"
        : "Available";

    return {
      value: capability,
      label: metadata.label,
      hint: disabled ? state.disabledReason ?? metadata.hint : metadata.hint,
      disabled,
      description: metadata.description,
      dependencyText,
      statusText,
    } satisfies CapabilityChecklistOption;
  });

  return {
    selections: normalizedSelections,
    profile,
    options,
    selectedCapabilities: CAPABILITIES.filter(
      (capability) => normalizedSelections.capabilities[capability],
    ),
  };
}

export function renderWizardReviewSummary(selections: InstallSelections): string {
  const normalizedSelections = normalizeWizardSelections(selections);
  const profile = resolveInstallProfile(normalizedSelections);
  const instructionKinds = INSTRUCTION_KINDS.filter(
    (instructionKind) => normalizedSelections.instructionKinds[instructionKind],
  );
  const instructionSummary =
    instructionKinds.length === INSTRUCTION_KINDS.length
      ? "all"
      : instructionKinds.length > 0
        ? formatInlineList(instructionKinds)
        : "none";

  return [
    "Document types",
    ...CAPABILITIES.map((capability) => {
      const state = profile.capabilityState[capability];
      const label = CAPABILITY_METADATA[capability].label;
      const value = state.effectiveSelection
        ? "selected"
        : state.disabledReason
          ? `locked (${state.disabledReason})`
          : "off";

      return `- ${label}: ${value}`;
    }),
    "",
    "Options",
    `- ${OPTION_METADATA.prompts.label}: ${normalizedSelections.prompts ? "included" : "omitted"}`,
    `- ${OPTION_METADATA.templatesMode.label}: ${normalizedSelections.templatesMode}`,
    `- ${OPTION_METADATA.referencesMode.label}: ${normalizedSelections.referencesMode}`,
    `- Agents: ${instructionSummary}`,
  ].join("\n");
}

export async function runSelectionWizard(
  options: RunSelectionWizardOptions,
): Promise<InstallSelections | null> {
  return runSelectionWizardWithRenderer(createClackWizardRenderer(), options);
}

export async function runSelectionWizardWithRenderer(
  renderer: WizardRenderer,
  options: RunSelectionWizardOptions,
): Promise<InstallSelections | null> {
  let selections = normalizeWizardSelections(options.initialSelections);
  let step = options.startStep ?? "capabilities";

  await renderer.beginSession?.(options.introTitle);

  while (true) {
    if (step === "capabilities") {
      const selectedCapabilities = await renderer.editCapabilities({
        selections,
        checklist: buildCapabilityChecklistState(selections),
      });

      if (!selectedCapabilities) {
        return null;
      }

      selections = applyCapabilitySelections(selections, selectedCapabilities);
      step = "options";
      continue;
    }

    if (step === "options") {
      const nextOptions = await renderer.editOptions({
        selections,
        options: getWizardOptionSelections(selections),
      });

      if (!nextOptions) {
        return null;
      }

      selections = applyWizardOptionSelections(selections, nextOptions);
      step = "review";
      continue;
    }

    const reviewAction = await renderer.review({
      selections,
      profile: resolveInstallProfile(selections),
      summary: renderWizardReviewSummary(selections),
    });

    if (reviewAction === "apply") {
      return normalizeWizardSelections(selections);
    }

    if (reviewAction === "edit-capabilities") {
      step = "capabilities";
      continue;
    }

    if (reviewAction === "edit-options") {
      step = "options";
      continue;
    }

    return null;
  }
}

export async function promptForUpdateWizardAction(): Promise<UpdateWizardAction | null> {
  const result = await select<UpdateWizardAction | "cancel">({
    message: "How would you like to continue?",
    withGuide: true,
    options: [
      {
        value: "update-existing",
        label: "Update with existing selections",
        hint: "Keep the current install profile and preview the update",
      },
      {
        value: "reconfigure",
        label: "Reconfigure selections",
        hint: "Open the interactive wizard before updating",
      },
      {
        value: "cancel",
        label: "Cancel",
        hint: "Exit without applying changes",
      },
    ],
  });

  if (isCancel(result) || result === "cancel") {
    return null;
  }

  return result;
}

export async function promptForInstructionConflictResolutions(
  conflicts: InstructionConflict[],
): Promise<InstructionConflictResolutions | null> {
  if (conflicts.length === 0) {
    return {};
  }

  note(
    "starter-docs found existing agent instruction files where managed guidance would normally be installed.\nChoose how to handle each conflict before continuing.",
    "Resolve agent instruction conflicts",
  );

  const resolutions: InstructionConflictResolutions = {};

  for (const conflict of conflicts) {
    note(
      [`Path: ${conflict.relativePath}`, `Conflict: ${conflict.reason}`].join("\n"),
      `Existing ${conflict.instructionKind} detected`,
    );

    const resolution = await select<InstructionConflictResolution>({
      message: `How should starter-docs handle ${conflict.relativePath}?`,
      withGuide: true,
      initialValue: "update",
      options: [
        {
          value: "update",
          label: "Update",
          hint: "Append the starter-docs instructions to the end of the existing file.",
        },
        {
          value: "overwrite",
          label: "Overwrite",
          hint: "Replace the existing file with the starter-docs version and manage it directly.",
        },
        {
          value: "skip",
          label: "Skip",
          hint: "WARNING: Leave this file unchanged. Agent behavior and automation could be severely impacted if starter-docs instructions are skipped here.",
        },
      ],
    });

    if (isCancel(resolution)) {
      return null;
    }

    resolutions[conflict.relativePath] = resolution;
  }

  return resolutions;
}

function createClackWizardRenderer(): WizardRenderer {
  return {
    beginSession(title) {
      intro(title);
    },
    async editCapabilities(state) {
      return promptForCapabilities(state.selections);
    },
    async editOptions(state) {
      return promptForOptions(state.options);
    },
    async review(state) {
      note(state.summary, "Review selections");

      const result = await select<WizardReviewAction>({
        message: "What would you like to do next?",
        withGuide: true,
        options: [
          { value: "apply", label: "Apply", hint: "Use this configuration" },
          {
            value: "edit-capabilities",
            label: "Edit document types",
            hint: "Adjust managed document types",
          },
          {
            value: "edit-options",
            label: "Edit options",
            hint: "Adjust prompts, templates, references, and instructions",
          },
          { value: "cancel", label: "Cancel", hint: "Exit without applying changes" },
        ],
      });

      if (isCancel(result)) {
        return "cancel";
      }

      return result;
    },
  };
}

async function promptForCapabilities(
  selections: InstallSelections,
): Promise<Capability[] | null> {
  const promptState = {
    selections: normalizeWizardSelections(selections),
  };

  const prompt = new MultiSelectPrompt<CapabilityChecklistOption>({
    options: buildCapabilityChecklistState(promptState.selections).options,
    initialValues: buildCapabilityChecklistState(promptState.selections).selectedCapabilities,
    required: true,
    render(this: MultiSelectPrompt<CapabilityChecklistOption>) {
      return renderCapabilitiesFrame(this, promptState.selections);
    },
    validate(value) {
      if (!value || value.length === 0) {
        return "Please keep at least one capability enabled.";
      }
    },
  });

  const syncPromptState = () => {
    promptState.selections = applyCapabilitySelections(selections, prompt.value ?? []);

    const checklist = buildCapabilityChecklistState(promptState.selections);
    prompt.options = checklist.options;
    prompt.value = checklist.selectedCapabilities;

    if (prompt.options[prompt.cursor]?.disabled) {
      prompt.cursor = findNearestEnabledIndex(prompt.cursor, prompt.options);
    }
  };

  prompt.on("value", syncPromptState);
  prompt.on("cursor", syncPromptState);
  prompt.on("key", syncPromptState);
  syncPromptState();

  const result = await prompt.prompt();
  if (isCancel(result)) {
    return null;
  }

  return buildCapabilityChecklistState(promptState.selections).selectedCapabilities;
}

async function promptForOptions(
  options: WizardOptionSelections,
): Promise<WizardOptionSelections | null> {
  const promptsResult = await confirm({
    message: "Install starter prompts?",
    withGuide: true,
    initialValue: options.prompts,
    active: "Yes",
    inactive: "No",
  });

  if (isCancel(promptsResult)) {
    return null;
  }

  const templatesMode = await select<TemplatesMode>({
    message: "Which document templates should be installed?",
    withGuide: true,
    initialValue: options.templatesMode,
    options: [
      {
        value: "all",
        label: "All templates",
        hint: OPTION_METADATA.templatesMode.all,
      },
      {
        value: "required",
        label: "Required templates only",
        hint: OPTION_METADATA.templatesMode.required,
      },
    ],
  });

  if (isCancel(templatesMode)) {
    return null;
  }

  const referencesMode = await select<ReferencesMode>({
    message: "Which reference files should be installed?",
    withGuide: true,
    initialValue: options.referencesMode,
    options: [
      {
        value: "all",
        label: "All references",
        hint: OPTION_METADATA.referencesMode.all,
      },
      {
        value: "required",
        label: "Required references only",
        hint: OPTION_METADATA.referencesMode.required,
      },
    ],
  });

  if (isCancel(referencesMode)) {
    return null;
  }

  const instructionKinds = await multiselect<InstructionKind>({
    message: "Which agent instructions should be installed?",
    withGuide: true,
    initialValues: options.instructionKinds,
    required: true,
    options: INSTRUCTION_KINDS.map((instructionKind) => ({
      value: instructionKind,
      label: instructionKind,
    })),
  });

  if (isCancel(instructionKinds)) {
    return null;
  }

  return {
    prompts: promptsResult,
    templatesMode,
    referencesMode,
    instructionKinds,
  };
}

function renderCapabilitiesFrame(
  prompt: MultiSelectPrompt<CapabilityChecklistOption>,
  selections: InstallSelections,
): string {
  const checklist = buildCapabilityChecklistState(selections);
  const lineColor = prompt.state === "error" ? "yellow" : "cyan";
  const header = [
    styleText("gray", S_BAR),
    wrapTextWithPrefix(
      process.stdout,
      "Choose the document types to manage in this project:",
      `${styleText(lineColor, S_BAR)}  `,
      `${symbol(prompt.state)}  `,
    ),
  ];
  const bodyPrefix = `${styleText(lineColor, S_BAR)}  `;
  const focusedOption = checklist.options[prompt.cursor] ?? checklist.options[0];
  const selectedLabels =
    checklist.selectedCapabilities.length > 0
      ? checklist.selectedCapabilities.map((capability) => CAPABILITY_METADATA[capability].label)
      : [];

  if (prompt.state === "submit") {
    const submittedSummary =
      selectedLabels.length > 0 ? formatInlineList(selectedLabels) : "no capability families";

    return `${header.join("\n")}\n${styleText("gray", S_BAR)}  ${styleText("dim", submittedSummary)}`;
  }

  if (prompt.state === "cancel") {
    const cancelledSummary =
      selectedLabels.length > 0 ? formatInlineList(selectedLabels) : "no capability families";

    return `${header.join("\n")}\n${styleText("gray", S_BAR)}  ${styleText(
      ["strikethrough", "dim"],
      cancelledSummary,
    )}`;
  }

  const checklistLines = checklist.options.map((option, index) =>
    renderCapabilityOption(option, index === prompt.cursor, checklist.selectedCapabilities),
  );

  const detailLines = renderDetailBox(
    focusedOption.label,
    [
      `${focusedOption.description}`,
      "",
      `Status: ${focusedOption.statusText}`,
      `Prerequisites: ${focusedOption.dependencyText.replace(/^Requires /, "")}`,
    ],
    process.stdout.columns,
  );

  const hintLines = [
    `${styleText("dim", "Selected now:")} ${
      selectedLabels.length > 0 ? formatInlineList(selectedLabels) : styleText("dim", "none")
    }`,
    `${styleText("dim", "Use ↑/↓ to navigate")} • ${styleText(
      "dim",
      "Space to select or deselect",
    )} • ${styleText("dim", "Enter to confirm")}`,
  ];

  const footer = styleText(lineColor, S_BAR_END);
  const spacer = styleText(lineColor, S_BAR);
  const errorLines =
    prompt.state === "error"
      ? prompt.error.split("\n").map((line, index) =>
          index === 0
            ? `${styleText("yellow", S_BAR_END)}  ${styleText("yellow", line)}`
            : `   ${styleText("yellow", line)}`,
        )
      : [];

  return [
    ...header,
    spacer,
    ...checklistLines.map((line) => `${bodyPrefix}${line}`),
    spacer,
    ...detailLines.map((line) => `${bodyPrefix}${line}`),
    spacer,
    ...hintLines.map((line) => `${bodyPrefix}${line}`),
    footer,
    ...errorLines,
  ].join("\n");
}

function renderCapabilityOption(
  option: CapabilityChecklistOption,
  active: boolean,
  selectedCapabilities: Capability[],
): string {
  const selected = selectedCapabilities.includes(option.value);

  if (option.disabled) {
    return `${styleText("gray", S_CHECKBOX_INACTIVE)} ${styleText(
      ["strikethrough", "gray"],
      option.label,
    )}`;
  }

  if (selected && active) {
    return `${styleText("green", S_CHECKBOX_SELECTED)} ${option.label}`;
  }

  if (selected) {
    return `${styleText("green", S_CHECKBOX_SELECTED)} ${styleText("dim", option.label)}`;
  }

  if (active) {
    return `${styleText("cyan", S_CHECKBOX_ACTIVE)} ${option.label}`;
  }

  return `${styleText("dim", S_CHECKBOX_INACTIVE)} ${styleText("dim", option.label)}`;
}

function renderDetailBox(title: string, lines: string[], columns: number): string[] {
  const maxWidth = Math.max(46, Math.min(columns - 8, 88));
  const contentWidth = Math.max(24, maxWidth - 4);
  const boxLines = [
    `${unicodeFrame("╭", "+")} ${title} ${unicodeFrame("─", "-").repeat(
      Math.max(1, contentWidth - title.length),
    )}${unicodeFrame("╮", "+")}`,
  ];

  for (const line of lines) {
    for (const wrappedLine of wrapPlainText(line, contentWidth)) {
      boxLines.push(
        `${unicodeFrame("│", "|")} ${wrappedLine.padEnd(contentWidth)} ${unicodeFrame("│", "|")}`,
      );
    }
  }

  boxLines.push(
    `${unicodeFrame("╰", "+")}${unicodeFrame("─", "-").repeat(contentWidth + 2)}${unicodeFrame(
      "╯",
      "+",
    )}`,
  );

  return boxLines.map((line) => styleText("dim", line));
}

function wrapPlainText(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
    }

    if (word.length <= width) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > width) {
      lines.push(remaining.slice(0, width - 1) + "…");
      remaining = remaining.slice(width - 1);
    }
    current = remaining;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function unicodeFrame(primary: string, fallback: string): string {
  return process.env.TERM === "linux" ? fallback : primary;
}

function findNearestEnabledIndex(
  cursor: number,
  options: CapabilityChecklistOption[],
): number {
  const enabledIndices = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.disabled)
    .map(({ index }) => index);

  if (enabledIndices.length === 0) {
    return 0;
  }

  if (enabledIndices.includes(cursor)) {
    return cursor;
  }

  return enabledIndices.find((index) => index > cursor) ?? enabledIndices[0];
}
