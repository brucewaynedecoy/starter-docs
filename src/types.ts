export const CAPABILITIES = ["designs", "plans", "prd", "work"] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const INSTRUCTION_KINDS = ["AGENTS.md", "CLAUDE.md"] as const;

export type InstructionKind = (typeof INSTRUCTION_KINDS)[number];

export type TemplatesMode = "required" | "all";
export type ReferencesMode = "required" | "all";
export type InstructionConflictResolution = "update" | "overwrite" | "skip";
export type InstructionConflictResolutions = Partial<
  Record<string, InstructionConflictResolution>
>;
export type ActionType =
  | "create"
  | "noop"
  | "update"
  | "update-conflict"
  | "skip-conflict"
  | "remove-managed"
  | "generate";

export interface InstallSelections {
  capabilities: Record<Capability, boolean>;
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
  instructionKinds: Record<InstructionKind, boolean>;
}

export interface CapabilityState {
  explicitSelection: boolean;
  effectiveSelection: boolean;
  missingPrerequisites: Capability[];
  disabledReason?: string;
}

export interface InstallProfile {
  selections: InstallSelections;
  capabilityState: Record<Capability, CapabilityState>;
  effectiveCapabilities: Capability[];
  profileId: string;
}

export interface ResolvedAsset {
  relativePath: string;
  assetClass: "static" | "scoped-static" | "buildable";
  sourceId: string;
  content: string;
}

export interface ManifestFileEntry {
  hash: string;
  sourceId: string;
}

export interface InstallManifest {
  schemaVersion: number;
  packageName: string;
  packageVersion: string;
  updatedAt: string;
  profileId: string;
  selections: InstallSelections;
  effectiveCapabilities: Capability[];
  files: Record<string, ManifestFileEntry>;
}

export interface InstructionConflict {
  relativePath: string;
  instructionKind: InstructionKind;
  reason: string;
}

export interface PlannedAction {
  type: ActionType;
  relativePath: string;
  sourceId?: string;
  content?: string;
  contentHash?: string;
  reason?: string;
}

export interface InstallPlan {
  packageName: string;
  packageVersion: string;
  profile: InstallProfile;
  actions: PlannedAction[];
  desiredFiles: Record<string, ManifestFileEntry>;
  conflictsRunId?: string;
}

export interface PackageMeta {
  name: string;
  version: string;
}

export interface ApplyResult {
  manifest: InstallManifest;
  appliedActions: PlannedAction[];
  conflictFiles: string[];
}
