import { createInterface } from "node:readline/promises";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { applyInstallPlan, planInstall } from "./install";
import { loadManifest } from "./manifest";
import { defaultSelections, hasEffectiveCapabilities } from "./profile";
import type {
  InstallManifest,
  InstallSelections,
  PlannedAction,
  ReferencesMode,
  TemplatesMode,
} from "./types";
import { readPackageMeta } from "./utils";
import { type PromptIO, runSelectionWizard } from "./wizard";

type Command = "init" | "update";

interface ParsedArgs {
  command?: Command;
  targetDir?: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
  reconfigure: boolean;
  noDesigns: boolean;
  noPlans: boolean;
  noPrd: boolean;
  noWork: boolean;
  noPrompts: boolean;
  noAgents: boolean;
  noClaude: boolean;
  templatesMode?: TemplatesMode;
  referencesMode?: ReferencesMode;
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp();
    return;
  }

  const targetDir = path.resolve(parsed.targetDir ?? process.cwd());
  const existingManifest = loadManifest(targetDir);
  const command = inferCommand(parsed, existingManifest);

  if (command === "update" && !existingManifest) {
    throw new Error(
      "No starter-docs manifest was found in the target directory. Run `starter-docs init` first.",
    );
  }

  if (command === "update" && hasSelectionOverrides(parsed) && !parsed.reconfigure) {
    throw new Error(
      "Selection flags are only valid for `init` or `update --reconfigure`.",
    );
  }

  const interactive = !parsed.yes;
  const promptIo = interactive ? createConsolePromptIO() : null;

  try {
    let selections = resolveSelections({
      parsed,
      command,
      existingManifest,
    });

    if (promptIo) {
      if (command === "init") {
        const wizardSelections = await runSelectionWizard(
          promptIo,
          selections,
          "Configure starter-docs install. Press Enter to accept each default.",
        );
        if (!wizardSelections) {
          output.write("Installer cancelled.\n");
          return;
        }
        selections = wizardSelections;
      } else if (parsed.reconfigure || (!parsed.command && !hasSelectionOverrides(parsed) && (await promptIo.confirm("Reconfigure selections before updating? [y/N]", false)))) {
        const wizardSelections = await runSelectionWizard(
          promptIo,
          selections,
          "Reconfigure starter-docs install. Press Enter to keep each current selection.",
        );
        if (!wizardSelections) {
          output.write("Installer cancelled.\n");
          return;
        }
        selections = wizardSelections;
      }
    }

    const plan = planInstall({
      targetDir,
      selections,
      existingManifest,
      packageMeta: readPackageMeta(),
    });

    if (!hasEffectiveCapabilities(plan.profile)) {
      throw new Error("At least one capability must remain enabled.");
    }

    printPlan(plan.actions);

    if (parsed.dryRun) {
      output.write("\nDry run complete.\n");
      return;
    }

    if (promptIo) {
      const proceed = await promptIo.confirm("Apply these changes? [Y/n]", true);
      if (!proceed) {
        output.write("Installer cancelled.\n");
        return;
      }
    }

    const applied = applyInstallPlan({
      targetDir,
      plan,
      existingManifest,
    });

    output.write(
      `\nInstalled starter-docs ${applied.manifest.packageVersion} into ${targetDir}.\n`,
    );
    output.write(`Manifest: ${path.join(targetDir, "docs/.starter-docs/manifest.json")}\n`);
    if (applied.conflictFiles.length > 0) {
      output.write("Conflicts were staged for manual review:\n");
      for (const conflictFile of applied.conflictFiles) {
        output.write(`- ${conflictFile}\n`);
      }
    }
  } finally {
    promptIo?.close();
  }
}

function inferCommand(
  parsed: ParsedArgs,
  existingManifest: InstallManifest | null,
): Command {
  if (parsed.command) {
    return parsed.command;
  }

  if (existingManifest) {
    return "update";
  }

  return "init";
}

function resolveSelections(options: {
  parsed: ParsedArgs;
  command: Command;
  existingManifest: InstallManifest | null;
}): InstallSelections {
  const { parsed, command, existingManifest } = options;
  const baseSelections =
    command === "update" && existingManifest
      ? existingManifest.selections
      : defaultSelections();

  const selections: InstallSelections = {
    capabilities: { ...baseSelections.capabilities },
    prompts: baseSelections.prompts,
    templatesMode: baseSelections.templatesMode,
    referencesMode: baseSelections.referencesMode,
    instructionKinds: { ...baseSelections.instructionKinds },
  };

  if (parsed.noDesigns) {
    selections.capabilities.designs = false;
  }
  if (parsed.noPlans) {
    selections.capabilities.plans = false;
  }
  if (parsed.noPrd) {
    selections.capabilities.prd = false;
  }
  if (parsed.noWork) {
    selections.capabilities.work = false;
  }
  if (parsed.noPrompts) {
    selections.prompts = false;
  }
  if (parsed.noAgents) {
    selections.instructionKinds["AGENTS.md"] = false;
  }
  if (parsed.noClaude) {
    selections.instructionKinds["CLAUDE.md"] = false;
  }
  if (parsed.templatesMode) {
    selections.templatesMode = parsed.templatesMode;
  }
  if (parsed.referencesMode) {
    selections.referencesMode = parsed.referencesMode;
  }

  return selections;
}

function hasSelectionOverrides(parsed: ParsedArgs): boolean {
  return Boolean(
    parsed.noDesigns ||
      parsed.noPlans ||
      parsed.noPrd ||
      parsed.noWork ||
      parsed.noPrompts ||
      parsed.noAgents ||
      parsed.noClaude ||
      parsed.templatesMode ||
      parsed.referencesMode,
  );
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    dryRun: false,
    yes: false,
    help: false,
    reconfigure: false,
    noDesigns: false,
    noPlans: false,
    noPrd: false,
    noWork: false,
    noPrompts: false,
    noAgents: false,
    noClaude: false,
  };

  const args = [...argv];
  if (args[0] === "init" || args[0] === "update") {
    parsed.command = args.shift() as Command;
  }

  while (args.length > 0) {
    const arg = args.shift();
    switch (arg) {
      case "--target":
        parsed.targetDir = args.shift();
        break;
      case "--dry-run":
        parsed.dryRun = true;
        break;
      case "--yes":
        parsed.yes = true;
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      case "--reconfigure":
        parsed.reconfigure = true;
        break;
      case "--no-designs":
        parsed.noDesigns = true;
        break;
      case "--no-plans":
        parsed.noPlans = true;
        break;
      case "--no-prd":
        parsed.noPrd = true;
        break;
      case "--no-work":
        parsed.noWork = true;
        break;
      case "--no-prompts":
        parsed.noPrompts = true;
        break;
      case "--no-agents":
        parsed.noAgents = true;
        break;
      case "--no-claude":
        parsed.noClaude = true;
        break;
      case "--templates": {
        const value = args.shift();
        if (value !== "required" && value !== "all") {
          throw new Error("`--templates` must be either `required` or `all`.");
        }
        parsed.templatesMode = value;
        break;
      }
      case "--references": {
        const value = args.shift();
        if (value !== "required" && value !== "all") {
          throw new Error("`--references` must be either `required` or `all`.");
        }
        parsed.referencesMode = value;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printPlan(actions: PlannedAction[]): void {
  const nonNoop = actions.filter((action) => action.type !== "noop");
  const noopCount = actions.length - nonNoop.length;

  output.write("\nPlanned changes:\n");
  for (const action of nonNoop) {
    output.write(
      `- ${action.type}: ${action.relativePath}${action.reason ? ` (${action.reason})` : ""}\n`,
    );
  }
  output.write(`- noop: ${noopCount} file(s)\n`);
}

function printHelp(): void {
  output.write(`starter-docs\n
Usage:
  starter-docs
  starter-docs init [--target <dir>] [--dry-run] [--yes] [--no-designs] [--no-plans] [--no-prd] [--no-work] [--no-prompts] [--templates required|all] [--references required|all] [--no-agents] [--no-claude]
  starter-docs update [--target <dir>] [--dry-run] [--yes]
  starter-docs update --reconfigure [selection flags]
\n`);
}

interface CloseablePromptIO extends PromptIO {
  close(): void;
}

function createConsolePromptIO(): CloseablePromptIO {
  if (!input.isTTY || !output.isTTY) {
    throw new Error("Interactive prompts require a TTY. Use --yes for non-interactive runs.");
  }

  const rl = createInterface({ input, output });

  return {
    info(message: string) {
      output.write(`${message}\n`);
    },
    async confirm(question: string, defaultValue: boolean) {
      while (true) {
        const answer = (await rl.question(`${question} `)).trim().toLowerCase();
        if (answer.length === 0) {
          return defaultValue;
        }
        if (answer === "y" || answer === "yes") {
          return true;
        }
        if (answer === "n" || answer === "no") {
          return false;
        }
      }
    },
    async choose<T extends string>(
      question: string,
      options: readonly T[],
      defaultValue: T,
    ): Promise<T> {
      while (true) {
        const answer = (await rl.question(`${question} `)).trim().toLowerCase();
        if (answer.length === 0) {
          return defaultValue;
        }
        const normalized = options.find((option) => option.toLowerCase() === answer);
        if (normalized) {
          return normalized;
        }
      }
    },
    close() {
      rl.close();
    },
  };
}
